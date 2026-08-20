type InboxFetchOptions = {
  body?: FormData | Record<string, unknown>;
  method?: "POST" | "PATCH" | "DELETE";
};

export function useClerkFetch() {
  const { getToken } = useAuth();

  return async function clerkFetch<T>(request: string, options: InboxFetchOptions = {}) {
    const token = await getToken.value();
    const headers = new Headers();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (options.body && !(options.body instanceof FormData)) {
      headers.set("content-type", "application/json");
    }

    return $fetch(request, { ...options, headers }) as Promise<T>;
  };
}
