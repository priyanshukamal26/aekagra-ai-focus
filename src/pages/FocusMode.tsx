import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Play, Square } from "lucide-react";
import { useFocusActive, useFocusStart, useFocusEnd, useFocusEvent } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { FocusCamera } from "@/components/FocusCamera";
import { gsap, useGSAP } from "@/lib/gsap-setup";

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const TIMER_SETTINGS = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
};

const FocusMode = () => {
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState<TimerMode>('work');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const { data: activeData, isLoading: activeLoading } = useFocusActive();
  const startMutation = useFocusStart();
  const endMutation = useFocusEnd();
  const eventMutation = useFocusEvent();

  const activeSession = activeData?.session;
  const isActive = !!activeSession;

  // Track tab visibility
  const handleVisibility = useCallback(() => {
    if (!activeSession) return;
    const eventType = document.hidden ? "tab_switch" : "tab_return";
    eventMutation.mutate({ sessionId: activeSession.id, event_type: eventType });
  }, [activeSession, eventMutation]);

  const handleCameraStatus = useCallback((status: 'active' | 'face_lost' | 'eyes_away') => {
    if (!activeSession) return;

    if (status !== 'active') {
      eventMutation.mutate({ sessionId: activeSession.id, event_type: status });

      if (status === 'face_lost') {
        toast({ title: "Focus Alert", description: "You seem to be away! 🏃‍♂️", variant: "destructive" });
      }
    }
  }, [activeSession, eventMutation, toast]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [handleVisibility]);

  // Sync with server session
  useEffect(() => {
    if (isActive && activeSession) {
      if (!isTimerRunning) setIsTimerRunning(true);

      const startTime = new Date(activeSession.started_at.endsWith("Z") ? activeSession.started_at : activeSession.started_at + "Z").getTime();
      const tick = () => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      if (mode !== 'work' && isTimerRunning) {
        intervalRef.current = setInterval(() => {
          setElapsed(prev => prev + 1);
        }, 1000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
      } else {
        setIsTimerRunning(false);
        setElapsed(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }
  }, [isActive, activeSession, mode, isTimerRunning]);

  // GSAP entrance animation
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    gsap.set(".focus-mode-switcher", { autoAlpha: 0, y: 15 });
    gsap.set(".focus-timer", { autoAlpha: 0, scale: 0.9 });
    gsap.set(".focus-controls", { autoAlpha: 0, y: 20 });

    tl.to(".focus-mode-switcher", { autoAlpha: 1, y: 0, duration: 0.5 })
      .to(".focus-timer", { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.4)" }, "<0.15")
      .to(".focus-controls", { autoAlpha: 1, y: 0, duration: 0.5 }, "<0.2");
  }, { scope: pageRef });

  // Animate timer ring with GSAP
  const ringRef = useRef<SVGCircleElement>(null);
  const targetDuration = TIMER_SETTINGS[mode];
  const remaining = Math.max(0, targetDuration - elapsed);
  const progress = Math.min(100, (elapsed / targetDuration) * 100);

  useEffect(() => {
    if (ringRef.current) {
      gsap.to(ringRef.current, {
        strokeDasharray: `${progress * 2.83} 283`,
        duration: 0.8,
        ease: "power1.out",
      });
    }
  }, [progress]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (mode === 'work') {
      startMutation.mutate(undefined, {
        onSuccess: () => {
          toast({ title: "Focus session started", description: "Get in the zone! 🎯" });
          setElapsed(0);
          setIsTimerRunning(true);
        },
        onError: (err: Error) => toast({ title: "Failed to start", description: err.message, variant: "destructive" })
      });
    } else {
      setElapsed(0);
      setIsTimerRunning(true);
    }
  };

  const handleEnd = () => {
    if (activeSession) {
      endMutation.mutate(activeSession.id, {
        onSuccess: (data) => {
          toast({ title: "Session complete!", description: `Focus score: ${data.session.focus_score}%` });
          setIsTimerRunning(false);
          setElapsed(0);
        },
        onError: (err: Error) => toast({ title: "Failed to end", description: err.message, variant: "destructive" })
      });
    } else {
      setIsTimerRunning(false);
      setElapsed(0);
      setMode('work');
    }
  };

  if (activeLoading) {
    return (
      <AppLayout>
        <div className="p-8 flex items-center justify-center min-h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div ref={pageRef} className="p-8 flex flex-col items-center justify-center min-h-full">
        <div className="text-center max-w-lg w-full">
          {/* Mode Switcher */}
          <div className="focus-mode-switcher flex justify-center gap-2 mb-8 bg-secondary/50 p-1 rounded-xl w-fit mx-auto">
            {[
              { id: 'work', label: 'Work' },
              { id: 'shortBreak', label: 'Short Break' },
              { id: 'longBreak', label: 'Long Break' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  if (isActive) return;
                  setMode(m.id as TimerMode);
                  setElapsed(0);
                  setIsTimerRunning(false);
                }}
                disabled={isActive}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === m.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  } ${isActive ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Timer Display */}
          <div className="focus-timer relative w-72 h-72 mx-auto mb-12 group">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
              <circle
                ref={ringRef}
                cx="50" cy="50" r="45"
                fill="none"
                stroke={mode === 'work' ? "hsl(var(--primary))" : "#60a5fa"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="0 283"
                style={{
                  filter: isTimerRunning ? `drop-shadow(0 0 10px ${mode === 'work' ? 'hsl(var(--primary) / 0.5)' : 'rgba(96, 165, 250, 0.5)'})` : "none",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-6xl font-bold font-mono tracking-tighter ${mode === 'work' ? 'text-foreground' : 'text-blue-400'}`}>
                {formatTime(remaining)}
              </span>
              <span className="text-sm text-muted-foreground mt-2 font-medium bg-secondary/50 px-3 py-1 rounded-full">
                {isTimerRunning ? (mode === 'work' ? 'FOCUSING' : 'BREAK') : 'READY'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="focus-controls flex justify-center gap-4">
            {!isTimerRunning && !isActive ? (
              <button
                onClick={handleStart}
                disabled={startMutation.isPending}
                className="px-12 py-4 rounded-2xl font-bold text-lg bg-primary text-primary-foreground hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                {startMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                Start {mode === 'work' ? 'Focus' : 'Break'}
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={handleEnd}
                  className="px-8 py-4 rounded-2xl font-bold text-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all flex items-center gap-2"
                >
                  <Square className="w-5 h-5 fill-current" />
                  Stop
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Vision AI Camera */}
        <FocusCamera
          isActive={isActive && mode === 'work'}
          onStatusChange={handleCameraStatus}
        />
      </div>
    </AppLayout>
  );
};

export default FocusMode;
