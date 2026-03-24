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

const TOPIC_KEYWORDS = {
  ai: [/(\bai\b|\bartificial intelligence\b|\bautomation\b|\bmachine learning\b)/i],
  waste: [/\bwaste\b/i, /\binefficien/i, /\brework\b/i, /\bduplicat/i],
  tools: [/\bsoftware tools?\b/i, /\btool sprawl\b/i, /\btoo many tools\b/i, /\bsaas\b/i],
  spreadsheets: [/\bspreadsheet/i, /\bexcel\b/i, /\bgoogle sheets\b/i],
  cyber: [/\bcyber\b/i, /\brisk\b/i, /\bsecurity\b/i, /\bmfa\b/i, /\bphishing\b/i],
  coffee: [/\bcoffee\b/i, /\bbrisbane\b/i, /\bcafe\b/i, /\blatte\b/i]
};

const TOPIC_REPLIES = {
  ai: {
    fun: [
      "Yes—just don’t start with a giant AI moonshot. Pick one workflow, set guardrails, and stack quick wins.",
      "If AI can save minutes per task all day, it’s worth piloting. Keep scope tight and outcomes measurable."
    ],
    serious: [
      "Start AI where it improves a critical workflow with clear ROI, then expand with governance and controls.",
      "Run a focused pilot tied to time, quality, or risk reduction metrics before broader rollout."
    ]
  },
  waste: {
    fun: [
      "The silent budget vampire is duplicate tools plus manual handovers. Trim both and productivity jumps quickly.",
      "Most businesses pay twice: once for software, again for workaround labour. Rationalise tooling and process together."
    ],
    serious: [
      "The biggest hidden waste is overlapping systems and manual rework between teams.",
      "Cost and time losses usually come from duplicate platforms and inconsistent process ownership."
    ]
  },
  tools: {
    fun: [
      "Tool sprawl happens when every problem gets a new app. Architecture discipline is the antidote.",
      "Too many tools usually means too many disconnected decisions. A roadmap turns chaos into a stack."
    ],
    serious: [
      "Companies accumulate excess tools when procurement is decentralised and architecture governance is weak.",
      "A defined capability map and review process prevents tool duplication and complexity growth."
    ]
  },
  spreadsheets: {
    fun: [
      "Spreadsheets are brilliant assistants, terrible operating systems. Great until one tab runs your business.",
      "You can run on spreadsheets—until version drift, key-person risk, and audit gaps start steering decisions."
    ],
    serious: [
      "Spreadsheets are useful for analysis, but core operations should move to controlled systems as complexity grows.",
      "Operational dependence on spreadsheets creates governance, integrity, and continuity risk."
    ]
  },
  cyber: {
    fun: [
      "Fast cyber uplift is unglamorous and effective: MFA, least privilege, patching, and tested backups.",
      "Start with the boring controls done consistently. That’s where the biggest risk drop usually lives."
    ],
    serious: [
      "Prioritise MFA, privileged access reduction, critical patching, and backup recovery testing.",
      "The quickest risk reduction comes from baseline controls, clear ownership, and regular control validation."
    ]
  },
  coffee: {
    fun: [
      "Brisbane coffee debates are fierce, but the IT lesson is simple: standards matter, consistency wins, and latency ruins everything.",
      "Great coffee and great IT both need good process, quality inputs, and reliable delivery under pressure."
    ],
    serious: [
      "The coffee analogy maps to IT operations: consistency, repeatability, and quality control drive outcomes.",
      "Treat technology delivery like a strong café workflow—clear process, measured performance, and minimal bottlenecks."
    ]
  },
  generic: {
    fun: [
      "Great question. The fastest path is to identify one high-friction process and improve it with clear owners and metrics.",
      "Let’s make it practical: start small, measure impact, and scale what demonstrably works."
    ],
    serious: [
      "A practical next step is to define the business outcome, current constraints, and a 90-day delivery plan.",
      "Begin with priority mapping, risk assessment, and a focused execution sequence."
    ]
  }
};

const TOPIC_CTAS = {
  ai: REPLY_CTAS,
  waste: REPLY_CTAS,
  tools: REPLY_CTAS,
  spreadsheets: REPLY_CTAS,
  cyber: REPLY_CTAS,
  coffee: REPLY_CTAS.slice(1, 4),
  generic: REPLY_CTAS.slice(1, 3)
};

const classifyQuestion = (question) => {
  const normalizedQuestion = question.toLowerCase();
  const orderedTopics = ["coffee", "spreadsheets", "cyber", "ai", "tools", "waste"];

  for (const topic of orderedTopics) {
    const patterns = TOPIC_KEYWORDS[topic];
    if (patterns.some((pattern) => pattern.test(normalizedQuestion))) {
      return topic;
    }
  }

  return "generic";
};

const getDeterministicIndex = (question, length) => {
  if (length <= 1) {
    return 0;
  }

  const seedValue = Array.from(question).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return seedValue % length;
};

const getMockReply = ({ question, isFunMode }) => {
  const topic = classifyQuestion(question);
  const replyPool = isFunMode ? TOPIC_REPLIES[topic].fun : TOPIC_REPLIES[topic].serious;
  const selectedReply = replyPool[getDeterministicIndex(question, replyPool.length)];

  return {
    topic,
    text: selectedReply,
    ctas: TOPIC_CTAS[topic]
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
      const reply = getMockReply({
        question,
        isFunMode
      });

      setMessages((current) => [...current, createAssistantMessage(reply.text, reply.ctas)]);

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
                      onClick={() => handleSend(prompt)}
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
