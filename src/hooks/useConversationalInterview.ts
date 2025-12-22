import { useState, useEffect, useCallback, useRef } from 'react';
import { InterviewSession, JobDetails, InterviewQuestion, AnswerRating } from '../types';
import { storage } from '../utils/storage';
import { detectVoiceCommand, VoiceCommand } from '../utils/voiceCommands';
import { api } from '../utils/api';

interface UseConversationalInterviewOptions {
  jobDetails: JobDetails;
  onComplete?: () => void;
}

type ConversationState = 'greeting' | 'waiting_confirmation' | 'asking_question' | 'listening' | 'providing_feedback' | 'asking_feedback_preference';

export const useConversationalInterview = (options: UseConversationalInterviewOptions) => {
  const { jobDetails, onComplete } = options;
  
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentRating, setCurrentRating] = useState<AnswerRating | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>('greeting');
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [shouldListen, setShouldListen] = useState(false);
  
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const sessionRef = useRef<InterviewSession | null>(null);
  const conversationStateRef = useRef<ConversationState>('greeting');
  const shouldListenRef = useRef<boolean>(false); // Keep ref for sync access in callbacks
  const isPlayingAudioRef = useRef<boolean>(false);

  // Helper to update shouldListen (both state and ref)
  const updateShouldListen = useCallback((value: boolean) => {
    shouldListenRef.current = value;
    setShouldListen(value);
  }, []);

  const playAudio = useCallback(async (dataUrl?: string) => {
    console.log('[Interview] playAudio called, hasDataUrl:', !!dataUrl);
    if (!dataUrl) return;
    return new Promise<void>((resolve) => {
      const audio = new Audio(dataUrl);
      isPlayingAudioRef.current = true;
      audio.onended = () => {
        console.log('[Interview] Audio playback ended');
        isPlayingAudioRef.current = false;
        resolve();
      };
      audio.onerror = (e) => {
        console.error('[Interview] Audio playback error:', e);
        isPlayingAudioRef.current = false;
        resolve();
      };
      audio.play()
        .then(() => console.log('[Interview] Audio playing...'))
        .catch((e) => {
          console.error('[Interview] Audio play() failed:', e);
          resolve();
        });
    });
  }, []);

  // Sync refs with state
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);

  // Initialize session
  useEffect(() => {
    const existingSession = storage.loadCurrentSession();
    
    if (existingSession && existingSession.jobDetails.jobTitle === jobDetails.jobTitle && existingSession.status === 'paused') {
      // Resume paused session
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
      sessionRef.current = newSession;
      storage.saveCurrentSession(newSession);
    }
  }, [jobDetails]);


  // Handle greeting when conversation starts
  const startConversation = useCallback(() => {
    console.log('[Interview] startConversation called');
    setConversationState('waiting_confirmation');
    lastActivityRef.current = Date.now();
    // Don't listen while AI is speaking - will resume after speech ends
    updateShouldListen(false);
    setIsListening(false);
    // Start interview from backend
    console.log('[Interview] Calling API...');
    api.startInterview(jobDetails)
      .then(async (res) => {
        console.log('[Interview] API response received:', { hasQuestion: !!res.questionText, hasAudio: !!res.questionAudioDataUrl });
        const baseSession = sessionRef.current || {
          id: `session_${Date.now()}`,
          jobDetails,
          questions: [],
          answers: [],
          ratings: [],
          currentQuestionIndex: 0,
          status: 'active',
          conversationState: 'greeting',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as InterviewSession;

        const firstQuestion: InterviewQuestion = {
          questionNumber: 1,
          questionText: res.questionText,
        };
        setCurrentQuestion(firstQuestion);
        setConversationState('asking_question');
        const updatedSession: InterviewSession = {
          ...baseSession,
          questions: [firstQuestion],
          currentQuestionIndex: 0,
          conversationState: 'asking_question',
          status: 'active',
          updatedAt: new Date().toISOString(),
        };
        setSession(updatedSession);
        sessionRef.current = updatedSession;
        storage.saveCurrentSession(updatedSession);
        console.log('[Interview] Playing question audio...');
        await playAudio(res.questionAudioDataUrl);
        console.log('[Interview] Audio done, enabling listening');
        setConversationState('listening');
        updateShouldListen(true);
      })
      .catch((err) => {
        console.error('[Interview] API error:', err);
        // If backend fails, still allow user to answer
        setConversationState('listening');
        updateShouldListen(true);
      });
  }, [jobDetails, playAudio, updateShouldListen]);

  const moveToNextQuestion = useCallback(async () => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;

    const prompt = 'Please give me the next interview question.';
    try {
      const resp = await api.sendInterviewTurn({
        transcript: prompt,
        jobDetails,
    history: currentSession.answers.map((a) => ({
          role: 'user',
          content: a,
        })),
      });

      const nextQuestionIndex = currentSession.currentQuestionIndex + 1;
      const nextQuestion: InterviewQuestion = {
        questionNumber: nextQuestionIndex + 1,
        questionText: resp.nextQuestion,
      };

      const updatedSession: InterviewSession = {
        ...currentSession,
        currentQuestionIndex: nextQuestionIndex,
        questions: [...currentSession.questions, nextQuestion],
        conversationState: 'asking_question',
        updatedAt: new Date().toISOString(),
      };

      setSession(updatedSession);
      sessionRef.current = updatedSession;
      setCurrentQuestion(nextQuestion);
      setCurrentAnswer('');
      setCurrentRating(null);
      setConversationState('asking_question');
      storage.saveCurrentSession(updatedSession);

      updateShouldListen(false);
      setIsListening(false);
      await playAudio(resp.questionAudioDataUrl);
      updateShouldListen(true);
      setIsListening(true);
    } catch (err) {
      console.error('moveToNextQuestion error', err);
      updateShouldListen(true);
      setIsListening(true);
    }
  }, [jobDetails, playAudio, updateShouldListen]);

  const processAnswer = useCallback(async (answer: string) => {
    const currentSession = sessionRef.current;
    if (!currentSession || !currentQuestion || !answer.trim()) {
      return;
    }

    // Call backend for rating/feedback/next question
    try {
      const resp = await api.sendInterviewTurn({
        transcript: answer,
        jobDetails,
        history: currentSession.answers.map((a) => ({ role: 'user', content: a })),
      });

      const rating: AnswerRating = {
        score: resp.score,
        feedback: resp.feedback,
      };

      setCurrentRating(rating);
      setCurrentAnswer(answer);

      // Update session
      const updatedSession: InterviewSession = {
        ...currentSession,
        answers: [...currentSession.answers, answer],
        ratings: [...currentSession.ratings, rating],
        updatedAt: new Date().toISOString(),
      };
      setSession(updatedSession);
      sessionRef.current = updatedSession;
      storage.saveCurrentSession(updatedSession);

      // Play feedback audio then next question audio
      setConversationState('providing_feedback');
      updateShouldListen(false);
      setIsListening(false);
      await playAudio(resp.feedbackAudioDataUrl);

      // Move to next question from backend response
      const nextQuestion: InterviewQuestion = {
        questionNumber: updatedSession.currentQuestionIndex + 2,
        questionText: resp.nextQuestion,
      };

      const nextSession: InterviewSession = {
        ...updatedSession,
        currentQuestionIndex: updatedSession.currentQuestionIndex + 1,
        questions: [...updatedSession.questions, nextQuestion],
        conversationState: 'asking_question',
        updatedAt: new Date().toISOString(),
      };
      setSession(nextSession);
      sessionRef.current = nextSession;
      setCurrentQuestion(nextQuestion);
      setCurrentRating(null);
      storage.saveCurrentSession(nextSession);

      await playAudio(resp.questionAudioDataUrl);
      setConversationState('asking_question');
      updateShouldListen(true);
      setIsListening(true);
    } catch (err) {
      console.error('processAnswer error', err);
      updateShouldListen(true);
      setIsListening(true);
    }
  }, [currentQuestion, jobDetails, playAudio, updateShouldListen]);

  const pauseSession = useCallback(() => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;
    
    setIsPaused(true);
    updateShouldListen(false);
    setIsListening(false);
    
    const pausedSession: InterviewSession = {
      ...currentSession,
      status: 'paused',
      conversationState: conversationStateRef.current,
      updatedAt: new Date().toISOString(),
    };
    setSession(pausedSession);
    sessionRef.current = pausedSession;
    storage.saveCurrentSession(pausedSession);
  }, [updateShouldListen]);

  const resumeSession = useCallback(() => {
    const currentSession = sessionRef.current;
    if (!currentSession || !isPaused) return;
    
    setIsPaused(false);
    updateShouldListen(true);
    
    const resumedSession: InterviewSession = {
      ...currentSession,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
    setSession(resumedSession);
    sessionRef.current = resumedSession;
    storage.saveCurrentSession(resumedSession);
    
    setIsListening(true);
  }, [isPaused, updateShouldListen]);

  const completeSession = useCallback(() => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;
    
    updateShouldListen(false);
    setIsListening(false);

    const completedSession: InterviewSession = {
      ...currentSession,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    };

    storage.addToSessionHistory(completedSession);
    storage.clearCurrentSession();
    
    if (onComplete) {
      onComplete();
    }
  }, [onComplete, updateShouldListen]);

  const handleVoiceCommand = useCallback((command: VoiceCommand) => {
    switch (command) {
      case 'skip':
        moveToNextQuestion();
        break;
      case 'repeat':
        updateShouldListen(true);
        setIsListening(true);
        break;
      case 'end':
        completeSession();
        break;
      case 'pause':
        pauseSession();
        break;
      case 'resume':
        resumeSession();
        break;
      case 'go_back':
        // TODO: Implement go back
        break;
    }
  }, [moveToNextQuestion, updateShouldListen, completeSession, pauseSession, resumeSession]);

  const handleUserResponse = useCallback(async (transcript: string, _voiceAnalysis?: any, audioBlob?: Blob | null) => {
    console.log('[Interview] handleUserResponse called with transcript:', transcript);
    lastActivityRef.current = Date.now();

    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }

    const currentState = conversationStateRef.current;

    // Check for voice commands first
    const command = detectVoiceCommand(transcript);
    console.log('[Interview] Detected command:', command, 'state:', currentState);

    // Handle submit command - strip trigger phrase and process answer
    if (command === 'submit') {
      if (currentState === 'listening' || currentState === 'asking_question') {
        // Remove the trigger phrase from the answer
        let cleanedTranscript = transcript.toLowerCase()
          .replace(/thank you\.?$/i, '')
          .replace(/thanks\.?$/i, '')
          .replace(/that's my answer\.?$/i, '')
          .replace(/done answering\.?$/i, '')
          .replace(/that's it\.?$/i, '')
          .trim();

        // Use original case if we have content
        if (cleanedTranscript.length > 0) {
          const originalLength = transcript.length;
          const triggerLength = originalLength - cleanedTranscript.length;
          cleanedTranscript = transcript.substring(0, transcript.length - triggerLength).trim();
        }

        console.log('[Interview] Submit detected, cleaned transcript:', cleanedTranscript);
        updateShouldListen(false);
        setIsListening(false);

        // Use Whisper if available
        let finalTranscript = cleanedTranscript || transcript;
        if (audioBlob) {
          try {
            const whisperTranscript = await api.transcribeAudio(audioBlob);
            if (whisperTranscript) {
              // Also clean Whisper transcript
              finalTranscript = whisperTranscript
                .replace(/thank you\.?$/i, '')
                .replace(/thanks\.?$/i, '')
                .replace(/that's my answer\.?$/i, '')
                .replace(/done answering\.?$/i, '')
                .replace(/that's it\.?$/i, '')
                .trim() || whisperTranscript;
            }
          } catch (err) {
            console.error('Whisper transcription failed:', err);
          }
        }

        processAnswer(finalTranscript);
        return;
      }
    }

    if (command && command !== 'yes' && command !== 'no' && command !== 'submit') {
      handleVoiceCommand(command);
      return;
    }

    // Handle conversation state
    if (currentState === 'waiting_confirmation') {
      return;
    }

    // For listening state without explicit submit, still accumulate
    // The answer will be processed when they say "thank you" or similar

  }, [handleVoiceCommand, updateShouldListen, processAnswer]);

  // Check for natural pauses
  useEffect(() => {
    if ((conversationState === 'listening' || conversationState === 'asking_question') && !isPaused && shouldListen) {
      pauseTimeoutRef.current = setTimeout(() => {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity > 8000 && (conversationStateRef.current === 'listening' || conversationStateRef.current === 'asking_question') && shouldListenRef.current) {
          // Briefly pause and then resume listening
          shouldListenRef.current = false;
          setShouldListen(false);
          setIsListening(false);
          setTimeout(() => {
            shouldListenRef.current = true;
            setShouldListen(true);
            setIsListening(true);
          }, 500);
          lastActivityRef.current = Date.now();
        }
      }, 8000);
    }

    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [conversationState, isPaused, shouldListen]);

  return {
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
    showFeedback: session?.feedbackPreference !== 'hide',
    shouldListen,
  };
};
