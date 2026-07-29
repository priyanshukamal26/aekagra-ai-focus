import { useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { TrendingUp, Clock, Flame, Target, Loader2 } from "lucide-react";
import { useDashboardStats, useDashboardUpcoming } from "@/hooks/use-api";
import { useNavigate } from "react-router-dom";
import { gsap, useGSAP } from "@/lib/gsap-setup";

const iconMap = {
  focusScore: Target,
  studyHours: Clock,
  dayStreak: Flame,
  tasksDone: TrendingUp,
};

const labelMap: Record<string, string> = {
  focusScore: "Focus Score",
  studyHours: "Study Hours Today",
  dayStreak: "Day Streak",
  tasksDone: "Tasks Done",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: statsData, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: upcomingData, isLoading: upcomingLoading } = useDashboardUpcoming(5);
  const pageRef = useRef<HTMLDivElement>(null);

  const stats = statsData?.stats;
  const upcomingTasks = upcomingData?.tasks || [];

  const statEntries = stats
    ? [
      { key: "focusScore", ...stats.focusScore },
      { key: "studyHours", ...stats.studyHours },
      { key: "dayStreak", ...stats.dayStreak },
      { key: "tasksDone", ...stats.tasksDone },
    ]
    : [];

  const quickActions = [
    { label: "Start Focus Session", emoji: "🎯", path: "/focus" },
    { label: "Create Study Plan", emoji: "📚", path: "/planner" },
    { label: "Ask AI Tutor", emoji: "🤖", path: "/tutor" },
    { label: "View Analytics", emoji: "📊", path: "/analytics" },
  ];

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    // Header
    gsap.set(".dash-header", { autoAlpha: 0, y: 15 });
    tl.to(".dash-header", { autoAlpha: 1, y: 0, duration: 0.5 });

    // Stat cards
    const statCards = gsap.utils.toArray<HTMLElement>(".dash-stat");
    if (statCards.length > 0) {
      gsap.set(statCards, { autoAlpha: 0, y: 25, scale: 0.95 });
      tl.to(statCards, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        stagger: 0.1,
        duration: 0.5,
        ease: "back.out(1.4)",
      }, "<0.1");
    }

    // Panels
    gsap.set(".dash-panel", { autoAlpha: 0, y: 20 });
    tl.to(".dash-panel", {
      autoAlpha: 1,
      y: 0,
      stagger: 0.12,
      duration: 0.5,
    }, "<0.2");
  }, { scope: pageRef, dependencies: [statsLoading, upcomingLoading] });

  return (
    <AppLayout>
      <div ref={pageRef} className="p-8">
        <div className="dash-header">
          <h1 className="text-3xl font-bold font-ndot mb-2">Dashboard</h1>
          <p className="text-muted-foreground mb-8">Welcome back. Here's your progress today.</p>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-muted mb-4" />
                <div className="h-7 w-20 bg-muted rounded mb-2" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : statsError ? (
          <div className="glass rounded-2xl p-6 mb-8 text-center text-muted-foreground">
            Failed to load stats. Please try refreshing the page.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statEntries.map((stat) => {
              const Icon = iconMap[stat.key as keyof typeof iconMap];
              return (
                <div
                  key={stat.key}
                  className="dash-stat glass rounded-2xl p-6 glass-hover"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    {stat.change && (
                      <span className="text-xs font-mono text-primary">{stat.change}</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold font-ndot">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{labelMap[stat.key]}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="dash-panel glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="p-4 rounded-xl bg-secondary hover:bg-muted text-left transition-colors"
                >
                  <span className="text-2xl mb-2 block">{action.emoji}</span>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="dash-panel glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Upcoming Tasks</h2>
            {upcomingLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p className="mb-1">No upcoming tasks</p>
                <p className="text-xs">Create a study plan to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary"
                  >
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.plan_title} · Week {task.week_number}
                      </p>
                    </div>
                    {task.due_date && (
                      <span className="text-xs font-mono text-muted-foreground">{task.due_date}</span>
                    )}
                    {!task.due_date && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
