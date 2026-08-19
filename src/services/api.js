import axios from "axios";
import { colorFromId } from "../utils";

const VITE_PROJECT_ID = import.meta.env.VITE_PROJECT_ID;
const VITE_BASE_HOST = (
  import.meta.env.VITE_BASE_HOST || "http://localhost"
).replace(/\/$/, "");
const VITE_AUTH_HOST = (
  import.meta.env.VITE_AUTH_HOST ||
  import.meta.env.VITE_BASE_HOST ||
  "http://localhost"
).replace(/\/$/, "");
const VITE_AUTH_PATH = (import.meta.env.VITE_AUTH_PATH ?? "/auth")
  .replace(/^\/+/, "")
  .replace(/\/+$/, "");

export const AUTH_BASE = `${VITE_AUTH_HOST}/${VITE_AUTH_PATH}`.replace(/\/$/, "");
export const AUTH_URL = `${AUTH_BASE}/${VITE_PROJECT_ID}`;

export function saveSession({ accessToken, refreshToken, user, email }) {
  const userId = user?.id || user?.sub || "";
  localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("rol", user?.rol || user?.role || "user");
  localStorage.setItem("userId", userId);
  localStorage.setItem("userName", user?.name || user?.email || email || "");
  localStorage.setItem("userColor", colorFromId(userId));
}

export async function exchangeGoogleLogin(code) {
  const { data } = await axios.post(
    `${AUTH_BASE}/google/exchange`,
    { code },
  );
  return data;
}

export async function exchangeMicrosoftLogin(code) {
  const { data } = await axios.post(
    `${AUTH_BASE}/microsoft/exchange`,
    { code },
  );
  return data;
}

export const getGoogleLoginUrl = () => `${AUTH_URL}/google`;

export function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("rol");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userColor");
}

let refreshPromise = null;

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return false;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { data } = await axios.post(`${AUTH_URL}/refresh-token`, {
        refreshToken,
      });
      localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken)
        localStorage.setItem("refreshToken", data.refreshToken);
      return true;
    } catch {
      clearSession();
      window.location.href = "/";
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

const authAxios = axios.create({
  baseURL: AUTH_URL,
});

authAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authAxios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const isAuthEndpoint =
        original.url.includes("/login") ||
        original.url.includes("/signup-direct") ||
        original.url.includes("/forgot-password") ||
        original.url.includes("/refresh-token");
      if (isAuthEndpoint) return Promise.reject(error);

      const ok = await refreshAccessToken();
      if (!ok) return Promise.reject(error);

      original.headers.Authorization = `Bearer ${localStorage.getItem("accessToken")}`;
      return authAxios(original);
    }
    return Promise.reject(error);
  },
);

export default authAxios;
