import { JobDetails, InterviewSession } from '../types';

const STORAGE_KEYS = {
  JOB_DETAILS: 'interview_assistant_job_details',
  CURRENT_SESSION: 'interview_assistant_current_session',
  SESSION_HISTORY: 'interview_assistant_session_history',
} as const;

export const storage = {
  // Job Details
  saveJobDetails: (jobDetails: JobDetails): void => {
    localStorage.setItem(STORAGE_KEYS.JOB_DETAILS, JSON.stringify(jobDetails));
  },

  loadJobDetails: (): JobDetails | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.JOB_DETAILS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading job details:', error);
      return null;
    }
  },

  clearJobDetails: (): void => {
    localStorage.removeItem(STORAGE_KEYS.JOB_DETAILS);
  },

  // Current Session
  saveCurrentSession: (session: InterviewSession): void => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
  },

  loadCurrentSession: (): InterviewSession | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading current session:', error);
      return null;
    }
  },

  clearCurrentSession: (): void => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  },

  // Session History
  saveSessionHistory: (sessions: InterviewSession[]): void => {
    localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(sessions));
  },

  loadSessionHistory: (): InterviewSession[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading session history:', error);
      return [];
    }
  },

  addToSessionHistory: (session: InterviewSession): void => {
    const history = storage.loadSessionHistory();
    history.push(session);
    storage.saveSessionHistory(history);
  },
};

