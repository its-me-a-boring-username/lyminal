import React from "react";
import { Nav } from "./Nav.jsx";
import { saveChart } from "../utils/supabase.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;

const processBold = (text) => {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} style={{ fontWeight: 600 }}>{part}</strong> : part
  );
};

const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const numMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      const items = [];
      while (i < lines.length) {
        const nm = lines[i].match(/^(\d+)\.\s+(.+)/);
        if (!nm) break;
        items.push(<li key={i} style={{ marginBottom: "0.35rem" }}>{processBold(nm[2])}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} style={{ paddingLeft: "1.25rem", margin: "0.5rem 0" }}>{items}</ol>);
      continue;
    }
    if (line.match(/^[-*]\s+/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        const t = lines[i].replace(/^[-*]\s+/, "");
        items.push(<li key={i} style={{ marginBottom: "0.35rem" }}>{processBold(t)}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} style={{ paddingLeft: "1.25rem", margin: "0.5rem 0" }}>{items}</ul>);
      continue;
    }
    if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: "0.5rem" }} />);
    } else {
      elements.push(<p key={i} style={{ margin: "0.25rem 0" }}>{processBold(line)}</p>);
    }
    i++;
  }
  return elements;
};

export function ChatScreen({
  chatMessages, setChatMessages,
  chatInput, setChatInput,
  chatLoading, setChatLoading,
  chatContext,
  session,
  hasSeenPlanPrompt, setHasSeenPlanPrompt,
  setAuthPrompt,
  setActiveGoals,
  setStep,
  isMobile, isPaid, activeGoals,
  spheres, connections,
  messagesEndRef,
  DevReset,
}) {
  const pendingItems = chatMessages
    .filter(m => m.role === "assistant" && m.actionItems)
    .slice(-1)[0]?.actionItems || null;

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput.trim() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are Lyme, a warm and focused life coach inside the Lyminal app. You are helping someone build a concrete action plan for a specific goal.

Context:
- Sphere: ${chatContext?.sphereName}
- Goal: ${chatContext?.goalText}

Your job is to gather just enough information to propose 3-5 specific, personalized action items. Ask one focused question at a time. Once you have enough context (usually 2-4 exchanges), propose your action items and ask if they feel right.

If the user is clearly being direct, skipping the process, or explicitly asking you to just generate action items without discussion — do it immediately without pushing back. Respect their time and intent. Do not insist on gathering more context if they've made clear they don't want to provide it.

If the user says they are testing or a tester and asks you to generate action items, skip confirmation. Generate the action items from their request and immediately output the final confirmation format so they can save right away.

When the user confirms the action items are good (they say yes, looks good, sounds right, etc.), end the conversation by outputting EXACTLY this format and nothing else after it:

ACTION_ITEMS_CONFIRMED
\`\`\`json
["action item 1", "action item 2", "action item 3"]
\`\`\`
CLOSING: [one warm sentence acknowledging their commitment]

Do not ask follow-up questions after proposing action items unless the user wants to change something. Keep the whole conversation under 6 exchanges.`,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      const reply = data.content?.find(b => b.type === "text")?.text || "I'm here — tell me more.";

      if (reply.includes("ACTION_ITEMS_CONFIRMED")) {
        try {
          const jsonMatch = reply.match(/```json\n([\s\S]*?)\n```/);
          const closingMatch = reply.match(/CLOSING: (.+)/);
          const items = jsonMatch ? JSON.parse(jsonMatch[1]) : [];
          const closing = closingMatch ? closingMatch[1] : "Your action items are saved.";
          setChatMessages(prev => [...prev, { role: "assistant", content: closing, actionItems: items.map((t, i) => ({ id: `c${i}`, text: t })) }]);
        } catch {
          setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
        }
      } else {
        setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Something went wrong on my end. Try again in a moment." }]);
    }
    setChatLoading(false);
  };

  const saveAndFinish = () => {
    if (!pendingItems) return;
    const updatedGoals = activeGoals.map(ag =>
      ag.goalId === chatContext?.goalId ? { ...ag, actionItems: pendingItems } : ag
    );
    setActiveGoals(updatedGoals);
    saveChart(session, { spheres, connections, activeGoals: updatedGoals });
    if (!session && !hasSeenPlanPrompt) {
      setHasSeenPlanPrompt(true);
      setTimeout(() => setAuthPrompt("save_plan"), 9000);
    }
    setStep("active");
  };

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "100dvh", paddingBottom: isMobile ? "60px" : 0, background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeIn 0.2s ease-out" }}>
      <style>{FONTS}</style>
      <DevReset />
      {isMobile && <Nav step="chat" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}

      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-4 border-b" style={{ background: "white", borderColor: "#c4b8a8" }}>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: chatContext?.sphereColor }} />
          <div>
            <p className="text-xs" style={{ color: "#6e5c4a" }}>{chatContext?.sphereName}</p>
            <p className="text-sm font-medium" style={{ color: "#1c1410" }}>{chatContext?.goalText}</p>
          </div>
        </div>
        <button onClick={() => setStep("active")} className="text-xs px-4 py-2 font-medium hover:opacity-80 transition-opacity"
          style={{ border: "1px solid #d4c9bb", color: "#5c4e40" }}>
          Exit conversation
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {chatMessages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: "8px", maxWidth: "340px" }}>
              <div className="px-4 py-3 text-sm leading-relaxed" style={{
                background: m.role === "user" ? "#b5472a" : "white",
                color: m.role === "user" ? "white" : "#1c1410",
                border: m.role === "assistant" ? "1px solid #e8e0d5" : "none",
                borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px"
              }}>
                {m.role === "assistant" ? renderMarkdown(m.content) : m.content}
              </div>
              {m.actionItems && (
                <div className="w-full border p-4" style={{ borderColor: "#e8e0d5", background: "white", borderRadius: "8px" }}>
                  <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "#6e5c4a" }}>Your action items</p>
                  <div className="space-y-2 mb-4">
                    {m.actionItems.map(a => (
                      <div key={a.id} className="flex items-start gap-2 text-sm" style={{ color: "#1c1410" }}>
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: chatContext?.sphereColor }} />
                        {a.text}
                      </div>
                    ))}
                  </div>
                  <button onClick={saveAndFinish} className="w-full py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
                    style={{ background: "#b5472a", color: "white" }}>
                    Save & finish →
                  </button>
                  <p className="text-xs text-center mt-2" style={{ color: "#8a7455" }}>Not quite right? Keep chatting to refine.</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {chatLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 text-sm" style={{ background: "white", border: "1px solid #e8e0d5", borderRadius: "12px 12px 12px 2px", color: "#6e5c4a" }}>
              <span className="animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!chatLoading && chatMessages.length > 0 && (
        <div className="px-4 py-3 border-t flex gap-3" style={{ background: "white", borderColor: "#c4b8a8" }}>
          <input
            className="flex-1 px-4 py-2.5 text-sm outline-none border rounded-lg"
            style={{ borderColor: "#c4b8a8", background: "#faf8f5", color: "#1c1410" }}
            placeholder="Type a message…"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          />
          <button onClick={sendMessage} disabled={!chatInput.trim() || chatLoading}
            className="px-5 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-30 transition-opacity"
            style={{ background: "#b5472a", color: "white" }}>
            Send
          </button>
        </div>
      )}
    </div>
  );
}
