import { clerkMiddleware } from "@clerk/nuxt/server";

export default clerkMiddleware((event) => {
  if (!getRequestURL(event).pathname.startsWith("/api/")) {
    return;
  }

  const auth = event.context.auth();

  if (!auth?.userId) {
    throw createError({ statusCode: 401, statusMessage: "Authentication is required." });
  }
});
