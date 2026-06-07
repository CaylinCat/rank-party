export function generateLobbyCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}
