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

const REPLY_CTAS = [
  { label: "Book a Technology Health Check", href: "/technology-health-check" },
  { label: "Explore services", href: "/services" },
  { label: "See the Digital Roadmap", href: "/it-strategy-roadmap" },
  { label: "Contact Aurora ICT", href: "/contact" }
];

const FUN_REPLIES = [
  "Short answer: yes. Long answer: yes, but with priorities, guardrails, and a practical rollout so your team doesn’t drown in shiny tools.",
  "Most IT waste hides in duplicate tools and improvised processes. We can trim both, fast, and keep only what drives outcomes.",
  "Spreadsheets are heroic... until they become your database, workflow engine, and risk register. Then they quietly tax every decision.",
  "Great cyber progress usually starts boring: MFA everywhere, tidy admin access, tested backups, and clear owner accountability.",
  "Best Brisbane coffee is debated hourly. But if your systems are slower than a pour-over queue, that’s definitely an IT problem."
];

const SERIOUS_REPLIES = [
  "Focus first on business-critical workflows, then apply AI where it reduces time, errors, or risk. Start narrow and measure outcomes.",
  "The largest hidden IT waste is overlapping software and manual rework between systems. Rationalising tools improves cost and speed.",
  "Tool sprawl usually comes from isolated purchasing decisions without architecture oversight. A roadmap and governance model prevents this.",
  "Spreadsheets are useful for lightweight analysis, but operational dependency creates control and reporting risk as complexity grows.",
  "To reduce cyber risk quickly: enforce MFA, remove excessive admin access, patch critical systems, and validate backup recovery."
];

const getReply = ({ question, isFunMode, replyIndex }) => {
  const options = isFunMode ? FUN_REPLIES : SERIOUS_REPLIES;
  const selectedReply = options[replyIndex % options.length];

  const shouldIncludeCtas = /roadmap|risk|cyber|tool|ai|spreadsheets|waste|business/i.test(question);

  return {
    text: selectedReply,
    ctas: shouldIncludeCtas ? REPLY_CTAS : REPLY_CTAS.slice(1, 3)
  };
};

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

export default function AskAuroraWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFunMode, setIsFunMode] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [replyIndex, setReplyIndex] = useState(0);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const conversationRef = useRef(null);

  const welcomeCtas = useMemo(() => REPLY_CTAS, []);

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

  useEffect(() => () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
  }, []);

  const handleReset = () => {
    setMessages([]);
    setInputValue("");
    setIsThinking(false);

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSend = (rawMessage) => {
    const question = rawMessage.trim();
    if (!question || isThinking) {
      return;
    }

    const userMessage = createUserMessage(question);
    setMessages((current) => [...current, userMessage]);
    setInputValue("");
    setIsThinking(true);

    timerRef.current = window.setTimeout(() => {
      setReplyIndex((currentIndex) => {
        const nextIndex = currentIndex + 1;
        const reply = getReply({
          question,
          isFunMode,
          replyIndex: currentIndex
        });

        setMessages((current) => [...current, createAssistantMessage(reply.text, reply.ctas)]);
        return nextIndex;
      });

      setIsThinking(false);
      timerRef.current = null;
    }, 700 + Math.floor(Math.random() * 500));
  };

  const panelClasses = `ask-aurora__panel ${isFunMode ? "is-fun" : "is-calm"}`;
  const launcherClasses = `ask-aurora__launcher ${isFunMode ? "is-fun" : "is-calm"}`;

  return (
    <div className="ask-aurora" aria-live="polite">
      {!isOpen && (
        <button
          className={launcherClasses}
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Ask Aurora chat"
        >
          <span className="ask-aurora__launcher-label">Ask Aurora</span>
        </button>
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
                  onClick={() => handleSend(prompt)}
                  role="listitem"
                >
                  {prompt}
                </button>
              ))}
            </div>

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
