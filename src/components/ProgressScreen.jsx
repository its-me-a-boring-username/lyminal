import React from "react";
import { Nav } from "./Nav.jsx";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');`;

export function ProgressScreen({
  activeGoals,
  checkedItems,
  completedGoals,
  isMobile,
  isPaid,
  setStep,
  session,
}) {
  // Derived stats
  const inProgress = activeGoals.filter(g => !completedGoals.has(g.goalId));
  const completed = activeGoals.filter(g => completedGoals.has(g.goalId));

  const totalSteps = activeGoals.reduce((sum, g) => sum + g.actionItems.length, 0);
  const doneSteps = activeGoals.reduce((sum, g) => {
    return sum + (checkedItems[g.goalId]?.size || 0);
  }, 0);

  const isEmpty = activeGoals.length === 0;

  return (
    <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif" }}>
      <style>{FONTS}</style>

      {/* Left color strip */}
      <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: "#4a7a72" }} />

      <div className="w-full lg:flex-1 lg:flex lg:flex-col">
        {!isMobile && <Nav step="progress" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
        {isMobile && <Nav step="progress" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}

        <div className="px-6 py-10 max-w-2xl mx-auto w-full lg:px-16 pb-24 lg:pb-12">

          {/* Header */}
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7455", margin: "0 0 6px", fontFamily: "'Inter', sans-serif" }}>
            Progress
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600, color: "#1c1410", margin: "0 0 28px" }}>
            How far you've come
          </h2>

          {isEmpty ? (
            /* Empty state */
            <div style={{ border: "1px solid #e8e0d5", background: "white", padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🌱</div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#1c1410", margin: "0 0 8px" }}>Nothing tracked yet</p>
              <p style={{ fontSize: "0.8rem", color: "#6e5c4a", fontWeight: 300, margin: "0 0 20px", lineHeight: 1.6 }}>
                Once you have an active goal and start adding steps, your progress will show up here.
              </p>
              <button
                onClick={() => setStep("active")}
                style={{ background: "#b5472a", color: "white", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", padding: "10px 24px", border: "none", cursor: "pointer" }}
              >
                GO TO MY GOALS →
              </button>
            </div>
          ) : (
            <>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "#e8e0d5", border: "1px solid #e8e0d5", marginBottom: "28px" }}>
                {[
                  { label: "In progress", value: inProgress.length },
                  { label: "Steps done", value: totalSteps > 0 ? `${doneSteps}/${totalSteps}` : "—" },
                  { label: "Completed", value: completed.length },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "white", padding: "20px 16px", textAlign: "center" }}>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600, color: "#1c1410", margin: "0 0 4px" }}>
                      {value}
                    </p>
                    <p style={{ fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a7455", margin: 0 }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Active goals */}
              {inProgress.length > 0 && (
                <>
                  <p style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#b5472a", fontWeight: 600, margin: "0 0 12px", fontFamily: "'Inter', sans-serif" }}>
                    Active goals
                  </p>
                  <div style={{ marginBottom: "28px" }} className="space-y-3">
                    {inProgress.map(ag => {
                      const total = ag.actionItems.length;
                      const done = checkedItems[ag.goalId]?.size || 0;
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                      return (
                        <div key={ag.goalId} style={{ border: "1px solid #e8e0d5", background: "white" }}>
                          {/* Sphere label */}
                          <div style={{ padding: "12px 18px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: ag.sphereColor, flexShrink: 0 }} />
                            <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", color: ag.sphereColor, fontWeight: 600 }}>
                              {ag.sphereName}
                            </span>
                          </div>

                          {/* Goal text */}
                          <div style={{ padding: "8px 18px 14px" }}>
                            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", color: "#1c1410", margin: "0 0 14px", lineHeight: 1.4 }}>
                              {ag.goalText}
                            </p>

                            {total === 0 ? (
                              <p style={{ fontSize: "0.75rem", color: "#8a7455", margin: 0, fontStyle: "italic" }}>
                                No steps added yet — talk to Lyme to build your plan
                              </p>
                            ) : (
                              <>
                                {/* Progress bar */}
                                <div style={{ height: "4px", background: "#f0e8df", borderRadius: "2px", marginBottom: "6px", overflow: "hidden" }}>
                                  <div style={{
                                    height: "100%",
                                    width: `${pct}%`,
                                    background: ag.sphereColor,
                                    borderRadius: "2px",
                                    transition: "width 0.4s ease",
                                  }} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: "0.7rem", color: "#8a7455" }}>
                                    {done} of {total} step{total !== 1 ? "s" : ""} complete
                                  </span>
                                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: pct === 100 ? "#4a7a72" : ag.sphereColor }}>
                                    {pct}%
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Steps breakdown (collapsed) — show only if there are items */}
                          {ag.actionItems.length > 0 && (
                            <div style={{ borderTop: "1px solid #f0ebe3", padding: "10px 18px" }}>
                              {ag.actionItems.map(item => {
                                const isChecked = checkedItems[ag.goalId]?.has(item.id) || false;
                                return (
                                  <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                                    <div style={{
                                      width: "14px", height: "14px", borderRadius: "3px",
                                      border: `1.5px solid ${isChecked ? ag.sphereColor : "#c4b8a8"}`,
                                      background: isChecked ? ag.sphereColor : "white",
                                      flexShrink: 0, marginTop: "1px",
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                      {isChecked && <span style={{ color: "white", fontSize: "8px", fontWeight: "bold" }}>✓</span>}
                                    </div>
                                    <span style={{
                                      fontSize: "0.72rem",
                                      color: isChecked ? "#8a7455" : "#4a3828",
                                      textDecoration: isChecked ? "line-through" : "none",
                                      lineHeight: 1.4,
                                    }}>
                                      {item.text}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Completed goals */}
              {completed.length > 0 && (
                <>
                  <p style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#4a7a72", fontWeight: 600, margin: "0 0 12px", fontFamily: "'Inter', sans-serif" }}>
                    Completed
                  </p>
                  <div className="space-y-2">
                    {completed.map(ag => {
                      const total = ag.actionItems.length;
                      const done = checkedItems[ag.goalId]?.size || 0;
                      return (
                        <div key={ag.goalId} style={{ border: "1px solid #e8e0d5", background: "#faf8f5", padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                          <div style={{
                            width: "20px", height: "20px", borderRadius: "50%",
                            background: "#4a7a72", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px"
                          }}>
                            <span style={{ color: "white", fontSize: "10px", fontWeight: "bold" }}>✓</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: ag.sphereColor }} />
                              <span style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8a7455" }}>{ag.sphereName}</span>
                            </div>
                            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", color: "#6e5c4a", margin: 0, textDecoration: "line-through" }}>
                              {ag.goalText}
                            </p>
                            {total > 0 && (
                              <p style={{ fontSize: "0.65rem", color: "#8a7455", margin: "4px 0 0" }}>
                                {done} of {total} steps complete
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Nudge to active screen */}
              <div style={{ marginTop: "28px", borderTop: "1px solid #e8e0d5", paddingTop: "20px" }}>
                <button
                  onClick={() => setStep("active")}
                  style={{ fontSize: "0.8rem", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", padding: "10px 20px", cursor: "pointer" }}
                >
                  ← Back to my goals
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
