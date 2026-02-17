import { z } from "zod";

// ═══════════════════════════════════════════════
// Pagination standardisée pour tous les endpoints
// ═══════════════════════════════════════════════

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Calcule le range Supabase à partir des params de pagination.
 */
export function getPaginationRange(params: PaginationParams) {
  const offset = (params.page - 1) * params.limit;
  return {
    offset,
    from: offset,
    to: offset + params.limit - 1,
  };
}

/**
 * Enveloppe une réponse paginée avec les métadonnées.
 */
export function paginatedResponse<T>(data: T[], total: number, params: PaginationParams) {
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
      hasNext: params.page * params.limit < total,
      hasPrev: params.page > 1,
    },
  };
}

/**
 * Parse les query params de pagination depuis une URL.
 */
export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  return paginationSchema.parse({
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 20,
  });
}
