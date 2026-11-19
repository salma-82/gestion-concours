import { getStudentScope } from './studentProgress';

const UPDATE_EVENT = 'daily-platform-time-updated';

const localDayKey = (value = new Date()) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const notifyUpdate = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(UPDATE_EVENT));
};

export const getDailyPlatformTimeStorageKey = (day = new Date()) =>
  `student-platform-time:${getStudentScope()}:${typeof day === 'string' ? day : localDayKey(day)}`;

export const readDailyPlatformTimeSeconds = (day = new Date()) => {
  if (typeof localStorage === 'undefined') return 0;
  try {
    const seconds = Number(localStorage.getItem(getDailyPlatformTimeStorageKey(day)) || 0);
    return Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  } catch {
    return 0;
  }
};

const addDailyPlatformTimeSeconds = (seconds, day) => {
  if (typeof localStorage === 'undefined' || seconds <= 0) return;
  try {
    const key = getDailyPlatformTimeStorageKey(day);
    const total = readDailyPlatformTimeSeconds(day) + seconds;
    localStorage.setItem(key, String(total));
    notifyUpdate();
  } catch {
    // Keep the platform usable if browser storage is unavailable.
  }
};

export const startDailyPlatformTimeTracking = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

  const owner = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const lockKey = `student-platform-time-lock:${getStudentScope()}`;
  let trackedDay = localDayKey();
  let lastTickAt = Date.now();
  let lastFlushAt = lastTickAt;
  let pendingSeconds = 0;
  let hasLock = false;

  const acquireOrRenewLock = (now) => {
    if (document.visibilityState !== 'visible') return false;
    try {
      const lock = JSON.parse(localStorage.getItem(lockKey) || 'null');
      if (lock?.owner !== owner && Number(lock?.expiresAt) > now) return false;
      if (lock?.owner === owner && Number(lock.expiresAt) - now > 2000) return true;
      localStorage.setItem(lockKey, JSON.stringify({ owner, expiresAt: now + 5000 }));
      return true;
    } catch {
      return true;
    }
  };

  const releaseLock = () => {
    try {
      const lock = JSON.parse(localStorage.getItem(lockKey) || 'null');
      if (lock?.owner === owner) localStorage.removeItem(lockKey);
    } catch {
      // Ignore storage errors during tab close or sign-out.
    }
  };

  const flush = () => {
    if (pendingSeconds > 0) addDailyPlatformTimeSeconds(pendingSeconds, trackedDay);
    pendingSeconds = 0;
    lastFlushAt = Date.now();
  };

  const tick = () => {
    const now = Date.now();
    const today = localDayKey(new Date(now));
    if (today !== trackedDay) {
      if (hasLock) flush();
      trackedDay = today;
      pendingSeconds = 0;
      lastTickAt = now;
      lastFlushAt = now;
      notifyUpdate();
    }

    if (document.visibilityState !== 'visible') {
      if (hasLock) flush();
      releaseLock();
      hasLock = false;
      lastTickAt = now;
      return;
    }

    const elapsed = Math.floor((now - lastTickAt) / 1000);
    const previouslyHadLock = hasLock;
    const nowHasLock = acquireOrRenewLock(now);
    if (previouslyHadLock && nowHasLock && elapsed > 0 && elapsed <= 5) {
      pendingSeconds += elapsed;
    } else if (!previouslyHadLock && nowHasLock) {
      lastFlushAt = now;
    }
    hasLock = nowHasLock;
    lastTickAt = now;

    if (hasLock && now - lastFlushAt >= 10000) flush();
  };

  const handleVisibilityChange = () => {
    const now = Date.now();
    if (document.visibilityState !== 'visible') {
      if (hasLock) flush();
      releaseLock();
      hasLock = false;
      lastTickAt = now;
      return;
    }
    trackedDay = localDayKey(new Date(now));
    lastTickAt = now;
    lastFlushAt = now;
    hasLock = acquireOrRenewLock(now);
    notifyUpdate();
  };

  hasLock = acquireOrRenewLock(lastTickAt);
  const intervalId = window.setInterval(tick, 1000);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', flush);
  notifyUpdate();

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', flush);
    if (hasLock) flush();
    releaseLock();
  };
};
