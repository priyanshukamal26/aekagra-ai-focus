import { useRef, useCallback } from "react";
import { gsap, useGSAP } from "@/lib/gsap-setup";

/**
 * Magnetic hover effect hook using gsap.quickTo() for performance.
 * Elements subtly shift toward the cursor on hover.
 */
export function useMagnetic(strength: number = 0.3) {
  const elementRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const el = elementRef.current;
    if (!el) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      xTo(relX * strength);
      yTo(relY * strength);
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, { scope: elementRef });

  return elementRef;
}
