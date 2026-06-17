#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { ensureDir, fileSize, remove, repoRoot, run, sha256File } from "./lib";
import { ARDUINO_TOOL_FALLBACKS, GO_TOOL_TARGETS } from "./tool-manifest";

function parseCli(argv: string[]) {
  const out = {
    tools: [] as string[],
    outDir: "distrib",
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--tool") out.tools.push(argv[++i]);
    else if (arg === "--out-dir") out.outDir = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (out.tools.length === 0) out.tools = ["gen-rodata-ld", "zephyr-sketch-tool"];
  return out;
}

function main() {
  const root = repoRoot();
  const args = parseCli(process.argv.slice(2));
  const outDir = resolve(root, args.outDir);
  ensureDir(outDir);

  for (const tool of args.tools) {
    const definition = ARDUINO_TOOL_FALLBACKS[tool];
    if (!definition) throw new Error(`Unknown Go tool '${tool}'`);
    const toolDir = join(root, "tools", tool);
    if (!existsSync(join(toolDir, "go.mod"))) throw new Error(`Missing Go module for ${tool}`);

    for (const target of GO_TOOL_TARGETS) {
      const archive = join(outDir, `${tool}-${definition.version}-${target.host}${target.ext}`);
      const packageRoot = join(outDir, `${tool}-${definition.version}-${target.host}`);
      const targetDir = join(packageRoot, target.host);
      const binary = join(targetDir, target.goos === "windows" ? `${tool}.exe` : tool);

      remove(packageRoot);
      remove(archive);
      ensureDir(targetDir);
      console.log(`Building ${tool} for ${target.goos}/${target.goarch} (${target.host})`);
      run("go", ["build", "-o", binary], {
        cwd: toolDir,
        env: { GOOS: target.goos, GOARCH: target.goarch },
      });

      if (target.ext === ".zip") {
        run("zip", ["-qr", archive, target.host], { cwd: packageRoot });
      } else {
        run("tar", ["-czf", archive, target.host], { cwd: packageRoot });
      }
      console.log(`${basename(archive)} ${fileSize(archive)} SHA-256:${sha256File(archive)}`);
      remove(packageRoot);
    }
  }
}

main();
