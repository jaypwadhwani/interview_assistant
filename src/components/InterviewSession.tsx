import { JobDetails } from '../types';
import { ColorScheme, getTheme } from '../utils/theme';
import { useConversationalInterview } from '../hooks/useConversationalInterview';
import { QuestionDisplay } from './QuestionDisplay';
import { ConversationalVoiceInterface } from './ConversationalVoiceInterface';
import { AnswerRating } from './AnswerRating';

interface InterviewSessionProps {
  jobDetails: JobDetails;
  onComplete: () => void;
  theme: ColorScheme;
}

export const InterviewSession = ({ jobDetails, onComplete, theme }: InterviewSessionProps) => {
  const themeColors = getTheme(theme);
  const {
    session,
    currentQuestion,
    currentAnswer,
    currentRating,
    conversationState,
    isPaused,
    isListening,
    setIsListening,
    isPlayingAudio,
    readyPromptText,
    endSessionPromptText,
    error,
    startConversation,
    handleUserResponse,
    pauseSession,
    resumeSession,
    completeSession,
    showFeedback,
    shouldListen,
    submitAnswer,
  } = useConversationalInterview({ jobDetails, onComplete });

  if (!session) {
    return (
      <div className={`min-h-screen ${themeColors.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-14 h-14 ${themeColors.primary} rounded-2xl mb-6`}>
            <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className={`${themeColors.text} text-lg`}>Loading interview session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeColors.bg} py-8 px-4`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className={`${themeColors.glass} rounded-3xl shadow-lg p-6 mb-6 border ${themeColors.glassBorder}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <div className={`w-2.5 h-2.5 ${isPaused ? 'bg-yellow-500' : 'bg-green-500'} rounded-full`}></div>
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {isPaused ? 'Interview Paused' : 'Voice Interview Session'}
                </h1>
              </div>
              <p className={`${themeColors.textSecondary} font-medium`}>{jobDetails.jobTitle}</p>
            </div>
            <button
              onClick={() => completeSession()}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
            >
              End Session
            </button>
          </div>
        </div>

        {/* Question Display - Only show when there's a question */}
        {currentQuestion && conversationState !== 'greeting' && (
          <QuestionDisplay question={currentQuestion} theme={theme} />
        )}

        {/* Feedback Display - Only show if user wants it on screen */}
        {currentRating && currentAnswer && showFeedback && conversationState === 'providing_feedback' && (
          <AnswerRating rating={currentRating} answer={currentAnswer} theme={theme} />
        )}

        {/* Ready Prompt Display */}
        {readyPromptText && conversationState === 'asking_feedback_preference' && (
          <div className={`${themeColors.glass} rounded-3xl shadow-lg p-6 mb-6 border ${themeColors.glassBorder}`}>
            <p className={`${themeColors.text} text-lg font-medium text-center`}>{readyPromptText}</p>
          </div>
        )}

        {/* End Session Prompt Display */}
        {endSessionPromptText && (
          <div className={`${themeColors.glass} rounded-3xl shadow-lg p-6 mb-6 border border-yellow-300 bg-yellow-50`}>
            <p className={`text-yellow-800 text-lg font-medium text-center`}>{endSessionPromptText}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className={`${themeColors.glass} rounded-3xl shadow-lg p-6 mb-6 border border-red-300 bg-red-50`}>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className={`text-red-800 text-lg font-semibold mb-2`}>Error Starting Interview</p>
                <p className={`text-red-700 text-base`}>{error}</p>
                <button
                  onClick={() => startConversation()}
                  className={`mt-4 px-4 py-2 text-sm font-semibold text-white ${themeColors.primary} ${themeColors.primaryHover} rounded-xl focus:outline-none focus:ring-2 focus:ring-${themeColors.accent}/20 transition-all`}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conversational Voice Interface */}
        <ConversationalVoiceInterface
          conversationState={conversationState}
          isPaused={isPaused}
          isListening={isListening}
          isPlayingAudio={isPlayingAudio}
          setIsListening={setIsListening}
          onUserResponse={handleUserResponse}
          onStartConversation={startConversation}
          onPause={pauseSession}
          onResume={resumeSession}
          theme={theme}
          shouldListen={shouldListen}
        />

        {/* Manual Submit Button - Always show when in listening state */}
        {conversationState === 'listening' && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => {
                // Manually trigger submission with current accumulated text
                submitAnswer();
              }}
              className={`flex items-center gap-2 px-8 py-4 bg-white border-2 ${themeColors.border} hover:border-${themeColors.accent} text-gray-800 rounded-2xl font-semibold text-lg shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5`}
            >
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              I'm Done / Submit Answer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
