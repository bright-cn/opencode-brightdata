import type { Plugin } from "@opencode-ai/plugin";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const current_dir = dirname(fileURLToPath(import.meta.url));

export const plugin: Plugin = async () => {
  return {
    async config(input) {
      input.instructions ??= [];
      // @ts-expect-error -- skills is a new opencode feature, types not yet updated
      input.skills ??= {};
      // @ts-expect-error -- skills is a new opencode feature, types not yet updated
      input.skills.paths ??= [];

      input.instructions.push(
        join(current_dir, "skills", "brightdata-cli", "rules", "install.md"),
      );

      // @ts-expect-error -- skills is a new opencode feature, types not yet updated
      input.skills.paths.push(join(current_dir, "skills"));
    },

    "shell.env": async (_input, output) => {
      if (process.env.BRIGHTDATA_API_KEY) {
        output.env.BRIGHTDATA_API_KEY = process.env.BRIGHTDATA_API_KEY;
      }
      if (process.env.BRIGHTDATA_UNLOCKER_ZONE) {
        output.env.BRIGHTDATA_UNLOCKER_ZONE = process.env.BRIGHTDATA_UNLOCKER_ZONE;
      }
      if (process.env.BRIGHTDATA_SERP_ZONE) {
        output.env.BRIGHTDATA_SERP_ZONE = process.env.BRIGHTDATA_SERP_ZONE;
      }
      if (process.env.BRIGHTDATA_POLLING_TIMEOUT) {
        output.env.BRIGHTDATA_POLLING_TIMEOUT = process.env.BRIGHTDATA_POLLING_TIMEOUT;
      }
    },
  };
};

export default plugin;
