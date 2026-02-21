-- Ajouter gpx_url pour lier directement un fichier GPX stocké
ALTER TABLE races ADD COLUMN IF NOT EXISTS gpx_url TEXT;
