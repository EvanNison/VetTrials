// Renderer ready for future private drafts. No condition articles loaded.
export type ConditionPacket = {
  slug: string; isHub: boolean; title: string; description: string;
  route: string; body: string; recordIds: number[]; decision: string; rationale: string;
};
export const packets: ConditionPacket[] = [];
