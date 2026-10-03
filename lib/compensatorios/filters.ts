export function parseCompensatoryMonth(value: string | undefined): string | undefined {
  return value && /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value) ? value : undefined;
}
