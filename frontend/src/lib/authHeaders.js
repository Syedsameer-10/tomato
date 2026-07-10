export const createAuthHeaders = (token, extraHeaders = {}) => ({
  ...extraHeaders,
  Authorization: `Bearer ${token}`,
});
