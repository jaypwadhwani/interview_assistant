import { useState, useEffect, useCallback } from 'react';
import { InterviewSession, JobDetails, InterviewQuestion, AnswerRating, VoiceAnalysis } from '../types';
import { storage } from '../utils/storage';
import { mockAI } from '../utils/mockAI';

interface UseInterviewSessionOptions {
  jobDetails: JobDetails;
  onComplete?: () => void;
}

export const useInterviewSession = (options: UseInterviewSessionOptions) => {
  const { jobDetails, onComplete } = options;
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentRating, setCurrentRating] = useState<AnswerRating | null>(null);
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);

  // Initialize or load session
  useEffect(() => {
    const existingSession = storage.loadCurrentSession();
    
    if (existingSession && existingSession.jobDetails.jobTitle === jobDetails.jobTitle) {
      // Resume existing session
      setSession(existingSession);
      if (existingSession.questions.length > 0) {
        const nextQuestionIndex = existingSession.currentQuestionIndex;
        if (nextQuestionIndex < existingSession.questions.length) {
          setCurrentQuestion(existingSession.questions[nextQuestionIndex]);
        }
      }
    } else {
      // Create new session
      const newSession: InterviewSession = {
        id: `session_${Date.now()}`,
        jobDetails,
        questions: [],
        answers: [],
        ratings: [],
        currentQuestionIndex: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        conversationState: 'greeting',
      };
      setSession(newSession);
      storage.saveCurrentSession(newSession);
      
      // Generate first question
      const firstQuestion = mockAI.generateQuestion(jobDetails, 1);
      setCurrentQuestion(firstQuestion);
      setSession(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          questions: [firstQuestion],
          updatedAt: new Date().toISOString(),
        };
        storage.saveCurrentSession(updated);
        return updated;
      });
    }
  }, [jobDetails]);

  const submitAnswer = useCallback((answer: string, voiceAnalysis?: VoiceAnalysis) => {
    if (!session || !currentQuestion || !answer.trim()) {
      return;
    }

    // Rate the answer with voice analysis
    const rating = mockAI.rateAnswer(currentQuestion, answer, jobDetails, voiceAnalysis);
    setCurrentRating(rating);
    setCurrentAnswer(answer);

    // Update session
    const updatedSession: InterviewSession = {
      ...session,
      answers: [...session.answers, answer],
      ratings: [...session.ratings, rating],
      updatedAt: new Date().toISOString(),
    };
    setSession(updatedSession);
    storage.saveCurrentSession(updatedSession);

    setIsWaitingForNext(true);
  }, [session, currentQuestion, jobDetails]);

  const moveToNextQuestion = useCallback(() => {
    if (!session) return;

    const nextQuestionIndex = session.currentQuestionIndex + 1;
    const nextQuestion = mockAI.generateQuestion(jobDetails, nextQuestionIndex + 1);

    const updatedSession: InterviewSession = {
      ...session,
      currentQuestionIndex: nextQuestionIndex,
      questions: [...session.questions, nextQuestion],
      updatedAt: new Date().toISOString(),
    };

    setSession(updatedSession);
    setCurrentQuestion(nextQuestion);
    setCurrentAnswer('');
    setCurrentRating(null);
    setIsWaitingForNext(false);
    storage.saveCurrentSession(updatedSession);
  }, [session, jobDetails]);

  const completeSession = useCallback(() => {
    if (!session) return;

    const completedSession: InterviewSession = {
      ...session,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    };

    storage.addToSessionHistory(completedSession);
    storage.clearCurrentSession();
    
    if (onComplete) {
      onComplete();
    }
  }, [session, onComplete]);

  return {
    session,
    currentQuestion,
    currentAnswer,
    currentRating,
    isWaitingForNext,
    submitAnswer,
    moveToNextQuestion,
    completeSession,
  };
};

