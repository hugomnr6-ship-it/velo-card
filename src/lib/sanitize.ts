/** Sanitize pour prévenir XSS dans les inputs texte libres */
export function sanitizeText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Sanitize pour les recherches LIKE SQL */
export function sanitizeLikeInput(input: string): string {
  return input.replace(/[%_\\]/g, '');
}
