const AUTH_STORAGE_KEY = "tomato_auth_session";

const defaultAuthSession = {
  user: null,
  token: null,
};

const canUseStorage = () => typeof window !== "undefined" && window.localStorage;

export const loadAuthSession = () => {
  if (!canUseStorage()) return defaultAuthSession;

  try {
    const savedSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!savedSession) return defaultAuthSession;

    return {
      ...defaultAuthSession,
      ...JSON.parse(savedSession),
    };
  } catch (error) {
    console.warn("Unable to load auth session:", error);
    return defaultAuthSession;
  }
};

export const saveAuthSession = (user, token) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
};

export const clearAuthSession = () => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};
