import { toast } from "sonner";

export type MetaResponse = {
  page: number;
  limit: number;
  count: number;
  total: number;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: MetaResponse;
};

// ========================
// GLOBAL REFRESH STATE
// ========================
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh-token", {
      method: "POST",
      credentials: "include",
    });

    return res.ok;
  } catch {
    return false;
  }
}

// ========================
// CORE FETCH WRAPPER
// ========================
export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  _retried = false,
): Promise<ApiResponse<T>> {
  const isFormData = options.body instanceof FormData;

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  let json: ApiResponse<T>;

  try {
    json = await res.json();
  } catch {
    toast.error("Invalid server response");
    throw new Error("Invalid server response");
  }

  // ========================
  // SUCCESS
  // ========================
  if (res.ok && json.success) {
    return json;
  }

  // ========================
  // HANDLE 401 ONCE
  // ========================
  if (res.status === 401 && !_retried) {
    if (!refreshPromise) {
      refreshPromise = refreshSession().finally(() => {
        refreshPromise = null;
      });
    }

    const ok = await refreshPromise;

    if (!ok) {
      toast.error("Session expired. Please login again.");
      throw new Error("Unauthorized");
    }

    // retry ONCE only
    const retryRes = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
      },
    });

    let retryJson: ApiResponse<T>;

    try {
      retryJson = await retryRes.json();
    } catch {
      toast.error("Invalid server response");
      throw new Error("Invalid server response");
    }

    if (!retryRes.ok || !retryJson.success) {
      toast.error(retryJson.message);
      throw new Error(retryJson.message || "Request failed");
    }

    return retryJson;
  }

  // ========================
  // OTHER ERRORS
  // ========================
  toast.error(json.message);
  throw new Error(json.message || `HTTP ${res.status}`);
}
