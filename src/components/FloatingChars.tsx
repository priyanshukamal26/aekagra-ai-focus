import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap-setup";

const chars = "αβγδεζηθλμπσφψωΣΔΩ∂∇∫∞≈≠±×÷√∑∏ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const FloatingChars = ({ count = 40 }: { count?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const container = containerRef.current;
    if (!container) return;

    const spans = container.querySelectorAll(".floating-char");

    spans.forEach((span) => {
      // Organic floating with random parameters via gsap.utils.random()
      gsap.to(span, {
        y: gsap.utils.random(-30, 30),
        x: gsap.utils.random(-15, 15),
        rotation: gsap.utils.random(-15, 15),
        scale: gsap.utils.random(0.8, 1.2),
        duration: gsap.utils.random(8, 25),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: gsap.utils.random(0, 5),
      });

      // Subtle opacity pulse
      gsap.to(span, {
        autoAlpha: gsap.utils.random(0.03, 0.12),
        duration: gsap.utils.random(3, 8),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: gsap.utils.random(0, 3),
      });
    });
  }, { scope: containerRef });

  // Generate items at render time (stable across re-renders via count)
  const items = Array.from({ length: count }, (_, i) => ({
    id: i,
    char: chars[Math.floor(Math.random() * chars.length)],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 1,
  }));

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((item) => (
        <span
          key={item.id}
          className="floating-char font-ndot"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            fontSize: `${item.size}rem`,
            opacity: 0.06,
          }}
        >
          {item.char}
        </span>
      ))}
    </div>
  );
};
