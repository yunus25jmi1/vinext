import { defineConfig } from "vite";
import vinext from "vinext";

export default defineConfig({
  plugins: [vinext()],
  // No manual ssr.noExternal needed - vinext includes validator in its known problematic ESM packages list
});
