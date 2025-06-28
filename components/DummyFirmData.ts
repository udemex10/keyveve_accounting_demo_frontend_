/* ------------------------------------------------------------------ */
/*  DummyFirmData – 1,000 synthetic engagements from stable JSON      */
/* ------------------------------------------------------------------ */
import { subDays } from "date-fns";
import type { FirmEngagement, ProspectiveClient } from "@/components/FirmEngagementTable";
import dummyDataJson from "@/components/dummydata.json";

/* ───────────────────────── Constants ────────────────────────────── */
const COUNT = 1_000;                                   // 👈 Number of engagements (reference only)
const PROSPECT_COUNT = 80;                             // 👈 Number of prospects (reference only)
const SERVICES = ["Tax Return", "Audit", "CAAS"] as const;
const PARTNERS = ["Alice", "Bob", "Carlos", "Dana"] as const;
const STATUSES = [
  "Kickoff",
  "Waiting Docs",
  "In Progress",
  "Filed",
  "Closed",
] as const;
const REFERRALS = [
  "LinkedIn",
  "CPA-to-CPA",
  "Website",
  "Client Referral",
  null,
] as const;

/* ───────────────────────── Data Export ────────────────────────────── */
// Export the data with proper type casting to ensure compatibility
export const dummyEngagements: FirmEngagement[] = dummyDataJson.dummyEngagements.map(engagement => ({
  id: Number(engagement.id),
  clientName: String(engagement.clientName),
  businessName: engagement.businessName === null ? null : String(engagement.businessName),
  service: engagement.service as typeof SERVICES[number],
  partner: engagement.partner as typeof PARTNERS[number],
  referral: engagement.referral as typeof REFERRALS[number],
  status: engagement.status as typeof STATUSES[number],
  createdAt: String(engagement.createdAt),
  dueDate: engagement.dueDate === null ? undefined : String(engagement.dueDate),
  documents: Number(engagement.documents)
}));

export const dummyProspects: ProspectiveClient[] = dummyDataJson.dummyProspects.map(prospect => ({
  id: Number(prospect.id),
  clientName: String(prospect.clientName),
  businessName: prospect.businessName === null ? null : String(prospect.businessName),
  isIndividual: Boolean(prospect.isIndividual),
  projectedService: prospect.projectedService as typeof SERVICES[number],
  partner: prospect.partner as typeof PARTNERS[number],
  referredBy: prospect.referredBy === null ? null : String(prospect.referredBy),
  createdAt: String(prospect.createdAt),
  potentialRevenue: Number(prospect.potentialRevenue)
}));

/* ───────────────────────── Validation ────────────────────────────── */
// Verify that we have the expected number of records
console.log(`Loaded ${dummyEngagements.length} engagements and ${dummyProspects.length} prospects`);
if (dummyEngagements.length !== COUNT || dummyProspects.length !== PROSPECT_COUNT) {
  console.warn(`Warning: Expected ${COUNT} engagements and ${PROSPECT_COUNT} prospects, ` +
               `but got ${dummyEngagements.length} engagements and ${dummyProspects.length} prospects`);
}