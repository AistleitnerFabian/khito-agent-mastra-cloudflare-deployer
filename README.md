# Khito Mastra Agent

A minimal, private Mastra agent prepared for Cloudflare Workers.

## Start

1. Copy `.env.example` to `.env` and set `OPENROUTER_API_KEY`.
2. Install dependencies with `pnpm install`.
3. Run `pnpm dev` and open Mastra Studio at `http://localhost:4111`.

## Build

Run `pnpm build`. Mastra generates the Cloudflare Worker into `.mastra/output/`.

The Worker has `workers_dev: false` and no route or custom domain. Bind it to a caller Worker before exposing any public application endpoint.

## Agent structure

The Khito agent uses Mastra's file-based discovery. See [the agent guide](docs/mastra-file-based-agent.md) for its layout, local development, and extension points.
