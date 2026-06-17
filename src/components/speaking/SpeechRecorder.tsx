"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Square, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Web Speech API không có sẵn trong lib TS — khai báo structural type tối thiểu
interface SpeechRecognitionErrorEventLike { error: string }
interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface SpeechRecorderProps {
  onTranscript: (text: string) => void;
  lang?: string;
  disabled?: boolean;
}

export function SpeechRecorder({
  onTranscript,
  lang = "en-US",
  disabled = false,
}: SpeechRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  // Keep ref updated with latest callback
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    // Check Web Speech API support
    const w = typeof window !== "undefined"
      ? (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor })
      : undefined;
    const SpeechRecognition = w?.SpeechRecognition || w?.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Phát hiện capability trình duyệt phải chạy sau mount (tránh hydration mismatch)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      console.error("Speech recognition error", event.error);
      if (event.error === "not-allowed") {
        setError("Vui lòng cấp quyền truy cập Micro.");
      } else if (event.error === "no-speech") {
        setError("Không nghe thấy giọng nói. Thử lại nhé.");
      } else {
        setError(`Lỗi: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript && onTranscriptRef.current) {
        onTranscriptRef.current(transcript);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang]);

  const startRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Start recognition fail:", err);
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error("Stop recognition fail:", err);
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-2 p-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg">
        <MicOff className="size-4 shrink-0" />
        <span>Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Web Speech API). Hãy dùng Chrome/Safari.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg w-full">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="relative flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800 w-full">
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-red-500/20 opacity-75"></span>
            <span className="animate-pulse absolute inline-flex h-20 w-20 rounded-full bg-red-500/10 opacity-50"></span>
          </div>
        )}

        {isRecording ? (
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full size-16 flex items-center justify-center shadow-lg relative z-10"
            onClick={stopRecording}
            disabled={disabled}
          >
            <Square className="size-6 text-white" />
          </Button>
        ) : (
          <Button
            variant="chunky"
            size="lg"
            className="rounded-full size-16 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 border-indigo-700 relative z-10"
            onClick={startRecording}
            disabled={disabled}
          >
            <Mic className="size-6 text-white" />
          </Button>
        )}
      </div>

      <span className="text-xs text-slate-400 font-medium">
        {isRecording ? "Đang lắng nghe... Hãy nói tiếng Anh" : "Bấm Micro và bắt đầu nói"}
      </span>
    </div>
  );
}
