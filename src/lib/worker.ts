export function generateWorkerSlug(
  firstName: string,
  lastName: string,
  location: string,
  category: string
): string {
  const parts = [
    firstName,
    lastName,
    location?.toLowerCase() || 'harare',
    category?.toLowerCase() || 'worker',
  ]
  return parts
    .join('-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
