"use client";

import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

interface GeneratedItem {
  id: string;
  type: "video" | "audio";
  url: string;
  prompt: string;
  createdAt: number;
}

type ActiveTab = "video" | "audio" | null;

export default function HomePage() {
  const [input, setInput] = useState("");
  const [activeItem, setActiveItem] = useState<GeneratedItem | null>(null);
  const [gallery, setGallery] = useState<GeneratedItem[]>([]);
  const [loading, setLoading] = useState<ActiveTab>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (mode: "video" | "audio") => {
    if (!input.trim()) {
      setError("Please enter a description to generate media.");
      return;
    }

    setLoading(mode);
    setError(null);

    try {
      const endpoint = mode === "video" ? "/api/generate-video" : "/api/generate-audio";
      const payload = mode === "video" ? { prompt: input } : { text: input };
      const { data } = await axios.post<{ url: string }>(endpoint, payload);

      if (!data?.url) {
        throw new Error("No media URL returned from the server.");
      }

      const newItem: GeneratedItem = {
        id: `${mode}-${Date.now()}`,
        type: mode,
        url: data.url,
        prompt: input,
        createdAt: Date.now(),
      };

      setGallery((prev) => [newItem, ...prev]);
      setActiveItem(newItem);
      setInput("");
    } catch (err) {
      console.error(`Failed to generate ${mode}:`, err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while generating media."
      );
    } finally {
      setLoading(null);
    }
  };

  const renderDisplay = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-neon/50 border-t-transparent" />
          <p className="text-lg uppercase tracking-widest">Generating {loading}...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-center text-red-200">
          {error}
        </div>
      );
    }

    if (!activeItem) {
      return (
        <div className="py-16 text-center text-muted">
          Your generated videos and audio will appear here.
        </div>
      );
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeItem.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full"
        >
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-lg shadow-neon/10 backdrop-blur">
            <p className="mb-3 text-sm uppercase tracking-widest text-neon">
              {activeItem.type === "video" ? "Video" : "Audio"} generated
            </p>
            {activeItem.type === "video" ? (
              <video
                controls
                className="aspect-video w-full rounded-xl border border-white/10"
                src={activeItem.url}
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <audio controls className="w-full">
                  <source src={activeItem.url} />
                  Your browser does not support the audio element.
                </audio>
                <p className="text-sm text-muted">Prompt: {activeItem.prompt}</p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-6 py-12">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        <h1 className="text-5xl font-bold uppercase tracking-[0.4em] text-white" style={{ textShadow: "0 0 20px #00ff90" }}>
          PokiPackage
        </h1>
        <p className="mt-4 text-base text-muted">
          Enter a description below to generate video or audio using OpenAI SORA.
          <br />
          Your creations will appear below in the gallery.
        </p>
      </motion.header>

      <section className="mx-auto w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="space-y-6 rounded-2xl border border-white/10 bg-black/30 p-8 shadow-lg shadow-neon/10 backdrop-blur"
        >
          <div className="flex flex-col gap-4">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Describe your scene or message..."
              className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-4 text-lg text-white placeholder:text-muted focus:border-neon focus:outline-none focus:ring focus:ring-neon/40"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => handleGenerate("video")}
                disabled={loading !== null}
                className="rounded-full bg-neon px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-black transition hover:shadow-neon focus:outline-none focus:ring-2 focus:ring-neon/70 disabled:cursor-not-allowed disabled:bg-neon/40 disabled:text-black/40"
              >
                Generate Video
              </button>
              <button
                onClick={() => handleGenerate("audio")}
                disabled={loading !== null}
                className="rounded-full bg-transparent px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-neon transition hover:bg-neon/10 hover:shadow-neon focus:outline-none focus:ring-2 focus:ring-neon/70 disabled:cursor-not-allowed disabled:text-neon/40"
              >
                Generate Audio
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-white transition-all duration-500 ease-out">
            {renderDisplay()}
          </div>
        </motion.div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold uppercase tracking-[0.3em] text-neon">
            Gallery
          </h2>
          <span className="text-sm text-muted">Click to replay any creation</span>
        </div>
        <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-4">
          {gallery.length === 0 ? (
            <p className="text-muted">Nothing here yet. Generate your first creation above.</p>
          ) : (
            gallery.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => setActiveItem(item)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative flex h-32 w-48 min-w-[12rem] flex-col overflow-hidden rounded-xl border ${
                  activeItem?.id === item.id ? "border-neon" : "border-white/10"
                } bg-black/50 text-left shadow-lg shadow-neon/10 transition`}
              >
                {item.type === "video" ? (
                  <video
                    src={item.url}
                    className="h-full w-full object-cover opacity-70 transition group-hover:opacity-100"
                    muted
                    loop
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon/20 via-black to-black text-neon">
                    <span className="text-lg font-semibold uppercase tracking-[0.3em]">Audio</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-xs text-muted">
                  {item.prompt.length > 60 ? `${item.prompt.slice(0, 57)}...` : item.prompt}
                </div>
              </motion.button>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
