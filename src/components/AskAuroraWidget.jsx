import { useEffect, useMemo, useRef, useState } from "react";
import "./AskAuroraWidget.css";

const WELCOME_MESSAGE =
  "Hi, I’m Aurora — the smartest AI chat. Ask me anything. I’ll give you a smart answer, and when it makes sense, I’ll connect it back to a better business, technology, or efficiency decision.";

const STARTER_PROMPTS = [
  "What’s the biggest waste most businesses ignore in IT?",
  "Should my business be using AI yet?",
  "Why do companies end up with too many software tools?",
  "Can I keep running everything from spreadsheets?",
  "What’s the best way to reduce cyber risk quickly?",
  "What’s the best coffee in Brisbane, and why is this somehow an IT problem?"
];

const CTA_BY_KEY = {
  "health-check": { label: "Book a Technology Health Check", href: "/technology-health-check" },
  services: { label: "Explore services", href: "/services" },
  roadmap: { label: "See the Digital Roadmap", href: "/it-strategy-roadmap" },
  contact: { label: "Contact Aurora ICT", href: "/contact" }
};

const WELCOME_CTA_KEYS = ["health-check", "services", "roadmap", "contact"];

const createAssistantMessage = (text, ctas = []) => ({
  id: crypto.randomUUID(),
  role: "assistant",
  text,
  ctas
});

const createUserMessage = (text) => ({
  id: crypto.randomUUID(),
  role: "user",
  text,
  ctas: []
});

const toChatCtas = (ctaKeys = []) =>
  ctaKeys.map((key) => CTA_BY_KEY[key]).filter(Boolean);

const toHistoryPayload = (messages) =>
  messages.slice(-10).map((message) => ({
    role: message.role,
    text: message.text.slice(0, 1200)
  }));

export default function AskAuroraWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFunMode, setIsFunMode] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);

  const inputRef = useRef(null);
  const conversationRef = useRef(null);
  const requestAbortRef = useRef(null);

  const welcomeCtas = useMemo(() => toChatCtas(WELCOME_CTA_KEYS), []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onEscape);

    return () => document.removeEventListener("keydown", onEscape);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  useEffect(
    () => () => {
      requestAbortRef.current?.abort();
    },
    []
  );

  const handleReset = () => {
    setMessages([]);
    setInputValue("");
    setIsThinking(false);
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
  };

  const handleSend = async (rawMessage) => {
    const question = rawMessage.trim();
    if (!question || isThinking) {
      return;
    }

    const userMessage = createUserMessage(question);
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInputValue("");
    setIsThinking(true);

    requestAbortRef.current?.abort();
    const controller = new AbortController();
    requestAbortRef.current = controller;

    try {
      const response = await fetch("/api/ask-aurora", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: question,
          history: toHistoryPayload(nextMessages),
          funMode: isFunMode
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const assistantText =
        typeof payload?.message === "string" && payload.message.trim().length > 0
          ? payload.message.trim()
          : isFunMode
            ? "Aurora had a brief moment of technological introspection. Please try again."
            : "Something went wrong processing that message. Please try again.";

      const ctas = Array.isArray(payload?.ctaKeys) ? toChatCtas(payload.ctaKeys) : toChatCtas(["services", "contact"]);

      setMessages((current) => [...current, createAssistantMessage(assistantText, ctas)]);
    } catch (error) {
      if (error?.name !== "AbortError") {
        const fallbackMessage = isFunMode
          ? "Aurora had a brief moment of technological introspection. Please try again."
          : "Something went wrong processing that message. Please try again.";

        setMessages((current) => [...current, createAssistantMessage(fallbackMessage, toChatCtas(["contact", "services"]))]);
      }
    } finally {
      setIsThinking(false);
      if (requestAbortRef.current === controller) {
        requestAbortRef.current = null;
      }
    }
  };

  const panelClasses = `ask-aurora__panel ${isFunMode ? "is-fun" : "is-calm"}`;
  const launcherClasses = `ask-aurora__launcher ${isFunMode ? "is-fun" : "is-calm"}`;

  return (
    <div className="ask-aurora" aria-live="polite">
      {!isOpen && (
        <div className="ask-aurora__launcher-stack">
          <span className={`ask-aurora__launcher-cue ${isFunMode ? "is-fun" : "is-calm"}`}>
            Not your usual chatbot
          </span>
          <button
            className={launcherClasses}
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open Ask Aurora chat"
          >
            <span className="ask-aurora__launcher-label">Ask Aurora, the witty bot</span>
          </button>
        </div>
      )}

      {isOpen && (
        <section className={panelClasses} aria-label="Ask Aurora chat panel">
          <header className="ask-aurora__header">
            <div>
              <p className="ask-aurora__title">Aurora</p>
              <p className="ask-aurora__subtitle">The smartest AI chat</p>
            </div>

            <div className="ask-aurora__header-actions">
              <label className="ask-aurora__fun-toggle">
                <span>Fun mode</span>
                <input
                  type="checkbox"
                  checked={isFunMode}
                  onChange={(event) => setIsFunMode(event.target.checked)}
                  aria-label="Toggle Fun mode"
                />
              </label>
              <button type="button" className="ask-aurora__ghost-btn" onClick={handleReset}>
                New chat
              </button>
              <button
                type="button"
                className="ask-aurora__icon-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close Ask Aurora chat"
              >
                ×
              </button>
            </div>
          </header>

          <div className="ask-aurora__body" ref={conversationRef}>
            {messages.length === 0 && (
              <>
                <article className="ask-aurora__message ask-aurora__message--assistant ask-aurora__welcome">
                  <p>{WELCOME_MESSAGE}</p>
                  <div className="ask-aurora__ctas">
                    {welcomeCtas.map((cta) => (
                      <a key={cta.label} href={cta.href} className="ask-aurora__cta-link">
                        {cta.label}
                      </a>
                    ))}
                  </div>
                </article>

                <div className="ask-aurora__chips" role="list" aria-label="Conversation starters">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="ask-aurora__chip"
                      onClick={() => {
                        handleSend(prompt);
                      }}
                      role="listitem"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((message) => (
              <article
                key={message.id}
                className={`ask-aurora__message ask-aurora__message--${message.role}`}
              >
                <p>{message.text}</p>
                {message.ctas.length > 0 && (
                  <div className="ask-aurora__ctas">
                    {message.ctas.map((cta) => (
                      <a key={`${message.id}-${cta.label}`} href={cta.href} className="ask-aurora__cta-link">
                        {cta.label}
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}

            {isThinking && (
              <article className="ask-aurora__message ask-aurora__message--assistant">
                <p className="ask-aurora__typing" aria-label="Aurora is typing">
                  Aurora is thinking<span>.</span><span>.</span><span>.</span>
                </p>
              </article>
            )}
          </div>

          <footer className="ask-aurora__footer">
            <form
              className="ask-aurora__composer"
              onSubmit={(event) => {
                event.preventDefault();
                handleSend(inputValue);
              }}
            >
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ask Aurora a question..."
                aria-label="Type your question"
                autoComplete="off"
              />
              <button type="submit" aria-label="Send message" disabled={isThinking || !inputValue.trim()}>
                Send
              </button>
            </form>
            <p className="ask-aurora__disclaimer">
              Aurora gives general guidance, not legal, medical, tax, or emergency advice.
            </p>
          </footer>
        </section>
      )}
    </div>
  );
}
