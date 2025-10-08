# PokiPackage

PokiPackage is a dark, cinematic Next.js studio for turning text prompts into video and audio using Google's Gemini video models and OpenAI's Audio API. The app features a neon-accented interface, loading feedback, and a gallery that keeps your generated creations accessible.

## ✨ Features
- **Text-to-Video** with Google's Gemini `veo-3-fast` model
- **Text-to-Audio** with OpenAI's speech API for natural narration
- Neon green, cinematic UI built with Tailwind CSS and Framer Motion animations
- Gallery with quick previews to replay previously generated assets
- API routes wired to the Google Gemini and OpenAI SDKs

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm 9 or later
- A Google AI Studio API key with access to the Gemini video models
- An OpenAI API key with access to the Audio endpoints

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env.local` file in the project root with your API credentials:

```bash
GEMINI_API_KEY=your_google_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
```

### Running Locally
```bash
npm run dev
```
The app will be available at [http://localhost:3000](http://localhost:3000).

## 📡 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/generate-video` | `POST` | Generates a video using Google's Gemini VEO 3 Fast model. |
| `/api/generate-audio` | `POST` | Produces speech audio (mp3) from text using OpenAI's Audio API. |

Each endpoint expects JSON input:

```json
// /api/generate-video
{ "prompt": "A neon city skyline at night" }

// /api/generate-audio
{ "text": "Welcome to PokiPackage." }
```

Responses return a JSON payload containing a `url` pointing to the generated media.

## 🧪 Testing the APIs
Use `curl` or an HTTP client such as Postman/Insomnia to POST to each endpoint once your server is running locally.

```bash
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A cinematic spaceship launch"}'
```

```bash
curl -X POST http://localhost:3000/api/generate-audio \
  -H "Content-Type: application/json" \
  -d '{"text":"This is PokiPackage bringing your ideas to life."}'
```

## 🛠 Deployment
Deploy directly to Vercel:
1. Push the project to a Git repository.
2. Import the repository in Vercel.
3. Set the `GEMINI_API_KEY` and `OPENAI_API_KEY` environment variables in the Vercel dashboard.
4. Deploy and enjoy your cinematic text-to-video studio.

## 📄 License
MIT
