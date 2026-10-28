"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isToolUIPart, type UIMessage } from "ai";
import { brand } from "@/config/business";

const suggestions = ["Rate kya hai?", "Is 20 December free?", "Book the chef for 60 people", "What dishes do you make?"];

type ToolOut = Record<string, unknown> & { ok?: boolean; error?: string; url?: string; whatsapp?: string; ref?: string; total?: string; date?: string; guests?: number };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status, error, clearError } = useChat({ transport: new DefaultChatTransport({ api: "/api/chat" }) });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("chat") === "1") setOpen(true);
    const on = () => setOpen(true);
    window.addEventListener("open-chat", on);
    return () => window.removeEventListener("open-chat", on);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    clearError();
    void sendMessage({ text: t });
    setInput("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close AI assistant" : "Ask the AI assistant"}
        className="fixed right-5 bottom-5 z-50 flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-saffron to-ember pr-5 pl-4 font-semibold text-coal shadow-[0_10px_40px_-6px_rgba(255,90,31,0.7)] transition hover:scale-105"
      >
        <span className="relative flex h-6 w-6 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-coal/20" />
          <svg viewBox="0 0 24 24" className="relative h-5 w-5 fill-coal" aria-hidden>
            <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
          </svg>
        </span>
        <span className="text-sm">{open ? "Close" : "Ask AI"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-3 bottom-24 z-50 flex max-h-[min(640px,calc(100dvh-8rem))] flex-col overflow-hidden rounded-3xl border border-cream/10 bg-soot/95 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-5 sm:w-[400px]"
            role="dialog"
            aria-label="AI booking assistant"
          >
            <div className="flex items-center gap-3 border-b border-cream/10 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-saffron to-ember font-deva text-lg text-coal">उ</div>
              <div className="flex-1">
                <div className="font-display text-lg leading-none text-cream">{brand.name} Assistant</div>
                <div className="mt-1 text-[11px] text-cream/50">AI · answers, checks dates, books requests</div>
              </div>
            </div>

            <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" data-lenis-prevent>
              {messages.length === 0 && (
                <div className="space-y-4">
                  <Bubble role="assistant">Aadaab! Ask me anything about the chef, prices or dates. I can also book a request for you. Hindi ya English, jo aapko pasand ho.</Bubble>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button key={s} onClick={() => send(s)} className="rounded-full border border-cream/15 px-3 py-1.5 text-xs text-cream/75 transition hover:border-saffron hover:text-saffron">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <MessageView key={m.id} m={m} />
              ))}
              {status === "submitted" && (
                <Bubble role="assistant">
                  <span className="inline-flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-saffron" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </span>
                </Bubble>
              )}
              {error && <p className="rounded-xl border border-chili/40 bg-chili/10 p-3 text-xs text-cream/80">The assistant is not available right now. Please use the booking form or WhatsApp.</p>}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2 border-t border-cream/10 p-3"
            >
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question…" maxLength={500} className="flex-1 rounded-full border border-cream/15 bg-coal/60 px-4 py-2.5 text-sm text-cream outline-none placeholder:text-cream/30 focus:border-saffron" aria-label="Message" />
              <button type="submit" disabled={busy || !input.trim()} className="rounded-full bg-gradient-to-r from-saffron to-ember px-4 text-sm font-semibold text-coal disabled:opacity-40">
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${role === "user" ? "rounded-br-sm bg-saffron text-coal" : "rounded-bl-sm bg-cream/[0.06] text-cream/90"}`}>{children}</div>
    </div>
  );
}

function MessageView({ m }: { m: UIMessage }) {
  return (
    <>
      {m.parts.map((part, i) => {
        if (part.type === "text") return part.text ? <Bubble key={i} role={m.role === "user" ? "user" : "assistant"}>{part.text}</Bubble> : null;
        if (!isToolUIPart(part)) return null;
        const name = getToolName(part);
        if (part.state !== "output-available") {
          const label = name === "createBookingRequest" ? "Creating your booking request…" : name === "checkDate" ? "Checking the chef’s calendar…" : "Working…";
          return (
            <div key={i} className="text-xs text-cream/40 italic">
              {label}
            </div>
          );
        }
        const out = part.output as ToolOut;
        if (name === "createBookingRequest" && out.ok) {
          return (
            <div key={i} className="rounded-2xl border border-saffron/40 bg-saffron/10 p-4 text-sm text-cream">
              <div className="text-xs tracking-widest text-saffron uppercase">Booking request sent</div>
              <div className="mt-1 font-display text-xl">{out.ref}</div>
              <div className="text-cream/70">
                {out.date} · {out.guests} guests · {out.total}
              </div>
              <a href={out.whatsapp} target="_blank" rel="noopener" className="mt-3 flex items-center justify-center rounded-full bg-[#25D366] py-2.5 font-semibold text-coal">
                Send to chef on WhatsApp
              </a>
            </div>
          );
        }
        if (name === "whatsappChef" && out.url) {
          return (
            <a key={i} href={out.url} target="_blank" rel="noopener" className="flex items-center justify-center rounded-full bg-[#25D366] py-2.5 text-sm font-semibold text-coal">
              Open WhatsApp to the chef
            </a>
          );
        }
        return null;
      })}
    </>
  );
}
