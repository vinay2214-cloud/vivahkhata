/** Normalised form of a person's name, used for search and duplicate checks. */
export function generateNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}
