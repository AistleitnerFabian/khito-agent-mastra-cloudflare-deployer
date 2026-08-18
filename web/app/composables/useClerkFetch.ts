type InboxFetchOptions = {
  body?: FormData;
  method?: "POST";
};

export function useClerkFetch() {
  const { getToken } = useAuth();

  return async function clerkFetch<T>(request: string, options: InboxFetchOptions = {}) {
    const token = await getToken.value();
    const headers = new Headers();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return $fetch(request, { ...options, headers }) as Promise<T>;
  };
}
