require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { OpenAI } = require('openai');
const path = require('path');

console.log('Starting server...');
console.log('PORT:', process.env.PORT || 3001);
console.log('OPENAI_API_KEY set:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
console.log('Working directory:', __dirname);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173,https://interviewapp-ashy.vercel.app';

let openai;
try {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('OpenAI client initialized');
} catch (err) {
  console.error('Failed to initialize OpenAI:', err.message);
}

// Configure CORS for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    const allowedOrigins = CORS_ORIGIN.split(',').map(o => o.trim());

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

// Transcribe audio with Whisper
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'audio file is required' });
    }

    const transcript = await openai.audio.transcriptions.create({
      file: {
        name: req.file.originalname || 'audio.webm',
        type: req.file.mimetype || 'audio/webm',
        arrayBuffer: async () => req.file.buffer
      },
      model: 'whisper-1',
      response_format: 'text'
    });

    res.json({ transcript });
  } catch (err) {
    console.error('Transcription error:', err?.response?.data || err);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// Generate TTS audio data URL
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'alloy' } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text is required' });

    const speech = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice,
      input: text
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());
    const dataUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;

    res.json({ audioDataUrl: dataUrl });
  } catch (err) {
    console.error('TTS error:', err?.response?.data || err);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});

// Start interview: return first question + TTS
app.post('/api/start-interview', async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({
        error: 'OpenAI client not initialized',
        hint: 'Please set OPENAI_API_KEY environment variable'
      });
    }

    const { jobDetails } = req.body || {};
    if (!jobDetails || !jobDetails.jobTitle) {
      return res.status(400).json({ error: 'jobDetails.jobTitle is required' });
    }

    // Generate a conversational, role-appropriate first question
    const jobDescText = jobDetails.jobDescription ? `\n\nJOB DESCRIPTION:\n${jobDetails.jobDescription}` : '';
    const notesText = jobDetails.notes ? `\n\nADDITIONAL CONTEXT / NOTES:\n${jobDetails.notes}` : '';

    const prompt = `Generate a warm, conversational opening question for an interview coach starting a practice interview.

JOB TITLE: ${jobDetails.jobTitle}${jobDescText}${notesText}

The question should:
- Be conversational and welcoming (like "Hey there, are you ready to begin?")
- Be a behavioral question that allows the candidate to use the STAR framework
- Be brief and natural when spoken
${jobDetails.jobDescription ? '- Be specifically tailored to the job description, referencing relevant skills, technologies, responsibilities, or requirements mentioned in the job description' : '- Be appropriate for the role based on the job title'}
${jobDetails.notes ? '- Naturally incorporate context from the notes provided. For example, if notes mention conversations with specific people (like "I had a conversation with Joel the CEO"), you can reference that naturally in your question or follow-up questions. Use the notes to make the interview feel personalized and relevant to the candidate\'s specific situation.' : ''}

IMPORTANT: 
- If a job description is provided, use it to craft a question that directly relates to the specific requirements, skills, or responsibilities mentioned.
- If notes are provided, treat them as important context that should be naturally referenced during the interview. For example, if notes mention specific people, conversations, or situations, you can reference these in your questions to make the interview more relevant and personalized.

Return only the question text, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a friendly interview coach. Generate conversational, natural interview questions. When notes or context are provided (such as conversations with specific people), naturally incorporate that information into your questions to make the interview personalized and relevant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    const question = completion.choices[0].message.content?.trim() ||
      `Hey there, are you ready to begin? For the ${jobDetails.jobTitle} role, tell me about a recent accomplishment you're proud of.`;

    const voice = jobDetails.voice || 'alloy';

    const tts = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice,
      input: question
    });
    const audioBuffer = Buffer.from(await tts.arrayBuffer());
    const audioDataUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;

    res.json({
      questionText: question,
      questionAudioDataUrl: audioDataUrl
    });
  } catch (err) {
    console.error('start-interview error:', err);
    console.error('Error message:', err?.message);
    console.error('Error status:', err?.status);
    console.error('Error code:', err?.code);
    console.error('Full error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));

    const errorMessage = err?.message || 'Unknown error';
    const statusCode = err?.status || err?.response?.status || 500;

    // Check for OpenAI API key issues
    if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('Invalid') || statusCode === 401) {
      return res.status(500).json({
        error: 'OpenAI API authentication failed',
        details: errorMessage,
        hint: 'Please check your OPENAI_API_KEY environment variable in the server/.env file. Make sure it starts with "sk-" and has no extra spaces.'
      });
    }

    // Check if OpenAI client is not initialized
    if (!openai) {
      return res.status(500).json({
        error: 'OpenAI client not initialized',
        hint: 'Please set OPENAI_API_KEY environment variable in server/.env file'
      });
    }

    res.status(500).json({
      error: 'Failed to start interview',
      details: errorMessage,
      code: err?.code,
      hint: 'Check server logs for more details'
    });
  }
});

// Main interview turn: takes transcript, returns rating/feedback/next question + TTS
app.post('/api/interview', async (req, res) => {
  try {
    const { transcript, jobDetails, history = [] } = req.body || {};
    if (!transcript || !jobDetails) {
      return res.status(400).json({ error: 'transcript and jobDetails are required' });
    }

    const systemPrompt = `You are an expert interview coach evaluating candidate answers. Your role is to provide constructive, specific feedback and accurate ratings.

RATING SCALE (1-10, rounded to nearest tenth):
- 10.0 (Exceptional): Crystal clear, highly specific with concrete details/names/dates/metrics, quantifiable results, strong personal ownership ("I" statements), perfect structure, directly relevant to role, shows depth and reflection
- 8.5-9.9 (Excellent): Very clear, mostly specific with good details, some metrics, primarily "I" statements, well-organized, strongly relevant, thorough understanding
- 7.0-8.4 (Good): Generally clear, some specifics but may lack depth, limited/vague metrics, mix of "I" and "we", adequate structure, moderate relevance
- 5.0-6.9 (Adequate): Somewhat clear but vague/general, no specific metrics, heavy "we" usage, basic structure, weak relevance, surface-level
- 1.0-4.9 (Poor): Unclear/confusing, extremely vague, no metrics, entirely "we" focused, poor structure, not relevant, superficial

KEY QUALITY INDICATORS (for 8.0+ ratings):
1. Specificity: Concrete examples, names, dates, numbers (not vague/generic)
2. Quantifiable Outcomes: Metrics, percentages, timeframes, measurable impact
3. Personal Ownership: Clear "I" statements showing individual contribution (not just "we")
4. Relevance: Direct connection to question and job requirements (use the job description to assess relevance - answers should relate to specific skills, technologies, or responsibilities mentioned)
5. Structure: Well-organized, logical flow, complete framework
6. Clarity: Easy to understand, no ambiguity
7. Depth: Thoughtful, shows understanding beyond surface level
8. Professional Delivery: Confident, appropriate pace, clear communication

RED FLAGS (lower ratings):
- Excessive "we" without personal contribution
- Vague/generic statements without specifics
- No quantifiable results or outcomes
- Poor structure or missing framework components
- Lack of relevance to question or role
- Unclear or confusing communication
- Superficial answers that don't demonstrate competencies

STAR FRAMEWORK (for behavioral questions):
Evaluate using Situation, Task, Action, Result:
- Situation: Clear context (when, where, who), relevant background, appropriate detail
- Task: Clear objective/goal, constraints, candidate's role
- Action: Specific actions by candidate (not team), step-by-step, shows skills/competencies, uses "I" statements
- Result: Quantifiable outcomes (metrics, percentages), impact, learning, connection to role

STAR Rating Guidelines:
- Excellent (8.5-10.0): All four components present, specific situation/task, detailed personal actions, quantifiable results
- Good (7.0-8.4): Most components present, clear situation/task, actions may lack detail/ownership, results mentioned but not quantified
- Fair (5.0-6.9): Some components missing/unclear, vague situation, "we" focused actions, results not specific
- Needs Improvement (1.0-4.9): Multiple components missing, unclear situation, vague actions, no results

FEEDBACK REQUIREMENTS:
- Brief and concise: Approximately 30 seconds or less when spoken
- Focus on 1-2 key strengths and 1-2 areas for improvement
- Be actionable and specific (not vague)
- For behavioral/STAR answers: Acknowledge which components were strong, identify gaps, provide specific guidance, connect to role
- Use constructive, supportive tone
- If notes/context are provided (e.g., mentioning conversations with specific people), you can reference them naturally in feedback when relevant

CONVERSATIONAL RECOGNITION:
If the transcript contains natural language commands (pause, resume, skip, repeat, end, clarify), note this but still provide evaluation if there's substantive content.

OUTPUT FORMAT:
Return JSON with exactly these keys:
- feedback: String (30 seconds or less when spoken, 1-2 strengths + 1-2 improvements)
- score: Number (1.0-10.0, rounded to nearest 0.1, e.g., 7.3, 8.7, 9.1)
- next_question: String (relevant follow-up question tailored to the job description and notes - if a job description is provided, reference specific skills, technologies, responsibilities, or requirements from it. If notes are provided (e.g., mentioning conversations with specific people), naturally incorporate that context into the question to make it personalized and relevant)

RATING PROCESS:
1. Determine if this is a behavioral question (requires STAR) or other type
2. Evaluate against quality indicators and rating benchmarks
3. Check for red flags
4. For behavioral: Evaluate all STAR components
5. Assign precise score (to nearest 0.1) based on benchmarks
6. Provide specific, actionable feedback`;

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        ...(history || []).map((h) => ({ role: h.role || 'user', content: h.content || '' })),
        {
          role: 'user',
          content: `Evaluate this candidate's interview answer:

JOB CONTEXT:
- Job Title: ${jobDetails.jobTitle}
${jobDetails.jobDescription ? `- Job Description: ${jobDetails.jobDescription}` : '- Job Description: Not provided'}
${jobDetails.notes ? `- Additional Notes / Context: ${jobDetails.notes}` : '- Additional Notes: None'}

CANDIDATE'S ANSWER:
"${transcript}"

INSTRUCTIONS:
1. Determine if this is a behavioral question (requires STAR framework evaluation) or another type
2. Evaluate the answer against the rating benchmarks and quality indicators
3. Check for red flags (excessive "we", vagueness, no metrics, poor structure, etc.)
4. If behavioral: Evaluate all STAR components (Situation, Task, Action, Result)
5. Assign a precise score (1.0-10.0, rounded to nearest 0.1)
6. Provide specific, actionable feedback (30 seconds or less when spoken)
7. Generate a relevant next question for this role${jobDetails.jobDescription ? '. IMPORTANT: Use the job description to tailor the next question. Reference specific skills, technologies, responsibilities, or requirements mentioned in the job description. Make the question directly relevant to what the role actually entails.' : ''}${jobDetails.notes ? ' IMPORTANT: Use the notes/context provided to make questions more personalized and relevant. For example, if notes mention specific people (like "I had a conversation with Joel the CEO"), you can naturally reference that in your next question (e.g., "Tell me about your conversation with Joel the CEO" or "Based on your discussion with Joel, how do you see yourself fitting into this role?"). Use notes to create a more contextual and personalized interview experience.' : ''}

Return your evaluation as JSON with keys: feedback, score, next_question`
        }
      ]
    });

    let parsed;
    try {
      parsed = JSON.parse(chat.choices[0].message.content || '{}');
    } catch (e) {
      parsed = { feedback: 'Thanks, let us continue.', score: 7.0, next_question: 'Can you tell me about a time you led a project?' };
    }

    const feedbackText = parsed.feedback || 'Thanks, let us continue.';
    // Round score to nearest 0.1 and ensure it's between 1.0 and 10.0
    let score = Number(parsed.score) || 7.0;
    if (isNaN(score) || score < 1.0) score = 1.0;
    if (score > 10.0) score = 10.0;
    score = Math.round(score * 10) / 10; // Round to nearest 0.1

    const nextQuestion = parsed.next_question || 'Can you tell me about a time you led a project?';

    const voice = jobDetails.voice || 'alloy';

    // TTS for feedback and next question
    const [feedbackTts, questionTts] = await Promise.all([
      openai.audio.speech.create({ model: 'gpt-4o-mini-tts', voice, input: feedbackText }),
      openai.audio.speech.create({ model: 'gpt-4o-mini-tts', voice, input: nextQuestion })
    ]);

    const feedbackAudio = Buffer.from(await feedbackTts.arrayBuffer()).toString('base64');
    const questionAudio = Buffer.from(await questionTts.arrayBuffer()).toString('base64');

    res.json({
      feedback: feedbackText,
      score,
      nextQuestion,
      feedbackAudioDataUrl: `data:audio/mpeg;base64,${feedbackAudio}`,
      questionAudioDataUrl: `data:audio/mpeg;base64,${questionAudio}`
    });
  } catch (err) {
    console.error('interview error:', err?.response?.data || err);
    res.status(500).json({ error: 'Failed to process interview turn' });
  }
});

app.listen(PORT, () => {
  console.log(`Interview assistant backend listening on port ${PORT}`);
});

