import { useEffect, useRef } from "react";

const LightStreaks = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createStreak = () => {
      const streak = document.createElement("div");
      const isRed = Math.random() < 0.3;
      const top = Math.random() * 100;
      const duration = 6 + Math.random() * 8;
      const height = 1 + Math.random() * 2;

      streak.style.cssText = `
        position: absolute;
        top: ${top}%;
        left: -200px;
        width: ${100 + Math.random() * 200}px;
        height: ${height}px;
        background: linear-gradient(90deg, transparent, ${
          isRed ? "hsla(4, 100%, 50%, 0.4)" : "hsla(190, 100%, 50%, 0.2)"
        }, transparent);
        animation: drift ${duration}s linear forwards;
        pointer-events: none;
      `;

      container.appendChild(streak);
      setTimeout(() => streak.remove(), duration * 1000);
    };

    const interval = setInterval(createStreak, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    />
  );
};

export default LightStreaks;
