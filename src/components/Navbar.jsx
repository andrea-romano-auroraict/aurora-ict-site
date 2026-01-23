import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const links = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Insights", href: "/insights" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [open]);

  return (
    <header className="fixed top-0 w-full z-50">
      {/* Brand row */}
      <div className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 md:py-6 flex items-center justify-center">
          {/* Centered, bigger logo (ONLY) */}
          <motion.a
            href="/"
            aria-label="Aurora ICT Home"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.02 }}
            className="inline-flex items-center justify-center"
          >
            <img
              src="/aurora-ict-logo.png"
              alt="Aurora ICT — AI-powered IT services"
              className="h-16 md:h-24 lg:h-28 w-auto"
            />
          </motion.a>

          {/* Mobile menu button (kept, but positioned top-right via absolute) */}
          <button
            onClick={() => setOpen(true)}
            className="md:hidden absolute right-6 rounded-xl border border-white/15 px-4 py-2 text-white/90 bg-white/10"
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Desktop nav row */}
      <nav className="hidden md:block glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          {links.map((l) => (
            <motion.a
              key={l.href}
              href={l.href}
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 350, damping: 18 }}
              whileTap={{ scale: 0.98 }}
              className="relative px-5 py-2.5 rounded-xl text-[18px] font-semibold text-white/90 transition"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              {/* visible hover glow */}
              <motion.span
                className="absolute inset-0 rounded-xl -z-10"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.18 }}
                  style={{
                background:
                "linear-gradient(90deg, rgba(57,255,122,0.28), rgba(124,58,237,0.26))",
                boxShadow:
                "0 0 0 2px rgba(255,255,255,0.14), 0 0 28px rgba(57,255,122,0.32), 0 0 34px rgba(124,58,237,0.24)",
                  }}
              /><motion.span
  className="absolute left-3 right-3 -bottom-1 h-[2px] rounded-full"
  initial={{ opacity: 0, scaleX: 0.2 }}
  whileHover={{ opacity: 1, scaleX: 1 }}
  transition={{ duration: 0.18 }}
  style={{
    background: "linear-gradient(90deg, var(--color-accent-green), var(--color-accent-purple))",
    transformOrigin: "left",
  }}
/>

              {l.label}
            </motion.a>
          ))}

          <div className="flex-1" />

          <a
            href="/contact"
            className="px-6 py-3 rounded-xl font-extrabold text-[#08110c] transition hover:brightness-110"
            style={{
              background: "var(--color-accent-green)",
              boxShadow: "0 0 26px rgba(57,255,122,0.26)",
            }}
          >
            Book a free consult
          </a>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 h-full w-[84vw] max-w-sm p-6 glass"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              <div className="flex items-center justify-between mb-6">
                <a href="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
                  <img src="/aurora-ict-logo.png" alt="Aurora ICT" className="h-12 w-auto" />
                </a>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/15 px-4 py-2 text-white bg-white/10"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 rounded-xl text-lg font-semibold text-white/90"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    {l.label}
                  </a>
                ))}
              </div>

              <a
                href="/contact"
                onClick={() => setOpen(false)}
                className="mt-6 inline-flex w-full items-center justify-center px-5 py-4 rounded-xl font-extrabold text-[#08110c] transition hover:brightness-110"
                style={{
                  background: "var(--color-accent-green)",
                  boxShadow: "0 0 26px rgba(57,255,122,0.26)",
                }}
              >
                Book a free consult
              </a>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}