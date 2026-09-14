// @ts-nocheck

import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";
import { pluginGenerateEntrypoints } from "@pimcore/studio-ui-bundle/rsbuild/plugins";
import path from "path";
import fs from "fs";
import packages from "./package.json";

const buildPath = path.resolve(__dirname, "..", "public", "build");

if (fs.existsSync(buildPath)) {
    fs.readdirSync(buildPath).forEach((file) => {
        if (file !== "studio-npm-package.tgz") {
            fs.rmSync(path.resolve(buildPath, file), { recursive: true });
        }
    });
}

if (!fs.existsSync(buildPath)) {
    fs.mkdirSync(buildPath, { recursive: true });
}

let nodeEnv = process.env.NODE_ENV;
let env: "development" | "production" = "production";

if (nodeEnv !== env) {
    env = "development";
}

export default defineConfig({
    mode: env,
    source: {
        entry: {
            main: "./js/src/main.ts",
        },
    },
    output: {
        manifest: true,
        assetPrefix: "/bundles/torqpimcoreexpressiontester/build",
        distPath: {
            root: buildPath,
        },
    },
    tools: {
        bundlerChain: (chain) => {
            chain.output.uniqueName("torq_expression_tester_bundle");
        },
    },
    plugins: [
        pluginGenerateEntrypoints(),
        pluginReact(),
        pluginModuleFederation({
            name: "torq_expression_tester_bundle",
            filename: "static/js/remoteEntry.js",
            exposes: {
                ".": "./js/src/main.ts",
            },
            dts: false,
            remotes: {
                "@pimcore/studio-ui-bundle": `promise new Promise(resolve => {
          const studioUIBundleRemoteUrl = window.StudioUIBundleRemoteUrl
          const script = document.createElement('script')

          let hasScript = false;

          document.querySelectorAll('script').forEach((el) => {
            const elPathname = el.src.replace(/https?:\\/\\/[^/]+/, '')
            const studioUIBundleRemoteUrlPathname = studioUIBundleRemoteUrl.replace(/https?:\\/\\/[^/]+/, '')

            if (elPathname === studioUIBundleRemoteUrlPathname) {
              hasScript = true;
              return;
            }
          })

          if (hasScript) {
            resolve({
              get: (request) => window['pimcore_studio_ui_bundle'].get(request),
              init: (...arg) => {
                try {
                  return window['pimcore_studio_ui_bundle'].init(...arg)
                } catch(e) {
                  console.log('remote container already initialized')
                }
              }
            })
            return
          }

          script.src = studioUIBundleRemoteUrl
          script.onload = () => {
            const proxy = {
              get: (request) => window['pimcore_studio_ui_bundle'].get(request),
              init: (...arg) => {
                try {
                  return window['pimcore_studio_ui_bundle'].init(...arg)
                } catch(e) {
                  console.log('remote container already initialized')
                }
              }
            }
            resolve(proxy)
          }
          document.head.appendChild(script);
        })
        `,
            },
            shared: {
                ...packages.dependencies,
                react: {
                    singleton: true,
                    eager: true,
                    requiredVersion: false,
                },
                "react-dom": {
                    singleton: true,
                    eager: true,
                    requiredVersion: false,
                },
            },
        }),
    ],
});
