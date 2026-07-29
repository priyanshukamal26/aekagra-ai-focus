import { useRef } from "react";
import { Eye, Brain, BarChart3 } from "lucide-react";
import { gsap, useGSAP, SplitText, ScrollTrigger } from "@/lib/gsap-setup";

const steps = [
  {
    icon: Eye,
    step: "01",
    title: "Detect Focus",
    description: "Real-time face & eye tracking powered by MediaPipe, running entirely in your browser.",
  },
  {
    icon: Brain,
    step: "02",
    title: "Plan Smart",
    description: "AI analyzes your syllabus and generates a personalized, structured study roadmap.",
  },
  {
    icon: BarChart3,
    step: "03",
    title: "Learn with AI",
    description: "An intelligent tutor explains, quizzes, and adapts to your learning patterns.",
  },
];

export const HowItWorks = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Heading reveal
    const headingSplit = SplitText.create(".hiw-heading", {
      type: "words",
      wordsClass: "split-word",
    });

    gsap.set(headingSplit.words, { autoAlpha: 0, y: 30 });

    gsap.to(headingSplit.words, {
      autoAlpha: 1,
      y: 0,
      stagger: 0.04,
      duration: 0.6,
      scrollTrigger: {
        trigger: ".hiw-heading",
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });

    // Label
    gsap.set(".hiw-label", { autoAlpha: 0, y: 15 });
    gsap.to(".hiw-label", {
      autoAlpha: 1,
      y: 0,
      duration: 0.5,
      scrollTrigger: {
        trigger: ".hiw-label",
        start: "top 90%",
        toggleActions: "play none none none",
      },
    });

    // Step cards with ScrollTrigger.batch
    const cards = gsap.utils.toArray<HTMLElement>(".hiw-card");
    gsap.set(cards, { autoAlpha: 0, y: 50, scale: 0.95 });

    ScrollTrigger.batch(cards, {
      start: "top 85%",
      onEnter: (batch) => {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.15,
          ease: "back.out(1.4)",
          overwrite: true,
        });
      },
    });

    // Icon hover animations via contextSafe are handled by CSS for simplicity
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="how-it-works" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <span className="hiw-label text-xs font-mono text-primary mb-4 block">HOW IT WORKS</span>
          <h2 className="hiw-heading text-4xl md:text-5xl font-bold font-ndot">
            Three steps to <span className="text-gradient">peak performance</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step) => (
            <div
              key={step.step}
              className="hiw-card glass rounded-2xl p-8 glass-hover group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="font-mono text-sm text-muted-foreground">{step.step}</span>
              </div>
              <h3 className="text-xl font-bold mb-3 font-ndot">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
