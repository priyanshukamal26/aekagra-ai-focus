import { ReactNode, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Eye, CalendarDays, MessageSquare, BarChart3, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { gsap, useGSAP } from "@/lib/gsap-setup";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Eye, label: "Focus Mode", path: "/focus" },
  { icon: CalendarDays, label: "Study Planner", path: "/planner" },
  { icon: MessageSquare, label: "AI Tutor", path: "/tutor" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const sidebarRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.4 } });

    // Logo entrance
    gsap.set(".sidebar-logo", { autoAlpha: 0, x: -15 });
    tl.to(".sidebar-logo", { autoAlpha: 1, x: 0, duration: 0.5 });

    // Nav items stagger
    const items = gsap.utils.toArray<HTMLElement>(".sidebar-nav-item");
    gsap.set(items, { autoAlpha: 0, x: -20 });
    tl.to(items, { autoAlpha: 1, x: 0, stagger: 0.06 }, "<0.15");

    // Logout button
    gsap.set(".sidebar-logout", { autoAlpha: 0, x: -15 });
    tl.to(".sidebar-logout", { autoAlpha: 1, x: 0 }, "<0.1");
  }, { scope: sidebarRef });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside ref={sidebarRef} className="w-64 border-r border-border/30 bg-card/30 flex flex-col">
        <div className="p-6">
          <Link to="/" className="sidebar-logo flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-ndot text-primary-foreground text-sm font-bold">A</span>
            </div>
            <span className="font-ndot text-lg">Aekagra<span className="text-gradient">.AI</span></span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3">
          <button
            onClick={handleLogout}
            className="sidebar-logout flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary w-full transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};
