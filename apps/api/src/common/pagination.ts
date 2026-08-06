import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_LIST_LIMIT = 100;
export const MAX_LIST_LIMIT = 500;

/**
 * Query params for list endpoints. Responses stay plain arrays — no envelope —
 * so this does not change any existing client contract.
 *
 * Note the default limit truncates: a caller that wants everything must page
 * through with `offset`. That is deliberate. These endpoints previously returned
 * every row in the table, which is unbounded in patient and transaction volume.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIST_LIMIT)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

/** Spread into a Prisma findMany: `{ where, ...paginate(query) }`. */
export function paginate(query?: PaginationQueryDto): {
  take: number;
  skip: number;
} {
  return {
    take: Math.min(query?.limit ?? DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT),
    skip: query?.offset ?? 0,
  };
}
