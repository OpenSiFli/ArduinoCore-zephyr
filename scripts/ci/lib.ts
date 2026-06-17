import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";

export type BoardDetails = {
  name: string;
  board: string;
  variant: string;
  target: string;
  args: string[];
  hals: string[];
  artifact: string;
  subarch: string;
};

export type ToolSystem = {
  host: string;
  url: string;
  archiveFileName: string;
  checksum: string;
  size: number | string;
};

export type ToolDefinition = {
  name: string;
  version: string;
  systems: ToolSystem[];
};

export function repoRoot(): string {
  return resolve(new URL("../..", import.meta.url).pathname);
}

export function readText(path: string): string {
  return readFileSync(path, "utf8");
}

export function writeText(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function remove(path: string): void {
  rmSync(path, { recursive: true, force: true });
}

export function run(cmd: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): void {
  const result = spawnSync(cmd, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}`);
  }
}

export function capture(cmd: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): string {
  const result = spawnSync(cmd, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed:\n${result.stderr}`);
  }
  return result.stdout.trim();
}

export function sha256File(path: string): string {
  const hash = createHash("sha256");
  hash.update(readFileSync(path));
  return hash.digest("hex");
}

export function fileSize(path: string): number {
  return statSync(path).size;
}

export function parseArduinoProperties(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s*#.*$/, "").trim();
    if (!line) continue;
    const index = line.indexOf("=");
    if (index < 0) continue;
    out.set(line.slice(0, index).trim(), line.slice(index + 1).trim());
  }
  return out;
}

export function loadBoards(root = repoRoot()): BoardDetails[] {
  const props = parseArduinoProperties(readText(join(root, "boards.txt")));
  const boards = [...props.keys()]
    .filter((key) => key.endsWith(".build.variant"))
    .map((key) => key.slice(0, -".build.variant".length))
    .sort();

  return boards.map((board) => {
    const get = (field: string) => props.get(`${board}.${field}`) ?? "";
    const artifact = get("build.artifact") || "sf32lb52";
    return {
      name: get("name"),
      board,
      variant: get("build.variant"),
      target: get("build.zephyr_target"),
      args: splitArgs(get("build.zephyr_args")),
      hals: splitWords(get("build.zephyr_hals")),
      artifact,
      subarch: get("build.subarch") || artifact,
    };
  });
}

export function getBoard(board = "sf32lb52devkitlcd", root = repoRoot()): BoardDetails {
  const details = loadBoards(root).find((item) => item.board === board);
  if (!details) {
    throw new Error(`Unknown board '${board}' in boards.txt`);
  }
  return details;
}

export function splitWords(value: string): string[] {
  return value.trim() ? value.trim().split(/\s+/) : [];
}

export function splitArgs(value: string): string[] {
  return splitWords(value);
}

export function getCoreVersion(root = repoRoot()): string {
  try {
    return capture("git", ["describe", "--tags", "--exact-match", "--exclude", "*/*"], { cwd: root });
  } catch {
    const describe = (() => {
      try {
        return capture("git", ["describe", "--tags", "--exclude", "*/*"], { cwd: root });
      } catch {
        return "";
      }
    })();
    const stem = describe
      ? describe.replace(/\.(\d+)(-.*)*-\d+-g.*/, (_match, patch, suffix) => `.${Number(patch) + 1}${suffix ?? ""}-0.dev`)
      : `9.9.9-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12)}`;
    const ref = process.env.HEAD_REF ? [process.env.HEAD_REF] : ["--dirty"];
    const hash = capture("git", ["describe", "--always", ...ref], { cwd: root });
    return `${stem}+${hash}`;
  }
}

export function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function tryStat(path: string) {
  try {
    return statSync(path);
  } catch {
    return undefined;
  }
}

function tryLstat(path: string) {
  try {
    return lstatSync(path);
  } catch {
    return undefined;
  }
}

export function copyPath(source: string, dest: string, options: { dereferenceSymlinks?: boolean } = {}): void {
  const dereferenceSymlinks = options.dereferenceSymlinks ?? true;
  const sourceStat = tryLstat(source);
  if (!sourceStat) return;
  ensureDir(dirname(dest));

  if (sourceStat.isSymbolicLink()) {
    const targetStat = dereferenceSymlinks ? tryStat(source) : undefined;
    if (!targetStat) {
      remove(dest);
      symlinkSync(readlinkSync(source), dest);
      return;
    }
    if (targetStat.isDirectory()) {
      ensureDir(dest);
      for (const entry of readdirSync(source)) {
        copyPath(join(source, entry), join(dest, entry), options);
      }
      return;
    }
    if (targetStat.isFile()) {
      remove(dest);
      copyFileSync(source, dest);
      return;
    }
  }

  if (sourceStat.isDirectory()) {
    ensureDir(dest);
    for (const entry of readdirSync(source)) {
      copyPath(join(source, entry), join(dest, entry), options);
    }
  } else if (sourceStat.isFile()) {
    remove(dest);
    copyFileSync(source, dest);
  }
}

export function copyFiltered(source: string, dest: string, excludeRelative: Set<string>): void {
  if (!existsSync(source)) return;
  const sourceStat = statSync(source);
  if (!sourceStat.isDirectory()) {
    copyPath(source, dest);
    return;
  }

  for (const entry of walk(source)) {
    const rel = relative(source, entry);
    if (!rel) continue;
    if ([...excludeRelative].some((excluded) => rel === excluded || rel.startsWith(`${excluded}/`))) {
      continue;
    }
    const target = join(dest, rel);
    const st = statSync(entry);
    if (st.isDirectory()) {
      ensureDir(target);
    } else if (st.isFile()) {
      copyPath(entry, target);
    }
  }
}

export function walk(root: string): string[] {
  const items: string[] = [];
  if (!existsSync(root)) return items;
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    items.push(path);
    if (statSync(path).isDirectory()) {
      items.push(...walk(path));
    }
  }
  return items;
}

export function stripInlineComments(root: string): void {
  for (const file of walk(root)) {
    if (!statSync(file).isFile()) continue;
    let content: string;
    try {
      content = readText(file);
    } catch {
      continue;
    }
    const stripped = content
      .split(/(\r?\n)/)
      .reduce((acc, part, index, arr) => {
        if (part === "\n" || part === "\r\n") return acc + part;
        const newline = arr[index + 1] === "\n" || arr[index + 1] === "\r\n" ? arr[index + 1] : "";
        const preprocOk = /^\s*#\s*(if|else|elif|endif)/.test(part);
        const commentOnly = /^\s*\/\*/.test(part);
        const continuation = /\\$/.test(part);
        if (!preprocOk && !(commentOnly && !continuation)) {
          return acc + part.replace(/\s*\/\*.*?\*\//g, "");
        }
        return acc + part;
      }, "");
    if (stripped !== content) {
      writeText(file, stripped);
    }
  }
}

export function readLdSymbol(path: string, symbol: string): number {
  const match = readText(path).match(new RegExp(`\\b${symbol}\\b\\s*=\\s*([^;\\)]+)`));
  if (!match) throw new Error(`Missing linker symbol ${symbol} in ${path}`);
  return Number(match[1].trim());
}

export function readConfigInt(path: string, symbol: string): number {
  const match = readText(path).match(new RegExp(`^${symbol}=(\\d+)`, "m"));
  if (!match) throw new Error(`Missing config symbol ${symbol} in ${path}`);
  return Number(match[1]);
}

export function updateProperty(text: string, key: string, value: string | number): string {
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${escapeRegExp(key)}=.*$`, "m");
  if (regex.test(text)) return text.replace(regex, line);
  return `${text.replace(/\s+$/, "")}\n${line}\n`;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function pathToFileUrl(path: string): string {
  return `file://${resolve(path)}`;
}

export function archiveName(path: string): string {
  return basename(path);
}
