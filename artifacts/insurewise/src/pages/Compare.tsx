import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Shield, AlertTriangle, Check, SlidersHorizontal, ChevronRight, SearchX } from "lucide-react";
import { useSearchPolicies, useGetUserProfile } from "@workspace/api-client-react";
import type { PolicyCard } from "@workspace/api-client-react";
import { useStore } from "@/store/use-store";
import { Navbar } from "@/components/layout/Navbar";
import { LoadingAgents } from "@/components/ui/LoadingAgents";

export default function Compare() {
  const [location, setLocation] = useLocation();
  const userProfileId = useStore((state) => state.userProfileId);
  const { data: profile, isLoading: isProfileLoading } = useGetUserProfile({
    query: {
      enabled: !!userProfileId,
      queryKey: ["getUserProfile"]
    }
  });

  const searchMutation = useSearchPolicies();
  const [policies, setPolicies] = useState<PolicyCard[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Local sliders for dynamic re-ranking
  const [priceWeight, setPriceWeight] = useState(33);
  const [coverageWeight, setCoverageWeight] = useState(33);
  const [ratingWeight, setRatingWeight] = useState(34);

  useEffect(() => {
    if (!userProfileId) {
      setLocation("/onboard");
    }
  }, [userProfileId, setLocation]);

  useEffect(() => {
    if (profile && !hasSearched && !searchMutation.isPending) {
      setPriceWeight(profile.priorities.price);
      setCoverageWeight(profile.priorities.coverage);
      setRatingWeight(profile.priorities.rating);

      searchMutation.mutate({
        data: {
          userProfileId: profile.id,
          insuranceType: profile.insuranceType,
          priorities: profile.priorities,
          requirements: profile.requirements,
          budgetMonthly: profile.budgetMonthly,
          location: profile.location
        }
      }, {
        onSuccess: (res) => {
          setPolicies(res.policies);
          setHasSearched(true);
        }
      });
    }
  }, [profile, hasSearched, searchMutation.isPending]);

  // Client-side re-ranking based on sliders
  const rankedPolicies = useMemo(() => {
    const totalWeight = priceWeight + coverageWeight + ratingWeight || 1;
    return [...policies].sort((a, b) => {
      const scoreA = (a.priceScore * priceWeight + a.coverageScore * coverageWeight + a.ratingScore * ratingWeight) / totalWeight;
      const scoreB = (b.priceScore * priceWeight + b.coverageScore * coverageWeight + b.ratingScore * ratingWeight) / totalWeight;
      return scoreB - scoreA;
    });
  }, [policies, priceWeight, coverageWeight, ratingWeight]);

  if (isProfileLoading || searchMutation.isPending || !hasSearched) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <LoadingAgents />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar / Filters */}
          <aside className="w-full md:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">Priority Weights</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Adjust these sliders to re-rank policies instantly.
              </p>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">Price</label>
                    <span className="text-sm font-bold text-primary">{priceWeight}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100"
                    value={priceWeight}
                    onChange={(e) => setPriceWeight(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">Coverage</label>
                    <span className="text-sm font-bold text-primary">{coverageWeight}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100"
                    value={coverageWeight}
                    onChange={(e) => setCoverageWeight(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">Rating</label>
                    <span className="text-sm font-bold text-primary">{ratingWeight}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100"
                    value={ratingWeight}
                    onChange={(e) => setRatingWeight(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Results Grid */}
          <div className="flex-1">
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">Top Matches for You</h1>
              <p className="text-muted-foreground">Found {rankedPolicies.length} policies matching your profile.</p>
            </div>

            {rankedPolicies.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-border">
                <SearchX className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No policies found</h3>
                <p className="text-muted-foreground">Try adjusting your requirements or budget.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {rankedPolicies.map((policy, idx) => {
                  const totalWeight = priceWeight + coverageWeight + ratingWeight || 1;
                  const score = Math.min(100, Math.round((policy.priceScore * priceWeight + policy.coverageScore * coverageWeight + policy.ratingScore * ratingWeight) / totalWeight));

                  return (
                    <div key={policy.id} className="bg-white rounded-2xl border border-border shadow-md shadow-black/5 hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden">
                      {idx === 0 && (
                        <div className="bg-gradient-to-r from-primary to-indigo-500 px-4 py-1.5 text-center">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">Best Overall Match</span>
                        </div>
                      )}

                      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center">
                        {/* Insurer Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-xl text-primary">
                              {policy.insurerName.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-foreground">{policy.insurerName}</h3>
                              <p className="text-sm text-muted-foreground">{policy.planName}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-4">
                            {policy.gapCount === 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
                                <Check className="w-4 h-4" /> No Coverage Gaps
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
                                <AlertTriangle className="w-4 h-4" /> {policy.gapCount} Coverage Gaps
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">
                              <Shield className="w-4 h-4" /> ${policy.deductible} Deductible
                            </span>
                          </div>
                        </div>

                        {/* Price & Score */}
                        <div className="flex flex-row md:flex-col items-center justify-between md:justify-center md:border-l border-border md:pl-8 gap-4">
                          <div className="text-center md:text-right">
                            <p className="text-sm text-muted-foreground mb-1">Monthly Premium</p>
                            <p className="text-4xl font-bold text-foreground">${policy.monthlyPremium}</p>
                          </div>

                          <div className="flex flex-col items-center">
                            <div className="relative w-16 h-16 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                                <circle
                                  cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="8" fill="transparent"
                                  strokeDasharray={2 * Math.PI * 28}
                                  strokeDashoffset={2 * Math.PI * 28 * (1 - score / 100)}
                                  className={`${score > 85 ? 'text-emerald-500' : score > 70 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000`}
                                />
                              </svg>
                              <span className="absolute text-lg font-bold">{score}%</span>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground mt-1">Match Score</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="md:border-l border-border md:pl-8 flex md:flex-col gap-3 justify-center">
                          <Link
                            href={`/policy/${policy.id}`}
                            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-primary/10 text-primary font-semibold text-center hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                          >
                            AI Analysis
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
