import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
export function validWorkerSecret(provided: string | null, expected = process.env.PREFLIGHT_WORKER_SECRET) {
  if (!provided || !expected || expected.length < 24) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(provided), digest(expected));
}
