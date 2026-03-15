import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Loader2, User, Save, LogOut
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetUserProfile, useUpsertUserProfile } from "@workspace/api-client-react";
import { useStore } from "@/store/use-store";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/use-toast";

// ─── Component ────────────────────────────────────────────────────────────────

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const userProfileId = useStore((state) => state.userProfileId);
  const setUserProfileId = useStore((state) => state.setUserProfileId);
  const clearChat = useStore((state) => state.clearChat);
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useGetUserProfile({
    query: {
      enabled: !!userProfileId,
      queryKey: ["getUserProfile", userProfileId]
    }
  });
  const updateMutation = useUpsertUserProfile();

  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!userProfileId) {
      setLocation("/onboard");
    } else if (profile) {
      // Flattens nested fields (like vehicleDetails.make) into 1D state for inputs
      const flattenedData: Record<string, any> = {};
      Object.entries(profile).forEach(([k, v]) => {
        if (v !== null && v !== undefined && typeof v === "object" && !Array.isArray(v)) {
          Object.entries(v).forEach(([subK, subV]) => {
            flattenedData[`${k}.${subK}`] = subV;
          });
        } else if (k === "requirements" && Array.isArray(v)) {
          flattenedData[k] = v.join(", ");
        } else {
          flattenedData[k] = v;
        }
      });
      setFormData(flattenedData);
    }
  }, [userProfileId, profile, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const updatedProfile = { ...profile };
    Object.keys(formData).forEach((key) => {
      // Handle nested updates (vehicleDetails, propertyDetails, priorities)
      if (key.startsWith("vehicleDetails.") || key.startsWith("propertyDetails.") || key.startsWith("priorities.")) {
        const [parent, child] = key.split(".");
        if (!updatedProfile[parent as keyof typeof updatedProfile]) {
          (updatedProfile as any)[parent] = {};
        }
        (updatedProfile as any)[parent][child] = formData[key];
      } else if (key === "requirements" && typeof formData[key] === "string") {
        updatedProfile.requirements = formData[key]
          .split(",")
          .map((r: string) => r.trim())
          .filter(Boolean);
      } else {
        (updatedProfile as any)[key] = formData[key];
      }
    });

    updateMutation.mutate(
      { data: updatedProfile },
      { 
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getUserProfile"] });
          toast({ title: "Profile updated", description: "Your details have been saved." });
        } 
      }
    );
  };

  const handleLogout = () => {
    setUserProfileId(null);
    clearChat();
    setLocation("/");
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
               {Object.entries(formData)
                  .filter(([k]) => 
                    !k.includes("id") && 
                    !k.includes("createdAt") && 
                    !k.includes("updatedAt") && 
                    !k.includes("onboardingComplete") &&
                    !k.includes("priorities") && // handled on Compare
                    k !== "name"
                  )
                  .map(([key, value]) => {
                    const formatLabel = (str: string) => {
                      return str
                        .replace(/([A-Z])/g, ' $1') // split camelCase
                        .replace(/\./g, ' - ')      // replace nested dots with dashes
                        .replace(/^./, (c) => c.toUpperCase()); // Capitalize first letter
                    };
                    
                    const isNumber = typeof value === "number" || key.includes("age") || key.includes("budget") || key.includes("year") || key.includes("squareFeet");
                    const isColSpan2 = key === "requirements" || key === "location" || key === "propertyDetails.address";

                    return (
                      <div key={key} className={isColSpan2 ? "md:col-span-2" : ""}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 truncate">
                          {formatLabel(key)}
                        </label>
                        <input
                          type={isNumber ? "number" : "text"}
                          value={formData[key] || ""}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            [key]: isNumber ? Number(e.target.value) : e.target.value 
                          }))}
                          className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-background"
                        />
                      </div>
                    );
                  })}
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

      </main>
    </div>
  );
}
