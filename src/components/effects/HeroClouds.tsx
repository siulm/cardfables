"use client";

import { useEffect, useState } from "react";

interface CloudShape {
  top: string;
  left?: string;
  right?: string;
  width: number;
  height: number;
  opacity: number;
  blur: number;
  rate: number;
}

const CLOUDS: CloudShape[] = [
  { top: "8%", right: "15%", width: 180, height: 50, opacity: 0.35, blur: 8, rate: -0.18 },
  { top: "12%", right: "25%", width: 120, height: 35, opacity: 0.25, blur: 6, rate: -0.10 },
  { top: "6%", left: "10%", width: 140, height: 40, opacity: 0.20, blur: 10, rate: 0.12 },
  { top: "18%", left: "30%", width: 90, height: 28, opacity: 0.15, blur: 5, rate: 0.06 },
];

export function HeroClouds() {
  const [scrollY, setScrollY] = useState(0);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) {
      setEnabled(false);
      return;
    }
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: c.top,
            left: c.left,
            right: c.right,
            width: c.width,
            height: c.height,
            background: `rgba(255,255,255,${c.opacity})`,
            borderRadius: c.height,
            filter: `blur(${c.blur}px)`,
            transform: enabled
              ? `translate3d(${scrollY * c.rate}px, 0, 0)`
              : "none",
            willChange: enabled ? "transform" : "auto",
          }}
        />
      ))}
    </div>
  );
}
