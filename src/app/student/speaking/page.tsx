"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authFetch } from "@/lib/auth-fetch";
import {
  ChevronLeft, Loader2, Volume2, Bot, User, Sparkles,
  MessageSquare, VolumeX, Send, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpeechRecorder } from "@/components/speaking/SpeechRecorder";
import { toast } from "sonner";

interface Message {
  role: "user" | "model";
  content: string;
  feedback?: string;
  suggestedResponse?: string;
}

const TOPICS = [
  { id: "it_interview", label: "💻 IT Job Interview", desc: "Luyện tập phỏng vấn xin việc ngành lập trình/IT." },
  { id: "daily_life", label: "☕ Daily Conversation", desc: "Trò chuyện thân mật về cuộc sống hàng ngày." },
  { id: "food", label: "🍔 Ordering Food", desc: "Thực hành gọi món và nói chuyện tại nhà hàng." },
  { id: "intro", label: "👋 Self Introduction", desc: "Giới thiệu bản thân trong môi trường học thuật/công sở." }
];

export default function StudentSpeakingPage() {
  const router = useRouter();
  const [, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState(TOPICS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [textInput, setTextInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setIsLoading(false);
        // Start conversation automatically
        initConversation(TOPICS[0].label);
      } else {
        router.push("/auth");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiLoading]);

  // Speak text using Web Speech API TTS
  const speakText = (text: string) => {
    if (isMuted || typeof window === "undefined" || !window.speechSynthesis) return;
    // Cancel current speaking
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    // Search for a natural English voice if possible
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith("en-") && v.name.includes("Google"));
    if (enVoice) utterance.voice = enVoice;
    window.speechSynthesis.speak(utterance);
  };

  const initConversation = (topicLabel: string) => {
    const initialGreeting = `Hello! I'm Lingo, your AI tutor. Today we will practice: "${topicLabel}". Let's start! Can you tell me a little bit about yourself or your experience with this topic?`;
    setMessages([
      {
        role: "model",
        content: initialGreeting
      }
    ]);
    setTimeout(() => {
      speakText(initialGreeting);
    }, 500);
  };

  const handleTopicChange = (topic: typeof TOPICS[0]) => {
    setActiveTopic(topic);
    initConversation(topic.label);
  };

  const handleUserResponse = async (inputStr: string) => {
    if (!inputStr.trim() || isAiLoading) return;

    // Add user message to UI
    const updatedMessages = [...messages, { role: "user" as const, content: inputStr }];
    setMessages(updatedMessages);
    setIsAiLoading(true);

    try {
      const res = await authFetch("/api/dictionary/ai-speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: updatedMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          topic: activeTopic.label,
          lastTranscript: inputStr
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to talk to tutor");
      }

      const aiReply = result.data;
      
      // Update messages with AI response + feedback
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          ...prev[prev.length - 1],
          feedback: aiReply.feedback,
          suggestedResponse: aiReply.suggestedResponse
        },
        {
          role: "model",
          content: aiReply.response
        }
      ]);

      // Speak the AI response
      speakText(aiReply.response);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi kết nối máy chủ");
      // Remove last user message on failure to let them retry
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsAiLoading(false);
    }
  };

  const resetConversation = () => {
    initConversation(activeTopic.label);
  };

  if (isLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-slate-900 text-slate-100 font-sans flex flex-col">
      <header className="sticky top-0 z-30 h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/student"
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Dashboard
          </Link>
          <span className="text-slate-700">/</span>
          <span className="font-bold flex items-center gap-2 text-indigo-400">
            <MessageSquare className="h-4 w-4" />
            AI Speaking Tutor (MVA)
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

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Topic sidebar selection */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-400 px-1 uppercase tracking-wider">Chọn chủ đề</h3>
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicChange(topic)}
                className={`flex-1 md:flex-none text-left p-3 rounded-xl border transition-all text-xs shrink-0 ${
                  activeTopic.id === topic.id
                    ? "bg-indigo-600/10 border-indigo-500 text-white shadow-lg"
                    : "bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80"
                }`}
              >
                <div className="font-bold mb-1">{topic.label}</div>
                <div className="text-[10px] text-slate-500 line-clamp-1 md:line-clamp-2">{topic.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-950/40 border border-slate-800/60 rounded-2xl overflow-hidden h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)]">
          {/* Messages block */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div key={idx} className="space-y-2">
                <div className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                  <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                    m.role === "user" ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"
                  }`}>
                    {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                  </div>
                  <div className={`p-3.5 rounded-2xl text-sm ${
                    m.role === "user"
                      ? "bg-emerald-600/15 border border-emerald-500/30 text-emerald-100 rounded-tr-none"
                      : "bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none"
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

                {/* User message feedback and suggested correction details */}
                {m.role === "user" && (m.feedback || m.suggestedResponse) && (
                  <div className="max-w-[80%] ml-11 mr-11 bg-slate-900/60 border border-slate-800/50 rounded-xl p-3 text-xs space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                    {m.suggestedResponse && m.suggestedResponse !== m.content && (
                      <div className="text-slate-400">
                        💡 <span className="font-bold text-slate-300">Nên nói là:</span>{" "}
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
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none text-slate-400 flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-indigo-400" />
                  <span>Trợ lý đang suy nghĩ...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Control input area */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/30 flex flex-col gap-3">
            <SpeechRecorder
              onTranscript={handleUserResponse}
              disabled={isAiLoading}
            />

            {/* Keyboard fallback option */}
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
                placeholder="Hoặc gõ câu trả lời của bạn tại đây..."
                disabled={isAiLoading}
                className="flex-1 bg-slate-900/60 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <Button
                type="submit"
                variant="outline"
                size="icon"
                disabled={isAiLoading || !textInput.trim()}
                className="border-slate-800 hover:bg-slate-800 text-indigo-400"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
