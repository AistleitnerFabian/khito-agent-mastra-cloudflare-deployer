import { Mastra } from "@mastra/core/mastra";
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";

export const mastra = new Mastra({
  deployer: new CloudflareDeployer({
    name: "khito-agent",
    compatibility_date: "2026-08-14",
    workers_dev: false,
  }),
});
