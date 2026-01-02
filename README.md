# Interview Assistant

AI-powered interview practice assistant with voice interaction and real-time feedback.

## Features

- 🎤 Voice-based interview practice
- 🤖 AI-powered questions tailored to job descriptions
- 📊 Real-time feedback and scoring
- 🎯 Natural conversation flow
- 💾 Session management and progress tracking

## Tech Stack

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS
- Web Speech API

**Backend:**
- Node.js + Express
- OpenAI API (GPT-4 + TTS + Whisper)

## Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key

### Local Development

1. **Clone the repository**
```bash
git clone YOUR_REPO_URL
cd interview-assistant
```

2. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

3. **Set up environment variables**

Create `server/.env`:
```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

4. **Run the application**

```bash
# Terminal 1: Start backend
cd server
npm start

# Terminal 2: Start frontend
npm run dev
```

5. **Open browser**
Navigate to `http://localhost:5173`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel (frontend) and Railway (backend).

### Quick Deploy

**Backend (Railway):**
1. Connect GitHub repo to Railway
2. Set environment variables: `OPENAI_API_KEY`, `CORS_ORIGIN`
3. Deploy automatically

**Frontend (Vercel):**
1. Connect GitHub repo to Vercel
2. Set environment variable: `VITE_API_BASE_URL` (Railway URL)
3. Deploy automatically

## Usage

1. **Enter job details**: Provide job title, description, and any notes
2. **Start interview**: Click the microphone button to begin
3. **Answer questions**: Speak your responses naturally
4. **Get feedback**: Receive immediate AI-powered feedback
5. **Continue or end**: Choose to continue with more questions or end the session

### Voice Commands

- "Thank you" - Submit your answer
- "Skip" - Skip to next question
- "Pause" - Pause the interview
- "Resume" - Resume the interview

## Project Structure

```
interview-assistant/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utilities
│   └── types/             # TypeScript types
├── server/                # Backend
│   ├── index.js          # Express server
│   └── package.json      # Backend dependencies
├── public/               # Static assets
└── dist/                # Production build
```

## Environment Variables

### Frontend
- `VITE_API_BASE_URL`: Backend API URL (default: empty for same origin)

### Backend
- `OPENAI_API_KEY`: Your OpenAI API key (**required**)
- `PORT`: Server port (default: 3001)
- `CORS_ORIGIN`: Allowed frontend origins (default: http://localhost:5173)
- `NODE_ENV`: Environment (development/production)

## API Endpoints

- `POST /api/start-interview` - Start new interview session
- `POST /api/interview` - Process interview turn (answer + feedback)
- `POST /api/transcribe` - Transcribe audio (Whisper API)
- `POST /api/tts` - Generate text-to-speech audio

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

## Acknowledgments

- OpenAI for GPT-4, Whisper, and TTS APIs
- Vercel for frontend hosting
- Railway for backend hosting

