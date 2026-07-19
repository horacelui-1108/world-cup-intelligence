/**
 * Shared structural types mirroring design.md §7 (SourceMeta concept).
 * These are intentionally simple — page agents will bind the real data layer
 * to these shapes via the provider adapter.
 */

export type DataStatus = 'LIVE' | 'FINAL' | 'VERIFIED' | 'PENDING' | 'DEMO';

export interface SourceMeta {
  source: string;
  sourceUrl?: string;
  /** ISO 8601 — when the provider payload was fetched */
  retrievedAt: string;
  /** ISO 8601 — provider-side last update */
  lastUpdated: string;
  dataStatus: DataStatus;
  matchId?: string;
}

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface TeamRef {
  id: string;
  name: string;
  shortName: string; // 3-letter FIFA code
  crest: string; // /crest-*.svg path
  ranking?: number;
}

export interface MatchRef {
  id: string;
  stage: string;
  group?: string;
  home: TeamRef;
  away: TeamRef;
  kickoffUtc: string; // ISO 8601 UTC
  venue: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
  scorers?: string[];
  meta: SourceMeta;
}
