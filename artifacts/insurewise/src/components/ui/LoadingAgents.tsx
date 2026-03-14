import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldAlert, Star, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Agent {
  text: string;
  icon: LucideIcon;
  color: string;
}

const AGENTS: Agent[] = [
  { text: "Price Agent scanning 40+ carriers...", icon: Search, color: "text-blue-500" },
  { text: "Coverage Agent analyzing exclusions...", icon: ShieldAlert, color: "text-indigo-500" },
  { text: "Ratings Agent verifying claim payouts...", icon: Star, color: "text-amber-500" },
  { text: "Matching policies to your priorities...", icon: CheckCircle2, color: "text-emerald-500" },
];

export function LoadingAgents() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev < AGENTS.length - 1 ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const currentAgent = AGENTS[index];
  const Icon = currentAgent?.icon;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-8">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-[spin_3s_linear_infinite]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-[spin_1.5s_ease-in-out_infinite]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-primary animate-pulse" />
        </div>
      </div>

      <div className="h-8 relative w-full max-w-md overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 flex items-center justify-center gap-3"
          >
            {currentAgent && Icon && (
              <>
                <Icon className={`w-5 h-5 ${currentAgent.color}`} />
                <span className="text-lg font-medium text-foreground">
                  {currentAgent.text}
                </span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
