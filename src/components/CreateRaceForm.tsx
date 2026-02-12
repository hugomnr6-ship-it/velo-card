"use client";

import { useState } from "react";

interface CreateRaceFormProps {
  onCreated: () => void;
}

export default function CreateRaceForm({ onCreated }: CreateRaceFormProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/races", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date, location, description }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la création");
      }
      setName("");
      setDate("");
      setLocation("");
      setDescription("");
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-neutral-500 focus:outline-none";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-5"
    >
      <p className="mb-4 text-sm font-bold tracking-wide text-white">
        Créer une course
      </p>

      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-500">
            Nom de la course *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Grand Prix de Trifouilly"
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-500">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">
              Lieu *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Rennes, Bretagne"
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-neutral-500">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Infos supplémentaires (optionnel)"
            rows={2}
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
        >
          {submitting ? "Création..." : "Créer la course"}
        </button>
      </div>
    </form>
  );
}
