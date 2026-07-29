import { useRef } from "react";
import { Shield } from "lucide-react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap-setup";

export const PrivacySection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Glass card entrance
    gsap.set(".privacy-card", { autoAlpha: 0, y: 40, scale: 0.98 });

    gsap.to(".privacy-card", {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".privacy-card",
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });

    // Shield icon pulse glow
    gsap.to(".privacy-shield", {
      scale: 1.08,
      boxShadow: "0 0 30px hsl(142 72% 50% / 0.3)",
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Privacy tags staggered entrance
    const tags = gsap.utils.toArray<HTMLElement>(".privacy-tag");
    gsap.set(tags, { autoAlpha: 0, y: 15, scale: 0.9 });

    ScrollTrigger.batch(tags, {
      start: "top 85%",
      onEnter: (batch) => {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          stagger: 0.08,
          duration: 0.5,
          ease: "back.out(1.4)",
          overwrite: true,
        });
      },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="privacy" className="py-32">
      <div className="container mx-auto px-6">
        <div className="privacy-card glass rounded-3xl p-12 md:p-20 text-center max-w-4xl mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <div className="relative z-10">
            <div className="privacy-shield w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-ndot mb-6">
              Your Privacy, <span className="text-gradient">Our Promise</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-4">
              All focus processing happens in your browser. No video data is ever uploaded, stored, or shared. Your webcam feed stays on your device — always.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              {["Local Processing", "No Cloud Upload", "No Tracking", "Open Source"].map((tag) => (
                <span key={tag} className="privacy-tag px-4 py-2 glass rounded-full text-xs font-mono text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
