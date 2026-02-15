"use client";

import { useState, useRef } from "react";
import { useToast } from "@/contexts/ToastContext";

interface CreateClubFormProps {
  onCreated: () => void;
}

export default function CreateClubForm({ onCreated }: CreateClubFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!logoFile) {
      setError("Ajoute une photo du maillot");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("logo", logoFile);

      const res = await fetch("/api/clubs", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la creation");
      }
      setName("");
      setLogoFile(null);
      setLogoPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      toast("Club cree !", "success");
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
        Creer un club
      </p>

      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs text-[#94A3B8]">
            Nom du club *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Les Rouleurs du Dimanche"
            required
            maxLength={50}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-[#94A3B8]">
            Photo du maillot *
          </label>
          <div className="flex items-center gap-3">
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Preview"
                className="h-14 w-14 rounded-full border border-white/[0.10] object-cover"
              />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm text-[#94A3B8] file:mr-3 file:rounded-lg file:border-0 file:bg-[#22223A] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-[#6366F1]/60"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6366F1]/80 disabled:opacity-50"
        >
          {submitting ? "Creation..." : "Creer le club"}
        </button>
      </div>
    </form>
  );
}
