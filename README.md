# Khito agent platform

This repository contains two pnpm workspaces:

- `mastra/` deploys the private `khito-agent` Cloudflare Worker.
- `web/` is the public Nuxt application and holds the `KHITO_AGENT` service binding.

Run `pnpm dev:mastra` or `pnpm dev:web` for local development. Build all workspaces with `pnpm build`.

## Local Docling service

Start the local Docling container before `pnpm dev`:

```sh
pnpm dev:docling
```

This runs the same CPU-based Docling image as the VPS (`quay.io/docling-project/docling-serve-cpu`) on http://localhost:5001 and keeps the model cache in a named volume. Stop it with `pnpm dev:docling:down`.

In local development, inbox items bypass the Cloudflare Queue and are processed directly against this container and the local Mastra dev server (http://localhost:4111). Classification additionally needs `mastra/.env` with `OPENROUTER_API_KEY` (see `mastra/.env.example`).

## VPS access

Connect to the Hetzner VPS through Cloudflare Access:

```sh
ssh -o ProxyCommand="cloudflared access ssh --hostname %h" root@hetzner.husq.tech
```

This requires the `cloudflared` CLI and an authenticated Cloudflare Access session.

## Docling VPS service

Start the persistent CPU-based Docling service with Podman:

```sh
podman run -d --name docling-serve --restart=always -p 5001:5001 --memory=6g -e OMP_NUM_THREADS=3 quay.io/docling-project/docling-serve-cpu
```
