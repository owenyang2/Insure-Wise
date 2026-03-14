import { useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, FileText, ChevronRight } from "lucide-react";
import { useExplainPolicy, useGetUserProfile } from "@workspace/api-client-react";
import { useStore } from "@/store/use-store";
import { Navbar } from "@/components/layout/Navbar";

export default function PolicyDetail() {
  const [, params] = useRoute("/policy/:id");
  const [, setLocation] = useLocation();
  const policyId = params?.id;
  
  const userProfileId = useStore((state) => state.userProfileId);
  const { data: profile, isLoading: isProfileLoading } = useGetUserProfile({
    query: {
      enabled: !!userProfileId,
      queryKey: ["getUserProfile"]
    }
  });

  const explainMutation = useExplainPolicy();

  useEffect(() => {
    if (!userProfileId) {
      setLocation("/onboard");
    }
  }, [userProfileId, setLocation]);

  useEffect(() => {
    if (profile && policyId && !explainMutation.isPending && !explainMutation.isSuccess) {
      explainMutation.mutate({
        policyId,
        data: {
          requirements: profile.requirements,
          userContext: `Age: ${profile.age}, Location: ${profile.location}, Budget: ${profile.budgetMonthly}`
        }
      });
    }
  }, [profile, policyId, explainMutation.isPending, explainMutation.isSuccess]);

  if (isProfileLoading || explainMutation.isPending || !explainMutation.data) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <FileText className="w-16 h-16 text-primary animate-pulse mb-4" />
            <h2 className="text-xl font-bold font-display">AI reading 50+ page policy document...</h2>
            <p className="text-muted-foreground mt-2">Extracting coverage terms and analyzing gaps.</p>
          </div>
        </main>
      </div>
    );
  }

  const data = explainMutation.data;

  return (
    <div className="min-h-screen flex flex-col bg-background pb-24">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/compare" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to comparison
        </Link>

        <div className="bg-white rounded-3xl p-8 md:p-12 border border-border shadow-xl shadow-blue-900/5 mb-8">
          <h1 className="text-3xl font-display font-bold mb-4">AI Policy Breakdown</h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            {data.summary}
          </p>

          <div className="bg-primary/5 rounded-2xl p-6 mb-10 border border-primary/10">
            <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              AI Recommendation
            </h3>
            <p className="text-foreground">{data.recommendation}</p>
          </div>

          <div className="space-y-12">
            {/* Detailed Coverage Items */}
            <section>
              <h2 className="text-2xl font-bold font-display mb-6 border-b border-border pb-2">Your Requirements vs Policy</h2>
              <div className="grid gap-4">
                {data.coverageItems.map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex flex-col md:flex-row gap-4 p-5 rounded-2xl border border-border bg-gray-50/50"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {item.status === 'covered' && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                      {item.status === 'partial' && <AlertTriangle className="w-6 h-6 text-amber-500" />}
                      {item.status === 'not_covered' && <XCircle className="w-6 h-6 text-red-500" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-foreground mb-1">{item.requirement}</h4>
                      <p className="text-muted-foreground mb-2">{item.explanation}</p>
                      {item.policyClause && (
                        <div className="text-sm bg-white p-3 rounded-lg border border-border font-mono text-gray-600 mt-2">
                          <span className="font-bold text-gray-400 uppercase text-xs block mb-1">Policy Clause</span>
                          "{item.policyClause}"
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Gap Analysis */}
            {data.gaps.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold font-display mb-6 border-b border-border pb-2 text-red-600">Critical Gaps Discovered</h2>
                <ul className="space-y-3">
                  {data.gaps.map((gap, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-red-50 p-4 rounded-xl border border-red-100">
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-red-900">{gap}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Key Terms */}
            <section>
              <h2 className="text-2xl font-bold font-display mb-6 border-b border-border pb-2">Jargon Translated</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {data.keyTerms.map((term, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border bg-white">
                    <h4 className="font-bold text-primary mb-1">{term.term}</h4>
                    <p className="text-sm text-muted-foreground">{term.definition}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <div className="container mx-auto px-4 py-4 max-w-5xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-muted-foreground">Ready to proceed?</p>
            <p className="text-xs text-gray-500">We'll auto-fill your application next.</p>
          </div>
          <Link 
            href={`/apply/${policyId}`}
            className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
          >
            Start Application
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
