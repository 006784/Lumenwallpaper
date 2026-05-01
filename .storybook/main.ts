import type { StorybookConfig } from '@storybook/nextjs-vite';
import { existsSync } from "node:fs";
import { join } from "node:path";

const publicDir = join(process.cwd(), "public");

const config: StorybookConfig = {
  "stories": [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "staticDirs": existsSync(publicDir) ? ["../public"] : [],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding"
  ],
  "framework": "@storybook/nextjs-vite"
};
export default config;
