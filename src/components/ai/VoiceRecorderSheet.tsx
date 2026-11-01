import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { useWedding } from '../../context/WeddingContext';
import { useAuth } from '../../context/AuthContext';
import { parseSpokenTextToDraft } from '../../lib/aiParser';
import { ParsedAIDraft } from './ConfirmCard';
import { logger } from '../../lib/logger';

/** Minimal shape of the (vendor-prefixed) Web Speech API that this sheet uses. */
interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

interface VoiceRecorderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onParsed: (draft: ParsedAIDraft) => void;
}

export const VoiceRecorderSheet: React.FC<VoiceRecorderSheetProps> = ({
  isOpen,
  onClose,
  onParsed,
}) => {
  const { wedding, vendors, members, events } = useWedding();
  const { user, profile } = useAuth();
  const isDemo = !!user?.isAnonymous;
  const speechSupported = getSpeechRecognition() !== undefined;
  const [processing, setProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [langHint, setLangHint] = useState<'te' | 'hi' | 'en' | 'mixed'>('te');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setTranscript('');
      setRecordingSeconds(0);
    }
  }, [isOpen]);

  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setTranscript('');

    // Timer
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 30) {
          stopRecording();
          return 30;
        }
        return prev + 1;
      });
    }, 1000);

    // Try Web Speech API if supported in browser
    const SpeechRecognition = getSpeechRecognition();

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = langHint === 'te' ? 'te-IN' : langHint === 'hi' ? 'hi-IN' : 'en-IN';

        recognition.onresult = (event: SpeechResultEvent) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript + ' ';
          }
          setTranscript(current.trim());
        };

        recognition.onerror = () => {
          // If speech recognition throws in iframe, fallback gracefully
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        // Fallback
      }
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition may already have stopped; nothing to clean up.
      }
      recognitionRef.current = null;
    }
  };

  const handleProcess = async (textToProcess: string) => {
    const text = (textToProcess || transcript).trim();
    if (!text || processing) return;
    stopRecording();

    setProcessing(true);
    let draft: ParsedAIDraft;
    try {
      // Loaded on demand so the AI library doesn't slow down the first app load.
      const { parseVoiceWithGemini } = await import('../../lib/geminiParser');
      draft = await parseVoiceWithGemini(text, {
        categories: wedding?.categories || [],
        vendors,
        members,
        events,
        speakerName: profile?.displayName || user?.displayName || 'Me',
      });
    } catch (err) {
      // No internet or AI unavailable: simple offline reading that leaves unknowns empty.
      logger.warn('Gemini voice parsing failed, using offline parser', err);
      draft = parseSpokenTextToDraft(text, wedding?.categories || []);
    } finally {
      setProcessing(false);
    }
    onClose();
    onParsed(draft);
  };

  const sampleVoicePrompts = [
    {
      label: 'Catering Advance (Telugu)',
      text: 'caterer ki 40 thousand advance ichhamu cash lo, mama pay chesaru',
    },
    {
      label: 'Guest Gift (Telugu)',
      text: 'Ramesh garu Guntur nunchi 5000 icharu',
    },
    {
      label: 'Photographer PhonePe',
      text: 'mama photographer ki 25000 phonepe chesaru',
    },
    {
      label: 'Decoration (Lakh)',
      text: 'ninna decoration vallaki oka laksha balance ichhamu',
    },
    {
      label: 'Gold Ring Gift',
      text: 'Sita akka rendu grams bangaram ungaram ichindi',
    },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Voice Entry (వాయిస్ రికార్డ్)">
      <div className="flex flex-col items-center gap-5 text-center py-2 pb-6">
        {/* Language selector chips */}
        <div className="flex items-center gap-2">
          {(['te', 'hi', 'en', 'mixed'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLangHint(l)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                langHint === l
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'
              }`}
            >
              {l === 'te'
                ? 'తెలుగు (Telugu)'
                : l === 'hi'
                  ? 'हिंदी (Hindi)'
                  : l === 'en'
                    ? 'English'
                    : 'Mixed'}
            </button>
          ))}
        </div>

        {/* Big Mic Button with Pulsing Animation */}
        <div className="relative my-2">
          {isRecording && (
            <div className="absolute inset-0 rounded-full bg-[var(--color-primary)] opacity-30 animate-ping" />
          )}
          <button
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            aria-pressed={isRecording}
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
              isRecording
                ? 'bg-[var(--color-danger)] text-white'
                : 'bg-[var(--color-primary)] text-white hover:opacity-95'
            }`}
          >
            {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          </button>
        </div>

        {/* Status & Timer */}
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {isRecording
              ? `Listening… (00:${recordingSeconds.toString().padStart(2, '0')})`
              : 'Tap mic and speak naturally'}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            e.g. "Caterer ki 40 thousand advance ichhamu cash lo"
          </p>
        </div>

        {/* Live speech feedback or manual input */}
        <div className="w-full">
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Spoken words appear here (or type/paste to test)..."
            className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-center"
          />
        </div>

        {!speechSupported && (
          <p className="w-full text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2">
            Voice typing isn’t supported in this browser. Use Chrome on Android, or type the note
            above.
          </p>
        )}

        {transcript && (
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            loading={processing}
            onClick={() => handleProcess(transcript)}
            icon={<Sparkles className="w-4 h-4" />}
          >
            {processing ? 'Understanding…' : 'Understand & Draft Entry ➔'}
          </Button>
        )}

        {/* Quick sample prompts — demo mode only, so real weddings never get sample data */}
        {isDemo && (
          <div className="w-full pt-3 border-t border-[var(--color-border)] text-left">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
              Try Quick Wedding Audio Samples:
            </span>
            <div className="flex flex-col gap-1.5">
              {sampleVoicePrompts.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTranscript(s.text);
                    handleProcess(s.text);
                  }}
                  className="text-left px-3 py-2 text-xs bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div>
                    <span className="font-semibold text-[var(--color-primary)] block">
                      {s.label}
                    </span>
                    <span className="text-[var(--color-text-muted)] italic truncate">
                      "{s.text}"
                    </span>
                  </div>
                  <Sparkles className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
