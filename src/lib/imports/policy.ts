type ConfirmableBatch = {
  confirmedAt: Date | null;
  status: string;
};

export function isAdminEmailAllowed(
  userEmail: string | null | undefined,
  configuredAdminEmail: string | null | undefined,
) {
  const user = userEmail?.trim().toLowerCase();
  const configured = configuredAdminEmail?.trim().toLowerCase();
  return Boolean(user && configured && user === configured);
}

export function canConfirmBatch(batch: ConfirmableBatch) {
  return (
    !batch.confirmedAt &&
    !["importing", "completed", "cancelled", "failed"].includes(batch.status)
  );
}

export type SuppressionComparable = {
  normalizedEmail?: string | null;
  normalizedDomain?: string | null;
  normalizedPhone?: string | null;
  sourceIdentifier?: string | null;
};

export function matchesSuppression(
  candidate: SuppressionComparable,
  entry: {
    normalizedEmail?: string | null;
    normalizedDomain?: string | null;
    normalizedPhone?: string | null;
    normalizedSourceIdentifier?: string | null;
  },
) {
  return Boolean(
    (candidate.normalizedEmail &&
      entry.normalizedEmail === candidate.normalizedEmail) ||
      (candidate.normalizedDomain &&
        entry.normalizedDomain === candidate.normalizedDomain) ||
      (candidate.normalizedPhone &&
        entry.normalizedPhone === candidate.normalizedPhone) ||
      (candidate.sourceIdentifier &&
        entry.normalizedSourceIdentifier === candidate.sourceIdentifier),
  );
}
