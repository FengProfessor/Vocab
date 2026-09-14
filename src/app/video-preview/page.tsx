"use client";

import { Player } from "@remotion/player";
import { StyleOne } from "@/remotion/styles/StyleOne";
import { StyleTwo } from "@/remotion/styles/StyleTwo";
import { StyleThree } from "@/remotion/styles/StyleThree";
import { useState } from "react";

export default function VideoPreviewPage() {
  const [activeStyle, setActiveStyle] = useState<1 | 2 | 3>(1);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center">Vocabulary Roadmap Video Preview</h1>
        <p className="text-center text-gray-400 mb-8">
          Comparing 3 different unique styles for the video introduction.
        </p>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveStyle(1)}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeStyle === 1 ? "bg-sky-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Style 1: Modern & Dynamic
          </button>
          <button
            onClick={() => setActiveStyle(2)}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeStyle === 2 ? "bg-fuchsia-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Style 2: 3D Neon
          </button>
          <button
            onClick={() => setActiveStyle(3)}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeStyle === 3 ? "bg-white text-gray-900" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Style 3: Minimalist Elegant
          </button>
        </div>

        <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-800 bg-black aspect-video flex items-center justify-center">
          {activeStyle === 1 && (
            <Player
              component={StyleOne}
              durationInFrames={300}
              fps={30}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{ width: "100%", height: "100%" }}
              controls
              loop
            />
          )}
          {activeStyle === 2 && (
            <Player
              component={StyleTwo}
              durationInFrames={300}
              fps={30}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{ width: "100%", height: "100%" }}
              controls
              loop
            />
          )}
          {activeStyle === 3 && (
            <Player
              component={StyleThree}
              durationInFrames={300}
              fps={30}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{ width: "100%", height: "100%" }}
              controls
              loop
            />
          )}
        </div>
      </div>
    </div>
  );
}
