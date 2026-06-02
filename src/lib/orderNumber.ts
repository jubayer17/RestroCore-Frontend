export function getOrderNumber(id: string): string {
  const m = /(\d+)$/.exec(id);
  return m?.[1] ?? id;
}

