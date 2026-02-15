"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import { FlagIcon } from "@/components/icons/TabIcons";
import { useToast } from "@/contexts/ToastContext";
import type { Federation, RaceGender } from "@/types";

export default function CreateRacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [federation, setFederation] = useState<Federation>("FFC");
  const [category, setCategory] = useState("Seniors");
  const [gender, setGender] = useState<RaceGender>("MIXTE");
  const [distanceKm, setDistanceKm] = useState("");
  const [elevationGain, setElevationGain] = useState("");
  const [department, setDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !date || !location) {
      toast("Nom, date et lieu sont requis", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/races", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          date,
          location,
          description,
          federation,
          category,
          gender,
          distance_km: distanceKm ? parseFloat(distanceKm) : undefined,
          elevation_gain: elevationGain ? parseInt(elevationGain) : undefined,
          department: department || undefined,
        }),
      });

      if (res.ok) {
        const race = await res.json();
        toast("Course creee avec succes !", "success");
        router.push(`/races/${race.id}`);
      } else {
        const err = await res.json();
        toast(err.error || "Erreur lors de la creation", "error");
      }
    } catch {
      toast("Erreur reseau", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || !session) return null;

  const inputClass = "w-full rounded-xl border border-white/[0.08] bg-[#111827] px-4 py-2.5 text-sm text-white placeholder-[#475569] focus:border-[#6366F1]/50 focus:outline-none";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5";

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-lg">
        <Link
          href="/races"
          className="mb-4 inline-flex items-center gap-1 text-sm text-[#94A3B8] hover:text-white/80 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Retour
        </Link>

        <PageHeader
          icon={<FlagIcon size={28} />}
          title="Proposer une course"
          subtitle="Ajoute une course au calendrier"
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className={labelClass}>Nom de la course *</label>
            <input type="text" className={inputClass} placeholder="Grand Prix de Perpignan" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Date *</label>
              <input type="date" className={inputClass} min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Lieu *</label>
              <input type="text" className={inputClass} placeholder="Perpignan" value={location} onChange={(e) => setLocation(e.target.value)} required />
            </div>
          </div>

          {/* Federation & Category */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Federation</label>
              <select className={inputClass} value={federation} onChange={(e) => setFederation(e.target.value as Federation)}>
                <option value="FFC">FFC</option>
                <option value="UFOLEP">UFOLEP</option>
                <option value="FSGT">FSGT</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Categorie</label>
              <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Cadets">Cadets</option>
                <option value="Juniors">Juniors</option>
                <option value="Espoirs">Espoirs</option>
                <option value="Seniors">Seniors</option>
                <option value="DN1">DN1</option>
                <option value="DN2">DN2</option>
                <option value="DN3">DN3</option>
                <option value="Pass Open">Pass Open</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Genre</label>
              <select className={inputClass} value={gender} onChange={(e) => setGender(e.target.value as RaceGender)}>
                <option value="MIXTE">Mixte</option>
                <option value="H">Hommes</option>
                <option value="F">Femmes</option>
              </select>
            </div>
          </div>

          {/* Distance & Elevation */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Distance (km)</label>
              <input type="number" step="0.1" className={inputClass} placeholder="85" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>D+ (m)</label>
              <input type="number" className={inputClass} placeholder="1200" value={elevationGain} onChange={(e) => setElevationGain(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Departement</label>
              <input type="text" className={inputClass} placeholder="66" value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-none`}
              placeholder="Informations supplementaires..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-xl bg-[#6366F1] py-3 text-sm font-bold text-white transition hover:bg-[#6366F1]/80 disabled:opacity-50 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
          >
            {submitting ? "Creation en cours..." : "Creer la course"}
          </button>
        </form>
      </div>
    </AnimatedPage>
  );
}
