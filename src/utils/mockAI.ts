import { JobDetails, InterviewQuestion, AnswerRating, VoiceAnalysis } from '../types';

// Mock questions database - contextual questions based on job type
const getContextualQuestions = (jobTitle: string, _jobDescription: string): string[] => {
  const titleLower = jobTitle.toLowerCase();

  // Technical roles
  if (titleLower.includes('engineer') || titleLower.includes('developer') || titleLower.includes('programmer')) {
    return [
      "Can you walk me through your experience with software development?",
      "Describe a challenging technical problem you've solved recently.",
      "How do you approach debugging a complex issue?",
      "Tell me about a time you had to learn a new technology quickly.",
      "How do you ensure code quality in your projects?",
    ];
  }

  // Management roles
  if (titleLower.includes('manager') || titleLower.includes('lead') || titleLower.includes('director')) {
    return [
      "Describe your leadership style and how you motivate your team.",
      "Tell me about a time you had to make a difficult decision under pressure.",
      "How do you handle conflicts within your team?",
      "Describe a situation where you had to manage multiple priorities.",
      "What's your approach to mentoring and developing team members?",
    ];
  }

  // Sales/Marketing roles
  if (titleLower.includes('sales') || titleLower.includes('marketing') || titleLower.includes('business development')) {
    return [
      "Tell me about a time you exceeded your sales targets.",
      "How do you build rapport with potential clients?",
      "Describe a challenging negotiation you've handled.",
      "What strategies do you use to identify new business opportunities?",
      "How do you handle rejection in sales?",
    ];
  }

  // Product roles
  if (titleLower.includes('product') || titleLower.includes('pm')) {
    return [
      "How do you prioritize features in a product roadmap?",
      "Describe a time you had to make a trade-off between user needs and business goals.",
      "Tell me about a product launch you've managed.",
      "How do you gather and incorporate user feedback?",
      "What's your approach to defining product requirements?",
    ];
  }

  // Design roles
  if (titleLower.includes('designer') || titleLower.includes('ux') || titleLower.includes('ui')) {
    return [
      "Walk me through your design process from concept to final product.",
      "How do you balance user needs with business constraints?",
      "Describe a time you received critical feedback on your design.",
      "What's your approach to user research?",
      "How do you stay current with design trends?",
    ];
  }

  // Default/general questions
  return [
    "Tell me about yourself and why you're interested in this role.",
    "What are your greatest strengths and how do they apply to this position?",
    "Describe a challenging situation you faced at work and how you handled it.",
    "Where do you see yourself in 5 years?",
    "Why do you want to work for this company?",
    "Tell me about a time you worked in a team to achieve a goal.",
    "What's your approach to handling stress and tight deadlines?",
    "Describe a time you had to learn something new quickly.",
  ];
};

export const mockAI = {
  generateQuestion: (jobDetails: JobDetails, questionNumber: number): InterviewQuestion => {
    const questions = getContextualQuestions(jobDetails.jobTitle, jobDetails.jobDescription);
    const questionIndex = (questionNumber - 1) % questions.length;
    
    return {
      questionNumber,
      questionText: questions[questionIndex] || "Tell me about yourself.",
    };
  },

  rateAnswer: (_question: InterviewQuestion, answer: string, jobDetails: JobDetails, voiceAnalysis?: VoiceAnalysis): AnswerRating => {
    // Mock rating logic - in real implementation, this would call an AI API
    // For now, we'll generate a rating based on answer length and keywords
    
    const answerLength = answer.trim().length;
    const answerLower = answer.toLowerCase();
    
    // Base score calculation
    let score = 5.0; // Start at middle
    
    // Length factor (too short or too long can be negative)
    if (answerLength < 50) {
      score -= 1.5;
    } else if (answerLength >= 100 && answerLength <= 500) {
      score += 1.0;
    } else if (answerLength > 1000) {
      score -= 0.5;
    }
    
    // Positive indicators
    const positiveKeywords = ['experience', 'challenge', 'solution', 'learned', 'result', 'team', 'improved', 'success'];
    const positiveCount = positiveKeywords.filter(keyword => answerLower.includes(keyword)).length;
    score += positiveCount * 0.3;
    
    // Structure indicators (STAR method)
    if (answerLower.includes('situation') || answerLower.includes('task') || 
        answerLower.includes('action') || answerLower.includes('result')) {
      score += 0.8;
    }
    
    // Job-specific relevance
    const jobKeywords = jobDetails.jobTitle.toLowerCase().split(' ');
    const relevantKeywords = jobKeywords.filter(keyword => 
      keyword.length > 3 && answerLower.includes(keyword)
    );
    score += relevantKeywords.length * 0.2;
    
    // Incorporate voice analysis if provided
    if (voiceAnalysis) {
      // Voice factors contribute 30% to overall score
      const voiceScore = (
        voiceAnalysis.tone * 0.2 +
        voiceAnalysis.pace * 0.25 +
        voiceAnalysis.confidence * 0.3 +
        voiceAnalysis.clarity * 0.25
      );
      // Blend: 70% content, 30% voice delivery
      score = score * 0.7 + voiceScore * 0.3;
      
      // Penalize excessive pauses
      if (voiceAnalysis.pauses > 5) {
        score -= 0.3;
      }
      if (voiceAnalysis.pauses > 10) {
        score -= 0.5;
      }
    }
    
    // Clamp score between 1 and 10, round to 0.1
    score = Math.max(1.0, Math.min(10.0, score));
    score = Math.round(score * 10) / 10;
    
    // Generate feedback based on score and voice analysis
    let feedback = '';
    const voiceFeedback: string[] = [];
    
    if (voiceAnalysis) {
      if (voiceAnalysis.pace < 6) {
        voiceFeedback.push(`Your pace was a bit slow (${voiceAnalysis.pace.toFixed(1)}/10). Try speaking a bit faster to maintain engagement.`);
      } else if (voiceAnalysis.pace > 8.5) {
        voiceFeedback.push(`Your pace was quite fast (${voiceAnalysis.pace.toFixed(1)}/10). Slow down slightly to ensure clarity.`);
      } else {
        voiceFeedback.push(`Your speaking pace was excellent (${voiceAnalysis.pace.toFixed(1)}/10).`);
      }
      
      if (voiceAnalysis.confidence < 6) {
        voiceFeedback.push(`Work on projecting more confidence (${voiceAnalysis.confidence.toFixed(1)}/10). Speak with conviction and avoid excessive filler words.`);
      } else if (voiceAnalysis.confidence >= 8) {
        voiceFeedback.push(`Your confidence level was strong (${voiceAnalysis.confidence.toFixed(1)}/10).`);
      }
      
      if (voiceAnalysis.pauses > 8) {
        voiceFeedback.push(`You used many filler words (${voiceAnalysis.pauses} instances). Try to pause silently instead of saying "um" or "uh".`);
      }
      
      if (voiceAnalysis.tone < 6) {
        voiceFeedback.push(`Your tone could be more positive and engaging (${voiceAnalysis.tone.toFixed(1)}/10).`);
      }
    }
    
    // Content feedback
    if (score >= 9.0) {
      feedback = "Excellent answer! You provided a clear, structured response with specific examples.";
    } else if (score >= 7.5) {
      feedback = "Good answer. You covered the key points well. Consider adding more specific examples.";
    } else if (score >= 6.0) {
      feedback = "Solid answer with relevant points. Try to be more specific with examples.";
    } else if (score >= 4.5) {
      feedback = "Your answer needs more detail. Focus on providing specific examples.";
    } else {
      feedback = "This answer needs improvement. Try to provide more specific examples and structure.";
    }
    
    // Combine content and voice feedback (prioritize brevity)
    if (voiceFeedback.length > 0) {
      feedback += ' ' + voiceFeedback.slice(0, 2).join(' '); // Limit to 2 voice feedback items
    }
    
    // Ensure feedback is brief (approximately 15 seconds of speech = ~200-250 words max)
    // Current feedbacks are already brief, but we'll ensure they stay under limit
    if (feedback.length > 250) {
      feedback = feedback.substring(0, 247) + '...';
    }
    
    return {
      score,
      feedback,
      voiceAnalysis,
    };
  },
};

