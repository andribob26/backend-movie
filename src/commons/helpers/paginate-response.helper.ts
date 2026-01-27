// paginate-response.helper.ts
import { Request } from 'express';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface PaginationResult<T> {
  message: string;
  data: T[];
  pagination: PaginationMeta & {
    next: string | null;
    prev: string | null;
  };
  statusCode?: number;
}

export function buildPaginationResponse<T>(
  req: Request,
  message: string,
  data: T[],
  meta: PaginationMeta,
): PaginationResult<T> {
  const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}/api`;
  const makePageLink = (p: number) =>
    `${baseUrl}?page=${p}&limit=${meta.limit}`;

  const next = meta.page < meta.lastPage ? makePageLink(meta.page + 1) : null;
  const prev = meta.page > 1 ? makePageLink(meta.page - 1) : null;

  return {
    message,
    data,
    pagination: {
      ...meta,
      next,
      prev,
    },
  };
}
