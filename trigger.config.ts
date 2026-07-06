import { defineConfig } from "@trigger.dev/sdk/v3";
import { playwright } from "@trigger.dev/build/extensions/playwright";

export default defineConfig({
  project: "proj_hbgmuokflilebytpwhkm",
  dirs: ["./trigger"],
  maxDuration: 300,
  build: {
    external: ["chromium-bidi"],
    extensions: [
      playwright(),
    ],
  },
});