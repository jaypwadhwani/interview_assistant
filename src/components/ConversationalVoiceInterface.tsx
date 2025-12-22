import { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useVoiceAnalysis } from '../hooks/useVoiceAnalysis';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { ColorScheme, getTheme } from '../utils/theme';

type ConversationState = 'greeting' | 'waiting_confirmation' | 'asking_question' | 'listening' | 'providing_feedback' | 'asking_feedback_preference';

interface ConversationalVoiceInterfaceProps {
  conversationState: ConversationState;
  isPaused: boolean;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  onUserResponse: (transcript: string, voiceAnalysis?: any, audioBlob?: Blob | null) => void;
  onStartConversation: () => void;
  onResume: () => void;
  theme: ColorScheme;
  shouldListen: boolean;
}

export const ConversationalVoiceInterface = ({
  conversationState,
  isPaused,
  isListening,
  setIsListening,
  onUserResponse,
  onStartConversation,
  onResume,
  theme,
  shouldListen,
}: ConversationalVoiceInterfaceProps) => {
  const themeColors = getTheme(theme);
  const { startAnalysis, analyzeTranscript, updateDuration } = useVoiceAnalysis();
  const [hasStarted, setHasStarted] = useState(false);
  const { start: startRecording, stop: stopRecording, isRecording } = useAudioRecorder();
  
  const { error, startListening, stopListening } = useSpeechRecognition({
    onResult: (finalTranscript, duration) => {
      if (duration) {
        updateDuration(duration);
      }
      const analysis = analyzeTranscript(finalTranscript);
      stopRecording().then((audioBlob) => {
        onUserResponse(finalTranscript, analysis, audioBlob);
      });
    },
    continuous: true, // Continuous listening like ChatGPT
    interimResults: false,
  });

  // Track if we've started listening for this shouldListen=true period
  const hasStartedListeningRef = useRef(false);

  // Auto-start/stop listening based on shouldListen flag
  useEffect(() => {
    console.log('[VoiceInterface] useEffect triggered:', { shouldListen, isPaused, conversationState, hasStarted: hasStartedListeningRef.current });

    // Only auto-start if we should be listening and haven't started yet
    if (shouldListen && !isPaused && conversationState !== 'providing_feedback') {
      if (!hasStartedListeningRef.current) {
        console.log('[VoiceInterface] Starting to listen...');
        hasStartedListeningRef.current = true;
        startAnalysis();
        startRecording().catch(() => {});
        startListening();
        setIsListening(true);
      }
    } else if (!shouldListen) {
      if (hasStartedListeningRef.current) {
        console.log('[VoiceInterface] Stopping listening...');
        hasStartedListeningRef.current = false;
        stopListening();
        if (isRecording) {
          stopRecording();
        }
        setIsListening(false);
      }
    }
  }, [shouldListen, isPaused, conversationState]);

  const handleMicrophoneClick = () => {
    console.log('[VoiceInterface] Microphone clicked:', { isPaused, conversationState, hasStarted, isListening });

    if (isPaused) {
      console.log('[VoiceInterface] Resuming from pause');
      onResume();
      return;
    }

    if (conversationState === 'greeting' && !hasStarted) {
      console.log('[VoiceInterface] Starting conversation');
      setHasStarted(true);
      onStartConversation();
    } else if (isListening) {
      // Toggle off - pause listening
      console.log('[VoiceInterface] Pausing listening (manual)');
      hasStartedListeningRef.current = false; // Sync ref
      stopListening();
      setIsListening(false);
    } else {
      // Toggle on - resume listening
      console.log('[VoiceInterface] Resuming listening (manual)');
      hasStartedListeningRef.current = true; // Sync ref
      startAnalysis();
      startRecording().catch(() => {});
      startListening();
      setIsListening(true);
    }
  };

  const getStatusText = (): string => {
    if (isPaused) return 'Session paused. Click to resume.';
    if (conversationState === 'greeting') return 'Click to start the interview';
    if (conversationState === 'waiting_confirmation') return 'Waiting for your response...';
    if (conversationState === 'asking_question') return 'Listening...';
    if (conversationState === 'listening') return 'Listening...';
    if (conversationState === 'providing_feedback') return 'Providing feedback...';
    if (conversationState === 'asking_feedback_preference') return 'Waiting for your preference...';
    return 'Ready';
  };

  return (
    <div className={`${themeColors.glass} rounded-3xl shadow-lg p-10 border ${themeColors.glassBorder}`}>
      <div className="flex flex-col items-center justify-center space-y-8">
        <div className="text-center">
          <h3 className={`text-2xl font-semibold ${themeColors.text} mb-2`}>
            {conversationState === 'greeting' ? 'Ready to Start' : 'Voice Conversation'}
          </h3>
          <p className={`${themeColors.textSecondary} text-sm`}>{getStatusText()}</p>
        </div>

        {/* Microphone Button - Only for initial start and pause/resume */}
        {(conversationState === 'greeting' || isPaused || !isListening) && (
          <button
            type="button"
            onClick={handleMicrophoneClick}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all transform shadow-lg ${
              isPaused
                ? 'bg-yellow-500 text-white hover:bg-yellow-600 hover:scale-105'
                : `${themeColors.primary} text-white hover:${themeColors.primaryHover} hover:scale-105`
            }`}
            aria-label={isPaused ? 'Resume conversation' : 'Start conversation'}
          >
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        {/* Listening Indicator - Show when actively listening, clickable to pause */}
        {isListening && conversationState !== 'greeting' && (
          <>
            <button
              type="button"
              onClick={handleMicrophoneClick}
              className={`w-32 h-32 rounded-full bg-red-500 flex items-center justify-center animate-pulse hover:bg-red-600 transition-colors cursor-pointer`}
              aria-label="Pause listening"
            >
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div className={`flex items-center gap-3`}>
              <div className="flex gap-2">
                <div className={`w-2 h-2 bg-red-500 rounded-full animate-pulse`}></div>
                <div className={`w-2 h-2 bg-red-500 rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
                <div className={`w-2 h-2 bg-red-500 rounded-full animate-pulse`} style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className={`text-base font-semibold ${themeColors.text}`}>Listening... (click to pause)</span>
            </div>
          </>
        )}

        {error && (
          <div className="w-full max-w-md p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {isPaused && (
          <div className="w-full max-w-md p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
            <p className="text-sm text-yellow-700 font-medium">Session paused. Say "resume" or click the microphone to continue.</p>
          </div>
        )}
      </div>
    </div>
  );
};
