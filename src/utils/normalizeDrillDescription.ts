export function normalizeDrillDescription(description: string): string {
  const normalizedLineEndings = description.replace(/\r\n?/g, "\n");

  return normalizedLineEndings
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/[ \t]*\n[ \t]*/g, " "))
    .join("\n\n");
}
