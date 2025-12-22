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
    startConversation,
    handleUserResponse,
    resumeSession,
    completeSession,
    showFeedback,
    shouldListen,
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

        {/* Conversational Voice Interface */}
        <ConversationalVoiceInterface
          conversationState={conversationState}
          isPaused={isPaused}
          isListening={isListening}
          setIsListening={setIsListening}
          onUserResponse={handleUserResponse}
          onStartConversation={startConversation}
          onResume={resumeSession}
          theme={theme}
          shouldListen={shouldListen}
        />
      </div>
    </div>
  );
};
