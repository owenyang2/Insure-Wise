import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { ShieldCheck, Edit2, Loader2, Sparkles } from "lucide-react";
import { useGetApplicationForm, useSubmitApplication, useInitiateCarrierHandoff, useParseDecPage } from "@workspace/api-client-react";
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
  const parseDecMutation = useParseDecPage();

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isHandingOff, setIsHandingOff] = useState(false);
  const [insurerName, setInsurerName] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [decFillCount, setDecFillCount] = useState(0);
  const [decFilledFields, setDecFilledFields] = useState<Set<string>>(new Set());

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

  const handleDecPageUpload = async (file: File) => {
    setIsExtracting(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await parseDecMutation.mutateAsync({
        data: { imageData: base64, mimeType: file.type }
      });

      if (result.fields) {
        const filled = new Set<string>();
        const updates: Record<string, string> = {};

        Object.entries(result.fields).forEach(([key, value]) => {
          if (value !== null && value !== "") {
            updates[key] = value as string;
            filled.add(key);
          }
        });

        setFormData(prev => ({ ...prev, ...updates }));
        setDecFilledFields(filled);
        setDecFillCount(filled.size);
      }
    } catch (err) {
      toast({
        title: "Could not read document",
        description: "Try a clearer photo or a different file. You can fill fields manually.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
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

        {/* Upload zone — replaces the existing AI Magic Fill banner */}
        <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 mb-8">
          {decFillCount > 0 ? (
            // Post-upload: success state
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 mb-1">
                  Filled {decFillCount} fields from your policy
                </h3>
                <p className="text-sm text-blue-700">
                  Review each highlighted field below and correct anything that looks off.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDecFillCount(0);
                  setDecFilledFields(new Set());
                }}
                className="text-xs text-blue-500 underline"
              >
                Upload different
              </button>
            </div>
          ) : isExtracting ? (
            // Extracting state
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <p className="text-sm text-blue-800">Reading your policy document…</p>
            </div>
          ) : (
            // Pre-upload: prompt state
            <label className="flex flex-col items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-blue-900 text-sm">
                  Upload your current policy to autofill this form
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Photo or PDF of your declarations page · PDF, JPG, PNG, HEIC
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.heic,image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDecPageUpload(file);
                }}
              />
              <span className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                Choose file
              </span>
            </label>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {appForm.sections.map((section, sIdx) => (
            <div key={sIdx} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-border">
                <h3 className="font-bold text-lg text-foreground">{section.title}</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.fields.map((field) => (
                  <div
                    key={field.fieldId}
                    className={[
                      field.fieldType === 'text' ? 'col-span-1 md:col-span-2' : '',
                      decFilledFields.has(field.fieldId) ? 'ring-1 ring-green-300 rounded-xl' : '',
                    ].join(' ')}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                      {field.label}
                      {decFilledFields.has(field.fieldId) && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
                          From policy
                        </span>
                      )}
                      {!field.editable && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Verified</span>
                      )}
                    </label>
                    <div className="relative">
                      {field.fieldType === 'select' && field.options ? (
                        <select
                          value={formData[field.fieldId] || ''}
                          onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
                          disabled={!field.editable}
                          required={field.required}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50 disabled:text-gray-500 appearance-none"
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
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50 disabled:text-gray-500"
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

          <div className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-lg shadow-black/5 flex flex-col md:flex-row items-center justify-between gap-6">
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
