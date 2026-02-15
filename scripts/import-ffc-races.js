#!/usr/bin/env node
/**
 * Import FFC races into VeloCard
 *
 * Usage:
 *   node scripts/import-ffc-races.js
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Or set IMPORT_URL to use the API endpoint instead.
 */

const fs = require('fs');
const path = require('path');

// Load env
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

async function main() {
  const dataPath = path.resolve(__dirname, 'ffc-races-import.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const races = data.races;

  console.log(`\n🚴 Importing ${races.length} FFC races into VeloCard...\n`);

  // Format for Supabase insert
  const formatted = races.map(r => ({
    name: r.name,
    date: r.date,
    location: r.location || '',
    description: r.description || '',
    federation: 'FFC',
    category: r.category || 'Seniors',
    gender: r.gender || 'MIXTE',
    is_official: true,
    department: r.department || null,
    region: r.region || null,
    source_url: r.source_url || null,
    status: 'upcoming',
    creator_id: null,
    distance_km: null,
    elevation_gain: null,
    rdi_score: null,
    gpx_data: null,
    weather_cache: null,
  }));

  // Upsert in batches of 50
  const BATCH_SIZE = 50;
  let total = 0;
  let errors = 0;

  for (let i = 0; i < formatted.length; i += BATCH_SIZE) {
    const batch = formatted.slice(i, i + BATCH_SIZE);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/races`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(batch),
    });

    if (res.ok) {
      total += batch.length;
      console.log(`  ✅ Batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(formatted.length/BATCH_SIZE)}: ${batch.length} races OK (total: ${total})`);
    } else {
      const err = await res.text();
      console.error(`  ❌ Batch ${Math.floor(i/BATCH_SIZE) + 1} ERROR: ${res.status} - ${err}`);
      errors++;
    }
  }

  console.log(`\n🏁 Done! Imported: ${total}, Errors: ${errors}`);

  if (total > 0) {
    console.log(`\n📅 Races couvrent du ${races[0].date} au ${races[races.length-1].date}`);
    console.log(`🌍 Ouvre ton app VeloCard et va sur /races pour voir le calendrier !`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
