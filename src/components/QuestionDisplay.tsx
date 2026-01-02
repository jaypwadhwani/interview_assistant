import { InterviewQuestion } from '../types';
import { ColorScheme, getTheme } from '../utils/theme';

interface QuestionDisplayProps {
  question: InterviewQuestion;
  theme: ColorScheme;
}

export const QuestionDisplay = ({ question, theme }: QuestionDisplayProps) => {
  const themeColors = getTheme(theme);

  // Audio is handled by OpenAI TTS in useConversationalInterview
  // No need for browser speech synthesis here

  return (
    <div className={`${themeColors.glass} rounded-3xl shadow-lg p-8 mb-6 border ${themeColors.glassBorder}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-5">
            <span className={`px-4 py-1.5 ${themeColors.primary} text-white text-sm font-semibold rounded-xl`}>
              Question {question.questionNumber}
            </span>
          </div>
          <h2 className={`text-2xl font-semibold ${themeColors.text} leading-relaxed`}>
            {question.questionText}
          </h2>
        </div>
      </div>
    </div>
  );
};
