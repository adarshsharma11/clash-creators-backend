export const isValidSupportPoints = (
  points: number,
  minimum: number,
  maximum: number
): { ok: true } | { ok: false; reason: string } => {
  if (!Number.isInteger(points) || points <= 0) {
    return { ok: false, reason: 'Support points must be a positive integer' };
  }
  if (points < minimum) {
    return { ok: false, reason: `Support points must be at least ${minimum}` };
  }
  if (points > maximum) {
    return { ok: false, reason: `Support points cannot exceed ${maximum}` };
  }
  return { ok: true };
};
