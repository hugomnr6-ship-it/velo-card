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
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [gpxFileName, setGpxFileName] = useState("");
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
        // Upload GPX if provided
        if (gpxFile) {
          try {
            const gpxText = await gpxFile.text();
            await fetch(`/api/races/${race.id}/gpx`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ gpx_xml: gpxText }),
            });
          } catch { /* GPX upload failed, but race was created */ }
        }
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
          className="mb-4 inline-flex items-center gap-1 text-sm text-[#94A3B8] hover:text-white/80 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F5D4] rounded"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
            <label htmlFor="race-name" className={labelClass}>Nom de la course *</label>
            <input id="race-name" type="text" className={inputClass} placeholder="Grand Prix de Perpignan" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="race-date" className={labelClass}>Date *</label>
              <input id="race-date" type="date" className={inputClass} min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="race-location" className={labelClass}>Lieu *</label>
              <input id="race-location" type="text" className={inputClass} placeholder="Perpignan" value={location} onChange={(e) => setLocation(e.target.value)} required />
            </div>
          </div>

          {/* Federation & Category */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="race-federation" className={labelClass}>Federation</label>
              <select id="race-federation" className={inputClass} value={federation} onChange={(e) => setFederation(e.target.value as Federation)}>
                <option value="FFC">FFC</option>
                <option value="UFOLEP">UFOLEP</option>
                <option value="FSGT">FSGT</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div>
              <label htmlFor="race-category" className={labelClass}>Categorie</label>
              <select id="race-category" className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Cadets">Cadets</option>
                <option value="Juniors">Juniors</option>
                <option value="Access">Access</option>
                <option value="Open">Open</option>
                <option value="Elite">Elite</option>
                <option value="Espoirs">Espoirs</option>
                <option value="Seniors">Seniors</option>
                <option value="DN1">DN1</option>
                <option value="DN2">DN2</option>
                <option value="DN3">DN3</option>
                <option value="Pass Open">Pass Open</option>
              </select>
            </div>
            <div>
              <label htmlFor="race-gender" className={labelClass}>Genre</label>
              <select id="race-gender" className={inputClass} value={gender} onChange={(e) => setGender(e.target.value as RaceGender)}>
                <option value="MIXTE">Mixte</option>
                <option value="H">Hommes</option>
                <option value="F">Femmes</option>
              </select>
            </div>
          </div>

          {/* Distance & Elevation */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="race-distance" className={labelClass}>Distance (km)</label>
              <input id="race-distance" type="number" step="0.1" className={inputClass} placeholder="85" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} />
            </div>
            <div>
              <label htmlFor="race-elevation" className={labelClass}>D+ (m)</label>
              <input id="race-elevation" type="number" className={inputClass} placeholder="1200" value={elevationGain} onChange={(e) => setElevationGain(e.target.value)} />
            </div>
            <div>
              <label htmlFor="race-department" className={labelClass}>Departement</label>
              <input id="race-department" type="text" className={inputClass} placeholder="66" value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>
          </div>

          {/* GPX File */}
          <div>
            <label className={labelClass}>Fichier GPX (optionnel)</label>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed ${gpxFile ? "border-[#6366F1]/40 bg-[#6366F1]/[0.06]" : "border-white/[0.08] bg-[#111827]"} px-4 py-3 transition hover:border-[#6366F1]/30`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={gpxFile ? "text-[#6366F1]" : "text-[#475569]"}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className={`text-sm ${gpxFile ? "text-white font-medium" : "text-[#475569]"}`}>
                {gpxFile ? gpxFileName : "Ajouter le parcours GPX"}
              </span>
              {gpxFile && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setGpxFile(null); setGpxFileName(""); }}
                  aria-label="Supprimer le fichier GPX"
                  className="ml-auto text-xs text-white/30 hover:text-red-400 transition"
                >
                  ✕
                </button>
              )}
              <input
                type="file"
                accept=".gpx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setGpxFile(file);
                    setGpxFileName(file.name);
                  }
                }}
              />
            </label>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="race-description" className={labelClass}>Description</label>
            <textarea
              id="race-description"
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
