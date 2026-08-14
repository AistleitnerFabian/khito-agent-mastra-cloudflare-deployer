# Khito agent platform

This repository contains two pnpm workspaces:

- `mastra/` deploys the private `khito-agent` Cloudflare Worker.
- `web/` is the public Nuxt application and holds the `KHITO_AGENT` service binding.

Run `pnpm dev:mastra` or `pnpm dev:web` for local development. Build all workspaces with `pnpm build`.
