import { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useVoiceAnalysis } from '../hooks/useVoiceAnalysis';
import { ColorScheme, getTheme } from '../utils/theme';

interface VoiceInterfaceProps {
  onTranscript: (transcript: string) => void;
  onFinalTranscript: (transcript: string, voiceAnalysis?: any) => void;
  disabled?: boolean;
  isVoiceMode?: boolean;
  theme: ColorScheme;
}

export const VoiceInterface = ({ 
  onTranscript, 
  onFinalTranscript, 
  disabled = false,
  isVoiceMode = true,
  theme
}: VoiceInterfaceProps) => {
  const themeColors = getTheme(theme);
  const [manualInput, setManualInput] = useState('');
  const { startAnalysis, analyzeTranscript, updateDuration } = useVoiceAnalysis();
  
  const { transcript, isListening, error, startListening, stopListening } = useSpeechRecognition({
    onResult: (finalTranscript, duration) => {
      if (duration) {
        updateDuration(duration);
      }
      const analysis = analyzeTranscript(finalTranscript);
      onFinalTranscript(finalTranscript, analysis);
    },
    continuous: false,
    interimResults: true,
  });

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else if (!disabled) {
      startAnalysis();
      startListening();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      const basicAnalysis = {
        tone: 6.0,
        pace: 6.0,
        confidence: 6.0,
        clarity: 7.0,
        pauses: 0,
      };
      onFinalTranscript(manualInput.trim(), basicAnalysis);
      setManualInput('');
    }
  };

  if (!isVoiceMode) {
    return (
      <div className={`${themeColors.glass} rounded-3xl shadow-lg p-6 border ${themeColors.glassBorder}`}>
        <h4 className={`text-sm font-semibold ${themeColors.text} mb-3`}>Type your answer:</h4>
        <form onSubmit={handleManualSubmit} className="flex gap-3">
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            disabled={disabled}
            rows={4}
            className={`flex-1 px-5 py-3 bg-white border ${themeColors.border} rounded-2xl ${themeColors.text} placeholder-gray-400 focus:ring-2 focus:ring-${themeColors.accent}/20 focus:border-${themeColors.accent} resize-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-all`}
            placeholder="Type your answer here..."
          />
          <button
            type="submit"
            disabled={disabled || !manualInput.trim()}
            className={`px-6 py-3 ${themeColors.primary} ${themeColors.primaryHover} text-white rounded-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-${themeColors.accent}/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
          >
            Submit
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary Voice Input - Large Microphone Button */}
      <div className={`${themeColors.glass} rounded-3xl shadow-lg p-10 border ${themeColors.glassBorder}`}>
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="text-center">
            <h3 className={`text-2xl font-semibold ${themeColors.text} mb-2`}>Voice Response</h3>
            <p className={`${themeColors.textSecondary} text-sm`}>Click the microphone to start recording your answer</p>
          </div>

          {/* Large Microphone Button */}
          <button
            type="button"
            onClick={handleToggleListening}
            disabled={disabled}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all transform shadow-lg ${
              isListening
                ? 'bg-red-500 text-white hover:bg-red-600 scale-110 animate-pulse'
                : disabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : `${themeColors.primary} text-white hover:${themeColors.primaryHover} hover:scale-105`
            }`}
            aria-label={isListening ? 'Stop recording' : 'Start recording'}
          >
            {isListening ? (
              <>
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </>
            ) : (
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {/* Status Display */}
          {isListening && (
            <div className={`flex items-center gap-3 text-${themeColors.accent}`}>
              <div className="flex gap-2">
                <div className={`w-2 h-2 bg-${themeColors.accent} rounded-full animate-pulse`}></div>
                <div className={`w-2 h-2 bg-${themeColors.accent} rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
                <div className={`w-2 h-2 bg-${themeColors.accent} rounded-full animate-pulse`} style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className={`text-base font-semibold ${themeColors.text}`}>Listening...</span>
            </div>
          )}

          {error && (
            <div className="w-full max-w-md p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <p className="text-xs text-red-500 mt-1">
                Voice recognition is not available. Use the text input below as an alternative.
              </p>
            </div>
          )}

          {/* Transcript Preview */}
          {transcript && (
            <div className={`w-full max-w-2xl p-6 bg-white border border-${themeColors.accent}/30 rounded-2xl shadow-sm`}>
              <p className={`${themeColors.text} whitespace-pre-wrap text-center leading-relaxed`}>{transcript}</p>
            </div>
          )}

          {!isListening && !transcript && !error && (
            <p className={`${themeColors.textSecondary} text-sm italic`}>Ready to record your answer</p>
          )}
        </div>
      </div>

      {/* Text Input Fallback - Collapsible */}
      <details className={`${themeColors.glass} rounded-3xl shadow-lg p-5 border ${themeColors.glassBorder}`}>
        <summary className={`cursor-pointer text-sm font-semibold ${themeColors.text} hover:text-${themeColors.accent} transition-colors`}>
          Or type your answer instead
        </summary>
        <form onSubmit={handleManualSubmit} className="mt-4 flex gap-3">
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            disabled={disabled || isListening}
            rows={4}
            className={`flex-1 px-5 py-3 bg-white border ${themeColors.border} rounded-2xl ${themeColors.text} placeholder-gray-400 focus:ring-2 focus:ring-${themeColors.accent}/20 focus:border-${themeColors.accent} resize-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-all`}
            placeholder="Type your answer here..."
          />
          <button
            type="submit"
            disabled={disabled || isListening || !manualInput.trim()}
            className={`px-6 py-3 ${themeColors.primary} ${themeColors.primaryHover} text-white rounded-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-${themeColors.accent}/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all self-start`}
          >
            Submit
          </button>
        </form>
      </details>
    </div>
  );
};
