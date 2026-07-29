import { useRef } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, SplitText } from "@/lib/gsap-setup";

export const CTASection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Heading — SplitText word reveal on scroll
    const headingSplit = SplitText.create(".cta-heading", {
      type: "words, chars",
      charsClass: "split-char",
      wordsClass: "split-word",
    });

    gsap.set(headingSplit.chars, { autoAlpha: 0, y: 40 });

    gsap.to(headingSplit.chars, {
      autoAlpha: 1,
      y: 0,
      stagger: 0.03,
      duration: 0.5,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".cta-heading",
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });

    // Subtitle
    gsap.set(".cta-subtitle", { autoAlpha: 0, y: 20 });
    gsap.to(".cta-subtitle", {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
      scrollTrigger: {
        trigger: ".cta-subtitle",
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });

    // CTA button — scale bounce
    gsap.set(".cta-button", { autoAlpha: 0, scale: 0.9, y: 20 });
    gsap.to(".cta-button", {
      autoAlpha: 1,
      scale: 1,
      y: 0,
      duration: 0.7,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: ".cta-button",
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });

    // Footer text
    gsap.set(".cta-footer", { autoAlpha: 0 });
    gsap.to(".cta-footer", {
      autoAlpha: 1,
      duration: 0.8,
      scrollTrigger: {
        trigger: ".cta-footer",
        start: "top 90%",
        toggleActions: "play none none none",
      },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.03] to-transparent" />
      <div className="container mx-auto px-6 text-center relative">
        <div>
          <h2 className="cta-heading text-4xl md:text-6xl font-bold font-ndot mb-6">
            Ready to <span className="text-gradient glow-text">focus</span>?
          </h2>
          <p className="cta-subtitle text-lg text-muted-foreground mb-10 max-w-md mx-auto">
            Join Aekagra.AI and transform the way you study, learn, and grow.
          </p>
          <Link
            to="/register"
            className="cta-button inline-block px-10 py-5 bg-primary text-primary-foreground rounded-xl font-semibold text-lg glow-green hover:scale-105 transition-transform"
          >
            Start Studying Now
          </Link>
        </div>

        <div className="cta-footer mt-24 border-t border-border/30 pt-8">
          <p className="text-xs text-muted-foreground font-mono">
            © 2026 Aekagra.AI — Built with focus.
          </p>
        </div>
      </div>
    </section>
  );
};
