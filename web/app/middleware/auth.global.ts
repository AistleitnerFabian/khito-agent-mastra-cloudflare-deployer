const publicPaths = ["/sign-in"];

export default defineNuxtRouteMiddleware(async (to) => {
  if (publicPaths.some(path => to.path === path || to.path.startsWith(`${path}/`))) {
    return;
  }

  if (import.meta.server) {
    const event = useRequestEvent();

    if (!event?.context.auth?.().userId) {
      return navigateTo("/sign-in");
    }

    return;
  }

  const clerk = useClerk();

  if (!clerk.value?.loaded) {
    await new Promise<void>((resolve) => {
      const stop = watch(
        () => clerk.value?.loaded,
        (loaded) => {
          if (!loaded) return;

          stop();
          resolve();
        },
        { immediate: true },
      );
    });
  }

  if (!clerk.value?.isSignedIn) {
    return navigateTo("/sign-in");
  }
});
