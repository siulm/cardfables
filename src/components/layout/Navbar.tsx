"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "/browse", label: "Browse" },
  { href: "/shop", label: "Shop" },
  { href: "/submit", label: "Submit" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-400"
      style={{
        height: 60,
        background: scrolled ? "rgba(7,7,13,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(1.4)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(24px) saturate(1.4)" : "none",
        transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <span
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-sm"
            style={{
              background: "linear-gradient(135deg, #D4A846, #B8860B)",
            }}
          >
            📖
          </span>
          <span className="font-heading text-lg font-bold text-gold">
            CardFables
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors duration-200"
              style={{
                color:
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "#D4A846"
                    : "#8888A0",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span
            className="block h-0.5 w-5 rounded bg-text-secondary transition-transform duration-200"
            style={{
              transform: mobileOpen
                ? "rotate(45deg) translate(2.5px, 2.5px)"
                : "none",
            }}
          />
          <span
            className="block h-0.5 w-5 rounded bg-text-secondary transition-opacity duration-200"
            style={{ opacity: mobileOpen ? 0 : 1 }}
          />
          <span
            className="block h-0.5 w-5 rounded bg-text-secondary transition-transform duration-200"
            style={{
              transform: mobileOpen
                ? "rotate(-45deg) translate(2.5px, -2.5px)"
                : "none",
            }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="flex flex-col gap-1 px-6 pb-6 pt-2 md:hidden"
          style={{ background: "rgba(7,7,13,0.96)" }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-200"
              style={{
                color:
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "#D4A846"
                    : "#8888A0",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
