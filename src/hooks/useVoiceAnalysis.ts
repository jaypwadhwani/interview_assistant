import { useRef } from 'react';
import { VoiceAnalysis } from '../types';

interface VoiceMetrics {
  startTime: number;
  words: number;
  pauses: number;
  duration: number; // in seconds
}

export const useVoiceAnalysis = () => {
  const metricsRef = useRef<VoiceMetrics>({
    startTime: 0,
    words: 0,
    pauses: 0,
    duration: 0,
  });

  const startAnalysis = () => {
    metricsRef.current = {
      startTime: Date.now(),
      words: 0,
      pauses: 0,
      duration: 0,
    };
  };

  const analyzeTranscript = (transcript: string): VoiceAnalysis => {
    const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
    const duration = metricsRef.current.duration || 1; // fallback to 1 second
    
    // Calculate words per minute (WPM)
    const wpm = (words.length / duration) * 60;
    
    // Ideal pace is 140-160 WPM for interviews
    let pace = 5.0;
    if (wpm >= 140 && wpm <= 160) {
      pace = 9.0; // Ideal range
    } else if (wpm >= 120 && wpm < 140) {
      pace = 7.5; // Slightly slow but acceptable
    } else if (wpm > 160 && wpm <= 180) {
      pace = 8.0; // Fast but acceptable
    } else if (wpm < 120) {
      pace = Math.max(1.0, 5.0 - (120 - wpm) / 10); // Too slow
    } else {
      pace = Math.max(1.0, 8.0 - (wpm - 180) / 20); // Too fast
    }
    
    // Count filler words and pauses
    const fillerWords = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'so', 'well'];
    const pauseCount = words.filter(w => 
      fillerWords.some(filler => w.toLowerCase().includes(filler))
    ).length;
    
    // Confidence based on answer length, structure, and filler words
    let confidence = 5.0;
    if (words.length > 30) confidence += 1.5; // Longer answers show confidence
    if (words.length > 60) confidence += 1.0;
    const fillerRatio = pauseCount / Math.max(words.length, 1);
    confidence -= fillerRatio * 3; // Reduce confidence for excessive fillers
    if (fillerRatio < 0.05) confidence += 1.0; // Low filler usage is good
    
    // Tone - simulate based on word choice and structure
    const positiveWords = ['success', 'achieved', 'improved', 'solved', 'led', 'delivered', 'exceeded'];
    const negativeWords = ['difficulty', 'problem', 'failed', 'struggled', 'couldn\'t'];
    const positiveCount = words.filter(w => 
      positiveWords.some(pw => w.toLowerCase().includes(pw))
    ).length;
    const negativeCount = words.filter(w => 
      negativeWords.some(nw => w.toLowerCase().includes(nw))
    ).length;
    
    let tone = 6.0; // Neutral start
    if (positiveCount > negativeCount) {
      tone = Math.min(9.5, 6.0 + (positiveCount - negativeCount) * 0.5);
    } else if (negativeCount > positiveCount) {
      tone = Math.max(3.0, 6.0 - (negativeCount - positiveCount) * 0.5);
    }
    
    // Clarity - simulate based on answer structure and length
    let clarity = 7.0;
    if (words.length < 20) clarity = 5.0; // Too short may indicate unclear
    if (words.length > 100) clarity += 0.5; // Well-developed answers are clearer
    const sentenceCount = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    if (sentenceCount > 2 && words.length / sentenceCount < 20) {
      clarity += 0.5; // Well-structured sentences
    }
    
    return {
      tone: Math.round(Math.max(1.0, Math.min(10.0, tone)) * 10) / 10,
      pace: Math.round(Math.max(1.0, Math.min(10.0, pace)) * 10) / 10,
      confidence: Math.round(Math.max(1.0, Math.min(10.0, confidence)) * 10) / 10,
      clarity: Math.round(Math.max(1.0, Math.min(10.0, clarity)) * 10) / 10,
      pauses: pauseCount,
    };
  };

  const updateDuration = (durationInSeconds: number) => {
    metricsRef.current.duration = durationInSeconds;
  };

  return {
    startAnalysis,
    analyzeTranscript,
    updateDuration,
  };
};

