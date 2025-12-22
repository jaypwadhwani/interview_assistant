require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { OpenAI } = require('openai');
const path = require('path');

console.log('Starting server...');
console.log('PORT:', process.env.PORT || 3001);
console.log('OPENAI_API_KEY set:', !!process.env.OPENAI_API_KEY);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 3001;

let openai;
try {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('OpenAI client initialized');
} catch (err) {
  console.error('Failed to initialize OpenAI:', err.message);
}

app.use(cors());
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
    const { jobDetails } = req.body || {};
    if (!jobDetails || !jobDetails.jobTitle) {
      return res.status(400).json({ error: 'jobDetails.jobTitle is required' });
    }

    const question = `Let's begin. For the ${jobDetails.jobTitle} role, tell me briefly about a recent accomplishment you're proud of.`;
    const tts = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: 'alloy',
      input: question
    });
    const audioBuffer = Buffer.from(await tts.arrayBuffer());
    const audioDataUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;

    res.json({
      questionText: question,
      questionAudioDataUrl: audioDataUrl
    });
  } catch (err) {
    console.error('start-interview error:', err?.response?.data || err);
    res.status(500).json({ error: 'Failed to start interview' });
  }
});

// Main interview turn: takes transcript, returns rating/feedback/next question + TTS
app.post('/api/interview', async (req, res) => {
  try {
    const { transcript, jobDetails, history = [] } = req.body || {};
    if (!transcript || !jobDetails) {
      return res.status(400).json({ error: 'transcript and jobDetails are required' });
    }

    const systemPrompt = `
You are an interview coach. Given a candidate's spoken answer, return:
- a concise feedback message (<= 2 sentences, < 15s spoken)
- a strict 1-10 score (one decimal)
- the next interview question
Focus on relevance, structure, and delivery (tone, pace, confidence, clarity).
Return JSON with keys: feedback, score, next_question.
`;

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        ...(history || []).map((h) => ({ role: h.role || 'user', content: h.content || '' })),
        {
          role: 'user',
          content: `Job Title: ${jobDetails.jobTitle}\nDescription: ${jobDetails.jobDescription || 'N/A'}\nNotes: ${jobDetails.notes || 'N/A'}\nCandidate answer: ${transcript}`
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
    const score = Number(parsed.score) || 7.0;
    const nextQuestion = parsed.next_question || 'Can you tell me about a time you led a project?';

    // TTS for feedback and next question
    const [feedbackTts, questionTts] = await Promise.all([
      openai.audio.speech.create({ model: 'gpt-4o-mini-tts', voice: 'alloy', input: feedbackText }),
      openai.audio.speech.create({ model: 'gpt-4o-mini-tts', voice: 'alloy', input: nextQuestion })
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

