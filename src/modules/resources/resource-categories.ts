export const RESOURCE_CATEGORIES = [
  'prevencion',
  'orientacion',
  'formacion',
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

function stripAccents(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeResourceCategory(
  value: unknown,
): ResourceCategory | null {
  if (typeof value !== 'string') return null;
  const normalized = stripAccents(value).trim().toLowerCase();
  if (!normalized) return null;

  if (normalized === 'prevencion') return 'prevencion';
  if (normalized === 'orientacion') return 'orientacion';
  if (normalized === 'formacion') return 'formacion';
  return null;
}
