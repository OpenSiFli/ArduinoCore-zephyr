#!/usr/bin/env bun

import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import {
  copyFiltered,
  copyPath,
  ensureDir,
  fileSize,
  getBoard,
  getCoreVersion,
  readConfigInt,
  readLdSymbol,
  readText,
  remove,
  repoRoot,
  run,
  tempDir,
  updateProperty,
  writeText,
} from "./lib";

function parseCli(argv: string[]) {
  const out = {
    board: "sf32lb52devkitlcd",
    version: "",
    output: "",
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--board") out.board = argv[++i];
    else if (arg === "--version") out.version = argv[++i];
    else if (arg === "--out") out.output = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
}

function main() {
  const root = repoRoot();
  const args = parseCli(process.argv.slice(2));
  const board = getBoard(args.board, root);
  const version = args.version || getCoreVersion(root);
  const out = resolve(args.output || join(root, "distrib", `ArduinoCore-${board.artifact}-${version}.tar.bz2`));
  const variant = board.variant;
  const syms = join(root, "variants", variant, "syms-static.ld");
  const config = join(root, "firmwares", `zephyr-${variant}.config`);

  if (!existsSync(syms)) throw new Error(`Missing ${syms}; run build-loader first.`);
  if (!existsSync(config)) throw new Error(`Missing ${config}; run build-loader first.`);

  const sketchSize = readLdSymbol(syms, "_sketch_max_size");
  const sketchLoadAddress = `0x${readLdSymbol(syms, "_sketch_start").toString(16)}`;
  const heapSize = readConfigInt(config, "CONFIG_LLEXT_HEAP_SIZE") * 1024;

  let boardsText = readText(join(root, "boards.txt"));
  boardsText = updateProperty(boardsText, `${board.board}.upload.maximum_size`, sketchSize);
  boardsText = updateProperty(boardsText, `${board.board}.upload.maximum_data_size`, heapSize);
  const configuredAddress = boardsText.match(new RegExp(`^${board.board}\\.upload\\.address=(.*)$`, "m"))?.[1]?.toLowerCase();
  if (configuredAddress && configuredAddress !== sketchLoadAddress.toLowerCase()) {
    throw new Error(`boards.txt ${board.board}.upload.address=${configuredAddress}, expected ${sketchLoadAddress}`);
  }

  let platformText = readText(join(root, "platform.txt"));
  platformText = updateProperty(platformText, "name", "SiFli Serial Boards");
  platformText = updateProperty(platformText, "version", version);

  const tmp = tempDir("sifli-core-");
  const staged = join(tmp, "ArduinoCore-zephyr");
  ensureDir(staged);

  writeText(join(staged, "boards.txt"), boardsText);
  writeText(join(staged, "platform.txt"), platformText);

  for (const item of ["programmers.txt", "LICENSE", "README.md", "doc", "cores", "variants/_ldscripts", "variants/common"]) {
    copyPath(join(root, item), join(staged, item));
  }

  copyFiltered(join(root, "libraries"), join(staged, "libraries"), new Set(["Camera", "Storage", "Zephyr_SDRAM"]));
  copyPath(join(root, "variants", variant), join(staged, "variants", variant));
  remove(join(staged, "variants", variant, "llext-edk", "Makefile.cflags"));
  remove(join(staged, "variants", variant, "llext-edk", "cmake.cflags"));

  const firmwarePrefix = `zephyr-${variant}.`;
  const bootloaderFile = `zephyr-${variant}.bin`;
  const bootloaderFtabFile = `zephyr-${variant}.ftab.bin`;
  const firmwares = readdirSync(join(root, "firmwares")).filter((name) => name.startsWith(firmwarePrefix));
  if (firmwares.length === 0) throw new Error(`No firmware artifacts found for ${variant}`);
  if (!firmwares.includes(bootloaderFile)) throw new Error(`Missing bootloader firmware ${bootloaderFile}`);
  if (!firmwares.includes(bootloaderFtabFile)) throw new Error(`Missing bootloader ftab ${bootloaderFtabFile}`);
  for (const name of firmwares) {
    copyPath(join(root, "firmwares", name), join(staged, "firmwares", name));
  }
  copyPath(join(root, "firmwares", bootloaderFile), join(staged, "bootloaders", bootloaderFile));
  copyPath(join(root, "firmwares", bootloaderFtabFile), join(staged, "bootloaders", bootloaderFtabFile));

  ensureDir(join(root, "distrib"));
  ensureDir(dirname(out));
  remove(out);
  run("tar", ["-cjf", out, "-C", tmp, "ArduinoCore-zephyr"]);
  console.log(`Created ${out} (${fileSize(out)} bytes)`);
  console.log(`Archive file: ${basename(out)}`);
}

main();
