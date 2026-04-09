import { supabase } from "../supabaseClient.js";

/**
 * Save chart + active goals to Supabase.
 * Called at specific save points in the flow — not on every state change.
 *
 * @param {object} session  - Supabase auth session (null if not logged in)
 * @param {object} data     - { spheres, connections, activeGoals, checkedItems, completedGoals }
 */
export async function saveChart(session, { spheres, connections = {}, activeGoals = [], checkedItems = {}, completedGoals = new Set() }) {
  if (!session?.user?.id || spheres.length === 0) return;
  const uid = session.user.id;

  try {
    // ── Chart: spheres + connections (one row per user, upsert) ──
    const { error: chartError } = await supabase.from('charts').upsert({
      user_id: uid,
      spheres,
      connections,
      drag_offsets: {},
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (chartError) throw chartError;

    // ── Active goals: delete all then re-insert ──
    const { error: deleteError } = await supabase
      .from('active_goals').delete().eq('user_id', uid);

    if (deleteError) throw deleteError;

    if (activeGoals.length > 0) {
      const { error: insertError } = await supabase.from('active_goals').insert(
        activeGoals.map(ag => ({
          user_id:      uid,
          sphere_id:    ag.sphereId,
          sphere_name:  ag.sphereName,
          sphere_color: ag.sphereColor,
          goal_id:      ag.goalId,
          goal_text:    ag.goalText,
          action_items: ag.actionItems || [],
          checked_items: checkedItems[ag.goalId] ? [...checkedItems[ag.goalId]] : [],
          completed:    completedGoals.has(ag.goalId)
        }))
      );

      if (insertError) throw insertError;
    }
  } catch (e) {
    console.error('[Supabase] saveChart failed:', e);
  }
}

/**
 * Delete all saved chart data from Supabase for this user.
 * Called when the user resets their chart.
 */
export async function clearChart(session) {
  if (!session?.user?.id) return;
  const uid = session.user.id;
  try {
    await supabase.from('active_goals').delete().eq('user_id', uid);
    await supabase.from('charts').delete().eq('user_id', uid);
  } catch (e) {
    console.error('[Supabase] clearChart failed:', e);
  }
}

/**
 * Load chart + active goals from Supabase.
 * Only runs if localStorage has no existing state — localStorage always wins.
 * Returns the loaded state object, or null if nothing to load.
 */
export async function loadChart(session) {
  if (!session?.user?.id) return null;

  // localStorage wins — only load from Supabase if nothing is saved locally
  try {
    const saved = localStorage.getItem('goalchart_state');
    if (saved) {
      const s = JSON.parse(saved);
      if (s.spheres?.length > 0) return null;
    }
  } catch {}

  try {
    const { data: chart, error: chartError } = await supabase
      .from('charts').select('*').eq('user_id', session.user.id).single();

    if (chartError || !chart?.spheres?.length) return null;

    const { data: goals } = await supabase
      .from('active_goals').select('*').eq('user_id', session.user.id);

    const activeGoals = (goals || []).map(g => ({
      sphereId:    g.sphere_id,
      sphereName:  g.sphere_name,
      sphereColor: g.sphere_color,
      goalId:      g.goal_id,
      goalText:    g.goal_text,
      actionItems: g.action_items || []
    }));

    const checkedItems = {};
    (goals || []).forEach(g => {
      checkedItems[g.goal_id] = new Set(g.checked_items || []);
    });

    const completedGoals = new Set(
      (goals || []).filter(g => g.completed).map(g => g.goal_id)
    );

    return {
      spheres:     chart.spheres,
      connections: chart.connections || {},
      activeGoals,
      checkedItems,
      completedGoals
    };
  } catch (e) {
    console.error('[Supabase] loadChart failed:', e);
    return null;
  }
}
