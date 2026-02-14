import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api";

// ── Type Definitions ───────────────────────────────────────────────

export interface FocusSession {
    id: number;
    user_id: number;
    started_at: string;
    ended_at: string | null;
    duration_seconds: number;
    focus_score: number;
    status: "active" | "completed" | "abandoned";
}

export interface StudyPlan {
    id: number;
    user_id: number;
    title: string;
    syllabus_text: string;
    created_at: string;
    updated_at: string;
    totalTasks?: number;
    completedTasks?: number;
    weeks?: StudyWeek[];
}

export interface StudyWeek {
    id: number;
    plan_id: number;
    week_number: number;
    topics: string[];
    tasks: StudyTask[];
}

export interface StudyTask {
    id: number;
    week_id: number;
    user_id: number;
    title: string;
    is_completed: number;
    due_date: string | null;
    completed_at: string | null;
    plan_title?: string;
    week_number?: number;
}

export interface TutorConversation {
    id: number;
    user_id: number;
    mode: string;
    title: string | null;
    created_at: string;
    lastMessage?: string;
}

export interface TutorMessage {
    id: number;
    conversation_id: number;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}

export interface DashboardStats {
    focusScore: { value: string; change: string };
    studyHours: { value: string; change: string };
    dayStreak: { value: string; change: string };
    tasksDone: { value: string; change: string };
}

export interface AnalyticsSummary {
    weeklyAverage: string;
    totalHours: string;
    currentStreak: string;
    longestStreak: string;
    distractions: number;
}

export interface FocusTrendPoint {
    date: string;
    avg_score: number;
    sessions: number;
    total_seconds: number;
}

export interface SubjectDistribution {
    id: number;
    name: string;
    color: string;
    total_minutes: number;
    percent: number;
}

export interface UserProfile {
    id: number;
    email: string;
    created_at: string;
    profile: {
        id: number;
        user_id: number;
        display_name: string | null;
        avatar_url: string | null;
        timezone: string;
        preferences: Record<string, unknown>;
        updated_at: string;
    };
}

// ── Dashboard Hooks ────────────────────────────────────────────────

export function useDashboardStats() {
    const api = useApi();
    return useQuery({
        queryKey: ["dashboard", "stats"],
        queryFn: () => api.get<{ stats: DashboardStats }>("/dashboard/stats"),
    });
}

export function useDashboardUpcoming(limit = 5) {
    const api = useApi();
    return useQuery({
        queryKey: ["dashboard", "upcoming", limit],
        queryFn: () => api.get<{ tasks: StudyTask[] }>(`/dashboard/upcoming?limit=${limit}`),
    });
}

// ── Focus Hooks ────────────────────────────────────────────────────

export function useFocusActive() {
    const api = useApi();
    return useQuery({
        queryKey: ["focus", "active"],
        queryFn: () => api.get<{ session: FocusSession | null }>("/focus/active"),
        refetchInterval: 5000, // poll every 5s while on focus page
    });
}

export function useFocusHistory(page = 1, limit = 10) {
    const api = useApi();
    return useQuery({
        queryKey: ["focus", "history", page, limit],
        queryFn: () =>
            api.get<{ sessions: FocusSession[]; total: number; page: number; limit: number }>(
                `/focus/history?page=${page}&limit=${limit}`
            ),
    });
}

export function useFocusStart() {
    const api = useApi();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => api.post<{ session: FocusSession }>("/focus/start"),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["focus"] });
        },
    });
}

export function useFocusEnd() {
    const api = useApi();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (sessionId: number) =>
            api.patch<{ session: FocusSession }>(`/focus/${sessionId}/end`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["focus"] });
            qc.invalidateQueries({ queryKey: ["dashboard"] });
            qc.invalidateQueries({ queryKey: ["analytics"] });
        },
    });
}

export function useFocusEvent() {
    const api = useApi();
    return useMutation({
        mutationFn: ({ sessionId, event_type }: { sessionId: number; event_type: string }) =>
            api.post(`/focus/${sessionId}/event`, { event_type }),
    });
}

// ── Study Planner Hooks ────────────────────────────────────────────

export function useStudyPlans() {
    const api = useApi();
    return useQuery({
        queryKey: ["planner", "plans"],
        queryFn: () => api.get<{ plans: StudyPlan[] }>("/planner/plans"),
    });
}

export function useStudyPlanDetail(planId: number | null) {
    const api = useApi();
    return useQuery({
        queryKey: ["planner", "plans", planId],
        queryFn: () => api.get<{ plan: StudyPlan }>(`/planner/plans/${planId}`),
        enabled: !!planId,
    });
}

export function useCreateStudyPlan() {
    const api = useApi();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            title: string;
            syllabus_text?: string;
            weeks?: Array<{
                week_number: number;
                topics?: string[];
                tasks?: Array<{ title: string; due_date?: string }>;
            }>;
        }) => api.post<{ plan: StudyPlan }>("/planner/plans", data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["planner"] });
            qc.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}

export function useToggleTask() {
    const api = useApi();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, is_completed }: { taskId: number; is_completed: boolean }) =>
            api.patch<{ task: StudyTask }>(`/planner/tasks/${taskId}`, { is_completed }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["planner"] });
            qc.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}

export function useDeletePlan() {
    const api = useApi();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (planId: number) => api.delete(`/planner/plans/${planId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["planner"] });
        },
    });
}

// ── AI Tutor Hooks ─────────────────────────────────────────────────

export function useTutorConversations() {
    const api = useApi();
    return useQuery({
        queryKey: ["tutor", "conversations"],
        queryFn: () => api.get<{ conversations: TutorConversation[] }>("/tutor/conversations"),
    });
}

export function useTutorMessages(conversationId: number | null) {
    const api = useApi();
    return useQuery({
        queryKey: ["tutor", "messages", conversationId],
        queryFn: () =>
            api.get<{ conversation: TutorConversation; messages: TutorMessage[] }>(
                `/tutor/conversations/${conversationId}/messages`
            ),
        enabled: !!conversationId,
    });
}

export function useCreateConversation() {
    const api = useApi();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { mode: string; title?: string }) =>
            api.post<{ conversation: TutorConversation }>("/tutor/conversations", data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["tutor", "conversations"] });
        },
    });
}

export function useDeleteTutorConversation() {
    const api = useApi();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (conversationId: number) => api.delete(`/tutor/conversations/${conversationId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["tutor", "conversations"] });
        },
    });
}

export function useSendMessage() {
    const api = useApi();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ conversationId, content }: { conversationId: number; content: string }) =>
            api.post<{ messages: TutorMessage[] }>(
                `/tutor/conversations/${conversationId}/messages`,
                { content }
            ),
        onMutate: async ({ conversationId, content }) => {
            await qc.cancelQueries({ queryKey: ["tutor", "messages", conversationId] });
            const previous = qc.getQueryData(["tutor", "messages", conversationId]);
            qc.setQueryData(["tutor", "messages", conversationId], (old: any) => ({
                ...old,
                messages: [...(old?.messages || []), {
                    id: Date.now(),
                    role: "user",
                    content,
                    created_at: new Date().toISOString()
                }]
            }));
            return { previous };
        },
        onError: (_err, variables, context) => {
            if (context?.previous) {
                qc.setQueryData(["tutor", "messages", variables.conversationId], context.previous);
            }
        },
        onSettled: (_data, _err, variables) => {
            qc.invalidateQueries({ queryKey: ["tutor", "messages", variables.conversationId] });
        },
    });
}

// ── Analytics Hooks ────────────────────────────────────────────────

export function useAnalyticsSummary() {
    const api = useApi();
    return useQuery({
        queryKey: ["analytics", "summary"],
        queryFn: () => api.get<{ summary: AnalyticsSummary }>("/analytics/summary"),
    });
}

export function useFocusTrend(days = 7) {
    const api = useApi();
    return useQuery({
        queryKey: ["analytics", "focus-trend", days],
        queryFn: () =>
            api.get<{ trend: FocusTrendPoint[]; days: number }>(`/analytics/focus-trend?days=${days}`),
    });
}

export function useSubjectDistribution() {
    const api = useApi();
    return useQuery({
        queryKey: ["analytics", "subject-distribution"],
        queryFn: () =>
            api.get<{ subjects: SubjectDistribution[]; totalMinutes: number }>(
                "/analytics/subject-distribution"
            ),
    });
}

// ── User Profile Hooks ─────────────────────────────────────────────

export function useUserProfile() {
    const api = useApi();
    return useQuery({
        queryKey: ["user", "profile"],
        queryFn: () => api.get<{ user: UserProfile }>("/user/profile"),
    });
}

export function useUpdateProfile() {
    const api = useApi();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            display_name?: string;
            avatar_url?: string | null;
            timezone?: string;
            preferences?: Record<string, unknown>;
        }) => api.patch("/user/profile", data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["user", "profile"] });
        },
    });
}

export function useChangePassword() {
    const api = useApi();
    return useMutation({
        mutationFn: (data: { current_password: string; new_password: string }) =>
            api.patch<{ message: string }>("/user/password", data),
    });
}

export function useDeleteAccount() {
    const api = useApi();
    return useMutation({
        mutationFn: () => api.delete<{ message: string }>("/user/account"),
    });
}
