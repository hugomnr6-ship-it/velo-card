"use client";

import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";

interface CreateRaceFormProps {
  onCreated: () => void;
}

export default function CreateRaceForm({ onCreated }: CreateRaceFormProps) {
  const { toast } = useToast();
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
      toast("Course creee !", "success");
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-white/[0.08] bg-[#111827] px-3 py-2 text-sm text-white placeholder-[#475569] focus:border-[#6366F1]/50 focus:outline-none";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-5"
    >
      <p className="mb-4 text-sm font-bold tracking-wide text-white">
        Créer une course
      </p>

      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs text-[#94A3B8]">
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
            <label className="mb-1 block text-xs text-[#94A3B8]">
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
            <label className="mb-1 block text-xs text-[#94A3B8]">
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
          <label className="mb-1 block text-xs text-[#94A3B8]">
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
          className="mt-1 rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6366F1]/80 disabled:opacity-50"
        >
          {submitting ? "Création..." : "Créer la course"}
        </button>
      </div>
    </form>
  );
}
