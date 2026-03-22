type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let json: ApiResponse<T>;

  try {
    json = await res.json();
  } catch {
    throw new Error("Invalid server response");
  }

  // ❗ HTTP-level error
  if (!res.ok) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  // ❗ Backend-level error
  if (!json.success) {
    throw new Error(json.message);
  }

  // ✅ return FULL response
  return json;
}
