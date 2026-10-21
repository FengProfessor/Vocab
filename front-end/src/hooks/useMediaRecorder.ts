import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaRecorderControls } from '@/hooks/types/MediaRecorderControls';

/**
 * Records microphone audio with the browser MediaRecorder API.
 */
export function useMediaRecorder(): MediaRecorderControls {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!isRecording) {
      return undefined;
    }
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  // Release the previous object URL whenever it is replaced or the component unmounts.
  useEffect(
    () => () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    },
    [audioUrl]
  );

  const start = useCallback(async (): Promise<void> => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setErrorMessage('Trình duyệt không hỗ trợ ghi âm.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent): void => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = (): void => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setAudioUrl(URL.createObjectURL(blob));
      };

      recorderRef.current = recorder;
      recorder.start();
      setErrorMessage(null);
      setElapsedSeconds(0);
      setAudioUrl(null);
      setIsRecording(true);
    } catch {
      setErrorMessage('Không truy cập được micro. Hãy cấp quyền ghi âm cho trình duyệt.');
    }
  }, []);

  const stop = useCallback((): void => {
    recorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const reset = useCallback((): void => {
    setAudioUrl(null);
    setElapsedSeconds(0);
  }, []);

  return { isRecording, elapsedSeconds, audioUrl, errorMessage, start, stop, reset };
}
