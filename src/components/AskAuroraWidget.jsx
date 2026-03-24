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

const CTA_BY_LABEL = Object.fromEntries(REPLY_CTAS.map((cta) => [cta.label, cta]));

const TOPIC_KEYWORDS = {
  ai: [
    "ai",
    "artificial intelligence",
    "automate",
    "automation",
    "copilot",
    "copilots",
    "chatgpt",
    "llm",
    "machine learning"
  ],
  waste: [
    "waste",
    "inefficiency",
    "inefficient",
    "duplicate",
    "duplication",
    "manual",
    "rework",
    "cost",
    "expensive",
    "wasted"
  ],
  tools: [
    "tool",
    "tools",
    "software",
    "app",
    "apps",
    "saas",
    "crm",
    "hubspot",
    "platform",
    "platforms",
    "system",
    "systems",
    "vendor",
    "vendors"
  ],
  spreadsheets: ["spreadsheet", "spreadsheets", "excel", "google sheets", "sheet", "sheets"],
  cyber: [
    "cyber",
    "cybersecurity",
    "security",
    "secure",
    "phishing",
    "mfa",
    "backup",
    "backups",
    "ransomware",
    "password",
    "passwords",
    "ignore cybersecurity"
  ],
  coffee: ["coffee", "brisbane coffee", "cafe", "café"]
};

const MOCK_REPLIES = {
  fun: {
    ai: [
      "Yes—just don’t launch an AI moonshot on Monday. Start with one workflow, tight guardrails, then scale what wins.",
      "If AI saves minutes per task all day, it’s worth doing. Small pilot, clear metric, confident rollout."
    ],
    waste: [
      "Biggest IT waste is usually duplicate tools plus manual rework—paying twice for the same outcome.",
      "The budget leak is rarely dramatic; it’s tiny process friction repeated hundreds of times."
    ],
    tools: [
      "Tool sprawl happens when every pain point gets a shiny new app. Architecture discipline fixes that fast.",
      "If the stack looks like a festival lineup, it’s roadmap time."
    ],
    spreadsheets: [
      "Spreadsheets are excellent assistants, risky operations platforms. Great for insight, rough for control.",
      "One spreadsheet is useful; seventeen linked tabs is usually an incident waiting politely."
    ],
    cyber: [
      "Quick cyber uplift is gloriously boring: MFA everywhere, tighter admin access, patching, and tested backups.",
      "Want fast risk reduction? Do the baseline controls consistently before buying fancy toys."
    ],
    coffee: [
      "Best Brisbane coffee is a heated debate, but the IT lesson is clear: consistency beats heroics every day.",
      "Great coffee and great IT both depend on process quality, good inputs, and low latency."
    ],
    generic: [
      "Great question. Pick one high-friction process, improve it in 90 days, then scale the result.",
      "Let’s keep it practical: clear outcome, clear owner, clear metric."
    ]
  },
  serious: {
    ai: [
      "Use AI where it improves a core workflow with measurable ROI, then expand under governance.",
      "Begin with a scoped pilot linked to time, quality, or risk outcomes before wider adoption."
    ],
    waste: [
      "The largest hidden IT waste is overlapping tools and repetitive manual handoffs.",
      "Most inefficiency comes from duplicated capabilities and unclear process ownership."
    ],
    tools: [
      "Tool overload usually comes from decentralised purchasing without architecture governance.",
      "A capability map and review gate reduce duplicate software and vendor complexity."
    ],
    spreadsheets: [
      "Spreadsheets are useful for analysis, but operational reliance increases integrity and continuity risk.",
      "As process complexity grows, controlled systems should replace spreadsheet-driven operations."
    ],
    cyber: [
      "Prioritise MFA, privileged access reduction, critical patching, and verified backup recovery.",
      "Fastest cyber improvement comes from consistent baseline controls and clear accountability."
    ],
    coffee: [
      "The coffee example maps to IT operations: repeatability, quality control, and predictable delivery.",
      "Strong operational outcomes come from standard process and measurable performance."
    ],
    generic: [
      "Define the target outcome, current constraints, and a sequenced 90-day execution plan.",
      "Start with priority mapping and risk-based implementation steps."
    ]
  }
};

const TOPIC_CTA_LABELS = {
  ai: ["Explore services", "See the Digital Roadmap"],
  waste: ["Book a Technology Health Check", "Explore services"],
  tools: ["Explore services", "Contact Aurora ICT", "Book a Technology Health Check"],
  spreadsheets: ["Book a Technology Health Check", "See the Digital Roadmap"],
  cyber: ["Contact Aurora ICT", "Explore services", "Book a Technology Health Check"],
  coffee: ["Explore services", "See the Digital Roadmap"],
  generic: ["Explore services", "Contact Aurora ICT"]
};

const classifyQuestion = (question) => {
  const normalizedQuestion = ` ${question.toLowerCase()} `;
  const orderedTopics = ["coffee", "spreadsheets", "cyber", "ai", "tools", "waste"];

  for (const topic of orderedTopics) {
    if (TOPIC_KEYWORDS[topic].some((keyword) => normalizedQuestion.includes(keyword))) {
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
  const modeKey = isFunMode ? "fun" : "serious";
  const replyPool = MOCK_REPLIES[modeKey][topic];
  const selectedReply = replyPool[getDeterministicIndex(question, replyPool.length)];

  return {
    topic,
    text: selectedReply,
    ctas: TOPIC_CTA_LABELS[topic].map((label) => CTA_BY_LABEL[label]).filter(Boolean)
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
