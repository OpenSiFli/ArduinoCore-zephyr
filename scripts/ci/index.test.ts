import { describe, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildPackageIndex, buildSftoolFromArchives, mirrorPackageIndex, toChinaMirrorUrl } from "./generate-index";
import { getBoard, readText } from "./lib";
import { SFTOOL, ZEPHYR_ARM_EABI, sftoolPackageArchiveName } from "./tool-manifest";

describe("package index generation", () => {
  test("mirrors GitHub asset URLs without touching non-GitHub URLs", () => {
    expect(toChinaMirrorUrl("https://github.com/OpenSiFli/sftool/releases/download/0.2.3/a.zip")).toBe(
      "https://downloads.sifli.com/github_assets/OpenSiFli/sftool/releases/download/0.2.3/a.zip",
    );
    expect(toChinaMirrorUrl("https://downloads.arduino.cc/tools/a.zip")).toBe("https://downloads.arduino.cc/tools/a.zip");
  });

  test("mirrors nested package index url fields", () => {
    const mirrored = mirrorPackageIndex({
      url: "https://github.com/OpenSiFli/ArduinoCore-zephyr/releases/download/v1/core.tar.bz2",
      nested: [{ url: "https://github.com/zephyrproject-rtos/sdk-ng/releases/download/v1.0.1/tool.tar.xz" }],
    });
    expect(mirrored.url).toContain("https://downloads.sifli.com/github_assets/OpenSiFli/");
    expect(mirrored.nested[0].url).toContain("https://downloads.sifli.com/github_assets/zephyrproject-rtos/");
  });

  test("builds a single-board sifli index", () => {
    const dir = join(tmpdir(), `sifli-index-test-${process.pid}`);
    mkdirSync(dir, { recursive: true });
    const core = join(dir, "ArduinoCore-sf32lb52-test.tar.bz2");
    writeFileSync(core, "fake-core");
    const index = buildPackageIndex({
      core,
      version: "1.2.3",
      releaseTag: "1.2.3",
      repo: "OpenSiFli/ArduinoCore-zephyr",
      toolsDir: dir,
      githubOut: join(dir, "github.json"),
      cnOut: join(dir, "cn.json"),
      requireLocalTools: false,
    });

    const sifli = index.packages.find((pkg) => pkg.name === "sifli") as any;
    expect(sifli.maintainer).toBe("SiFli");
    expect(sifli.email).toBe("sf-bot@sifli.com");
    expect(sifli.platforms).toHaveLength(1);
    expect(sifli.platforms[0].name).toBe("SiFli Serial Boards");
    expect(sifli.platforms[0].architecture).toBe("sf32lb52");
    expect(sifli.platforms[0].toolsDependencies).toContainEqual({ packager: "sifli", name: "sftool", version: "0.2.3" });
    expect(sifli.platforms[0].toolsDependencies).toContainEqual({ packager: "zephyr", name: "arm-zephyr-eabi", version: "1.0.1" });
  });

  test("parses the sf32lb52 board metadata", () => {
    const board = getBoard("sf32lb52devkitlcd");
    expect(board.target).toBe("sf32lb52_devkit_lcd");
    expect(board.artifact).toBe("sf32lb52");
    expect(board.subarch).toBe("sf32lb52");
    expect(readText("boards.txt")).toContain(
      "sf32lb52devkitlcd.build.compiler_path={runtime.tools.arm-zephyr-eabi-1.0.1.path}/bin/",
    );
  });

  test("maps sftool 0.2.3 release assets to sifli tool systems", () => {
    expect(SFTOOL.version).toBe("0.2.3");
    expect(SFTOOL.systems).toHaveLength(7);
    expect(SFTOOL.systems).toContainEqual(
      expect.objectContaining({
        host: "x86_64-linux-gnu",
        url: "https://github.com/OpenSiFli/sftool/releases/download/0.2.3/sftool-0.2.3-x86_64-unknown-linux-gnu.tar.xz",
      }),
    );
    expect(SFTOOL.systems).toContainEqual(
      expect.objectContaining({
        host: "x86_64-mingw32",
        archiveFileName: "sftool-0.2.3-x86_64-pc-windows-msvc.zip",
      }),
    );
  });

  test("uses Arduino-compatible sftool wrapper archives when present", () => {
    const dir = join(tmpdir(), `sifli-sftool-test-${process.pid}`);
    mkdirSync(dir, { recursive: true });
    const archiveFileName = sftoolPackageArchiveName("x86_64-linux-gnu");
    writeFileSync(join(dir, archiveFileName), "fake-sftool-wrapper");
    const tool = buildSftoolFromArchives(dir, "http://127.0.0.1:8765", false);
    const linux = tool.systems.find((system) => system.host === "x86_64-linux-gnu");
    expect(linux).toMatchObject({
      archiveFileName,
      url: `http://127.0.0.1:8765/${archiveFileName}`,
    });
  });

  test("uses Zephyr SDK 1.0.1 GNU arm toolchain assets", () => {
    expect(ZEPHYR_ARM_EABI.version).toBe("1.0.1");
    const platform = readText("platform.txt");
    expect(platform).toContain("--specs=picolibc.specs");
    expect(platform).not.toContain("--specs=nano.specs");
    expect(platform).not.toContain("--specs=nosys.specs");
    expect(ZEPHYR_ARM_EABI.systems).toContainEqual(
      expect.objectContaining({
        host: "x86_64-linux-gnu",
        archiveFileName: "toolchain_gnu_linux-x86_64_arm-zephyr-eabi.tar.xz",
      }),
    );
    expect(ZEPHYR_ARM_EABI.systems).toContainEqual(
      expect.objectContaining({
        host: "x86_64-mingw32",
        url: "https://downloads.sifli.com/github_assets/zephyrproject-rtos/sdk-ng/releases/download/v1.0.1/toolchain_gnu_windows-x86_64_arm-zephyr-eabi.zip",
        archiveFileName: "toolchain_gnu_windows-x86_64_arm-zephyr-eabi.zip",
        checksum: "SHA-256:e807dcbe5d32b12187fa3769700d17bfa5627d1b140577dd8930a415f6723ad3",
        size: 219119514,
      }),
    );
  });
});
