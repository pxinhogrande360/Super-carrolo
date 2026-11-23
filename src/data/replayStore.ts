import { MatchReplay } from '../types/game';

const REPLAY_STORAGE_KEY = 'super_carrollo_last_replay_v1';

export function saveLastReplay(replay: MatchReplay): void {
  try {
    localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(replay));
  } catch {
    // ignore storage quota errors
  }
}

export function loadLastReplay(): MatchReplay | null {
  try {
    const raw = localStorage.getItem(REPLAY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MatchReplay;
    if (!parsed || !Array.isArray(parsed.events) || parsed.events.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearLastReplay(): void {
  try {
    localStorage.removeItem(REPLAY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
