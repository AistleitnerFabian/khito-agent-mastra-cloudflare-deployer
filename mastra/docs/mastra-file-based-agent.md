# Khito file-based Mastra agent

`khito-agent` is a native file-based Mastra agent. Mastra discovers it when the project is run through the Mastra CLI.

```text
src/mastra/
  agents/
    khito-agent/
      config.ts
      instructions.md
```

## Files

- `config.ts` defines the stable agent identity and model.
- `instructions.md` is the always-on system prompt. Keep it short and put only behavior that applies on every request here.

The directory name is the agent's default identifier. This setup explicitly keeps the public identifier as `khito-agent` so it remains stable if the display name changes later.

## Run it

1. Copy `.env.example` to `.env` and set `OPENROUTER_API_KEY`.
2. Run `pnpm dev`.
3. Open `http://localhost:4111` and choose **Khito Agent** in Mastra Studio.

Mastra discovers file-based agents only through `mastra dev` and `mastra build`. Do not import the `mastra` instance from another server framework expecting filesystem discovery to occur; register the agent in code in that case, or keep Mastra running as its own service.

The agent always uses OpenRouter. Its current model is `openrouter/google/gemini-3.6-flash`; select any future model through the OpenRouter provider namespace and keep `OPENROUTER_API_KEY` as the only model-provider secret.

## Extend it

Keep agent-specific capabilities beside the agent:

```text
src/mastra/agents/khito-agent/
  tools/            # model-callable TypeScript tools
  skills/           # load-on-demand Markdown guidance
  memory.ts         # persistent conversation memory
  subagents/        # specialist agents
```

Add only the directories the agent needs.

## Cloudflare boundary

In the currently installed beta file-based routing API, an agent without `workspace.ts` receives a default local filesystem and shell workspace during CLI discovery. This project does not add workspace tools or instruct the agent to use them, but the default exists in the generated runtime.

That default is suitable for local Studio experimentation, not a production Cloudflare capability. Do not add a `workspace/` directory, filesystem tools, or shell-oriented instructions to this Worker. If the agent needs durable file access in production, choose a Cloudflare-native store and an explicit tool instead of relying on the file-based default workspace.
