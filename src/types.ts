export type LoopHealth = "healthy" | "stalled" | "dissolving" | "auditing";

export interface IntentionVector {
  id: string;
  author: string;
  purpose: string;
  timestamp: string;
  expires: string;
  signature: string;
}

export interface ConsentToken {
  id: string;
  loop_id: string;
  from: string;
  to: string;
  scope: string;
  issued: string;
  expires: string;
  revoked: boolean;
}

export interface LoopState {
  id: string;
  health: LoopHealth;
  purpose: string;
  consent_ledger: ConsentToken[];
  active_intentions: IntentionVector[];
  clarity_report: string;
}
