import { supabase } from "../supabaseClient.js";
import { normalizeActionItems } from "./actionItems.js";
import { trackUserEvent } from "./events.js";
import { chartFingerprint, chartsAreEquivalent } from "./chartReconciliation.js";

const LOCAL_KEY = "goalchart_state";

function normalizeCheckedItems(raw = {}) {
  const result = {};
  Object.entries(raw || {}).forEach(([goalId, value]) => {
    if (value instanceof Set) {
      result[goalId] = new Set(value);
      return;
    }
    if (Array.isArray(value)) {
      result[goalId] = new Set(value);
      return;
    }
    result[goalId] = new Set();
  });
  return result;
}

function serializeCheckedItems(raw = {}) {
  const result = {};
  Object.entries(raw || {}).forEach(([goalId, value]) => {
    if (value instanceof Set) result[goalId] = [...value];
    else if (Array.isArray(value)) result[goalId] = value;
    else result[goalId] = [];
  });
  return result;
}

function normalizeCompletedGoals(raw = []) {
  if (raw instanceof Set) return new Set(raw);
  if (Array.isArray(raw)) return new Set(raw);
  return new Set();
}

function serializeCompletedGoals(raw) {
  if (raw instanceof Set) return [...raw];
  if (Array.isArray(raw)) return raw;
  return [];
}

function normalizeStoredState(parsed = {}) {
  return {
    spheres: parsed.spheres || [],
    connections: parsed.connections || {},
    activeGoals: parsed.activeGoals || [],
    step: parsed.step || "welcome",
    completedGoals: normalizeCompletedGoals(parsed.completedGoals),
    checkedItems: normalizeCheckedItems(parsed.checkedItems),
    updatedAt: parsed.updatedAt || null,
  };
}

function archiveTitle(chart, prefix = "Chart") {
  const timestamp = chart?.updatedAt ? new Date(chart.updatedAt) : new Date();
  const date = Number.isNaN(timestamp.getTime())
    ? new Date().toLocaleDateString()
    : timestamp.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  return `${prefix} from ${date}`;
}

export function makeLocalState({ spheres = [], connections = {}, activeGoals = [], step = "welcome", completedGoals = new Set(), checkedItems = {}, updatedAt = null }) {
  return {
    spheres,
    connections,
    activeGoals,
    step,
    completedGoals: serializeCompletedGoals(completedGoals),
    checkedItems: serializeCheckedItems(checkedItems),
    updatedAt: updatedAt || new Date().toISOString(),
  };
}

export function readLocalState() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeStoredState(parsed);
  } catch {
    return null;
  }
}

export async function archiveChart(session, chart, { title = null, source = "manual" } = {}) {
  if (!session?.user?.id || !chart?.spheres?.length) return { ok: false, error: new Error("No chart to archive.") };

  const snapshot = makeLocalState({
    ...chart,
    step: chart.activeGoals?.length ? "active" : "chart-view",
    updatedAt: chart.updatedAt || new Date().toISOString(),
  });

  try {
    const { error } = await supabase.from("chart_archives").upsert({
      user_id: session.user.id,
      title: title || archiveTitle(chart),
      snapshot,
      snapshot_hash: chartFingerprint(snapshot),
      source,
      source_updated_at: chart.updatedAt || null,
    }, {
      onConflict: "user_id,snapshot_hash",
      ignoreDuplicates: true,
    });

    if (error) throw error;
    return { ok: true };
  } catch (error) {
    console.error("[Supabase] archiveChart failed:", error);
    return { ok: false, error };
  }
}

export async function loadArchivedCharts(session) {
  if (!session?.user?.id) return [];

  const { data, error } = await supabase
    .from("chart_archives")
    .select("id, title, snapshot, source, source_updated_at, archived_at")
    .eq("user_id", session.user.id)
    .order("archived_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((archive) => ({
    ...archive,
    snapshot: normalizeStoredState(archive.snapshot || {}),
  }));
}

export async function deleteArchivedChart(session, archiveId) {
  if (!session?.user?.id || !archiveId) return false;
  const { error } = await supabase
    .from("chart_archives")
    .delete()
    .eq("user_id", session.user.id)
    .eq("id", archiveId);
  if (error) throw error;
  return true;
}

export function writeLocalState(state) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(makeLocalState(state || {})));
  } catch {
    // ignore local persistence failures
  }
}

export async function saveChart(session, { spheres, connections = {}, activeGoals = [], checkedItems = {}, completedGoals = new Set() }) {
  if (!session?.user?.id || !Array.isArray(spheres) || spheres.length === 0) return false;
  const uid = session.user.id;

  try {
    const { error: chartError } = await supabase.from("charts").upsert({
      user_id: uid,
      spheres,
      connections,
      drag_offsets: {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    if (chartError) throw chartError;

    const { error: deleteError } = await supabase.from("active_goals").delete().eq("user_id", uid);
    if (deleteError) throw deleteError;

    if (activeGoals.length > 0) {
      const payload = activeGoals.map((ag) => ({
        user_id: uid,
        sphere_id: ag.sphereId,
        sphere_name: ag.sphereName,
        sphere_color: ag.sphereColor,
        goal_id: ag.goalId,
        goal_text: ag.goalText,
        action_items: ag.actionItems || [],
        checked_items: checkedItems[ag.goalId] ? [...checkedItems[ag.goalId]] : [],
        completed: completedGoals.has(ag.goalId),
      }));

      const { error: insertError } = await supabase.from("active_goals").insert(payload);
      if (insertError) throw insertError;
    }
    return true;
  } catch (e) {
    console.error("[Supabase] saveChart failed:", e);
    trackUserEvent(session, "save_chart_failed", {
      code: e?.code || null,
      message: e?.message || "saveChart failed",
    });
    return false;
  }
}

export async function clearChart(session) {
  if (!session?.user?.id) return false;
  const uid = session.user.id;

  try {
    const { error: goalsError } = await supabase.from("active_goals").delete().eq("user_id", uid);
    if (goalsError) throw goalsError;
    const { error: chartError } = await supabase.from("charts").delete().eq("user_id", uid);
    if (chartError) throw chartError;
    return true;
  } catch (e) {
    console.error("[Supabase] clearChart failed:", e);
    return false;
  }
}

export async function archiveAndClearChart(session, preferredChart = null) {
  const chart = preferredChart?.spheres?.length ? preferredChart : await loadChart(session);
  if (!chart?.spheres?.length) return clearChart(session);

  const archived = await archiveChart(session, chart, { source: "start_over" });
  if (!archived.ok) return false;
  return clearChart(session);
}

export async function restoreArchivedChart(session, archive) {
  if (!archive?.snapshot?.spheres?.length) return { ok: false, error: new Error("Archive is empty.") };

  const current = await loadChart(session);
  if (current?.spheres?.length && !chartsAreEquivalent(current, archive.snapshot)) {
    const preserved = await archiveChart(session, current, { source: "replaced_on_restore" });
    if (!preserved.ok) return preserved;
  }

  const saved = await saveChart(session, archive.snapshot);
  return saved ? { ok: true, chart: archive.snapshot } : { ok: false, error: new Error("Could not restore chart.") };
}

export async function loadChart(session) {
  if (!session?.user?.id) return null;

  try {
    const { data: chart, error: chartError } = await supabase
      .from("charts")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (chartError || !chart?.spheres?.length) return null;

    const { data: goals, error: goalsError } = await supabase
      .from("active_goals")
      .select("*")
      .eq("user_id", session.user.id);

    if (goalsError) throw goalsError;

    const activeGoals = (goals || []).map((g) => ({
      sphereId: g.sphere_id,
      sphereName: g.sphere_name,
      sphereColor: g.sphere_color,
      goalId: g.goal_id,
      goalText: g.goal_text,
      actionItems: normalizeActionItems(g.action_items || []),
    }));

    const checkedItems = {};
    (goals || []).forEach((g) => {
      checkedItems[g.goal_id] = new Set(g.checked_items || []);
    });

    const completedGoals = new Set((goals || []).filter((g) => g.completed).map((g) => g.goal_id));

    return {
      spheres: chart.spheres,
      connections: chart.connections || {},
      activeGoals,
      checkedItems,
      completedGoals,
      updatedAt: chart.updated_at || null,
    };
  } catch (e) {
    console.error("[Supabase] loadChart failed:", e);
    return null;
  }
}
