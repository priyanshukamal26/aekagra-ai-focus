import { useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { TrendingUp, Clock, Zap, AlertTriangle, Loader2 } from "lucide-react";
import { useAnalyticsSummary, useFocusTrend, useSubjectDistribution } from "@/hooks/use-api";
import { gsap, useGSAP } from "@/lib/gsap-setup";

const Analytics = () => {
  const { data: summaryData, isLoading: summaryLoading } = useAnalyticsSummary();
  const { data: trendData, isLoading: trendLoading } = useFocusTrend(7);
  const { data: subjectsData, isLoading: subjectsLoading } = useSubjectDistribution();
  const pageRef = useRef<HTMLDivElement>(null);

  const summary = summaryData?.summary;
  const trend = trendData?.trend || [];
  const subjects = subjectsData?.subjects || [];
  const maxVal = Math.max(...trend.map((d) => d.avg_score), 100);

  const summaryStats = [
    { icon: TrendingUp, label: "Weekly Average", value: summary ? `${summary.weeklyAverage}%` : "—", color: "text-primary" },
    { icon: Clock, label: "Total Hours", value: summary ? `${summary.totalHours}h` : "—", color: "text-primary" },
    { icon: Zap, label: "Longest Streak", value: summary ? `${summary.longestStreak} days` : "—", color: "text-primary" },
    { icon: AlertTriangle, label: "Distractions", value: summary ? `${summary.distractions}` : "—", color: "text-destructive" },
  ];

  // Page entrance animation
  useGSAP(() => {
    if (summaryLoading || trendLoading || subjectsLoading) return;

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    gsap.set(".analytics-header", { autoAlpha: 0, y: 15 });
    tl.to(".analytics-header", { autoAlpha: 1, y: 0, duration: 0.5 });

    const statCards = gsap.utils.toArray<HTMLElement>(".analytics-stat");
    if (statCards.length > 0) {
      gsap.set(statCards, { autoAlpha: 0, y: 20 });
      tl.to(statCards, {
        autoAlpha: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.5,
        ease: "back.out(1.4)",
      }, "<0.1");
    }

    gsap.set(".analytics-panel", { autoAlpha: 0, y: 20 });
    tl.to(".analytics-panel", {
      autoAlpha: 1,
      y: 0,
      stagger: 0.12,
      duration: 0.5,
    }, "<0.2");
  }, { scope: pageRef, dependencies: [summaryLoading, trendLoading, subjectsLoading] });

  // Animate bars and progress when data loads
  const barsRef = useRef<HTMLDivElement>(null);
  const subjectsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barsRef.current && trend.length > 0) {
      const bars = barsRef.current.querySelectorAll<HTMLElement>(".trend-bar");
      bars.forEach((bar, i) => {
        const height = bar.getAttribute("data-height") || "0%";
        gsap.fromTo(bar,
          { height: 0 },
          { height, duration: 0.6, delay: 0.5 + i * 0.1, ease: "power2.out" }
        );
      });
    }
  }, [trend]);

  useEffect(() => {
    if (subjectsRef.current && subjects.length > 0) {
      const progressBars = subjectsRef.current.querySelectorAll<HTMLElement>(".subject-bar");
      progressBars.forEach((bar, i) => {
        const width = bar.getAttribute("data-width") || "0%";
        gsap.fromTo(bar,
          { width: 0 },
          { width, duration: 0.6, delay: 0.6 + i * 0.1, ease: "power2.out" }
        );
      });
    }
  }, [subjects]);

  if (summaryLoading || trendLoading || subjectsLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full p-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div ref={pageRef} className="p-8 pb-20">
        <div className="analytics-header">
          <h1 className="text-3xl font-bold font-ndot mb-2">Analytics</h1>
          <p className="text-muted-foreground mb-8">Your focus and study performance at a glance.</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryStats.map((stat) => (
            <div key={stat.label} className="analytics-stat glass rounded-2xl p-5">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <p className="text-2xl font-bold font-ndot">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Focus Trend Chart */}
          <div className="analytics-panel glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-6">Daily Focus Trend (Last 7 Days)</h2>
            {trend.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <div ref={barsRef} className="flex items-end gap-3 h-48">
                {trend.map((point) => (
                  <div key={point.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {point.avg_score}% · {point.sessions} sessions
                    </div>

                    <span className="text-xs font-mono text-muted-foreground">{point.avg_score}%</span>
                    <div
                      className="trend-bar w-full rounded-lg bg-primary/80 min-h-[4px] hover:bg-primary transition-colors"
                      data-height={`${(point.avg_score / maxVal) * 100}%`}
                      style={{
                        height: 0,
                        boxShadow: "0 0 10px hsl(142 72% 50% / 0.3)",
                      }}
                    />
                    <span className="text-xs text-muted-foreground truncate w-full text-center">
                      {new Date(point.date).toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subject Distribution */}
          <div className="analytics-panel glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-6">Study Time by Subject</h2>
            {subjects.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">No subject data recorded yet.</p>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden" />
              </div>
            ) : (
              <div ref={subjectsRef} className="space-y-4">
                {subjects.map((subject) => (
                  <div key={subject.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{subject.name}</span>
                      <span className="text-muted-foreground font-mono">{Math.round(subject.percent)}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="subject-bar h-full rounded-full bg-primary"
                        data-width={`${subject.percent}%`}
                        style={{
                          width: 0,
                          backgroundColor: subject.color || undefined,
                        }}
                      />
                    </div>
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

export default Analytics;
