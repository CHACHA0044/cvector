/**
 * Generate a pair of realistic dates (createdAt, updatedAt) over the last 3 years.
 * Ensure createdAt <= updatedAt.
 *
 * @returns {{createdAt: Date, updatedAt: Date}}
 */
export function generateDates() {
  const now = new Date();
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(now.getFullYear() - 3);

  const startMs = threeYearsAgo.getTime();
  const endMs = now.getTime();
  const totalDuration = endMs - startMs;

  // Generate a random createdAt date
  const createdAtMs = startMs + Math.random() * totalDuration;
  const createdAt = new Date(createdAtMs);

  // Determine if it was updated (e.g. 70% chance it has been updated since creation)
  let updatedAt;
  if (Math.random() < 0.7) {
    const remainingDuration = endMs - createdAtMs;
    // Update can happen anywhere between creation and now
    const updatedAtMs = createdAtMs + Math.random() * remainingDuration;
    updatedAt = new Date(updatedAtMs);
  } else {
    // If not updated, updatedAt equals createdAt
    updatedAt = new Date(createdAtMs);
  }

  return { createdAt, updatedAt };
}
