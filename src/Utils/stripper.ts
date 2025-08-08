export const stripCodeFences = (input: string): string => {
  return input
    .trim()
    .replace(/^```(?:json)?[\r\n]?/, '')
    .replace(/\s*```$/g, '')
    .trim();
};