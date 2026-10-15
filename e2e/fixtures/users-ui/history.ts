// Browser-only replacement: no session, credentials, database, or mutations.
export default async function listUserVacationGrants({ userId }: { userId: string }) {
  const response = await fetch(`/fixture-history?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) return { success: false as const, error: "Error simulado" };
  return { success: true as const, data: await response.json() };
}
