const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

export interface JobDetailsPayload {
  jobTitle: string;
  jobDescription?: string;
  notes?: string;
  voice?: string;
}

export interface InterviewTurnResponse {
  feedback: string;
  score: number;
  nextQuestion: string;
  feedbackAudioDataUrl?: string;
  questionAudioDataUrl?: string;
}

export interface StartInterviewResponse {
  questionText: string;
  questionAudioDataUrl?: string;
}

export const api = {
  startInterview: async (jobDetails: JobDetailsPayload): Promise<StartInterviewResponse> => {
    const res = await fetch(`${API_BASE}/api/start-interview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDetails }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.details || 'Failed to start interview';
      const hint = errorData.hint ? ` (${errorData.hint})` : '';
      throw new Error(`${errorMessage}${hint}`);
    }
    return res.json();
  },

  sendInterviewTurn: async (params: {
    transcript: string;
    jobDetails: JobDetailsPayload;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<InterviewTurnResponse> => {
    const res = await fetch(`${API_BASE}/api/interview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to process interview turn');
    return res.json();
  },

  transcribeAudio: async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const res = await fetch(`${API_BASE}/api/transcribe`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to transcribe audio');
    const data = await res.json();
    return data.transcript as string;
  },

  generateTTS: async (text: string, voice: string = 'alloy'): Promise<string> => {
    const res = await fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });
    if (!res.ok) throw new Error('Failed to generate TTS');
    const data = await res.json();
    return data.audioDataUrl;
  },
};

