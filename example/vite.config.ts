import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    base: "./",
    plugins: [react()],
    resolve: {
        alias: {
            "@diagrams/graph": path.resolve(__dirname, "../graph/src"),
            "@diagrams/sidebar": path.resolve(__dirname, "../sidebar/src"),
        },
    },
    server: {
        fs: {
            allow: [path.resolve(__dirname, "..")],
        },
    },
});
