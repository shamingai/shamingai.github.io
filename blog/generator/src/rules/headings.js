export function headingsFromBody(body) {
  return String(body ?? "")
    .split(/\r?\n/)
    .map((line) => /^(#{2,6})\s+(\S.*?)\s*$/.exec(line))
    .filter(Boolean)
    .map((match) => ({
      text: match[2],
      anchor: match[2],
      level: match[1].length
    }));
}
