import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { ShieldCheck, Edit2, Loader2, Sparkles } from "lucide-react";
import { useGetApplicationForm, useSubmitApplication, useInitiateCarrierHandoff } from "@workspace/api-client-react";
import type { ApplicationField } from "@workspace/api-client-react";
import { useStore } from "@/store/use-store";
import { Navbar } from "@/components/layout/Navbar";
import { HandoffOverlay } from "@/components/ui/HandoffOverlay";
import { useToast } from "@/hooks/use-toast";

export default function Apply() {
  const [, params] = useRoute("/apply/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const policyId = params?.id;
  const userProfileId = useStore((state) => state.userProfileId);
  const setConfirmationData = useStore((state) => state.setConfirmationData);
  
  const formMutation = useGetApplicationForm();
  const submitMutation = useSubmitApplication();
  const handoffMutation = useInitiateCarrierHandoff();
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isHandingOff, setIsHandingOff] = useState(false);
  const [insurerName, setInsurerName] = useState("");

  useEffect(() => {
    if (!userProfileId) {
      setLocation("/onboard");
    } else if (policyId && !formMutation.isPending && !formMutation.isSuccess) {
      formMutation.mutate({
        policyId,
        data: { userProfileId }
      }, {
        onSuccess: (res) => {
          // Initialize local form state
          const initialData: Record<string, string> = {};
          res.sections.forEach(sec => {
            sec.fields.forEach(f => {
              initialData[f.fieldId] = f.value;
            });
          });
          setFormData(initialData);
        }
      });
    }
  }, [userProfileId, policyId, formMutation.isPending, formMutation.isSuccess]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyId || !userProfileId || !formMutation.data) return;

    setIsHandingOff(true);
    setInsurerName(formMutation.data.insurerName);

    const fields = Object.entries(formData).map(([fieldId, value]) => ({ fieldId, value }));

    Promise.all([
      submitMutation.mutateAsync({
        data: {
          policyId,
          userProfileId,
          fields
        }
      }),
      handoffMutation.mutateAsync({
        data: {
          userProfileId: parseInt(userProfileId, 10),
          policyId,
          planName: formMutation.data.planName,
          monthlyPremium: formMutation.data.monthlyPremium
        }
      })
    ]).then(([submitRes, handoffRes]) => {
      setConfirmationData(submitRes);
      if (handoffRes.checkoutUrl) {
        window.open(handoffRes.checkoutUrl, '_blank');
      }
      setLocation("/confirmation");
    }).catch(() => {
      toast({
        title: "Error submitting application",
        description: "Please check the fields and try again.",
        variant: "destructive"
      });
    }).finally(() => {
      setIsHandingOff(false);
    });
  };

  if (formMutation.isPending || !formMutation.data) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </main>
      </div>
    );
  }

  const appForm = formMutation.data;

  return (
    <div className="min-h-screen flex flex-col bg-background pb-12">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Review & Submit</h1>
          <p className="text-muted-foreground text-lg">Application for {appForm.insurerName} - {appForm.planName}</p>
        </div>

        <div className="bg-primary/5 rounded-2xl p-6 mb-8 border border-primary/20 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-primary mb-1">AI Magic Fill Active</h3>
            <p className="text-sm text-foreground">
              We've pre-filled {appForm.autoFilledCount} out of {appForm.totalFieldCount} fields using context from your chat session. Please review the details below.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {appForm.sections.map((section, sIdx) => (
            <div key={sIdx} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-muted/50 border-b border-border">
                <h3 className="font-bold text-lg text-foreground">{section.title}</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.fields.map((field) => (
                  <div key={field.fieldId} className={field.fieldType === 'text' ? 'col-span-1 md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center justify-between">
                      {field.label}
                      {!field.editable && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Verified</span>}
                    </label>
                    <div className="relative">
                      {field.fieldType === 'select' && field.options ? (
                        <select
                          value={formData[field.fieldId] || ''}
                          onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
                          disabled={!field.editable}
                          required={field.required}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-muted disabled:text-muted-foreground appearance-none"
                        >
                          <option value="" disabled>Select option</option>
                          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          type={field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : 'text'}
                          value={formData[field.fieldId] || ''}
                          onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
                          disabled={!field.editable}
                          required={field.required}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-muted disabled:text-muted-foreground"
                        />
                      )}
                      {field.editable && (
                        <Edit2 className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-lg shadow-black/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Due Today</p>
              <p className="text-4xl font-bold text-foreground">${appForm.monthlyPremium}<span className="text-lg text-muted-foreground font-normal">/mo</span></p>
            </div>
            
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full md:w-auto px-10 py-4 rounded-xl font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitMutation.isPending ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
              ) : (
                <><ShieldCheck className="w-5 h-5" /> Confirm & Bind Policy</>
              )}
            </button>
          </div>
        </form>
      </main>
      <HandoffOverlay isVisible={isHandingOff} insurerName={insurerName} />
    </div>
  );
}
