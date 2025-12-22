import { useEffect } from 'react';
import { InterviewQuestion } from '../types';
import { ColorScheme, getTheme } from '../utils/theme';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface QuestionDisplayProps {
  question: InterviewQuestion;
  theme: ColorScheme;
}

export const QuestionDisplay = ({ question, theme }: QuestionDisplayProps) => {
  const themeColors = getTheme(theme);
  const { speak, isSpeaking } = useSpeechSynthesis();

  useEffect(() => {
    // Auto-speak the question when it changes
    if (question.questionText) {
      speak(question.questionText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.questionText]);

  return (
    <div className={`${themeColors.glass} rounded-3xl shadow-lg p-8 mb-6 border ${themeColors.glassBorder}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-5">
            <span className={`px-4 py-1.5 ${themeColors.primary} text-white text-sm font-semibold rounded-xl`}>
              Question {question.questionNumber}
            </span>
            {isSpeaking && (
              <span className={`${themeColors.textSecondary} text-sm flex items-center gap-2`}>
                <div className="flex gap-1">
                  <div className={`w-1.5 h-1.5 bg-${themeColors.accent} rounded-full animate-pulse`}></div>
                  <div className={`w-1.5 h-1.5 bg-${themeColors.accent} rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
                  <div className={`w-1.5 h-1.5 bg-${themeColors.accent} rounded-full animate-pulse`} style={{ animationDelay: '0.4s' }}></div>
                </div>
                Speaking...
              </span>
            )}
          </div>
          <h2 className={`text-2xl font-semibold ${themeColors.text} leading-relaxed`}>
            {question.questionText}
          </h2>
        </div>
      </div>
    </div>
  );
};
