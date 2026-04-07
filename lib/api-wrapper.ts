import { toast } from "sonner";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
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
  } catch(error) {
    console.error(error)
    toast.error("Invalid Server response")
    throw new Error("Invalid server response");
  }

  // ❗ HTTP-level error
  if (!res.ok) {
    console.error(json)
    toast.error(json.message)
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  // ❗ Backend-level error
  if (!json.success) {
    toast.error(json.message)
    throw new Error(json.message);
  }

  // ✅ return FULL response
  return json;
}
