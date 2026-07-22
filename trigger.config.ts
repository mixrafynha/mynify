import { defineConfig } from "@trigger.dev/sdk/v3";
import { playwright } from "@trigger.dev/build/extensions/playwright";
import { aptGet } from "@trigger.dev/build/extensions/core";

export default defineConfig({
  project: "proj_hbgmuokflilebytpwhkm",
  dirs: ["./trigger"],
  maxDuration: 300,
  build: {
    external: ["chromium-bidi"],
    extensions: [
      aptGet({ packages: ["fontconfig"] }),
      playwright(),
    ],
  },
});
