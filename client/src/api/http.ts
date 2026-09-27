import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5001",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const isLoginRequest =
        url.includes("/api/auth/login") ||
        url.includes("/api/auth/teacher/login");

      // Teachers have their own login screen; send them back to it.
      const loginPath = window.location.pathname.startsWith("/teacher")
        ? "/teacher/login"
        : "/login";
      const alreadyOnLogin = window.location.pathname === loginPath;

      localStorage.removeItem("token");

      if (!isLoginRequest && !alreadyOnLogin) {
        window.location.assign(loginPath);
      }
    }

    return Promise.reject(error);
  },
);

export async function unwrap<T>(
  request: Promise<{ data: { data: T } }>,
): Promise<T> {
  try {
    const response = await request;
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const body = error.response?.data as { message?: string } | undefined;

      const message =
        body?.message ??
        (error.response?.status === 401
          ? "Please log in to continue."
          : "Something went wrong. Please try again.");

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}
