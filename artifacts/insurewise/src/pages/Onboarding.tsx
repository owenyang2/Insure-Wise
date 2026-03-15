import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User as UserIcon, Bot, Loader2, Check, Sparkles, Brain, Wand2, Gauge } from "lucide-react";
import { useUpsertUserProfile, useAiParseAnswer, useAskExpert } from "@workspace/api-client-react";
import { useStore } from "@/store/use-store";
import { Navbar } from "@/components/layout/Navbar";

// ─── Question Template ──────────────────────────────────────────────────────

interface Question {
  id: string;
  text: string;
  suggestions?: string[];
  multiSelect?: boolean;
  placeholder?: string;
  followUp?: (answer: string) => Question[] | null;
}

const BASE_QUESTIONS: Question[] = [
  {
    id: "name",
    text: "Hi! I'm your InsureWise assistant. To find you the perfect policy, I'll ask a few quick questions. What's your name?",
    placeholder: "Your first name...",
  },
  {
    id: "insuranceType",
    text: "Great! What type of insurance are you looking for?",
    suggestions: ["Auto", "Home", "Renters", "Health", "Life"],
    placeholder: "Type or tap an option...",
    followUp: (answer) => {
      const type = answer.toLowerCase();
      if (type.includes("auto") || type.includes("car")) {
        return [
          {
            id: "vehicleMake",
            text: "What's the make and model of your vehicle? (e.g. Toyota Camry)",
            suggestions: ["Toyota Camry", "Honda Civic", "Ford F-150", "Tesla Model 3", "Chevrolet Silverado"],
            placeholder: "Make and model...",
          },
          {
            id: "vehicleYear",
            text: "And what year is it?",
            suggestions: ["2024", "2023", "2022", "2021", "2020", "2019 or older"],
            placeholder: "Vehicle year...",
          },
        ];
      }
      if (type.includes("home") || type.includes("house")) {
        return [
          {
            id: "propertyType",
            text: "What type of property is it?",
            suggestions: ["House", "Condo", "Townhouse", "Apartment"],
            placeholder: "Property type...",
          },
        ];
      }
      return null;
    },
  },
  {
    id: "age",
    text: "How old are you?",
    suggestions: ["18–25", "26–35", "36–50", "51–65", "66+"],
    placeholder: "Your age...",
  },
  {
    id: "location",
    text: "What province are you in?",
    suggestions: ["Ontario", "British Columbia", "Alberta", "Quebec", "Nova Scotia", "Other"],
    placeholder: "Province or city...",
    followUp: (answer) => {
      if (answer.toLowerCase() === "other") {
        return [
          {
            id: "locationCountry",
            text: "Which country are you in?",
            suggestions: ["United States", "United Kingdom", "Australia", "Germany", "France", "Mexico", "India"],
            placeholder: "Your country...",
          },
          {
            id: "locationState",
            text: "And which state or province?",
            placeholder: "State or province...",
          },
        ];
      }
      return null;
    },
  },
  {
    id: "budget",
    text: "What's your monthly budget for insurance?",
    suggestions: ["Under $50", "$50–$100", "$100–$150", "$150–$200", "Over $200"],
    placeholder: "Monthly budget...",
  },
  {
    id: "requirements",
    text: "Which coverages are most important to you? Tap all that apply, then hit send.",
    suggestions: ["Rental car reimbursement", "Zero deductible", "Roadside assistance", "Flood coverage", "Uninsured motorist", "Gap coverage", "New car replacement"],
    multiSelect: true,
    placeholder: "Or describe what you need...",
  },
  {
    id: "priorities",
    text: "Last one! How would you like to prioritize your search?",
    suggestions: ["Cheapest price above all", "Best coverage above all", "Highest rated insurer", "Balanced — price, coverage, and rating equally"],
    placeholder: "Your priority...",
  },
];

// ─── Profile Builder ────────────────────────────────────────────────────────

interface Answers {
  [key: string]: string;
}

function buildProfile(answers: Answers) {
  const budgetMap: Record<string, number> = {
    "under $50": 50, "$50–$100": 75, "$100–$150": 125,
    "$150–$200": 175, "over $200": 250,
  };

  const ageMap: Record<string, number> = {
    "18–25": 22, "26–35": 30, "36–50": 43, "51–65": 57, "66+": 70,
  };

  const priorityMap: Record<string, { price: number; coverage: number; rating: number }> = {
    "cheapest price above all": { price: 70, coverage: 20, rating: 10 },
    "best coverage above all": { price: 15, coverage: 70, rating: 15 },
    "highest rated insurer": { price: 20, coverage: 20, rating: 60 },
    "balanced — price, coverage, and rating equally": { price: 33, coverage: 34, rating: 33 },
  };

  const budgetKey = (answers.budget || "").toLowerCase();
  const ageKey = (answers.age || "").toLowerCase();
  const priorityKey = (answers.priorities || "").toLowerCase();
  const insType = (answers.insuranceType || "auto").toLowerCase();

  // Combine country + state/province when "Other" was selected
  const resolvedLocation = answers.locationCountry && answers.locationState
    ? `${answers.locationState}, ${answers.locationCountry}`
    : answers.location || "Canada";

  const insuranceType = insType.includes("auto") || insType.includes("car") ? "auto"
    : insType.includes("home") || insType.includes("house") ? "home"
      : insType.includes("rent") ? "renters"
        : insType.includes("health") ? "health"
          : "life";

  const requirements = answers.requirements
    ? answers.requirements.split(",").map((r) => r.trim()).filter(Boolean)
    : ["roadside assistance"];

  let vehicleDetails = undefined;
  if (answers.vehicleMake) {
    const parts = answers.vehicleMake.split(" ");
    vehicleDetails = {
      make: parts[0] || "Toyota",
      model: parts.slice(1).join(" ") || "Camry",
      year: parseInt(answers.vehicleYear) || 2022,
    };
  }

  return {
    name: answers.name || "Guest",
    age: ageMap[ageKey] || parseInt(answers.age) || 30,
    location: resolvedLocation,
    budgetMonthly: budgetMap[budgetKey] || parseInt((answers.budget || "").replace(/\D/g, "")) || 100,
    insuranceType: insuranceType as "auto" | "home" | "life" | "health" | "renters",
    priorities: priorityMap[priorityKey] || { price: 33, coverage: 34, rating: 33 },
    requirements,
    vehicleDetails,
    onboardingComplete: true,
  };
}

// ─── Component ──────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  variant?: "default" | "expert" | "parser";
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { setUserProfileId } = useStore();
  const profileMutation = useUpsertUserProfile();
  const parseMutation = useAiParseAnswer();
  const expertMutation = useAskExpert();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [questionQueue, setQuestionQueue] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isAskingExpert, setIsAskingExpert] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [aiMode, setAiMode] = useState<"auto" | "expert" | "parser">("auto");

  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    const [first, ...rest] = BASE_QUESTIONS;
    setCurrentQuestion(first);
    setQuestionQueue(rest);
    setMessages([{ role: "assistant", content: first.text, variant: "default" }]);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSaving]);

  const advanceToNext = async (answer: string, questionId: string, queue: Question[], extracted?: Record<string, any>) => {
    const newAnswers = { ...answers, ...extracted, [questionId]: answer };
    setAnswers(newAnswers);

    // Add follow-up questions from the current question's followUp fn
    const currentQ = currentQuestion;
    let extraQuestions: Question[] = [];
    if (currentQ?.followUp) {
      extraQuestions = currentQ.followUp(answer) || [];
    }

    const fullQueue = [...extraQuestions, ...queue];

    if (fullQueue.length === 0) {
      // Done — save profile
      setIsComplete(true);
      setCurrentQuestion(null);
      setIsSaving(true);

      setTimeout(async () => {
        try {
          const profile = buildProfile(newAnswers);
          const saved = await profileMutation.mutateAsync({ data: profile });
          setUserProfileId(saved.id);
          setTimeout(() => setLocation("/compare"), 1200);
        } catch (err) {
          console.error("Profile save error:", err);
        }
      }, 800);
    } else {
      const [next, ...remaining] = fullQueue;
      setCurrentQuestion(next);
      setQuestionQueue(remaining);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: next.text, variant: "default" },
      ]);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    if (!currentQuestion || isComplete) return;

    let answer: string;
    if (currentQuestion.multiSelect) {
      const typed = overrideInput ?? input.trim();
      const all = [...selected, ...(typed ? [typed] : [])];
      if (all.length === 0) return;
      answer = all.join(", ");
    } else {
      answer = overrideInput ?? input.trim();
      if (!answer) return;
    }

    // Determine if we should route to Moorcheh (Expert) or Anthropic (Parser)
    let isQuestion = false;
    if (aiMode === "expert") {
      isQuestion = true;
    } else if (aiMode === "parser") {
      isQuestion = false;
    } else {
      isQuestion = answer.trim().endsWith("?") || /^(what|why|how|can|could|would|will|explain|tell me)\b/i.test(answer.trim());
    }

    if (isQuestion) {
      setMessages((prev) => [...prev, { role: "user", content: answer }]);
      setInput("");
      setIsAskingExpert(true);
      try {
        const res = await expertMutation.mutateAsync({
          data: {
            query: answer,
            chatHistory: messages.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content }))
          }
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.answer,
            variant: "expert"
          },
          {
            role: "assistant",
            content: currentQuestion.text,
            variant: "default"
          }
        ]);
      } catch (err) {
        console.error("Moorcheh expert failed", err);
        setMessages((prev) => [
          ...prev,
          { 
            role: "assistant", 
            content: "I'm having trouble connecting to my knowledge base right now.",
            variant: "expert"
          }
        ]);
      }
      setIsAskingExpert(false);
      return; // Stop processing as an answer
    }

    let finalAnswer = answer;
    let extractedEntities: Record<string, any> | undefined;

    if (!currentQuestion.multiSelect) {
      const isExactMatch = currentQuestion.suggestions?.some(s => s.toLowerCase() === answer.toLowerCase());

      if (!isExactMatch) {
        setIsParsing(true);
        try {
          const res = await parseMutation.mutateAsync({
            data: {
              questionId: currentQuestion.id,
              questionText: currentQuestion.text,
              answer: answer,
            }
          });

          if (!res.parsedValue) {
            setMessages((prev) => [
              ...prev,
              { role: "user", content: answer },
              {
                role: "assistant", 
                content: currentQuestion.suggestions && currentQuestion.suggestions.length > 0
                  ? "I'm sorry, I didn't quite understand that. Could you please clarify or choose one of the options?"
                  : "I'm sorry, I didn't quite catch that. Could you please clarify?",
                variant: "parser"
              }
            ]);
            setInput("");
            setSelected([]);
            setIsParsing(false);
            return;
          }

          finalAnswer = res.parsedValue;
          extractedEntities = res.extractedEntities;
        } catch (e) {
          console.error("Failed to parse via AI", e);
        }
        setIsParsing(false);
      }
    }
    setMessages((prev) => [...prev, { role: "user", content: answer }]);
    setInput("");
    setSelected([]);

    await advanceToNext(finalAnswer, currentQuestion.id, questionQueue, extractedEntities);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!currentQuestion) return;
    if (currentQuestion.multiSelect) {
      setSelected((prev) =>
        prev.includes(suggestion) ? prev.filter((s) => s !== suggestion) : [...prev, suggestion]
      );
    } else {
      setMessages((prev) => [...prev, { role: "user", content: suggestion }]);
      setInput("");
      setSelected([]);
      advanceToNext(suggestion, currentQuestion.id, questionQueue);
    }
  };

  const totalSteps = BASE_QUESTIONS.length;
  const completedSteps = Object.keys(answers).filter(
    (k) => BASE_QUESTIONS.some((q) => q.id === k)
  ).length;
  const progress = Math.round((completedSteps / totalSteps) * 100);

  const saveEdit = (k: string) => {
    if (!editValue.trim()) {
      deleteEdit(k);
      return;
    }
    setAnswers(prev => ({ ...prev, [k]: editValue }));
    setEditingKey(null);
  };

  const deleteEdit = (k: string) => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[k];
      return next;
    });
    setEditingKey(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 flex gap-6 max-w-5xl">
        <div className="flex-1 flex flex-col min-w-0">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-1.5">
              <span>Profile setup</span>
              <span>{progress}% complete</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-border flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-gray-50/50 flex items-center gap-4">
              <img
                src={`${import.meta.env.BASE_URL}images/avatar-ai.png`}
                alt="AI Avatar"
                className="w-12 h-12 rounded-full border-2 border-primary/20 bg-white object-cover"
              />
              <div>
                <h2 className="font-bold text-lg text-foreground">InsureWise Assistant</h2>
                <p className="text-sm flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </p>
              </div>
              {isParsing && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm pl-4 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  Analyzing your answer...
                </div>
              )}
              {isAskingExpert && (
                <div className="flex items-center gap-2 text-indigo-500 text-sm pl-4 animate-pulse font-medium">
                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                  Moorcheh AI is researching your question...
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm ${
                        msg.role === "user" 
                          ? "bg-primary text-white" 
                          : msg.variant === "expert"
                            ? "bg-indigo-100 text-indigo-600 shadow-sm border border-indigo-200"
                          : msg.variant === "parser"
                            ? "bg-emerald-100 text-emerald-600 shadow-sm border border-emerald-200"
                            : "bg-primary/10 text-primary"
                      }`}>
                      {msg.role === "user" ? <UserIcon size={16} /> : msg.variant === "expert" ? <Sparkles size={16} /> : msg.variant === "parser" ? <Wand2 size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : msg.variant === "expert"
                          ? "bg-indigo-50 text-indigo-950 rounded-tl-sm border border-indigo-100"
                        : msg.variant === "parser"
                          ? "bg-emerald-50 text-emerald-950 rounded-tl-sm border border-emerald-100"
                          : "bg-gray-100 text-foreground rounded-tl-sm border border-border/50"
                      }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isParsing && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center bg-primary/10 text-primary">
                    <Bot size={16} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100 border border-border/50 text-foreground text-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-muted-foreground delay-0" />
                    <span className="text-muted-foreground animate-pulse">Analyzing your answer...</span>
                  </div>
                </motion.div>
              )}

              {isSaving && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center bg-emerald-100 text-emerald-600">
                    <Check size={16} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Building your profile and finding matches...
                  </div>
                </motion.div>
              )}
            </div>

            {/* Suggestions + Input */}
            {!isComplete && currentQuestion && (
              <div className="border-t border-border bg-white p-4 space-y-3">
                {/* Suggestion chips */}
                {currentQuestion.suggestions && currentQuestion.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentQuestion.suggestions.map((s) => {
                      const isActive = selected.includes(s);
                      return (
                        <motion.button
                          key={s}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleSuggestionClick(s)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${isActive
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-foreground border-border hover:border-primary hover:text-primary"
                            }`}
                        >
                          {currentQuestion.multiSelect && isActive && (
                            <Check size={12} className="inline mr-1" />
                          )}
                          {s}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* AI Routing Toggle */}
                <div className="flex flex-col gap-1 mb-2">
                  <div className="flex bg-gray-100 p-1 rounded-full w-fit">
                    <button
                      onClick={() => setAiMode("auto")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${aiMode === 'auto' ? 'bg-white shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Gauge size={14} /> Auto
                    </button>
                    <button
                      onClick={() => setAiMode("expert")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${aiMode === 'expert' ? 'bg-indigo-50 shadow text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Sparkles size={14} /> Moorcheh
                    </button>
                    <button
                      onClick={() => setAiMode("parser")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${aiMode === 'parser' ? 'bg-emerald-50 shadow text-emerald-600' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Wand2 size={14} /> OpenAI
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-2 italic">
                    {aiMode === 'auto' && "Smart routing: answers form fields, searches knowledge for questions."}
                    {aiMode === 'expert' && "Sidebar mode: strictly ask Moorcheh's knowledge base without advancing."}
                    {aiMode === 'parser' && "Form mode: strictly extract answers to your profile using OpenAI."}
                  </p>
                </div>

                {/* Text input */}
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={currentQuestion.placeholder || "Type your answer..."}
                    className="w-full pl-5 pr-14 py-3.5 rounded-full bg-gray-50 border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm text-foreground"
                  />
                  <button
                    type="submit"
                    disabled={
                      currentQuestion.multiSelect
                        ? selected.length === 0 && !input.trim()
                        : !input.trim()
                    }
                    className="absolute right-2 p-2 rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={16} className="ml-0.5" />
                  </button>
                </form>

                {currentQuestion.multiSelect && selected.length > 0 && (
                  <p className="text-xs text-muted-foreground pl-2">
                    {selected.length} selected — hit send when done
                  </p>
                )}
              </div>
            )}
            {/* Dummy div to scroll to includes the input form now */}
            <div ref={scrollRef} className="h-4" />

          </div>
        </div>

        {/* SIDEBAR */}
        <div className="w-80 hidden lg:flex flex-col gap-4">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 border border-blue-100 shadow-xl shadow-blue-900/5 flex-1 overflow-y-auto">
            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Captured Details
            </h3>
            {Object.keys(answers).length === 0 ? (
              <p className="text-sm text-blue-800/60">I'll automatically extract your details here as we chat.</p>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {Object.entries(answers).map(([k, v]) => (
                    <motion.div
                      key={k}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-xl p-3 shadow-sm border border-blue-100/50 relative group"
                    >
                      <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                        {k.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      {editingKey === k ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(k); }}
                            className="w-full text-sm border border-blue-200 rounded px-2 py-1 outline-none"
                          />
                          <button onClick={() => saveEdit(k)} className="text-xs bg-blue-500 text-white px-2 rounded">
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-blue-950 block">{v as string}</span>
                          <button
                            onClick={() => { setEditingKey(k); setEditValue(v as string); }}
                            className="opacity-0 group-hover:opacity-100 text-xs text-blue-500 transition-opacity"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

