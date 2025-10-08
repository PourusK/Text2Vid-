# PokiPackage

PokiPackage is a dark, cinematic Next.js studio for turning text prompts into video and audio using OpenAI's SORA and Audio APIs. The app features a neon-accented interface, loading feedback, and a gallery that keeps your generated creations accessible.

## ✨ Features
- **Text-to-Video** with the `sora-2-preview` model (30 second, 720p clips)
- **Text-to-Audio** with OpenAI's speech API for natural narration
- Neon green, cinematic UI built with Tailwind CSS and Framer Motion animations
- Gallery with quick previews to replay previously generated assets
- API routes wired to the OpenAI Node SDK

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm 9 or later
- An OpenAI API key with access to SORA and Audio endpoints

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env.local` file in the project root with your OpenAI credentials:

```bash
OPENAI_API_KEY=your_openai_api_key
```

To verify that the key is valid and that your account has access to the required models, run:

```bash
npm run check-key
```

The script performs a lightweight request to the OpenAI API and prints either a confirmation message or details about why the key was rejected (for example, a `401` if the key is invalid or lacks access).

### Running Locally
```bash
npm run dev
```
The app will be available at [http://localhost:3000](http://localhost:3000).

## 📡 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/generate-video` | `POST` | Generates a 30s 720p video using the SORA model. |
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
3. Set the `OPENAI_API_KEY` environment variable in the Vercel dashboard.
4. Deploy and enjoy your cinematic text-to-video studio.

## 📄 License
MIT
