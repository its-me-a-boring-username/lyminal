import { supabase } from "../supabaseClient.js";
import { normalizeActionItems } from "./actionItems.js";

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
    return {
      spheres: parsed.spheres || [],
      connections: parsed.connections || {},
      activeGoals: parsed.activeGoals || [],
      step: parsed.step || "welcome",
      completedGoals: normalizeCompletedGoals(parsed.completedGoals),
      checkedItems: normalizeCheckedItems(parsed.checkedItems),
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return null;
  }
}

export function writeLocalState(state) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(makeLocalState(state || {})));
  } catch {
    // ignore local persistence failures
  }
}

export async function saveChart(session, { spheres, connections = {}, activeGoals = [], checkedItems = {}, completedGoals = new Set() }) {
  if (!session?.user?.id || !Array.isArray(spheres) || spheres.length === 0) return;
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
  } catch (e) {
    console.error("[Supabase] saveChart failed:", e);
  }
}

export async function clearChart(session) {
  if (!session?.user?.id) return;
  const uid = session.user.id;

  try {
    await supabase.from("active_goals").delete().eq("user_id", uid);
    await supabase.from("charts").delete().eq("user_id", uid);
  } catch (e) {
    console.error("[Supabase] clearChart failed:", e);
  }
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