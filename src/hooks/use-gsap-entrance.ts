import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap-setup";

/**
 * Staggered entrance animation for a list of elements using ScrollTrigger.batch().
 * Elements animate in when they enter the viewport.
 */
export function useStaggerEntrance(
  selector: string,
  options: {
    y?: number;
    scale?: number;
    duration?: number;
    stagger?: number;
    start?: string;
    ease?: string;
  } = {}
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    y = 40,
    scale = 0.97,
    duration = 0.6,
    stagger = 0.1,
    start = "top 85%",
    ease = "power2.out",
  } = options;

  useGSAP(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll(selector);
    if (elements.length === 0) return;

    // Set initial state
    gsap.set(elements, { autoAlpha: 0, y, scale });

    ScrollTrigger.batch(elements, {
      start,
      onEnter: (batch) => {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration,
          stagger,
          ease,
          overwrite: true,
        });
      },
      onLeaveBack: (batch) => {
        gsap.set(batch, { autoAlpha: 0, y, scale, overwrite: true });
      },
    });
  }, { scope: containerRef });

  return containerRef;
}

/**
 * Numeric counter animation that counts from 0 to a target value.
 */
export function useCounterAnimation(
  endValue: number,
  options: {
    duration?: number;
    delay?: number;
    decimals?: number;
  } = {}
) {
  const ref = useRef<HTMLElement>(null);

  const {
    duration = 1.2,
    delay = 0,
    decimals = 0,
  } = options;

  useGSAP(() => {
    const el = ref.current;
    if (!el || endValue === 0) return;

    const proxy = { value: 0 };
    gsap.to(proxy, {
      value: endValue,
      duration,
      delay,
      ease: "power2.out",
      snap: { value: decimals > 0 ? 1 / Math.pow(10, decimals) : 1 },
      onUpdate: () => {
        el.textContent = decimals > 0
          ? proxy.value.toFixed(decimals)
          : Math.round(proxy.value).toString();
      },
    });
  }, { dependencies: [endValue] });

  return ref;
}

/**
 * Simple page entrance timeline — animates children in sequence.
 */
export function usePageEntrance(selectors: string[]) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const container = containerRef.current;
    if (!container) return;

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    selectors.forEach((sel, i) => {
      const elements = container.querySelectorAll(sel);
      if (elements.length === 0) return;

      gsap.set(elements, { autoAlpha: 0, y: 25 });
      tl.to(elements, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
      }, i === 0 ? 0 : "<0.1");
    });
  }, { scope: containerRef });

  return containerRef;
}
