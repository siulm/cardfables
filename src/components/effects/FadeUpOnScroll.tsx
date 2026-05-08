"use client";

import { useEffect, useRef, useState } from "react";

interface FadeUpOnScrollProps {
  children: React.ReactNode;
  delay?: number;
  animation?: "fade-up" | "curtain-drop";
  className?: string;
  threshold?: number;
}

export function FadeUpOnScroll({
  children,
  delay = 0,
  animation = "fade-up",
  className = "",
  threshold = 0.15,
}: FadeUpOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) {
      setAnimate(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setAnimate(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  const animationClass =
    animation === "curtain-drop" ? "animate-curtain-drop" : "animate-fade-up";

  return (
    <div
      ref={ref}
      className={`${animate ? animationClass : ""} ${className}`}
      style={animate ? { animationDelay: `${delay}s` } : { opacity: 0 }}
    >
      {children}
    </div>
  );
}
