export type ResolutionStatus = "DRAFT" | "ACTIVE" | "PASSED" | "REJECTED";
export type ResolutionThreshold = "ORDINARY" | "TWO_THIRDS" | "SPECIAL";
export type VoteChoice = "FOR" | "AGAINST" | "ABSTAIN";

export interface Tally {
  forWeight: number;
  againstWeight: number;
  abstainWeight: number;
  participationPct: number;
  quorumMet: boolean;
  forPctOfDecided: number;
  wouldPass: boolean;
}

export interface Resolution {
  id: string;
  title: string;
  titleAr: string | null;
  description: string | null;
  threshold: ResolutionThreshold;
  quorumPct: number;
  votingDeadline: string;
  status: ResolutionStatus;
  totalVotingPower: number | null;
  createdBy: string;
  openedAt: string | null;
  closedAt: string | null;
  /** Latest reminder email, automatic or sent by an officer. */
  lastReminderAt?: string | null;
  tally: Tally;
}

export interface ResolutionVote {
  shareholderId: string;
  nameEn: string;
  nameAr: string | null;
  vote: VoteChoice;
  weight: number;
  castAt: string;
}

export interface ResolutionDetail {
  resolution: Resolution;
  votes: ResolutionVote[];
}

export interface CreateResolutionRequest {
  title: string;
  titleAr?: string;
  description?: string;
  threshold: ResolutionThreshold;
  quorumPct: number;
  votingDeadline: string;
}
