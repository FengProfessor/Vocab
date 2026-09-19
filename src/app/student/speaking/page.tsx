"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authFetch } from "@/lib/auth-fetch";
import {
  ChevronLeft, Loader2, Volume2, Bot, User, Sparkles,
  MessageSquare, VolumeX, Send, RefreshCw, Filter, Lightbulb,
  BookOpen, Zap, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpeechRecorder } from "@/components/speaking/SpeechRecorder";
import { toast } from "sonner";
import { StudentShell } from "@/components/student/StudentShell";
import { speak } from "@/lib/study";
import { AI_SPEAKING_TOPICS, AiSpeakingTopic } from "@/data/speaking/ai-topics";

interface Message {
  role: "user" | "model";
  content: string;
  feedback?: string;
  suggestedResponse?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'workplace', label: 'Công sở' },
  { id: 'academic', label: 'Học thuật' },
  { id: 'daily_travel', label: 'Đời sống & Du lịch' },
  { id: 'debates', label: 'Tranh biện' },
  { id: 'exam_prep', label: 'Luyện thi' },
] as const;

export default function StudentSpeakingPage() {
  const router = useRouter();
  const [, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTopic, setActiveTopic] = useState<AiSpeakingTopic>(AI_SPEAKING_TOPICS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [textInput, setTextInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredTopics = useMemo(() => {
    if (selectedCategory === 'all') return AI_SPEAKING_TOPICS;
    return AI_SPEAKING_TOPICS.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setIsLoading(false);
        initConversation(AI_SPEAKING_TOPICS[0]);
      } else {
        router.push("/auth");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiLoading]);

  const speakText = (text: string) => {
    if (isMuted) return;
    speak(text, 1.0);
  };

  const initConversation = (topic: AiSpeakingTopic) => {
    const greeting = topic.initialGreeting;
    setMessages([
      {
        role: "model",
        content: greeting,
      },
    ]);
    setTimeout(() => {
      speakText(greeting);
    }, 400);
  };

  const handleTopicChange = (topic: AiSpeakingTopic) => {
    setActiveTopic(topic);
    initConversation(topic);
  };

  const handleUserResponse = async (inputStr: string) => {
    if (!inputStr.trim() || isAiLoading) return;

    const updatedMessages = [...messages, { role: "user" as const, content: inputStr }];
    setMessages(updatedMessages);
    setIsAiLoading(true);

    try {
      const res = await authFetch("/api/dictionary/ai-speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: updatedMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          topic: `${activeTopic.label} (${activeTopic.level})`,
          lastTranscript: inputStr,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to talk to tutor");
      }

      const aiReply = result.data;

      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          ...prev[prev.length - 1],
          feedback: aiReply.feedback,
          suggestedResponse: aiReply.suggestedResponse,
        },
        {
          role: "model",
          content: aiReply.response,
        },
      ]);

      speakText(aiReply.response);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi kết nối máy chủ");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsAiLoading(false);
    }
  };

  const resetConversation = () => {
    initConversation(activeTopic);
  };

  if (isLoading) {
    return (
      <main className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <StudentShell title="AI Speaking Tutor" contentClassName="p-0" hideMobileNav>
      <main className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] bg-slate-900 text-slate-100 font-sans flex flex-col">
        <header className="sticky top-header-safe z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/student"
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Dashboard
            </Link>
            <span className="text-slate-700">/</span>
            <span className="font-bold flex items-center gap-2 text-indigo-400 text-sm sm:text-base">
              <MessageSquare className="h-4 w-4" />
              AI Speaking Tutor (24+ Topics)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="border-slate-800 hover:bg-slate-800 text-slate-400"
              title={isMuted ? "Bật âm thanh phát âm" : "Tắt âm thanh phát âm"}
            >
              {isMuted ? <VolumeX className="size-4 text-red-400" /> : <Volume2 className="size-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={resetConversation}
              className="border-slate-800 hover:bg-slate-800 text-slate-400"
              title="Làm mới cuộc trò chuyện"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </header>

        {/* Master Speaking Hub 3-Track Navigation */}
        <div className="border-b border-slate-800/80 bg-slate-950/80 px-4 py-4 sm:px-6 backdrop-blur">
          <div className="max-w-6xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-indigo-400" /> Chọn Lộ Trình Luyện Nói (3 Learning Tracks)
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Toàn diện từ A0 đến 6.5 IELTS &amp; AI Chat Realtime
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Track 1: 3-Tier Curriculum */}
              <Link
                href="/student/speaking/curriculum"
                className="group p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all flex items-start gap-3"
              >
                <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      Track 1: Lộ Trình 32 Bài
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      0 - 6.5 IELTS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    Curriculum 3 chặng khép kín: Ngữ âm, Khối Lego &lt;1s, Hội thoại &amp; SafeHarbor.
                  </p>
                  <div className="mt-2 text-[11px] text-indigo-400 font-semibold flex items-center gap-1">
                    <span>Khám phá 32 bài học</span>
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>

              {/* Track 2: Foundational Speaking Hub */}
              <Link
                href="/student/speaking/foundation"
                className="group p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-amber-500/50 hover:bg-slate-900/90 transition-all flex items-start gap-3"
              >
                <div className="size-9 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Zap className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      Track 2: Khóa Nền Tảng A0-A1
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Chống dịch thầm
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    Stage Mindset &amp; Chặng 0-3 cho người mất gốc: Khung câu, nối âm &amp; nhả âm tức thì.
                  </p>
                  <div className="mt-2 text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                    <span>Vào học Chặng 0 - 3</span>
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>

              {/* Track 3: AI Speaking Tutor (Active Track) */}
              <div className="p-3.5 rounded-xl border-2 border-emerald-500/40 bg-emerald-950/15 flex items-start gap-3 relative">
                <div className="size-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Bot className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Track 3: AI Speaking Tutor
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Đang mở
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                    24+ Kịch bản hội thoại AI tương tác thực tế, phản hồi phát âm &amp; gợi ý tự nhiên.
                  </p>
                  <div className="mt-2 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span>Luyện nói tự do bên dưới</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 flex flex-col md:flex-row gap-4 sm:gap-6 overflow-hidden">
          {/* Topic sidebar selection */}
          <div className="w-full md:w-80 shrink-0 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="size-3.5" /> Chủ đề đàm thoại ({filteredTopics.length})
              </h3>
            </div>

            {/* Category filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-[11px]">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-all ${
                    selectedCategory === cat.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Topics scroll list */}
            <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[140px] md:max-h-[calc(100vh-14rem)] pr-1 scrollbar-thin">
              {filteredTopics.map((topic) => {
                const isActive = activeTopic.id === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicChange(topic)}
                    className={`flex-1 md:flex-none text-left p-3 rounded-xl border transition-all text-xs shrink-0 w-64 md:w-full ${
                      isActive
                        ? "bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-950/50"
                        : "bg-slate-800/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="font-bold truncate flex items-center gap-1.5">
                        <span>{topic.icon}</span>
                        <span className="truncate">{topic.label}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        topic.level === 'C1' ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50' :
                        topic.level === 'B2' ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50' :
                        topic.level === 'B1' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' :
                        'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                      }`}>
                        {topic.level}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {topic.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat & Interaction Area */}
          <div className="flex-1 flex flex-col bg-slate-950/40 border border-slate-800/60 rounded-2xl overflow-hidden h-[calc(100vh-16rem)] md:h-[calc(100vh-8.5rem)]">
            {/* Active Topic Header Bar */}
            <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">{activeTopic.icon}</span>
                <span className="font-semibold text-slate-200">{activeTopic.label}</span>
                <span className="text-[10px] text-indigo-400 font-mono font-bold px-1.5 py-0.5 bg-indigo-950/60 rounded border border-indigo-800/50">
                  {activeTopic.level}
                </span>
              </div>
              <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="text-slate-500">Từ khóa:</span>
                {activeTopic.keyVocabulary.slice(0, 3).map((v, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 text-[10px]">
                    {v}
                  </span>
                ))}
              </div>
            </div>

            {/* Context & Roleplay Persona Banner */}
            {(activeTopic.roleplayPersona || activeTopic.contextSettingVi) && (
              <div className="px-4 py-3 bg-slate-900/40 border-b border-slate-800/60 text-xs space-y-2">
                {activeTopic.roleplayPersona && (
                  <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Đối tác đàm thoại AI:</span>
                      <strong className="text-white">{activeTopic.roleplayPersona.name}</strong>
                      <span className="text-slate-400">({activeTopic.roleplayPersona.role} • {activeTopic.roleplayPersona.organization})</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                      Phong thái: {activeTopic.roleplayPersona.tone}
                    </span>
                  </div>
                )}

                {activeTopic.contextSettingVi && (
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    <strong className="text-amber-400/90">Bối cảnh:</strong> {activeTopic.contextSettingVi}
                  </p>
                )}

                {activeTopic.conversationGoalsVi && activeTopic.conversationGoalsVi.length > 0 && (
                  <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">Mục tiêu bạn cần đạt:</span>
                    {activeTopic.conversationGoalsVi.map((g, gi) => (
                      <span key={gi} className="px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 border border-slate-700/60">
                        ✓ {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages scroll box */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, idx) => (
                <div key={idx} className="space-y-2">
                  <div className={`flex gap-3 max-w-[88%] ${m.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                      m.role === "user" ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"
                    }`}>
                      {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                    </div>
                    <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-emerald-600/15 border border-emerald-500/30 text-emerald-100 rounded-tr-none"
                        : "bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none shadow-sm"
                    }`}>
                      {m.content}
                      {m.role === "model" && (
                        <button
                          onClick={() => speakText(m.content)}
                          className="ml-2 inline-flex items-center text-indigo-400 hover:text-indigo-300 align-middle"
                          title="Nghe lại phát âm"
                        >
                          <Volume2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Feedback card */}
                  {m.role === "user" && (m.feedback || m.suggestedResponse) && (
                    <div className="max-w-[85%] ml-11 mr-11 bg-slate-900/80 border border-slate-800/70 rounded-xl p-3 text-xs space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                      {m.suggestedResponse && m.suggestedResponse !== m.content && (
                        <div className="text-slate-400">
                          💡 <span className="font-bold text-slate-300">Gợi ý cách diễn đạt tự nhiên:</span>{" "}
                          <span className="italic text-emerald-300 font-medium">&ldquo;{m.suggestedResponse}&rdquo;</span>
                        </div>
                      )}
                      {m.feedback && (
                        <div className="text-indigo-300 flex gap-1 items-start">
                          <Sparkles className="size-3.5 shrink-0 mt-0.5" />
                          <span>{m.feedback}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isAiLoading && (
                <div className="flex gap-3 max-w-[85%] animate-pulse">
                  <div className="size-8 rounded-full bg-indigo-900 flex items-center justify-center">
                    <Bot className="size-4 text-indigo-400" />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none text-slate-400 flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin text-indigo-400" />
                    <span>Trợ lý AI đang phản hồi và phân tích phát âm...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Starter Chips */}
            {activeTopic.suggestedStarters && activeTopic.suggestedStarters.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                  <Lightbulb className="size-3 text-amber-400" /> Gợi ý mở đầu:
                </span>
                {activeTopic.suggestedStarters.map((starter, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => setTextInput(starter)}
                    disabled={isAiLoading}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-850 border border-slate-750 text-slate-300 hover:text-white hover:border-indigo-500/60 hover:bg-slate-800 shrink-0 transition-colors truncate max-w-xs"
                    title="Bấm để đưa vào khung trả lời"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            )}

            {/* Input and Recording Area */}
            <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-900/30 flex flex-col gap-2.5">
              <SpeechRecorder
                onTranscript={handleUserResponse}
                disabled={isAiLoading}
              />

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (textInput.trim()) {
                    handleUserResponse(textInput);
                    setTextInput("");
                  }
                }}
                className="flex gap-2 w-full max-w-lg mx-auto"
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Nhập hoặc nói câu trả lời của bạn..."
                  disabled={isAiLoading}
                  className="flex-1 bg-slate-900/70 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  disabled={isAiLoading || !textInput.trim()}
                  className="border-slate-800 hover:bg-slate-800 text-indigo-400 shrink-0"
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </StudentShell>
  );
}
