# PokiPackage

PokiPackage is a dark, cinematic Next.js studio for turning text prompts into video using Google's Gemini video models. The app features a neon-accented interface, loading feedback, and a gallery that keeps your generated creations accessible.

## ✨ Features
- **Text-to-Video** with Google's Gemini video models (defaults to `veo-1.5-001`)
- Neon green, cinematic UI built with Tailwind CSS and Framer Motion animations
- Gallery with quick previews to replay previously generated assets
- API route wired to the Google Gemini SDK

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm 9 or later
- A Google AI Studio API key with access to the Gemini video models

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env.local` file in the project root with your API credentials:

```bash
GEMINI_API_KEY=your_google_gemini_api_key # or set GOOGLE_API_KEY
# Optional: override the Gemini video model (e.g. veo-1.5-001)
# GEMINI_VIDEO_MODEL=your_preferred_model
```

### Running Locally
```bash
npm run dev
```
The app will be available at [http://localhost:3000](http://localhost:3000).

## 📡 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/generate-video` | `POST` | Generates a video using Google's Gemini video models. |

Each endpoint expects JSON input:

```json
// /api/generate-video
{ "prompt": "A neon city skyline at night" }
```

Responses return a JSON payload containing a `url` pointing to the generated media.

## 🧪 Testing the APIs
Use `curl` or an HTTP client such as Postman/Insomnia to POST to each endpoint once your server is running locally.

```bash
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A cinematic spaceship launch"}'
```

## 🛠 Deployment
Deploy directly to Vercel:
1. Push the project to a Git repository.
2. Import the repository in Vercel.
3. Set the `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) environment variable in the Vercel dashboard.
4. Deploy and enjoy your cinematic text-to-video studio.

## 📄 License
MIT
