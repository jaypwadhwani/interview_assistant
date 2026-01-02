import { AnswerRating as AnswerRatingType } from '../types';
import { ColorScheme, getTheme } from '../utils/theme';

interface AnswerRatingProps {
  rating: AnswerRatingType;
  answer: string;
  theme: ColorScheme;
}

const getMetricColor = (value: number): string => {
  if (value >= 8) return 'text-green-600 bg-green-50 border-green-200';
  if (value >= 6.5) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (value >= 5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-orange-600 bg-orange-50 border-orange-200';
};

export const AnswerRating = ({ rating, answer, theme }: AnswerRatingProps) => {
  const themeColors = getTheme(theme);

  // Audio is handled by OpenAI TTS in useConversationalInterview
  // No need for browser speech synthesis here

  const getScoreColor = (score: number): string => {
    if (score >= 8.5) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 7.0) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 5.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 4.0) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 9.0) return 'Excellent';
    if (score >= 8.0) return 'Very Good';
    if (score >= 7.0) return 'Good';
    if (score >= 6.0) return 'Fair';
    if (score >= 5.0) return 'Needs Improvement';
    return 'Poor';
  };

  const getProgressBarColor = (score: number): string => {
    if (score >= 8.5) return 'bg-green-500';
    if (score >= 7.0) return 'bg-blue-500';
    if (score >= 5.5) return 'bg-yellow-500';
    if (score >= 4.0) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`${themeColors.glass} rounded-3xl shadow-lg p-8 mb-6 border ${themeColors.glassBorder} space-y-6`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-semibold ${themeColors.text}`}>Your Answer</h3>
        <div className={`px-6 py-3 rounded-2xl font-bold text-2xl border ${getScoreColor(rating.score)}`}>
          {rating.score.toFixed(1)} / 10.0
        </div>
      </div>

      <div className={`bg-gray-50 rounded-2xl p-6 border ${themeColors.border}`}>
        <h4 className={`text-sm font-semibold ${themeColors.textSecondary} mb-3 uppercase tracking-wide`}>Full Transcript:</h4>
        <p className={`${themeColors.text} whitespace-pre-wrap leading-relaxed`}>{answer || 'No transcript available'}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-sm font-semibold px-4 py-2 rounded-xl border ${getScoreColor(rating.score)}`}>
          {getScoreLabel(rating.score)}
        </span>
      </div>

      <div className={`bg-${themeColors.accent}/10 border-l-4 border-${themeColors.accent} rounded-2xl p-6`}>
        <h4 className={`font-semibold ${themeColors.text} mb-3 text-lg`}>Feedback:</h4>
        <p className={`${themeColors.textSecondary} leading-relaxed`}>{rating.feedback}</p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(rating.score)}`}
          style={{ width: `${(rating.score / 10) * 100}%` }}
        ></div>
      </div>

      {/* Voice Analysis Metrics */}
      {rating.voiceAnalysis && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h4 className={`text-xl font-semibold ${themeColors.text} mb-6`}>Voice Delivery Analysis</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`bg-gray-50 rounded-2xl p-5 border ${themeColors.border}`}>
              <div className={`text-xs font-semibold ${themeColors.textSecondary} mb-2 uppercase tracking-wide`}>Tone</div>
              <div className={`text-3xl font-bold px-3 py-2 rounded-xl border ${getMetricColor(rating.voiceAnalysis.tone)}`}>
                {rating.voiceAnalysis.tone.toFixed(1)}
              </div>
              <div className={`text-xs ${themeColors.textSecondary} mt-2`}>Warmth & Positivity</div>
            </div>
            <div className={`bg-gray-50 rounded-2xl p-5 border ${themeColors.border}`}>
              <div className={`text-xs font-semibold ${themeColors.textSecondary} mb-2 uppercase tracking-wide`}>Pace</div>
              <div className={`text-3xl font-bold px-3 py-2 rounded-xl border ${getMetricColor(rating.voiceAnalysis.pace)}`}>
                {rating.voiceAnalysis.pace.toFixed(1)}
              </div>
              <div className={`text-xs ${themeColors.textSecondary} mt-2`}>Speaking Speed</div>
            </div>
            <div className={`bg-gray-50 rounded-2xl p-5 border ${themeColors.border}`}>
              <div className={`text-xs font-semibold ${themeColors.textSecondary} mb-2 uppercase tracking-wide`}>Confidence</div>
              <div className={`text-3xl font-bold px-3 py-2 rounded-xl border ${getMetricColor(rating.voiceAnalysis.confidence)}`}>
                {rating.voiceAnalysis.confidence.toFixed(1)}
              </div>
              <div className={`text-xs ${themeColors.textSecondary} mt-2`}>Assertiveness</div>
            </div>
            <div className={`bg-gray-50 rounded-2xl p-5 border ${themeColors.border}`}>
              <div className={`text-xs font-semibold ${themeColors.textSecondary} mb-2 uppercase tracking-wide`}>Clarity</div>
              <div className={`text-3xl font-bold px-3 py-2 rounded-xl border ${getMetricColor(rating.voiceAnalysis.clarity)}`}>
                {rating.voiceAnalysis.clarity.toFixed(1)}
              </div>
              <div className={`text-xs ${themeColors.textSecondary} mt-2`}>Pronunciation</div>
            </div>
          </div>
          {rating.voiceAnalysis.pauses > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
              <div className="text-sm text-yellow-700">
                <span className="font-semibold">Filler words detected:</span> {rating.voiceAnalysis.pauses} instances
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
