
import React, { useState } from "react";
import InputBox from "./components/InputBox";
import ModeToggle from "./components/ModeToggle";
import WorldMap3D from "./components/WorldMap3D";
import { useWorldState } from "./hooks/useWorldState";
import { generateStoryElements } from "./utils/gptOssApi";

export default function Page() {
  const [world, setWorld] = useWorldState();
  const [mode, setMode] = useState("education");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInput = async (input: string) => {
    setLoading(true);
    setError(null);
    try {
      const newElements = await generateStoryElements({ input, world, mode });
      setWorld({
        locations: [...world.locations, ...(newElements.locations || [])],
        characters: [...world.characters, ...(newElements.characters || [])],
        items: [...world.items, ...(newElements.items || [])],
        events: [...world.events, ...(newElements.events || [])],
      });
    } catch (err: any) {
      setError(err?.message || "Failed to generate story elements.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">StoryPulse</h1>
      <p className="mb-4 text-gray-700">Your ideas, turned into living worlds in real time.</p>
      <ModeToggle mode={mode} setMode={setMode} />
      <WorldMap3D world={world} loading={loading} error={error} setError={setError} />
      <InputBox onSubmit={handleInput} />
    </main>
  );
}
