import { useState, useEffect, useRef, useCallback } from 'react';
import { InterviewSession, InterviewQuestion, AnswerRating, JobDetails } from '../types';
import { api } from '../utils/api';
import { storage } from '../utils/storage';
import { detectVoiceCommand } from '../utils/voiceCommands';

type ConversationState = 'greeting' | 'waiting_confirmation' | 'asking_question' | 'listening' | 'providing_feedback' | 'asking_feedback_preference';

export interface UseConversationalInterviewOptions {
  jobDetails: JobDetails;
  onComplete?: () => void;
}

// Simple global audio manager - only ONE audio element for the entire app
class GlobalAudioManager {
  private static instance: GlobalAudioManager | null = null;
  private audio: HTMLAudioElement;
  private currentDataUrl: string | null = null;
  private isPlaying: boolean = false;
  private instanceId: string;

  private constructor() {
    this.instanceId = `AudioManager_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.audio = new Audio();
    console.log(`[AudioManager] Created instance: ${this.instanceId}`);

    // Store on window to ensure true singleton across all module loads
    if ((window as any).__globalAudioManager) {
      console.error('[AudioManager] WARNING: Another manager already exists!');
      return (window as any).__globalAudioManager;
    }
    (window as any).__globalAudioManager = this;
  }

  static getInstance(): GlobalAudioManager {
    // Always check window first to ensure true singleton
    if ((window as any).__globalAudioManager) {
      return (window as any).__globalAudioManager;
    }

    if (!GlobalAudioManager.instance) {
      GlobalAudioManager.instance = new GlobalAudioManager();
    }
    return GlobalAudioManager.instance;
  }

  async play(dataUrl: string): Promise<void> {
    console.log(`[AudioManager ${this.instanceId}] play() called`, {
      currentlyPlaying: this.isPlaying,
      sameUrl: this.currentDataUrl === dataUrl,
      paused: this.audio.paused
    });

    // If already playing this exact audio, skip
    if (this.isPlaying && this.currentDataUrl === dataUrl && !this.audio.paused) {
      console.log(`[AudioManager ${this.instanceId}] Already playing this audio, skipping`);
      return;
    }

    // Stop any current playback
    this.stop();

    return new Promise<void>((resolve) => {
      this.currentDataUrl = dataUrl;
      this.isPlaying = true;
      this.audio.src = dataUrl;

      this.audio.onended = () => {
        console.log(`[AudioManager ${this.instanceId}] Playback ended`);
        this.isPlaying = false;
        this.currentDataUrl = null;
        resolve();
      };

      this.audio.onerror = (e) => {
        console.error(`[AudioManager ${this.instanceId}] Playback error:`, e);
        this.isPlaying = false;
        this.currentDataUrl = null;
        resolve();
      };

      this.audio.play()
        .then(() => console.log(`[AudioManager ${this.instanceId}] Playing`))
        .catch((e) => {
          console.error(`[AudioManager ${this.instanceId}] Play failed:`, e);
          this.isPlaying = false;
          this.currentDataUrl = null;
          resolve();
        });
    });
  }

  stop(): void {
    if (!this.audio.paused) {
      console.log(`[AudioManager ${this.instanceId}] Stopping audio`);
      this.audio.pause();
    }
    this.audio.currentTime = 0;
    this.isPlaying = false;
    this.currentDataUrl = null;
  }

  pause(): void {
    if (!this.audio.paused) {
      console.log(`[AudioManager ${this.instanceId}] Pausing audio`);
      this.audio.pause();
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying && !this.audio.paused;
  }
}

export const useConversationalInterview = (options: UseConversationalInterviewOptions) => {
  const { jobDetails, onComplete } = options;
  const audioManager = useRef(GlobalAudioManager.getInstance());

  // States
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentRating, setCurrentRating] = useState<AnswerRating | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>('greeting');
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [shouldListen, setShouldListen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [readyPromptText, setReadyPromptText] = useState<string | null>(null);
  const [endSessionPromptText, setEndSessionPromptText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Refs
  const sessionRef = useRef<InterviewSession | null>(null);
  const conversationStateRef = useRef<ConversationState>('greeting');
  const shouldListenRef = useRef<boolean>(false);
  const isPlayingAudioRef = useRef<boolean>(false);
  const accumulatedTranscriptRef = useRef<string>('');
  const pendingNextQuestionRef = useRef<{ question: InterviewQuestion; audioDataUrl: string; session: InterviewSession } | null>(null);
  const readyPromptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endSessionPromptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Sync state to refs
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);

  useEffect(() => {
    shouldListenRef.current = shouldListen;
  }, [shouldListen]);

  useEffect(() => {
    isPlayingAudioRef.current = isPlayingAudio;
  }, [isPlayingAudio]);

  // Update shouldListen helper
  const updateShouldListen = useCallback((value: boolean) => {
    shouldListenRef.current = value;
    setShouldListen(value);
  }, []);

  // Play audio wrapper
  const playAudio = useCallback(async (dataUrl?: string) => {
    if (!dataUrl) return;

    setIsPlayingAudio(true);
    await audioManager.current.play(dataUrl);
    setIsPlayingAudio(false);
  }, []);

  // Initialize session
  useEffect(() => {
    const existingSession = storage.loadCurrentSession();

    if (existingSession && existingSession.jobDetails.jobTitle === jobDetails.jobTitle && existingSession.status === 'paused') {
      setSession(existingSession);
      setConversationState(existingSession.conversationState || 'asking_question');
      setIsPaused(false);
      if (existingSession.questions.length > 0) {
        const nextQuestionIndex = existingSession.currentQuestionIndex;
        if (nextQuestionIndex < existingSession.questions.length) {
          setCurrentQuestion(existingSession.questions[nextQuestionIndex]);
        }
      }
    } else {
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
      sessionRef.current = newSession;
      storage.saveCurrentSession(newSession);
    }
    setError(null);
  }, [jobDetails]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (readyPromptTimeoutRef.current) clearTimeout(readyPromptTimeoutRef.current);
      if (endSessionPromptTimeoutRef.current) clearTimeout(endSessionPromptTimeoutRef.current);
    };
  }, []);

  // Complete session
  const completeSession = useCallback(() => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;

    // Stop any playing audio immediately
    audioManager.current.stop();

    if (readyPromptTimeoutRef.current) clearTimeout(readyPromptTimeoutRef.current);
    if (endSessionPromptTimeoutRef.current) clearTimeout(endSessionPromptTimeoutRef.current);

    const updatedSession: InterviewSession = {
      ...currentSession,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    };
    setSession(updatedSession);
    sessionRef.current = updatedSession;
    storage.saveCurrentSession(updatedSession);

    updateShouldListen(false);
    setIsListening(false);
    setConversationState('greeting');
    setIsPlayingAudio(false);

    if (onComplete) {
      onComplete();
    }
  }, [onComplete, updateShouldListen]);

  // Generate ready prompt variations
  const generateReadyPrompt = useCallback((): string => {
    const prompts = [
      "Are you ready for the next question?",
      "Ready to move on?",
      "Should we continue?"
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  }, []);

  // Ask if ready for next question
  const askIfReadyForNextQuestion = useCallback(async () => {
    if (readyPromptTimeoutRef.current) clearTimeout(readyPromptTimeoutRef.current);

    const prompt = generateReadyPrompt();
    setReadyPromptText(prompt);

    let promptAudioDataUrl: string | undefined;
    try {
      promptAudioDataUrl = await api.generateTTS(prompt);
    } catch (err) {
      console.error('[Interview] TTS error:', err);
    }

    setConversationState('asking_question');
    updateShouldListen(true);

    if (promptAudioDataUrl) {
      await playAudio(promptAudioDataUrl);
    }

    readyPromptTimeoutRef.current = setTimeout(() => {
      completeSession();
    }, 15000);
  }, [generateReadyPrompt, playAudio, updateShouldListen, completeSession]);

  // Handle ready response
  const handleReadyResponse = useCallback(async (response: 'yes' | 'no') => {
    if (readyPromptTimeoutRef.current) clearTimeout(readyPromptTimeoutRef.current);
    setReadyPromptText(null);

    if (response === 'yes') {
      const pending = pendingNextQuestionRef.current;
      if (!pending) return;

      pendingNextQuestionRef.current = null;
      const { question, audioDataUrl, session } = pending;

      setCurrentQuestion(question);
      setCurrentAnswer('');
      setCurrentRating(null);
      setSession(session);
      sessionRef.current = session;
      storage.saveCurrentSession(session);

      accumulatedTranscriptRef.current = '';
      setConversationState('asking_question');
      updateShouldListen(false);

      if (audioDataUrl) {
        await playAudio(audioDataUrl);
      }

      setConversationState('listening');
      updateShouldListen(true);
    } else {
      const endPrompt = "Would you like to end the session?";
      setEndSessionPromptText(endPrompt);

      let endPromptAudio: string | undefined;
      try {
        endPromptAudio = await api.generateTTS(endPrompt);
      } catch (err) {
        console.error('[Interview] TTS error:', err);
      }

      setConversationState('asking_question');
      updateShouldListen(true);

      if (endPromptAudio) {
        await playAudio(endPromptAudio);
      }

      endSessionPromptTimeoutRef.current = setTimeout(() => {
        completeSession();
      }, 15000);
    }
  }, [playAudio, updateShouldListen, completeSession]);

  // Start conversation
  const startConversation = useCallback(async () => {
    if (isProcessingRef.current) {
      console.log('[Interview] Already processing, ignoring');
      return;
    }

    isProcessingRef.current = true;
    setIsStarting(true);
    setError(null);
    setConversationState('waiting_confirmation');
    updateShouldListen(false);
    setIsListening(false);

    try {
      const res = await api.startInterview(jobDetails);

      if (!sessionRef.current) {
        console.error('[Interview] Session is null after API call');
        return;
      }

      const question: InterviewQuestion = {
        questionNumber: 1,
        questionText: res.questionText || 'Tell me about yourself.',
      };

      const updatedSession: InterviewSession = {
        ...sessionRef.current,
        questions: [question],
        currentQuestionIndex: 0,
        updatedAt: new Date().toISOString(),
      };

      setSession(updatedSession);
      sessionRef.current = updatedSession;
      storage.saveCurrentSession(updatedSession);
      setCurrentQuestion(question);

      accumulatedTranscriptRef.current = '';
      setConversationState('asking_question');
      updateShouldListen(false);

      if (res.questionAudioDataUrl) {
        await playAudio(res.questionAudioDataUrl);
      }

      setConversationState('listening');
      updateShouldListen(true);
      setIsStarting(false);
      isProcessingRef.current = false;
    } catch (err) {
      console.error('[Interview] API error:', err);
      const errorMessage = (err as any)?.message || 'Failed to start interview. Please check your connection and try again.';
      setError(errorMessage);
      setIsStarting(false);
      isProcessingRef.current = false;

      if (!sessionRef.current) {
        const fallbackSession: InterviewSession = {
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
        setSession(fallbackSession);
        sessionRef.current = fallbackSession;
        storage.saveCurrentSession(fallbackSession);
      }

      setConversationState('greeting');
      updateShouldListen(false);
      setIsListening(false);
    }
  }, [jobDetails, playAudio, updateShouldListen]);

  // Move to next question
  const moveToNextQuestion = useCallback(async () => {
    if (isProcessingRef.current) return;

    const currentSession = sessionRef.current;
    const currentQ = currentQuestion;

    if (!currentSession || !currentQ) {
      if (conversationStateRef.current === 'greeting') {
        startConversation();
      }
      return;
    }

    isProcessingRef.current = true;

    try {
      setConversationState('asking_question');
      updateShouldListen(false);

      const resp = await api.sendInterviewTurn({
        transcript: '',
        jobDetails: currentSession.jobDetails,
        history: [],
      });

      const nextQuestion: InterviewQuestion = {
        questionNumber: currentSession.currentQuestionIndex + 2,
        questionText: resp.nextQuestion || 'Tell me more.',
      };

      const updatedSession: InterviewSession = {
        ...currentSession,
        questions: [...currentSession.questions, nextQuestion],
        currentQuestionIndex: currentSession.currentQuestionIndex + 1,
        updatedAt: new Date().toISOString(),
      };

      setSession(updatedSession);
      sessionRef.current = updatedSession;
      storage.saveCurrentSession(updatedSession);
      setCurrentQuestion(nextQuestion);

      accumulatedTranscriptRef.current = '';

      if (resp.questionAudioDataUrl) {
        await playAudio(resp.questionAudioDataUrl);
      }

      setConversationState('listening');
      updateShouldListen(true);
      isProcessingRef.current = false;
    } catch (err) {
      console.error('[Interview] Error moving to next question:', err);
      isProcessingRef.current = false;
    }
  }, [currentQuestion, jobDetails, playAudio, updateShouldListen, startConversation]);

  // Process answer
  const processAnswer = useCallback(async (answer: string) => {
    const currentSession = sessionRef.current;
    const currentQ = currentQuestion;

    if (!currentSession || !currentQ || !answer.trim()) return;

    setConversationState('providing_feedback');
    updateShouldListen(false);
    setIsListening(false);

    try {
      const resp = await api.sendInterviewTurn({
        transcript: answer,
        jobDetails: currentSession.jobDetails,
        history: [],
      });

      const rating: AnswerRating = {
        score: resp.score,
        feedback: resp.feedback,
      };

      setCurrentRating(rating);
      setCurrentAnswer(answer);

      const updatedSession: InterviewSession = {
        ...currentSession,
        answers: [...currentSession.answers, answer],
        ratings: [...currentSession.ratings, rating],
        updatedAt: new Date().toISOString(),
      };
      setSession(updatedSession);
      sessionRef.current = updatedSession;
      storage.saveCurrentSession(updatedSession);

      await playAudio(resp.feedbackAudioDataUrl);

      const nextQuestion: InterviewQuestion = {
        questionNumber: updatedSession.currentQuestionIndex + 2,
        questionText: resp.nextQuestion || 'Tell me more.',
      };

      pendingNextQuestionRef.current = {
        question: nextQuestion,
        audioDataUrl: resp.questionAudioDataUrl || '',
        session: {
          ...updatedSession,
          questions: [...updatedSession.questions, nextQuestion],
          currentQuestionIndex: updatedSession.currentQuestionIndex + 1,
          updatedAt: new Date().toISOString(),
        },
      };

      await askIfReadyForNextQuestion();
    } catch (err) {
      console.error('[Interview] Error processing answer:', err);
      updateShouldListen(true);
    }
  }, [currentQuestion, playAudio, updateShouldListen, askIfReadyForNextQuestion]);

  // Handle voice commands
  const handleVoiceCommand = useCallback((transcript: string) => {
    const command = detectVoiceCommand(transcript);
    const currentState = conversationStateRef.current;

    if (command === 'submit') {
      if (currentState === 'listening' || currentState === 'asking_question') {
        let fullTranscript = accumulatedTranscriptRef.current || transcript;
        let cleanedTranscript = fullTranscript
          .replace(/thank you\.?$/i, '')
          .replace(/thanks\.?$/i, '')
          .trim();

        if (cleanedTranscript) {
          processAnswer(cleanedTranscript);
        }
        return;
      }
    }

    if (command === 'yes') {
      if (readyPromptText) {
        handleReadyResponse('yes');
        return;
      }
      if (endSessionPromptText) {
        completeSession();
        return;
      }
    }

    if (command === 'no') {
      if (readyPromptText) {
        handleReadyResponse('no');
        return;
      }
      if (endSessionPromptText) {
        setEndSessionPromptText(null);
        askIfReadyForNextQuestion();
        return;
      }
    }
  }, [processAnswer, handleReadyResponse, completeSession, askIfReadyForNextQuestion, readyPromptText, endSessionPromptText]);

  // Handle user response
  const handleUserResponse = useCallback((transcript: string) => {
    if (!transcript.trim()) return;

    accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + ' ' + transcript).trim();
    handleVoiceCommand(transcript);
  }, [handleVoiceCommand]);

  // Pause session
  const pauseSession = useCallback(() => {
    audioManager.current.pause();
    setIsPaused(true);
    setIsPlayingAudio(false);
    updateShouldListen(false);
    setIsListening(false);
  }, [updateShouldListen]);

  // Resume session
  const resumeSession = useCallback(() => {
    setIsPaused(false);
    if (conversationStateRef.current === 'listening' || conversationStateRef.current === 'asking_question') {
      updateShouldListen(true);
    }
  }, [updateShouldListen]);

  return {
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
    isStarting,
    startConversation,
    handleUserResponse,
    pauseSession,
    resumeSession,
    completeSession,
    showFeedback: session?.feedbackPreference !== 'hide',
    shouldListen,
    moveToNextQuestion,
    submitAnswer: () => processAnswer(accumulatedTranscriptRef.current || currentAnswer),
  };
};
