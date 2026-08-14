import { Mastra } from "@mastra/core/mastra";
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";

export const mastra = new Mastra({
  deployer: new CloudflareDeployer({
    name: "khito-agent",
    workers_dev: false,
  }),
});
