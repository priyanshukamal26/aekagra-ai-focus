import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect, useRef } from "react";
import { Save, Lock, Trash2, Loader2, User, Globe } from "lucide-react";
import { useUserProfile, useUpdateProfile, useChangePassword, useDeleteAccount } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { gsap, useGSAP } from "@/lib/gsap-setup";

const Settings = () => {
    const { toast } = useToast();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const pageRef = useRef<HTMLDivElement>(null);

    // Profile form state
    const [displayName, setDisplayName] = useState("");
    const [timezone, setTimezone] = useState("");

    // Password form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    const { data: profileData, isLoading: profileLoading } = useUserProfile();
    const updateProfileMutation = useUpdateProfile();
    const changePasswordMutation = useChangePassword();
    const deleteAccountMutation = useDeleteAccount();

    useGSAP(() => {
        if (profileLoading) return;

        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        gsap.set(".settings-header", { autoAlpha: 0, y: 15 });
        tl.to(".settings-header", { autoAlpha: 1, y: 0, duration: 0.5 });

        const sections = gsap.utils.toArray<HTMLElement>(".settings-section");
        if (sections.length > 0) {
            gsap.set(sections, { autoAlpha: 0, y: 20 });
            tl.to(sections, {
                autoAlpha: 1,
                y: 0,
                stagger: 0.1,
                duration: 0.5,
            }, "<0.1");
        }
    }, { scope: pageRef, dependencies: [profileLoading] });

    useEffect(() => {
        if (profileData?.user?.profile) {
            setDisplayName(profileData.user.profile.display_name || "");
            setTimezone(profileData.user.profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
        }
    }, [profileData]);

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(
            { display_name: displayName, timezone },
            {
                onSuccess: () => toast({ title: "Profile updated" }),
                onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
            }
        );
    };

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            toast({ title: "Passwords do not match", variant: "destructive" });
            return;
        }
        changePasswordMutation.mutate(
            { current_password: currentPassword, new_password: newPassword },
            {
                onSuccess: () => {
                    toast({ title: "Password changed successfully" });
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                },
                onError: (err: unknown) => toast({ title: "Failed to change password", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" }),
            }
        );
    };

    const handleDeleteAccount = () => {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            deleteAccountMutation.mutate(undefined, {
                onSuccess: () => {
                    logout();
                    navigate("/");
                    toast({ title: "Account deleted" });
                },
                onError: () => toast({ title: "Failed to delete account", variant: "destructive" }),
            });
        }
    };

    if (profileLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div ref={pageRef} className="p-8 pb-20 max-w-4xl mx-auto">
                <div className="settings-header mb-8">
                    <h1 className="text-3xl font-bold font-ndot mb-2">Settings</h1>
                    <p className="text-muted-foreground">Manage your account preferences and security.</p>
                </div>

                <div className="space-y-8">
                    {/* Profile Section */}
                    <section
                        className="settings-section glass rounded-2xl p-8"
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Profile Information
                        </h2>
                        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Display Name</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Your Name"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Timezone</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={updateProfileMutation.isPending}
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {updateProfileMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Password Section */}
                    <section
                        className="settings-section glass rounded-2xl p-8"
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" />
                            Change Password
                        </h2>
                        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={changePasswordMutation.isPending}
                                    className="bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {changePasswordMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </section>
                    {/* AI Configuration Section */}
                    <section
                        className="settings-section glass rounded-2xl p-8"
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
                            AI Configuration
                        </h2>
                        <div className="space-y-4 max-w-md">
                            <div>
                                <label className="text-sm font-medium mb-1 block">AI Provider</label>
                                <select
                                    value={(profileData?.user?.profile?.preferences?.aiProvider as string) || "gemini"}
                                    onChange={(e) => updateProfileMutation.mutate({ preferences: { ...profileData?.user?.profile?.preferences, aiProvider: e.target.value } })}
                                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="gemini">Google Gemini (Cloud)</option>
                                    <option value="ollama">Ollama (Local)</option>
                                </select>
                            </div>

                            {profileData?.user?.profile?.preferences?.aiProvider === "ollama" && (
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Ollama Model</label>
                                    <select
                                        value={(profileData?.user?.profile?.preferences?.ollamaModel as string) || "llama3"}
                                        onChange={(e) => updateProfileMutation.mutate({ preferences: { ...profileData?.user?.profile?.preferences, ollamaModel: e.target.value } })}
                                        className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        <option value="llama3">Llama 3 (8B)</option>
                                        <option value="phi3">Phi-3 Mini (3.8B)</option>
                                        <option value="gemma2:2b">Gemma 2 (2B)</option>
                                        <option value="mistral">Mistral (7B)</option>
                                    </select>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Make sure Ollama is running locally (`ollama serve`) and the model is pulled.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section
                        className="settings-section glass rounded-2xl p-8 border border-destructive/20"
                    >
                        <h2 className="text-xl font-bold mb-2 text-destructive flex items-center gap-2">
                            <Trash2 className="w-5 h-5" />
                            Danger Zone
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <button
                            onClick={handleDeleteAccount}
                            disabled={deleteAccountMutation.isPending}
                            className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {deleteAccountMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Delete Account
                        </button>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
};

export default Settings;
