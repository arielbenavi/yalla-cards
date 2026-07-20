"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { strings } from "@/lib/strings";
import { AUTH_COOKIE } from "@/lib/auth";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SCENARIOS = [
  { key: "market", label: strings.simulate.scenarios.market },
  { key: "taxi", label: strings.simulate.scenarios.taxi },
  { key: "restaurant", label: strings.simulate.scenarios.restaurant },
  { key: "street", label: strings.simulate.scenarios.street },
  { key: "cafe", label: strings.simulate.scenarios.cafe },
];

function parseAssistantMessage(content: string): { arabic: string; translation: string } {
  // Expected format: arabic line\n(Hebrew translation)
  const match = content.match(/^([\s\S]*?)\n\(([^)]+)\)\s*$/);
  if (match) {
    return { arabic: match[1].trim(), translation: match[2].trim() };
  }
  // Fallback: try splitting on newline with paren
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const translationLine = lines.find((l) => l.startsWith("(") && l.endsWith(")"));
  const arabicLines = lines.filter((l) => l !== translationLine);
  return {
    arabic: arabicLines.join(" "),
    translation: translationLine ? translationLine.slice(1, -1) : "",
  };
}

export default function SimulatePage() {
  const router = useRouter();
  const [scenario, setScenario] = useState("market");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [showTranslit, setShowTranslit] = useState<Record<number, boolean>>({});
  const [authChecked, setAuthChecked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth check via cookie presence (httpOnly cookie means we check via an API call)
  useEffect(() => {
    fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "test" }], scenario: "market" }),
    }).then((res) => {
      if (res.status === 401) {
        router.replace("/?from=/simulate");
      } else {
        setAuthChecked(true);
        // Abort the stream
        res.body?.cancel();
      }
    }).catch(() => {
      setAuthChecked(true);
    });
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStreamingContent("");

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, scenario }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreamingContent(accumulated);
      }

      const assistantMessage: Message = { role: "assistant", content: accumulated };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `(${strings.common.error})` },
      ]);
      setStreamingContent("");
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, loading, messages, scenario]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setStreamingContent("");
    setShowTranslit({});
    setInput("");
    textareaRef.current?.focus();
  };

  const toggleTranslit = (idx: number) => {
    setShowTranslit((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!authChecked) {
    return (
      <div className="flex flex-1 items-center justify-center">
        {strings.common.loading}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Scenario selector */}
      <div className="border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <label htmlFor="scenario-select" className="text-sm font-medium whitespace-nowrap">
          {strings.simulate.scenarioLabel}:
        </label>
        <select
          id="scenario-select"
          value={scenario}
          onChange={(e) => { setScenario(e.target.value); resetConversation(); }}
          className="flex-1 border rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 dark:border-gray-600"
          disabled={loading}
        >
          {SCENARIOS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          onClick={resetConversation}
          disabled={loading || messages.length === 0}
          className="text-sm border rounded px-3 py-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
        >
          {strings.simulate.reset}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !streamingContent && (
          <p className="text-center text-gray-400 text-sm mt-8">
            {strings.simulate.startHint}
          </p>
        )}

        {messages.map((msg, idx) => {
          if (msg.role === "user") {
            return (
              <div key={idx} className="flex justify-start">
                <div className="max-w-[80%]">
                  <p className="text-xs text-gray-400 mb-1">{strings.simulate.youLabel}</p>
                  <div className="bg-black text-white rounded-2xl rounded-tl-sm px-4 py-2 text-base">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          }

          const { arabic, translation } = parseAssistantMessage(msg.content);

          return (
            <div key={idx} className="flex justify-end">
              <div className="max-w-[80%]">
                <p className="text-xs text-gray-400 mb-1 text-end">{strings.simulate.aiLabel}</p>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tr-sm px-4 py-3 space-y-1">
                  {/* Arabic in Hebrew transliteration — RTL */}
                  <p dir="rtl" className="text-lg nikud-text leading-relaxed">
                    {arabic || msg.content}
                  </p>
                  {/* Hebrew translation */}
                  {translation && (
                    <p dir="rtl" className="text-sm text-gray-500 dark:text-gray-400">
                      {translation}
                    </p>
                  )}
                  {/* Transliteration toggle (shows raw content hint) */}
                  <button
                    onClick={() => toggleTranslit(idx)}
                    className="text-xs text-blue-500 hover:underline mt-1"
                  >
                    {showTranslit[idx]
                      ? strings.simulate.hideTranslit
                      : strings.simulate.showTranslit}
                  </button>
                  {showTranslit[idx] && (
                    <p dir="ltr" className="text-xs text-gray-400 font-mono break-all">
                      {msg.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Streaming in-progress message */}
        {streamingContent && (
          <div className="flex justify-end">
            <div className="max-w-[80%]">
              <p className="text-xs text-gray-400 mb-1 text-end">{strings.simulate.aiLabel}</p>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tr-sm px-4 py-3">
                <p dir="rtl" className="text-lg nikud-text leading-relaxed">
                  {streamingContent}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading && !streamingContent && (
          <div className="flex justify-end">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tr-sm px-4 py-3">
              <p className="text-gray-400 text-sm">{strings.simulate.thinking}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t px-4 py-3 flex gap-2 items-end flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={strings.simulate.inputPlaceholder}
          disabled={loading}
          rows={1}
          className="flex-1 border rounded-xl px-3 py-2 text-base resize-none overflow-hidden bg-white dark:bg-gray-900 dark:border-gray-600 disabled:opacity-50"
          style={{ direction: "rtl" }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-black text-white px-4 py-2 text-base font-bold disabled:opacity-40 flex-shrink-0"
        >
          {strings.simulate.send}
        </button>
      </div>
    </div>
  );
}
