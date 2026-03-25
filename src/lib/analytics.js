const getPageContext = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {};
  }

  return {
    page_path: window.location?.pathname,
    page_title: document.title
  };
};

const sanitizePayload = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

export const trackEvent = (eventName, properties = {}) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload = sanitizePayload({
    ...getPageContext(),
    ...properties
  });

  window.dataLayer = window.dataLayer || [];
  const gtagSafe =
    typeof window.gtag === "function"
      ? window.gtag
      : function () {
          window.dataLayer.push(arguments);
        };

  gtagSafe("event", eventName, payload);
};

export const bucketMessageLength = (messageLength) => {
  if (messageLength <= 80) {
    return "short";
  }
  if (messageLength <= 220) {
    return "medium";
  }
  return "long";
};

export const getCtaDestinationType = (ctaKey) => {
  const key = `${ctaKey ?? ""}`;

  if (key === "health-check") return "health_check";
  if (key === "services") return "services";
  if (key === "roadmap") return "roadmap";
  if (key === "contact") return "contact";

  return "unknown";
};
