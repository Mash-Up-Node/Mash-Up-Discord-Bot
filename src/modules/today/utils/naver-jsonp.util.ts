export function parseJsonp<T>(responseText: string): T {
  const match = responseText.match(/^[^(]+\(([\s\S]*)\);\s*$/);

  if (!match) {
    throw new Error('Invalid JSONP response');
  }

  return JSON.parse(match[1]) as T;
}
