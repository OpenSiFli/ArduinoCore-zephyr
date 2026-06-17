#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import {
  archiveName,
  fileSize,
  getBoard,
  getCoreVersion,
  pathToFileUrl,
  repoRoot,
  sha256File,
  type ToolDefinition,
  type ToolSystem,
  writeText,
} from "./lib";
import { ARDUINO_TOOL_FALLBACKS, GITHUB_MIRROR_PREFIX, GO_TOOL_TARGETS, SFTOOL, ZEPHYR_ARM_EABI } from "./tool-manifest";

type PackageIndex = {
  packages: Array<Record<string, unknown>>;
};

type GenerateOptions = {
  core: string;
  version: string;
  releaseTag: string;
  repo: string;
  toolsDir: string;
  githubOut: string;
  cnOut: string;
  assetBaseUrl?: string;
  requireLocalTools: boolean;
};

export function toChinaMirrorUrl(url: string): string {
  if (!url.startsWith("https://github.com/")) return url;
  return `${GITHUB_MIRROR_PREFIX}${url.slice("https://github.com/".length)}`;
}

export function mirrorPackageIndex<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => mirrorPackageIndex(item)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        key === "url" && typeof item === "string" ? toChinaMirrorUrl(item) : mirrorPackageIndex(item),
      ]),
    ) as T;
  }
  return value;
}

export function buildToolFromArchives(
  name: string,
  version: string,
  toolsDir: string,
  releaseBaseUrl: string,
  requireLocal: boolean,
): ToolDefinition {
  const systems: ToolSystem[] = [];
  for (const target of GO_TOOL_TARGETS) {
    const archiveFileName = `${name}-${version}-${target.host}${target.ext}`;
    const file = join(toolsDir, archiveFileName);
    if (!existsSync(file)) {
      if (requireLocal) throw new Error(`Missing tool archive ${file}`);
      return ARDUINO_TOOL_FALLBACKS[name];
    }
    systems.push({
      host: target.host,
      url: `${releaseBaseUrl}/${archiveFileName}`,
      archiveFileName,
      checksum: `SHA-256:${sha256File(file)}`,
      size: fileSize(file),
    });
  }
  return { name, version, systems };
}

export function buildPackageIndex(options: GenerateOptions): PackageIndex {
  const root = repoRoot();
  const board = getBoard("sf32lb52devkitlcd", root);
  const coreFile = resolve(options.core);
  const releaseBaseUrl = options.assetBaseUrl || `https://github.com/${options.repo}/releases/download/${options.releaseTag}`;
  const coreUrl = options.assetBaseUrl ? `${options.assetBaseUrl.replace(/\/$/, "")}/${archiveName(coreFile)}` : `${releaseBaseUrl}/${archiveName(coreFile)}`;
  const arduinoTools = ["gen-rodata-ld", "zephyr-sketch-tool"].map((tool) =>
    buildToolFromArchives(
      tool,
      ARDUINO_TOOL_FALLBACKS[tool].version,
      resolve(options.toolsDir),
      releaseBaseUrl,
      options.requireLocalTools,
    ),
  );

  return {
    packages: [
      {
        name: "sifli",
        maintainer: "OpenSiFli",
        websiteURL: "https://github.com/OpenSiFli/ArduinoCore-zephyr",
        email: "packages@sifli.com",
        help: { online: "https://github.com/OpenSiFli/ArduinoCore-zephyr" },
        platforms: [
          {
            name: "SiFli SF32LB52 Boards",
            architecture: "sf32lb52",
            version: options.version,
            category: "Contributed",
            url: coreUrl,
            archiveFileName: basename(coreFile),
            checksum: `SHA-256:${sha256File(coreFile)}`,
            size: fileSize(coreFile),
            boards: [{ name: board.name }],
            toolsDependencies: [
              { packager: "zephyr", name: ZEPHYR_ARM_EABI.name, version: ZEPHYR_ARM_EABI.version },
              { packager: "arduino", name: "gen-rodata-ld", version: ARDUINO_TOOL_FALLBACKS["gen-rodata-ld"].version },
              { packager: "arduino", name: "zephyr-sketch-tool", version: ARDUINO_TOOL_FALLBACKS["zephyr-sketch-tool"].version },
              { packager: "sifli", name: SFTOOL.name, version: SFTOOL.version },
            ],
          },
        ],
        tools: [SFTOOL],
      },
      {
        name: "zephyr",
        maintainer: "The Zephyr Project",
        websiteURL: "https://zephyrproject.org/",
        email: "packages@sifli.com",
        help: { online: "https://docs.zephyrproject.org/latest/" },
        platforms: [],
        tools: [ZEPHYR_ARM_EABI],
      },
      {
        name: "arduino",
        maintainer: "Arduino",
        websiteURL: "https://www.arduino.cc/",
        email: "packages@sifli.com",
        help: { online: "https://www.arduino.cc/en/Reference/HomePage" },
        platforms: [],
        tools: arduinoTools,
      },
    ],
  };
}

function parseCli(argv: string[]): GenerateOptions {
  const root = repoRoot();
  const out: GenerateOptions = {
    core: "",
    version: "",
    releaseTag: "",
    repo: process.env.GITHUB_REPOSITORY || "OpenSiFli/ArduinoCore-zephyr",
    toolsDir: join(root, "distrib"),
    githubOut: join(root, "distrib", "package_sifli_index.json"),
    cnOut: join(root, "distrib", "package_sifli_index_cn.json"),
    requireLocalTools: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--core") out.core = argv[++i];
    else if (arg === "--version") out.version = argv[++i];
    else if (arg === "--release-tag") out.releaseTag = argv[++i];
    else if (arg === "--repo") out.repo = argv[++i];
    else if (arg === "--tools-dir") out.toolsDir = argv[++i];
    else if (arg === "--github-out") out.githubOut = argv[++i];
    else if (arg === "--cn-out") out.cnOut = argv[++i];
    else if (arg === "--asset-base-url") out.assetBaseUrl = argv[++i];
    else if (arg === "--require-local-tools") out.requireLocalTools = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!out.core) throw new Error("--core is required");
  out.version ||= getCoreVersion(root);
  out.releaseTag ||= process.env.GITHUB_REF_NAME || out.version;
  return out;
}

if (import.meta.main) {
  const options = parseCli(process.argv.slice(2));
  const githubIndex = buildPackageIndex(options);
  const cnIndex = mirrorPackageIndex(githubIndex);
  writeText(options.githubOut, `${JSON.stringify(githubIndex, null, 2)}\n`);
  writeText(options.cnOut, `${JSON.stringify(cnIndex, null, 2)}\n`);
  console.log(`Wrote ${options.githubOut}`);
  console.log(`Wrote ${options.cnOut}`);
}
