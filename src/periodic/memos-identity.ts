export function getMemosUserIdFromOwner(owner: string | null | undefined): number | null {
  const matchedUserId = owner?.match(/^users\/(\d+)$/);
  if (!matchedUserId?.[1]) {
    return null;
  }

  const parsedUserId = Number.parseInt(matchedUserId[1], 10);
  return Number.isNaN(parsedUserId) ? null : parsedUserId;
}

export function isMemosUserResourceName(value: string | null | undefined): value is string {
  return Boolean(value?.match(/^users\/[^/]+$/));
}

export function getMemosUserResourceNameFromOwner(owner: string | null | undefined): string | null {
  return isMemosUserResourceName(owner) ? owner : null;
}

export function celString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}
