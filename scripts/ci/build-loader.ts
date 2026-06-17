#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { delimiter, join, resolve } from "node:path";
import {
  capture,
  ensureDir,
  getBoard,
  remove,
  repoRoot,
  run,
  stripInlineComments,
  writeText,
} from "./lib";

function appendCmakeArg(args: string[], value: string): string[] {
  const sep = args.indexOf("--");
  if (sep >= 0) return [...args.slice(0, sep + 1), ...args.slice(sep + 1), value];
  return [...args, "--", value];
}

function parseCli(argv: string[]) {
  const board = argv[0] && !argv[0].startsWith("-") ? argv[0] : "sf32lb52devkitlcd";
  const rest = argv.slice(board === argv[0] ? 1 : 0);
  return {
    board,
    debug: rest.includes("--debug"),
    extraArgs: rest.filter((arg) => arg !== "--debug"),
  };
}

function main() {
  const root = repoRoot();
  const { board: boardId, debug, extraArgs } = parseCli(process.argv.slice(2));
  const board = getBoard(boardId, root);
  const repoVenvBin = join(root, "venv", "bin");
  const initialEnv = existsSync(repoVenvBin)
    ? { PATH: `${repoVenvBin}${delimiter}${process.env.PATH ?? ""}` }
    : {};

  const workspace =
    process.env.ZEPHYR_WORKSPACE ||
    capture("west", ["topdir"], { cwd: root, env: initialEnv });
  const zephyrBase = process.env.ZEPHYR_BASE || join(workspace, "zephyr");
  const pathEntries = [...new Set([join(workspace, ".venv", "bin"), repoVenvBin])]
    .filter((path) => existsSync(path));
  const baseEnv = pathEntries.length > 0
    ? { PATH: `${pathEntries.join(delimiter)}${delimiter}${process.env.PATH ?? ""}` }
    : {};
  const env = {
    ...baseEnv,
    ZEPHYR_BASE: zephyrBase,
    ZEPHYR_EXTRA_MODULES: root,
  };

  const buildDir = join(root, "build", board.variant);
  const variantDir = join(root, "variants", board.variant);
  const firmwareDir = join(root, "firmwares");
  const bootloaderDir = join(root, "bootloaders");
  let westArgs = [...board.args, ...extraArgs];

  if (debug) {
    westArgs = appendCmakeArg(westArgs, `-DEXTRA_CONF_FILE=${join(root, "extra", "debug.conf")}`);
  }
  westArgs = appendCmakeArg(westArgs, `-DZEPHYR_EXTRA_MODULES=${root}`);

  console.log("");
  console.log(`Build target: ${board.target} ${westArgs.join(" ")}`);
  console.log(`Build variant: ${board.variant}`);
  console.log(`Zephyr workspace: ${workspace}`);
  console.log(`Zephyr base: ${zephyrBase}`);

  remove(buildDir);
  run(
    "west",
    ["build", "-d", buildDir, "-b", board.target, join(root, "loader"), "-t", "llext-edk", ...westArgs],
    { cwd: workspace, env },
  );

  ensureDir(variantDir);
  ensureDir(firmwareDir);
  ensureDir(bootloaderDir);
  remove(join(buildDir, "llext-edk"));
  run("tar", ["xf", join("zephyr", "llext-edk.tar.Z")], { cwd: buildDir });
  run("rsync", ["-a", "--delete", `${join(buildDir, "llext-edk")}/`, `${join(variantDir, "llext-edk")}/`]);
  stripInlineComments(join(variantDir, "llext-edk", "include"));

  for (const ext of ["elf", "bin", "hex"]) {
    const source = join(buildDir, "zephyr", `zephyr.${ext}`);
    const dest = join(firmwareDir, `zephyr-${board.variant}.${ext}`);
    remove(dest);
    if (existsSync(source)) {
      run("cp", [source, dest]);
    }
  }
  const ftabHexSource = join(buildDir, "zephyr", "sf32lb52x_ftab.hex");
  const ftabHex = join(firmwareDir, `zephyr-${board.variant}.ftab.hex`);
  remove(ftabHex);
  run("cp", [ftabHexSource, ftabHex]);
  run("cp", [join(buildDir, "zephyr", "zephyr.dts"), join(firmwareDir, `zephyr-${board.variant}.dts`)]);
  run("cp", [join(buildDir, "zephyr", ".config"), join(firmwareDir, `zephyr-${board.variant}.config`)]);

  console.log("Generating exported symbol scripts");
  const elf = join(buildDir, "zephyr", "zephyr.elf");
  const dynamic = capture("python3", [join(root, "extra", "gen_provides.py"), elf, "-L"], { cwd: root, env });
  writeText(join(variantDir, "syms-dynamic.ld"), `${dynamic}\n`);
  const staticSymbols = capture(
    "python3",
    [
      join(root, "extra", "gen_provides.py"),
      elf,
      "-LF",
      "+kheap_llext_heap",
      "+kheap__system_heap",
      "*sketch_base_addr=_sketch_start",
      "*sketch_max_size=_sketch_max_size",
      "*loader_max_size=_loader_max_size",
      "malloc=__wrap_malloc",
      "free=__wrap_free",
      "realloc=__wrap_realloc",
      "calloc=__wrap_calloc",
      "random=__wrap_random",
    ],
    { cwd: root, env },
  );
  writeText(join(variantDir, "syms-static.ld"), `${staticSymbols}\n`);

  run("cmake", ["-P", join(root, "extra", "gen_arduino_files.cmake"), board.variant], {
    cwd: root,
    env,
  });

  for (const ext of ["bin", "elf", "hex", "config", "dts", "ftab.hex"]) {
    const artifact = resolve(firmwareDir, `zephyr-${board.variant}.${ext}`);
    if (!existsSync(artifact)) {
      throw new Error(`Expected firmware artifact was not generated: ${artifact}`);
    }
  }

  const bootloader = resolve(bootloaderDir, `zephyr-${board.variant}.bin`);
  remove(bootloader);
  run("cp", [resolve(firmwareDir, `zephyr-${board.variant}.bin`), bootloader]);
  if (!existsSync(bootloader)) {
    throw new Error(`Expected bootloader artifact was not generated: ${bootloader}`);
  }

  const ftab = resolve(bootloaderDir, `zephyr-${board.variant}.ftab.hex`);
  remove(ftab);
  run("cp", [resolve(firmwareDir, `zephyr-${board.variant}.ftab.hex`), ftab]);
  if (!existsSync(ftab)) {
    throw new Error(`Expected bootloader ftab artifact was not generated: ${ftab}`);
  }
}

main();
