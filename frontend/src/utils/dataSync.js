const DATA_SYNC_EVENT = 'campusbook:data-sync';
const DATA_SYNC_STORAGE_KEY = 'campusbook:data-sync';

export const signalAppDataChanged = (scope = 'all') => {
  const detail = { scope, timestamp: Date.now() };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATA_SYNC_EVENT, { detail }));

    try {
      localStorage.setItem(DATA_SYNC_STORAGE_KEY, JSON.stringify(detail));
    } catch {
      // Ignore localStorage sync issues.
    }
  }
};

export const subscribeToAppDataChanges = (callback) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleCustomEvent = (event) => {
    callback(event.detail || { scope: 'all', timestamp: Date.now() });
  };

  const handleStorageEvent = (event) => {
    if (event.key !== DATA_SYNC_STORAGE_KEY || !event.newValue) return;

    try {
      callback(JSON.parse(event.newValue));
    } catch {
      callback({ scope: 'all', timestamp: Date.now() });
    }
  };

  window.addEventListener(DATA_SYNC_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(DATA_SYNC_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
};
