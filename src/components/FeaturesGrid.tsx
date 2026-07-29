import { useRef } from "react";
import { Eye, CalendarDays, MessageSquare, TrendingUp, Shield, Zap } from "lucide-react";
import { gsap, useGSAP, SplitText, ScrollTrigger } from "@/lib/gsap-setup";

const features = [
  {
    icon: Eye,
    title: "Focus Detection",
    description: "Real-time face tracking, eye alignment, and head stability analysis using your webcam.",
  },
  {
    icon: CalendarDays,
    title: "AI Study Planner",
    description: "Upload your syllabus and let AI create a week-by-week study roadmap tailored to your pace.",
  },
  {
    icon: MessageSquare,
    title: "Smart AI Tutor",
    description: "Explain, quiz, revise, and interview modes powered by advanced language models.",
  },
  {
    icon: TrendingUp,
    title: "Deep Analytics",
    description: "Track focus trends, study hours, streaks, and distraction patterns over time.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "All focus processing happens locally in your browser. No video data leaves your device.",
  },
  {
    icon: Zap,
    title: "RAG Pipeline",
    description: "Upload notes and get context-aware answers using retrieval-augmented generation.",
  },
];

export const FeaturesGrid = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Heading
    const headingSplit = SplitText.create(".features-heading", {
      type: "words",
      wordsClass: "split-word",
    });

    gsap.set(".features-label", { autoAlpha: 0, y: 15 });
    gsap.set(headingSplit.words, { autoAlpha: 0, y: 25 });

    gsap.to(".features-label", {
      autoAlpha: 1,
      y: 0,
      duration: 0.5,
      scrollTrigger: {
        trigger: ".features-label",
        start: "top 90%",
        toggleActions: "play none none none",
      },
    });

    gsap.to(headingSplit.words, {
      autoAlpha: 1,
      y: 0,
      stagger: 0.04,
      duration: 0.6,
      scrollTrigger: {
        trigger: ".features-heading",
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });

    // Feature cards — batch entrance
    const cards = gsap.utils.toArray<HTMLElement>(".feature-card");
    gsap.set(cards, { autoAlpha: 0, y: 40, scale: 0.97 });

    ScrollTrigger.batch(cards, {
      start: "top 85%",
      onEnter: (batch) => {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          overwrite: true,
        });
      },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="features" className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-20">
          <span className="features-label text-xs font-mono text-primary mb-4 block">FEATURES</span>
          <h2 className="features-heading text-4xl md:text-5xl font-bold font-ndot">
            Everything you need to <span className="text-gradient">stay focused</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="feature-card glass rounded-2xl p-8 glass-hover group cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
