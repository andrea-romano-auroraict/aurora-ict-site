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
      {/* ================= BRAND BANNER ================= */}
      <div className="glass border-b border-white/10 overflow-visible">
        <div className="max-w-7xl mx-auto px-6 py-2 md:py-3 flex items-center justify-center relative overflow-visible">
          {/* Centered logo */}
          <motion.a
            href="/"
            aria-label="Aurora ICT Home"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center justify-center -my-5 md:-my-6 drop-shadow-[0_0_28px_rgba(57,255,122,0.35)]"

          >
            <img
              src="/aurora-ict-logo.png"
              alt="Aurora ICT — AI-powered IT services"
              className="w-auto max-h-none !h-[72px] md:!h-[116px] lg:!h-[144px] xl:!h-[173px]"
            />
          </motion.a>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(true)}
            className="md:hidden absolute right-6 rounded-xl border border-white/15 px-4 py-2 text-white/90 bg-white/10 hover:bg-white/20 transition"
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* ================= DESKTOP NAV ================= */}
      <nav className="hidden md:block glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          {links.map((l) => (
            <motion.a
              key={l.href}
              href={l.href}
              whileHover={{ y: -8, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 320, damping: 16 }}
              whileTap={{ scale: 0.97 }}
              className="relative px-6 py-3 rounded-xl text-[18px] font-semibold text-white/95 transition"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {/* Glow background */}
              <motion.span
                className="absolute inset-0 rounded-xl -z-10"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                style={{
                  background:
                    "linear-gradient(90deg, rgba(57,255,122,0.35), rgba(124,58,237,0.32))",
                  boxShadow:
                    "0 0 0 2px rgba(255,255,255,0.16), 0 0 32px rgba(57,255,122,0.35), 0 0 40px rgba(124,58,237,0.28)",
                }}
              />

              {/* Underline accent */}
              <motion.span
                className="absolute left-4 right-4 -bottom-1 h-[3px] rounded-full"
                initial={{ opacity: 0, scaleX: 0.2 }}
                whileHover={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.2 }}
                style={{
                  background:
                    "linear-gradient(90deg, var(--color-accent-green), var(--color-accent-purple))",
                  transformOrigin: "left",
                }}
              />

              {l.label}
            </motion.a>
          ))}

          <div className="flex-1" />

          {/* CTA */}
          <a
            href="/contact"
            className="px-7 py-3.5 rounded-xl font-extrabold text-[#08110c] transition hover:brightness-110"
            style={{
              background: "var(--color-accent-green)",
              boxShadow: "0 0 30px rgba(57,255,122,0.35)",
            }}
          >
            Book a free consult
          </a>
        </div>
      </nav>

      {/* ================= MOBILE DRAWER ================= */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60"
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
                <a
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3"
                >
                  <img
                    src="/aurora-ict-logo.png"
                    alt="Aurora ICT"
                    className="h-14 w-auto"
                  />
                </a>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/15 px-4 py-2 text-white bg-white/10 hover:bg-white/20 transition"
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
                    className="block px-5 py-4 rounded-xl text-lg font-semibold text-white/95 transition hover:brightness-110"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    {l.label}
                  </a>
                ))}
              </div>

              <a
                href="/contact"
                onClick={() => setOpen(false)}
                className="mt-6 inline-flex w-full items-center justify-center px-6 py-4 rounded-xl font-extrabold text-[#08110c] transition hover:brightness-110"
                style={{
                  background: "var(--color-accent-green)",
                  boxShadow: "0 0 30px rgba(57,255,122,0.35)",
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