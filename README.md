# Khito agent platform

This repository contains two pnpm workspaces:

- `mastra/` deploys the private `khito-agent` Cloudflare Worker.
- `web/` is the public Nuxt application and holds the `KHITO_AGENT` service binding.

Run `pnpm dev:mastra` or `pnpm dev:web` for local development. Build all workspaces with `pnpm build`.

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
