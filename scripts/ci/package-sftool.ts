#!/usr/bin/env bun

import { chmodSync, existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import {
  copyPath,
  ensureDir,
  fileSize,
  remove,
  repoRoot,
  run,
  sha256File,
  tempDir,
  walk,
} from "./lib";
import { SFTOOL, sftoolPackageArchiveName } from "./tool-manifest";

function parseCli(argv: string[]) {
  const out = {
    hosts: [] as string[],
    outDir: "distrib",
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--host") out.hosts.push(argv[++i]);
    else if (arg === "--out-dir") out.outDir = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
}

async function download(url: string, dest: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  await Bun.write(dest, response);
}

async function main() {
  const root = repoRoot();
  const args = parseCli(process.argv.slice(2));
  const outDir = resolve(root, args.outDir);
  const selected = args.hosts.length > 0
    ? SFTOOL.systems.filter((system) => args.hosts.includes(system.host))
    : SFTOOL.systems;
  const unknownHosts = args.hosts.filter((host) => !SFTOOL.systems.some((system) => system.host === host));
  if (unknownHosts.length > 0) throw new Error(`Unknown sftool host(s): ${unknownHosts.join(", ")}`);

  ensureDir(outDir);
  for (const system of selected) {
    const tmp = tempDir("sftool-package-");
    const sourceArchive = join(tmp, system.archiveFileName);
    const unpackDir = join(tmp, "upstream");
    const rootDirName = `sftool-${SFTOOL.version}-${system.host}`;
    const packageRoot = join(tmp, rootDirName);
    const binaryName = system.host.endsWith("mingw32") ? "sftool.exe" : "sftool";
    const binaryOut = join(packageRoot, binaryName);
    const archive = join(outDir, sftoolPackageArchiveName(system.host));

    console.log(`Downloading ${system.url}`);
    await download(system.url, sourceArchive);
    const checksum = `SHA-256:${sha256File(sourceArchive)}`;
    if (checksum !== system.checksum) {
      throw new Error(`Checksum mismatch for ${system.archiveFileName}: got ${checksum}, expected ${system.checksum}`);
    }

    ensureDir(unpackDir);
    if (system.archiveFileName.endsWith(".zip")) {
      run("unzip", ["-q", sourceArchive, "-d", unpackDir]);
    } else {
      run("tar", ["-xf", sourceArchive, "-C", unpackDir]);
    }

    const binaryIn = walk(unpackDir).find((path) => basename(path) === binaryName);
    if (!binaryIn || !existsSync(binaryIn)) {
      throw new Error(`Could not find ${binaryName} in ${system.archiveFileName}`);
    }

    remove(packageRoot);
    ensureDir(packageRoot);
    copyPath(binaryIn, binaryOut);
    if (!system.host.endsWith("mingw32")) chmodSync(binaryOut, 0o755);

    remove(archive);
    if (archive.endsWith(".zip")) {
      run("zip", ["-qr", archive, rootDirName], { cwd: tmp });
    } else {
      run("tar", ["-czf", archive, rootDirName], { cwd: tmp });
    }
    console.log(`${basename(archive)} ${fileSize(archive)} SHA-256:${sha256File(archive)}`);
    remove(tmp);
  }
}

main();
