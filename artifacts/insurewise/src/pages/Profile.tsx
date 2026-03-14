import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, User, Save, LogOut, Sparkles, TrendingDown,
  MapPin, CreditCard, Shield, Car, Zap, Package, Leaf,
  ChevronRight, AlertCircle
} from "lucide-react";
import { useGetUserProfile, useUpsertUserProfile } from "@workspace/api-client-react";
import { useStore } from "@/store/use-store";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OptimizationTip {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedSavings: string;
  impact: "high" | "medium" | "low";
  actionLabel: string;
  profileField: string | null;
}

interface OptimizationResult {
  tips: OptimizationTip[];
  personalizedQuote: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  location: { icon: <MapPin size={16} />, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  credit:   { icon: <CreditCard size={16} />, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  deductible: { icon: <Shield size={16} />, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  bundling: { icon: <Package size={16} />, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  vehicle:  { icon: <Car size={16} />, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
  safety:   { icon: <Zap size={16} />, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  lifestyle:{ icon: <Leaf size={16} />, color: "text-green-600", bg: "bg-green-50 border-green-200" },
};

const IMPACT_BADGE: Record<string, string> = {
  high:   "bg-red-100 text-red-700 border border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  low:    "bg-green-100 text-green-700 border border-green-200",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const userProfileId = useStore((state) => state.userProfileId);
  const setUserProfileId = useStore((state) => state.setUserProfileId);
  const clearChat = useStore((state) => state.clearChat);

  const { data: profile, isLoading } = useGetUserProfile({
    query: { enabled: !!userProfileId }
  });
  const updateMutation = useUpsertUserProfile();

  const [formData, setFormData] = useState({
    name: "",
    age: 0,
    location: "",
    budgetMonthly: 0,
    insuranceType: "auto" as const,
  });

  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState("");

  useEffect(() => {
    if (!userProfileId) {
      setLocation("/onboard");
    } else if (profile) {
      setFormData({
        name: profile.name,
        age: profile.age,
        location: profile.location,
        budgetMonthly: profile.budgetMonthly,
        insuranceType: profile.insuranceType as any,
      });
    }
  }, [userProfileId, profile, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    updateMutation.mutate(
      { data: { ...profile, ...formData } },
      { onSuccess: () => toast({ title: "Profile updated", description: "Your details have been saved." }) }
    );
  };

  const handleLogout = () => {
    setUserProfileId(null);
    clearChat();
    setLocation("/");
  };

  const handleOptimize = async () => {
    if (!profile) return;
    setIsOptimizing(true);
    setOptimizeError("");
    setOptimization(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/insurance/optimize-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (!res.ok) throw new Error("Failed to optimize");
      const data: OptimizationResult = await res.json();
      setOptimization(data);
    } catch {
      setOptimizeError("Could not generate tips right now. Please try again.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const applyProfileChange = (field: string | null) => {
    if (!field || !profile) return;
    if (field === "location") {
      toast({
        title: "Update your location",
        description: "Edit the location field above and save your profile.",
      });
      document.getElementById("field-location")?.focus();
    } else if (field === "budgetMonthly") {
      toast({
        title: "Adjust your budget",
        description: "Edit your monthly budget above and save.",
      });
      document.getElementById("field-budget")?.focus();
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-3xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <User className="w-8 h-8 text-primary" /> My Profile
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" /> Reset Session
          </button>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-3xl border border-border shadow-xl shadow-blue-900/5 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  id="field-location"
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Budget ($)</label>
                <input
                  id="field-budget"
                  type="number"
                  value={formData.budgetMonthly}
                  onChange={e => setFormData({ ...formData, budgetMonthly: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-background"
                />
              </div>
            </div>
            <div className="pt-6 border-t border-border flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md shadow-primary/20"
              >
                {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* ── Premium Optimizer ─────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-border shadow-xl shadow-blue-900/5 overflow-hidden">
          {/* Section header */}
          <div className="px-8 py-6 border-b border-border bg-gradient-to-r from-primary/5 to-violet-500/5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Premium Optimizer
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered tips specific to your profile to lower your {profile.insuranceType} premium
              </p>
            </div>
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all flex items-center gap-2 shadow-md shadow-primary/20 shrink-0"
            >
              {isOptimizing ? (
                <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
              ) : (
                <><TrendingDown size={16} /> Analyze My Profile</>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {/* Idle state */}
              {!isOptimizing && !optimization && !optimizeError && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-10 text-muted-foreground"
                >
                  <TrendingDown className="w-12 h-12 mx-auto mb-3 text-primary/30" />
                  <p className="font-medium">Click "Analyze My Profile" to get personalized savings tips</p>
                  <p className="text-sm mt-1">We'll look at your location, vehicle, and coverage to find real savings</p>
                </motion.div>
              )}

              {/* Loading */}
              {isOptimizing && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-10"
                >
                  <Loader2 className="w-10 h-10 mx-auto mb-4 text-primary animate-spin" />
                  <p className="font-semibold text-lg">Analyzing {profile.name}'s profile...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Checking rates in {profile.location} and finding your best saving opportunities
                  </p>
                </motion.div>
              )}

              {/* Error */}
              {optimizeError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700"
                >
                  <AlertCircle size={18} />
                  <span className="text-sm">{optimizeError}</span>
                </motion.div>
              )}

              {/* Results */}
              {optimization && !isOptimizing && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  {/* Personalized quote */}
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {optimization.personalizedQuote}
                    </p>
                  </div>

                  {/* Tips */}
                  <div className="space-y-3">
                    {optimization.tips.map((tip, idx) => {
                      const meta = CATEGORY_META[tip.category] ?? CATEGORY_META.safety;
                      return (
                        <motion.div
                          key={tip.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.07 }}
                          className={`rounded-2xl border p-5 ${meta.bg}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`mt-0.5 shrink-0 ${meta.color}`}>
                                {meta.icon}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-semibold text-sm text-foreground">{tip.title}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${IMPACT_BADGE[tip.impact]}`}>
                                    {tip.impact} impact
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">{tip.description}</p>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="text-lg font-bold text-emerald-600 whitespace-nowrap">{tip.estimatedSavings}</div>
                              <div className="text-xs text-muted-foreground">est. savings</div>
                            </div>
                          </div>

                          {tip.profileField && tip.profileField !== "null" && (
                            <button
                              onClick={() => applyProfileChange(tip.profileField)}
                              className={`mt-3 ml-7 flex items-center gap-1.5 text-xs font-semibold ${meta.color} hover:opacity-80 transition-opacity`}
                            >
                              {tip.actionLabel} <ChevronRight size={13} />
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
