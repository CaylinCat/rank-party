const PLAYER_ID_KEY = "playerId";
const GAME_ID_KEY = "gameId";
const IS_HOST_KEY = "isHost";

export function setPlayerSession(
  playerId: string,
  gameId: string,
  isHost: boolean
) {
  localStorage.setItem(PLAYER_ID_KEY, playerId);
  localStorage.setItem(GAME_ID_KEY, gameId);
  localStorage.setItem(IS_HOST_KEY, String(isHost));
}

export function getPlayerId(): string | null {
  return localStorage.getItem(PLAYER_ID_KEY);
}

export function getGameId(): string | null {
  return localStorage.getItem(GAME_ID_KEY);
}

export function isHost(): boolean {
  return localStorage.getItem(IS_HOST_KEY) === "true";
}
