export interface JobDetails {
  jobTitle: string;
  jobDescription: string;
  notes: string;
}

export interface InterviewQuestion {
  questionNumber: number;
  questionText: string;
}

export interface VoiceAnalysis {
  tone: number; // 1-10, confidence and warmth
  pace: number; // 1-10, speaking speed (7-9 is ideal)
  confidence: number; // 1-10, certainty and assertiveness
  clarity: number; // 1-10, pronunciation and enunciation
  pauses: number; // count of excessive pauses/ums
}

export interface AnswerRating {
  score: number; // 1-10, rounded to 0.1
  feedback: string; // Brief feedback, max ~15 seconds of speech
  voiceAnalysis?: VoiceAnalysis; // Voice characteristics analysis
}

export interface InterviewSession {
  id: string;
  jobDetails: JobDetails;
  questions: InterviewQuestion[];
  answers: string[];
  ratings: AnswerRating[];
  currentQuestionIndex: number;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
  feedbackPreference?: 'show' | 'hide'; // User's preference for showing feedback
  conversationState: 'greeting' | 'waiting_confirmation' | 'asking_question' | 'listening' | 'providing_feedback' | 'asking_feedback_preference';
}

