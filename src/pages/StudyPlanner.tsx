import { AppLayout } from "@/components/AppLayout";
import { useState, useRef } from "react";
import { Upload, CheckCircle2, Circle, Loader2, Trash2, Plus } from "lucide-react";
import { useStudyPlans, useStudyPlanDetail, useCreateStudyPlan, useToggleTask, useDeletePlan, StudyWeek } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { gsap, useGSAP } from "@/lib/gsap-setup";

const StudyPlanner = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [syllabusText, setSyllabusText] = useState("");
  const { toast } = useToast();
  const pageRef = useRef<HTMLDivElement>(null);

  const { data: plansData, isLoading: plansLoading } = useStudyPlans();
  const createMutation = useCreateStudyPlan();
  const deleteMutation = useDeletePlan();
  const toggleMutation = useToggleTask();

  // For simplicity in this phase, we just show the first plan if it exists
  const activePlanId = plansData?.plans?.[0]?.id || null;
  const { data: planDetail, isLoading: detailLoading } = useStudyPlanDetail(activePlanId);

  const activePlan = planDetail?.plan;
  const showEmptyState = !plansLoading && !activePlanId && !isCreating;

  // Page entrance animation
  useGSAP(() => {
    if (plansLoading || (activePlanId && detailLoading)) return;

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    gsap.set(".planner-header", { autoAlpha: 0, y: 15 });
    tl.to(".planner-header", { autoAlpha: 1, y: 0, duration: 0.5 });

    // Empty state / creating / plan content
    gsap.set(".planner-content", { autoAlpha: 0, y: 20 });
    tl.to(".planner-content", {
      autoAlpha: 1,
      y: 0,
      duration: 0.5,
      ease: "back.out(1.4)",
    }, "<0.15");

    // Week cards stagger
    const weekCards = gsap.utils.toArray<HTMLElement>(".planner-week");
    if (weekCards.length > 0) {
      gsap.set(weekCards, { autoAlpha: 0, y: 20 });
      tl.to(weekCards, {
        autoAlpha: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.5,
      }, "<0.1");
    }
  }, { scope: pageRef, dependencies: [plansLoading, detailLoading, activePlanId, isCreating] });

  const handleCreatePlan = () => {
    if (!syllabusText.trim()) {
      toast({ title: "Please enter some syllabus text", variant: "destructive" });
      return;
    }

    createMutation.mutate(
      {
        title: "Study Plan: " + syllabusText.slice(0, 20) + "...",
        syllabus_text: syllabusText,
        weeks: [] // Empty weeks triggers backend AI generation
      },
      {
        onSuccess: () => {
          setIsCreating(false);
          setSyllabusText("");
          toast({ title: "Study plan created!", description: "AI has generated your roadmap." });
        },
        onError: () => {
          toast({ title: "Failed to create plan", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = () => {
    if (activePlanId) {
      deleteMutation.mutate(activePlanId, {
        onSuccess: () => toast({ title: "Plan deleted" }),
      });
    }
  };

  return (
    <AppLayout>
      <div ref={pageRef} className="p-8 pb-20">
        <div className="planner-header flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold font-ndot mb-2">Study Planner</h1>
            <p className="text-muted-foreground">AI-generated study roadmap tailored to your goals.</p>
          </div>
          {activePlanId && (
            <button
              onClick={handleDelete}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Delete Plan"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {plansLoading || (activePlanId && detailLoading) ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : showEmptyState ? (
          <div className="planner-content glass rounded-2xl p-12 text-center max-w-xl mx-auto border-dashed border-2 border-border">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Create Your Study Plan</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Paste your syllabus or topics and let AI generate a personalized roadmap.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Plan
            </button>
          </div>
        ) : isCreating ? (
          <div className="planner-content glass rounded-2xl p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-4">New Study Plan</h2>
            <textarea
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              placeholder="Paste your syllabus, topics, or learning goals here..."
              className="w-full h-40 bg-secondary border border-border rounded-xl p-4 mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setIsCreating(false)} className="px-4 py-2 hover:bg-muted rounded-lg font-medium">Cancel</button>
              <button
                onClick={handleCreatePlan}
                disabled={createMutation.isPending}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Generate Plan
              </button>
            </div>
          </div>
        ) : activePlan ? (
          <div className="space-y-6">
            <div className="planner-content glass rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold font-ndot mb-2">{activePlan.title}</h2>
              <div className="text-sm text-muted-foreground">
                {(activePlan.completedTasks || 0)} / {(activePlan.totalTasks || 0)} tasks completed
              </div>
              <div className="w-full h-2 bg-secondary rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${activePlan.totalTasks ? ((activePlan.completedTasks || 0) / activePlan.totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            {activePlan.weeks?.map((week: StudyWeek) => (
              <div
                key={week.id}
                className="planner-week glass rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold font-ndot text-lg">Week {week.week_number}</h3>
                  <span className="text-xs font-mono text-muted-foreground">
                    {week.tasks.filter(t => t.is_completed).length}/{week.tasks.length} done
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {week.topics.map((topic, idx) => (
                    <span key={idx} className="px-3 py-1 bg-secondary rounded-full text-xs text-muted-foreground border border-border">
                      {topic}
                    </span>
                  ))}
                </div>

                <div className="space-y-3">
                  {week.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => toggleMutation.mutate({ taskId: task.id, is_completed: !task.is_completed })}
                      disabled={toggleMutation.isPending}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors text-left group"
                    >
                      {task.is_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <span className={`text-sm block ${task.is_completed ? "text-muted-foreground line-through" : ""}`}>
                          {task.title}
                        </span>
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground block mt-0.5">Due: {task.due_date}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
};

export default StudyPlanner;
