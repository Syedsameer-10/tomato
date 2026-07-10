const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "");

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const readApiJson = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const body = await response.text();
  const htmlTitle = body.match(/<title>(.*?)<\/title>/i)?.[1];
  const message = htmlTitle
    ? `Server returned HTML instead of JSON: ${htmlTitle}`
    : "Server returned HTML instead of JSON. Check that the backend is running on port 3001.";

  throw new Error(message);
};
