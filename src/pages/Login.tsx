import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FloatingChars } from "@/components/FloatingChars";
import { gsap, useGSAP, SplitText } from "@/lib/gsap-setup";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    // Logo
    gsap.set(".login-logo", { autoAlpha: 0, scale: 0.8 });
    tl.to(".login-logo", { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" });

    // Heading — SplitText
    const headingSplit = SplitText.create(".login-heading", {
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
    gsap.set(".login-subtitle", { autoAlpha: 0, y: 10 });
    tl.to(".login-subtitle", { autoAlpha: 1, y: 0, duration: 0.4 }, "<0.15");

    // Form card
    gsap.set(".login-form", { autoAlpha: 0, y: 20, scale: 0.97 });
    tl.to(".login-form", {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      ease: "back.out(1.4)",
    }, "<0.1");

    // Form fields stagger
    const fields = gsap.utils.toArray<HTMLElement>(".login-field");
    gsap.set(fields, { autoAlpha: 0, y: 15 });
    tl.to(fields, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.4 }, "<0.15");

    // Submit button
    gsap.set(".login-submit", { autoAlpha: 0, y: 10 });
    tl.to(".login-submit", { autoAlpha: 1, y: 0, duration: 0.4 }, "<0.1");

    // Orb animation
    gsap.to(".login-orb", {
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
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={pageRef} className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <FloatingChars count={25} />
      <div className="login-orb absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-6">
        <div className="text-center mb-8">
          <Link to="/" className="login-logo inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-ndot text-primary-foreground font-bold">A</span>
            </div>
            <span className="font-ndot text-2xl">Aekagra<span className="text-gradient">.AI</span></span>
          </Link>
          <h1 className="login-heading text-3xl font-bold font-ndot mb-2">Welcome back</h1>
          <p className="login-subtitle text-muted-foreground text-sm">Sign in to continue your focus journey</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form glass rounded-2xl p-8 space-y-5">
          <div className="login-field">
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

          <div className="login-field">
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

          <button
            type="submit"
            disabled={loading}
            className="login-submit w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity glow-green disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
