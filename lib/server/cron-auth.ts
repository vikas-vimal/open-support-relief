import type { NextRequest } from "next/server";

/**
 * Authorises a scheduled-job request.
 *
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; the same header lets
 * the job be triggered by hand (curl) on other hosts. Without a configured
 * secret the endpoint is closed, never open — a purge route that anyone could
 * hit would be a denial-of-service and a data-destruction lever.
 */
export function isAuthorizedCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
