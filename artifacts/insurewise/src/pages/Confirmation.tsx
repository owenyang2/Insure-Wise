import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, Download, Calendar, Shield, CreditCard } from "lucide-react";
import { useStore } from "@/store/use-store";
import { Navbar } from "@/components/layout/Navbar";

export default function Confirmation() {
  const [, setLocation] = useLocation();
  const confirmationData = useStore((state) => state.confirmationData);

  useEffect(() => {
    if (!confirmationData) {
      setLocation("/");
    }
  }, [confirmationData, setLocation]);

  if (!confirmationData) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8"
        >
          <CheckCircle className="w-12 h-12 text-emerald-600" />
        </motion.div>

        <h1 className="text-4xl font-display font-bold text-center mb-4">You're Covered!</h1>
        <p className="text-xl text-muted-foreground text-center max-w-lg mb-10">
          {confirmationData.message}
        </p>

        <div className="w-full max-w-2xl bg-white rounded-3xl border border-border shadow-xl shadow-blue-900/5 overflow-hidden mb-8">
          <div className="bg-gray-50 px-8 py-6 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Policy Number</p>
              <p className="text-xl font-mono font-bold text-foreground">{confirmationData.policyNumber}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
                Status: {confirmationData.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="p-8 grid sm:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <p className="text-sm flex items-center gap-2 text-muted-foreground mb-1"><Shield className="w-4 h-4" /> Insurer</p>
                <p className="font-bold">{confirmationData.insurerName}</p>
                <p className="text-sm">{confirmationData.planName}</p>
              </div>
              <div>
                <p className="text-sm flex items-center gap-2 text-muted-foreground mb-1"><Calendar className="w-4 h-4" /> Start Date</p>
                <p className="font-bold">{new Date(confirmationData.startDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-6 border border-border flex flex-col justify-center text-center">
              <p className="text-sm flex items-center justify-center gap-2 text-muted-foreground mb-2"><CreditCard className="w-4 h-4" /> Monthly Premium</p>
              <p className="text-4xl font-bold text-primary">${confirmationData.monthlyPremium}</p>
            </div>
          </div>

          <div className="px-8 pb-8">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Coverage Included</p>
            <ul className="grid sm:grid-cols-2 gap-3">
              {confirmationData.coverageSummary.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button className="px-8 py-3 rounded-xl bg-white border-2 border-border text-foreground font-semibold hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 shadow-sm">
            <Download className="w-4 h-4" /> Download Documents
          </button>
          <Link 
            href="/profile"
            className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center"
          >
            Go to Profile
          </Link>
        </div>
      </main>
    </div>
  );
}
