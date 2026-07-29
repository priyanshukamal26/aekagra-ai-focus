import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

// Register all plugins once at app startup
gsap.registerPlugin(
  useGSAP,
  ScrollTrigger,
  SplitText,
  Flip,
  ScrollToPlugin,
  ScrambleTextPlugin
);

// Set sensible defaults for all tweens
gsap.defaults({
  duration: 0.6,
  ease: "power2.out",
});

export { gsap, useGSAP, ScrollTrigger, SplitText, Flip, ScrollToPlugin, ScrambleTextPlugin };
