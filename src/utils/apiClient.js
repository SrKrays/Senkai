// Cliente HTTP mínimo para hablar con Senkai.Api. Nada de librerías extra —
// fetch alcanza para lo que hace falta en esta fase (login/registro/me).
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5080";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = data?.message || data?.title || `Error ${res.status} al hablar con el servidor.`;
    throw new ApiError(message, res.status);
  }

  return data;
}

// Para respuestas binarias (los gifs de ejercicios de WorkoutX, vía nuestro
// propio proxy) — no se puede usar un <img src> directo porque el endpoint
// exige el Bearer token, así que se trae como blob y se arma un object URL.
export async function apiFetchBlob(path, { token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) throw new ApiError(`Error ${res.status} al pedir el recurso.`, res.status);
  return res.blob();
}
