import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FloatingChars } from "@/components/FloatingChars";
import { gsap, useGSAP, SplitText } from "@/lib/gsap-setup";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    // Logo
    gsap.set(".register-logo", { autoAlpha: 0, scale: 0.8 });
    tl.to(".register-logo", { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" });

    // Heading — SplitText
    const headingSplit = SplitText.create(".register-heading", {
      type: "chars",
      charsClass: "split-char",
    });
    gsap.set(headingSplit.chars, { autoAlpha: 0, y: 20 });
    tl.to(headingSplit.chars, {
      autoAlpha: 1,
      y: 0,
      stagger: 0.03,
      duration: 0.4,
    }, "<0.2");

    // Subtitle
    gsap.set(".register-subtitle", { autoAlpha: 0, y: 10 });
    tl.to(".register-subtitle", { autoAlpha: 1, y: 0, duration: 0.4 }, "<0.15");

    // Form card
    gsap.set(".register-form", { autoAlpha: 0, y: 20, scale: 0.97 });
    tl.to(".register-form", {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      ease: "back.out(1.4)",
    }, "<0.1");

    // Form fields stagger
    const fields = gsap.utils.toArray<HTMLElement>(".register-field");
    gsap.set(fields, { autoAlpha: 0, y: 15 });
    tl.to(fields, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.4 }, "<0.15");

    // Submit button
    gsap.set(".register-submit", { autoAlpha: 0, y: 10 });
    tl.to(".register-submit", { autoAlpha: 1, y: 0, duration: 0.4 }, "<0.1");

    // Orb animation
    gsap.to(".register-orb", {
      x: gsap.utils.random(-30, 30),
      y: gsap.utils.random(-20, 20),
      scale: gsap.utils.random(0.9, 1.1),
      duration: 15,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, { scope: pageRef });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both password fields match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      toast({
        title: "Registration failed",
        description: err instanceof Error ? err.message : "Could not create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={pageRef} className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <FloatingChars count={25} />
      <div className="register-orb absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-6">
        <div className="text-center mb-8">
          <Link to="/" className="register-logo inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-ndot text-primary-foreground font-bold">A</span>
            </div>
            <span className="font-ndot text-2xl">Aekagra<span className="text-gradient">.AI</span></span>
          </Link>
          <h1 className="register-heading text-3xl font-bold font-ndot mb-2">Create account</h1>
          <p className="register-subtitle text-muted-foreground text-sm">Start optimizing your focus and learning</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form glass rounded-2xl p-8 space-y-5">
          <div className="register-field">
            <label className="text-sm text-muted-foreground mb-2 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="register-field">
            <label className="text-sm text-muted-foreground mb-2 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="register-field">
            <label className="text-sm text-muted-foreground mb-2 block">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="register-submit w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity glow-green disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Account
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
