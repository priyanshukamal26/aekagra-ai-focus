import { useRef } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, SplitText, ScrollTrigger } from "@/lib/gsap-setup";
import { FloatingChars } from "./FloatingChars";

export const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Respect prefers-reduced-motion
    const mm = gsap.matchMedia();

    mm.add(
      {
        hasMotion: "(prefers-reduced-motion: no-preference)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { reduceMotion } = context.conditions!;
        const dur = reduceMotion ? 0 : undefined;

        // --- Master entrance timeline ---
        const tl = gsap.timeline({
          defaults: { ease: "power3.out", duration: dur ?? 0.8 },
        });

        // 1. Badge pill
        gsap.set(".hero-badge", { autoAlpha: 0, scale: 0.8, y: 20 });
        tl.to(".hero-badge", {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          ease: dur === 0 ? "none" : "back.out(1.7)",
        });

        // 2. Heading — SplitText char-by-char 3D reveal
        const headingSplit = SplitText.create(".hero-heading", {
          type: "chars, words",
          charsClass: "split-char",
          wordsClass: "split-word",
        });

        gsap.set(headingSplit.chars, {
          autoAlpha: 0,
          y: 60,
          rotationX: -90,
          transformOrigin: "bottom",
        });

        tl.to(
          headingSplit.chars,
          {
            autoAlpha: 1,
            y: 0,
            rotationX: 0,
            stagger: 0.02,
            duration: dur ?? 0.6,
            ease: dur === 0 ? "none" : "power3.out",
          },
          "<0.15"
        );

        // 3. Subtitle — words fade-in
        const subtitleSplit = SplitText.create(".hero-subtitle", {
          type: "words",
          wordsClass: "split-word",
        });

        gsap.set(subtitleSplit.words, { autoAlpha: 0, y: 25 });

        tl.to(
          subtitleSplit.words,
          {
            autoAlpha: 1,
            y: 0,
            stagger: 0.015,
            duration: dur ?? 0.5,
          },
          "<0.3"
        );

        // 4. CTA buttons
        gsap.set(".hero-cta", { autoAlpha: 0, y: 30 });
        tl.to(
          ".hero-cta",
          {
            autoAlpha: 1,
            y: 0,
            stagger: 0.12,
            ease: dur === 0 ? "none" : "back.out(1.4)",
            duration: dur ?? 0.6,
          },
          "<0.2"
        );

        // 5. Scroll indicator
        gsap.set(".hero-scroll-indicator", { autoAlpha: 0 });
        tl.to(".hero-scroll-indicator", { autoAlpha: 1, delay: 0.5 });

        if (!reduceMotion) {
          // Infinite scroll indicator bounce
          gsap.to(".hero-scroll-dot", {
            y: 12,
            duration: 0.8,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });

          // Gradient orb ambient animation
          gsap.to(".hero-orb-1", {
            x: gsap.utils.random(-50, 50),
            y: gsap.utils.random(-30, 30),
            scale: gsap.utils.random(0.9, 1.2),
            duration: 18,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });

          gsap.to(".hero-orb-2", {
            x: gsap.utils.random(-40, 60),
            y: gsap.utils.random(-40, 20),
            scale: gsap.utils.random(0.85, 1.15),
            duration: 22,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });

          // Parallax on scroll
          gsap.to(".hero-heading", {
            y: -60,
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
          });

          gsap.to(".hero-subtitle", {
            y: -30,
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
          });
        }
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <FloatingChars count={50} />

      {/* Gradient orbs */}
      <div className="hero-orb-1 absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="hero-orb-2 absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <div className="hero-badge inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground font-mono">AI-Powered Focus System</span>
        </div>

        <h1 className="hero-heading text-5xl md:text-7xl lg:text-8xl font-bold font-ndot leading-tight mb-6">
          Train Your{" "}
          <span className="text-gradient glow-text">Focus</span>
          <br />
          Master Your{" "}
          <span className="text-gradient glow-text">Learning</span>
        </h1>

        <p className="hero-subtitle text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Real-time focus detection, AI-powered study planning, and an intelligent tutor — all running locally in your browser.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="hero-cta group relative px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg glow-green hover:scale-105 transition-transform"
          >
            Start Studying
            <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl group-hover:blur-2xl transition-all" />
          </Link>
          <Link
            to="/login"
            className="hero-cta px-8 py-4 glass rounded-xl font-semibold text-lg text-foreground glass-hover"
          >
            Login →
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll-indicator absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <div className="hero-scroll-dot w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </section>
  );
};
