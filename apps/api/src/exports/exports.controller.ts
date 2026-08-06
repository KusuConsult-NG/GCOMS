import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { csvFilename } from './csv';

/**
 * One export route rather than a download button bolted onto each module.
 *
 * The dataset name selects the query, and each dataset carries its own role
 * requirement — checked in the service, because an export is a bulk read and
 * must not become a way around the per-module permissions. Patient exports go
 * through the same PHI scoping as the screens.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exports')
export class ExportsController {
  constructor(private readonly exports: ExportsService) {}

  @Get('datasets')
  listDatasets() {
    return this.exports.availableFor();
  }

  @Get(':dataset')
  async download(
    @Param('dataset') dataset: string,
    @Query('status') status: string | undefined,
    @Res() res: Response,

    ...rest: any[]
  ) {
    // JwtAuthGuard puts the authenticated user on the request, but Express's
    // own `Request.user` type comes from passport and does not describe our
    // payload — so the two types do not overlap and a direct cast is rejected.
    // Going via `unknown` is the narrowing TypeScript asks for here; the shape
    // is guaranteed by the guard on this controller, not by the cast.
    const req = res.req as unknown as { user: { id: string; role: string } };
    const csv = await this.exports.build(dataset, req.user, { status });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${csvFilename(dataset)}"`,
    );
    res.send(csv);
  }
}
