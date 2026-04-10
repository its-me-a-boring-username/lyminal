import React from "react";
import { Nav } from "./Nav.jsx";
import { saveChart } from "../utils/supabase.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');`;

export function GoalPicker({
  spheres,
  activeGoals, setActiveGoals,
  completedGoals,
  connections,
  checkedItems,
  session,
  setStep,
  isMobile,
  isPaid,
}) {
  // Goals already being tracked (active) or previously completed
  const trackedGoalIds = new Set([
    ...activeGoals.map(ag => ag.goalId),
    ...completedGoals,
  ]);

  const handlePick = (sphere, goal) => {
    const newGoal = {
      sphereId: sphere.id,
      sphereName: sphere.name,
      sphereColor: sphere.color,
      goalId: goal.id,
      goalText: goal.text,
      actionItems: [],
    };
    const updated = [...activeGoals, newGoal];
    setActiveGoals(updated);
    saveChart(session, {
      spheres,
      connections,
      activeGoals: updated,
      checkedItems,
      completedGoals,
    });
    setStep("active");
  };

  // Spheres that have at least one available (untracked) goal
  const spheresWithGoals = spheres.filter(s =>
    (s.goals || []).some(g => !trackedGoalIds.has(g.id))
  );

  // Spheres with no goals at all (none were set during setup)
  const spheresWithNoGoals = spheres.filter(s => (s.goals || []).length === 0);

  return (
    <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif" }}>
      <style>{FONTS}</style>

      <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: "#2c1f14" }} />

      <div className="w-full lg:flex-1 lg:flex lg:flex-col">
        {!isMobile && <Nav step="active" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
        {isMobile && <Nav step="active" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}

        <div className="px-6 py-10 max-w-2xl mx-auto w-full lg:px-16 pb-24 lg:pb-12">

          {/* Back */}
          <button
            onClick={() => setStep("active")}
            style={{ fontSize: "12px", color: "#8a7455", background: "none", border: "none", padding: "0 0 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
          >
            ← Back
          </button>

          <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7455", margin: "0 0 6px" }}>
            Add a goal
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600, color: "#1c1410", margin: "0 0 6px" }}>
            What do you want to work on?
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#5c4e40", fontWeight: 300, margin: "0 0 28px", lineHeight: 1.6 }}>
            Pick a goal from any sphere below. You can work on multiple goals at once.
          </p>

          {spheresWithGoals.length === 0 && spheresWithNoGoals.length === 0 ? (
            <div style={{ border: "1px solid #e8e0d5", background: "white", padding: "32px 24px", textAlign: "center" }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#1c1410", margin: "0 0 8px" }}>
                All goals are already active
              </p>
              <p style={{ fontSize: "13px", color: "#8a7455", fontWeight: 300, margin: "0 0 20px", lineHeight: 1.5 }}>
                You're already tracking every goal in your chart. Complete one first, or start fresh.
              </p>
              <button
                onClick={() => setStep("active")}
                style={{ background: "#b5472a", color: "white", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", padding: "10px 24px", border: "none", cursor: "pointer" }}
              >
                BACK TO MY GOALS →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {spheres.map(sphere => {
                const available = (sphere.goals || []).filter(g => !trackedGoalIds.has(g.id));
                const allActive = (sphere.goals || []).length > 0 && available.length === 0;

                if ((sphere.goals || []).length === 0) {
                  // Sphere has no goals set during setup — skip silently
                  return null;
                }

                return (
                  <div key={sphere.id} style={{ border: "1px solid #e8e0d5", background: "white" }}>
                    {/* Sphere header */}
                    <div style={{ padding: "12px 18px", borderBottom: "1px solid #f0ebe3", display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: sphere.color, flexShrink: 0 }} />
                      <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: sphere.color, fontWeight: 600 }}>
                        {sphere.name}
                      </span>
                      {allActive && (
                        <span style={{ fontSize: "9px", color: "#8a7455", marginLeft: "auto", fontStyle: "italic" }}>
                          all goals active
                        </span>
                      )}
                    </div>

                    {/* Goals */}
                    {allActive ? (
                      <div style={{ padding: "12px 18px" }}>
                        <p style={{ fontSize: "12px", color: "#8a7455", margin: 0, fontStyle: "italic" }}>
                          You're already working on all goals in this sphere.
                        </p>
                      </div>
                    ) : (
                      <div>
                        {available.map((goal, idx) => (
                          <button
                            key={goal.id}
                            onClick={() => handlePick(sphere, goal)}
                            style={{
                              width: "100%", textAlign: "left", padding: "14px 18px",
                              borderBottom: idx < available.length - 1 ? "1px solid #f0ebe3" : "none",
                              background: "white", border: "none", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#faf8f5"}
                            onMouseLeave={e => e.currentTarget.style.background = "white"}
                          >
                            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", color: "#1c1410", margin: 0, lineHeight: 1.4 }}>
                              {goal.text}
                            </p>
                            <span style={{ fontSize: "14px", color: sphere.color, flexShrink: 0 }}>→</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
