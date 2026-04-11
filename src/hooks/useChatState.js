import { useState, useRef, useEffect } from "react";

export function useChatState() {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatContext, setChatContext] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  return { chatMessages, setChatMessages, chatInput, setChatInput, chatLoading, setChatLoading, chatContext, setChatContext, messagesEndRef };
}
