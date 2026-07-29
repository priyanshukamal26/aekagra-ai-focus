import { useRef } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap-setup";

export const Navbar = () => {
  const navRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const nav = navRef.current;
    if (!nav) return;

    // Entrance timeline
    const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.5 } });

    gsap.set(".nav-item", { autoAlpha: 0, y: -15 });
    gsap.set(".nav-logo", { autoAlpha: 0, x: -20 });
    gsap.set(".nav-cta", { autoAlpha: 0, y: -10 });

    tl.to(".nav-logo", { autoAlpha: 1, x: 0, duration: 0.6 })
      .to(".nav-item", { autoAlpha: 1, y: 0, stagger: 0.08 }, "<0.2")
      .to(".nav-cta", { autoAlpha: 1, y: 0, stagger: 0.1 }, "<0.1");

    // Scroll-driven navbar glass deepening
    ScrollTrigger.create({
      trigger: document.body,
      start: "100px top",
      end: "101px top",
      onEnter: () => {
        gsap.to(nav, {
          backdropFilter: "blur(20px)",
          backgroundColor: "hsl(240 8% 8% / 0.85)",
          borderBottomColor: "hsl(240 6% 18% / 0.6)",
          duration: 0.3,
        });
      },
      onLeaveBack: () => {
        gsap.to(nav, {
          backdropFilter: "blur(12px)",
          backgroundColor: "hsl(240 8% 8% / 0.5)",
          borderBottomColor: "hsl(240 6% 18% / 0.3)",
          duration: 0.3,
        });
      },
    });
  }, { scope: navRef });

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <Link to="/" className="nav-logo flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="font-ndot text-primary-foreground text-sm font-bold">A</span>
          </div>
          <span className="font-ndot text-lg text-foreground">Aekagra<span className="text-gradient">.AI</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="nav-item text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="nav-item text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          <a href="#privacy" className="nav-item text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="nav-cta text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="nav-cta text-sm bg-primary text-primary-foreground px-5 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};
