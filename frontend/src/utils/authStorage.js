const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const safeStorage = {
  getSession() {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  },
  getLocal() {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  },
};

export const hydrateLegacyAuth = () => {
  const session = safeStorage.getSession();
  const local = safeStorage.getLocal();

  if (!session || !local) return;
  if (session.getItem(TOKEN_KEY)) return;

  const token = local.getItem(TOKEN_KEY);
  const user = local.getItem(USER_KEY);

  if (token) {
    session.setItem(TOKEN_KEY, token);
  }

  if (user) {
    session.setItem(USER_KEY, user);
  }

  if (token || user) {
    local.removeItem(TOKEN_KEY);
    local.removeItem(USER_KEY);
  }
};

export const getStoredToken = () => {
  hydrateLegacyAuth();
  return safeStorage.getSession()?.getItem(TOKEN_KEY) || null;
};

export const getStoredUser = () => {
  hydrateLegacyAuth();
  const raw = safeStorage.getSession()?.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    clearStoredAuth();
    return null;
  }
};

export const setStoredAuth = (user, token) => {
  const session = safeStorage.getSession();
  if (!session) return;

  session.setItem(TOKEN_KEY, token);
  session.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = () => {
  safeStorage.getSession()?.removeItem(TOKEN_KEY);
  safeStorage.getSession()?.removeItem(USER_KEY);
  safeStorage.getLocal()?.removeItem(TOKEN_KEY);
  safeStorage.getLocal()?.removeItem(USER_KEY);
};

export const setStoredUser = (user) => {
  const session = safeStorage.getSession();
  if (!session) return;

  session.setItem(USER_KEY, JSON.stringify(user));
};
