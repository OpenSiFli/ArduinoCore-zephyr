import type { ToolDefinition } from "./lib";

export const GITHUB_MIRROR_PREFIX = "https://downloads.sifli.com/github_assets/";

export const ZEPHYR_ARM_EABI: ToolDefinition = {
  name: "arm-zephyr-eabi",
  version: "1.0.1",
  systems: [
    {
      host: "aarch64-linux-gnu",
      url: "https://github.com/zephyrproject-rtos/sdk-ng/releases/download/v1.0.1/toolchain_gnu_linux-aarch64_arm-zephyr-eabi.tar.xz",
      archiveFileName: "toolchain_gnu_linux-aarch64_arm-zephyr-eabi.tar.xz",
      checksum: "SHA-256:b9805b691f2f0a8926c92694cae378d05ba07b76abca745e216fcc52753cc4d6",
      size: 97253908,
    },
    {
      host: "x86_64-linux-gnu",
      url: "https://github.com/zephyrproject-rtos/sdk-ng/releases/download/v1.0.1/toolchain_gnu_linux-x86_64_arm-zephyr-eabi.tar.xz",
      archiveFileName: "toolchain_gnu_linux-x86_64_arm-zephyr-eabi.tar.xz",
      checksum: "SHA-256:21b85981cb5a1818d9bc53d82af80f208946ec038b982ff1907287572ed3a634",
      size: 101752776,
    },
    {
      host: "arm64-apple-darwin",
      url: "https://github.com/zephyrproject-rtos/sdk-ng/releases/download/v1.0.1/toolchain_gnu_macos-aarch64_arm-zephyr-eabi.tar.xz",
      archiveFileName: "toolchain_gnu_macos-aarch64_arm-zephyr-eabi.tar.xz",
      checksum: "SHA-256:4008edb5d4840cd994aedd7f1309bfb63e7243729d57839ebf1cc83c1f17c886",
      size: 89958448,
    },
    {
      host: "x86_64-mingw32",
      // Zephyr SDK 1.0.1 publishes Windows GNU toolchains as .7z archives.
      // Arduino CLI does not accept that archive format, so use the SiFli
      // zip repack in the package index.
      url: "https://downloads.sifli.com/github_assets/zephyrproject-rtos/sdk-ng/releases/download/v1.0.1/toolchain_gnu_windows-x86_64_arm-zephyr-eabi.zip",
      archiveFileName: "toolchain_gnu_windows-x86_64_arm-zephyr-eabi.zip",
      checksum: "SHA-256:73d876b4df5a708fede0b773917ccb45bf3c33f089ba587f6b352dd356566cb6",
      size: 218142036,
    },
  ],
};

export const GO_TOOL_TARGETS = [
  { host: "aarch64-linux-gnu", goos: "linux", goarch: "arm64", ext: ".tar.gz" },
  { host: "x86_64-linux-gnu", goos: "linux", goarch: "amd64", ext: ".tar.gz" },
  { host: "arm64-apple-darwin", goos: "darwin", goarch: "arm64", ext: ".tar.gz" },
  { host: "x86_64-apple-darwin", goos: "darwin", goarch: "amd64", ext: ".tar.gz" },
  { host: "i686-mingw32", goos: "windows", goarch: "386", ext: ".zip" },
] as const;

export const ARDUINO_TOOL_FALLBACKS: Record<string, ToolDefinition> = {
  "gen-rodata-ld": {
    name: "gen-rodata-ld",
    version: "0.1.1",
    systems: [
      {
        host: "aarch64-linux-gnu",
        url: "https://downloads.arduino.cc/tools/gen-rodata-ld-0.1.1-aarch64-linux-gnu.tar.gz",
        archiveFileName: "gen-rodata-ld-0.1.1-aarch64-linux-gnu.tar.gz",
        checksum: "SHA-256:a058a80fda2158f1a70eec117a2c0d68ed019933dd6c00a18c2067c3607c7828",
        size: "1621208",
      },
      {
        host: "arm64-apple-darwin",
        url: "https://downloads.arduino.cc/tools/gen-rodata-ld-0.1.1-arm64-apple-darwin.tar.gz",
        archiveFileName: "gen-rodata-ld-0.1.1-arm64-apple-darwin.tar.gz",
        checksum: "SHA-256:d22ba68101882e7ae6a9556588cad52232b0ca572f6324e619898396f5ca9f0a",
        size: "1741205",
      },
      {
        host: "i686-mingw32",
        url: "https://downloads.arduino.cc/tools/gen-rodata-ld-0.1.1-i686-mingw32.zip",
        archiveFileName: "gen-rodata-ld-0.1.1-i686-mingw32.zip",
        checksum: "SHA-256:03e9d79d7be548dbfa4a1a4d13be704e4cc08693718589c03b00d56fc7083ed9",
        size: "1697255",
      },
      {
        host: "x86_64-apple-darwin",
        url: "https://downloads.arduino.cc/tools/gen-rodata-ld-0.1.1-x86_64-apple-darwin.tar.gz",
        archiveFileName: "gen-rodata-ld-0.1.1-x86_64-apple-darwin.tar.gz",
        checksum: "SHA-256:96d7006fcaef9e35214dc436f9290206906ce906de36dac5c76da71dc4bffd15",
        size: "1846338",
      },
      {
        host: "x86_64-linux-gnu",
        url: "https://downloads.arduino.cc/tools/gen-rodata-ld-0.1.1-x86_64-linux-gnu.tar.gz",
        archiveFileName: "gen-rodata-ld-0.1.1-x86_64-linux-gnu.tar.gz",
        checksum: "SHA-256:984a6f2a957dd775678f0000112329136fd1741ec52cacfcba44000ad76aeb11",
        size: "1758031",
      },
    ],
  },
  "zephyr-sketch-tool": {
    name: "zephyr-sketch-tool",
    version: "0.3.0",
    systems: [
      {
        host: "aarch64-linux-gnu",
        url: "https://downloads.arduino.cc/tools/zephyr-sketch-tool-0.3.0-aarch64-linux-gnu.tar.gz",
        archiveFileName: "zephyr-sketch-tool-0.3.0-aarch64-linux-gnu.tar.gz",
        checksum: "SHA-256:c255dac387ce477fe1f517a2c91e7a5c71b9b4b0eeef5bdc8a6a835451eefefa",
        size: "1482863",
      },
      {
        host: "arm64-apple-darwin",
        url: "https://downloads.arduino.cc/tools/zephyr-sketch-tool-0.3.0-arm64-apple-darwin.tar.gz",
        archiveFileName: "zephyr-sketch-tool-0.3.0-arm64-apple-darwin.tar.gz",
        checksum: "SHA-256:20e71071871a03a5d91e1caab8a546569a5d48d029e4dd2d9262361f84578e26",
        size: "1554928",
      },
      {
        host: "i686-mingw32",
        url: "https://downloads.arduino.cc/tools/zephyr-sketch-tool-0.3.0-i686-mingw32.zip",
        archiveFileName: "zephyr-sketch-tool-0.3.0-i686-mingw32.zip",
        checksum: "SHA-256:329b30209e0fe7d59bb34644dfd7d9085a7ecd27f8c3b618842dc58f5a10af44",
        size: "1575545",
      },
      {
        host: "x86_64-apple-darwin",
        url: "https://downloads.arduino.cc/tools/zephyr-sketch-tool-0.3.0-x86_64-apple-darwin.tar.gz",
        archiveFileName: "zephyr-sketch-tool-0.3.0-x86_64-apple-darwin.tar.gz",
        checksum: "SHA-256:994d3f83344c330bc18fc6abd85cb15d6f3c14df72beac35696a14cd1be63592",
        size: "1644940",
      },
      {
        host: "x86_64-linux-gnu",
        url: "https://downloads.arduino.cc/tools/zephyr-sketch-tool-0.3.0-x86_64-linux-gnu.tar.gz",
        archiveFileName: "zephyr-sketch-tool-0.3.0-x86_64-linux-gnu.tar.gz",
        checksum: "SHA-256:0d861cfafc07aacc85cf553ed78272ab4e746acf6c91a8f068cbae50f2b58b3e",
        size: "1599691",
      },
    ],
  },
};

export const SFTOOL: ToolDefinition = {
  name: "sftool",
  version: "0.2.3",
  systems: [
    {
      host: "arm64-apple-darwin",
      url: "https://github.com/OpenSiFli/sftool/releases/download/0.2.3/sftool-0.2.3-aarch64-apple-darwin.tar.xz",
      archiveFileName: "sftool-0.2.3-aarch64-apple-darwin.tar.xz",
      checksum: "SHA-256:c08bc1a84f8ed57be0637b512fbea296e766e394124daf6f7ccc5b36bbd1b55f",
      size: 4279716,
    },
    {
      host: "x86_64-apple-darwin",
      url: "https://github.com/OpenSiFli/sftool/releases/download/0.2.3/sftool-0.2.3-x86_64-apple-darwin.tar.xz",
      archiveFileName: "sftool-0.2.3-x86_64-apple-darwin.tar.xz",
      checksum: "SHA-256:c540e197f9b630c064ec76e331037e8b98aabf8771c27bbf4aa8c8fa3057b134",
      size: 4358544,
    },
    {
      host: "aarch64-linux-gnu",
      url: "https://github.com/OpenSiFli/sftool/releases/download/0.2.3/sftool-0.2.3-aarch64-unknown-linux-gnu.tar.xz",
      archiveFileName: "sftool-0.2.3-aarch64-unknown-linux-gnu.tar.xz",
      checksum: "SHA-256:ff41c7cf47c6e55b9d0bfc3438d7cf514c3be1a195dda5e091fa0e5d6cbaad0a",
      size: 4386324,
    },
    {
      host: "x86_64-linux-gnu",
      url: "https://github.com/OpenSiFli/sftool/releases/download/0.2.3/sftool-0.2.3-x86_64-unknown-linux-gnu.tar.xz",
      archiveFileName: "sftool-0.2.3-x86_64-unknown-linux-gnu.tar.xz",
      checksum: "SHA-256:66fa3a0617f78a9c237b9ce7908a01847f97efb66f75f6cf469db1768a6441cd",
      size: 4528532,
    },
    {
      host: "i686-linux-gnu",
      url: "https://github.com/OpenSiFli/sftool/releases/download/0.2.3/sftool-0.2.3-i686-unknown-linux-gnu.tar.xz",
      archiveFileName: "sftool-0.2.3-i686-unknown-linux-gnu.tar.xz",
      checksum: "SHA-256:66dda711a6cc27261c470461524c852cdd1797889026703ddd3d2fb3327b8f96",
      size: 4580408,
    },
    {
      host: "i686-mingw32",
      url: "https://github.com/OpenSiFli/sftool/releases/download/0.2.3/sftool-0.2.3-i686-pc-windows-msvc.zip",
      archiveFileName: "sftool-0.2.3-i686-pc-windows-msvc.zip",
      checksum: "SHA-256:9df2df118366110e9c3e9e8ad41e1f83824e7db0ad9a10d163b5aa06a4c02b6f",
      size: 4626591,
    },
    {
      host: "x86_64-mingw32",
      url: "https://github.com/OpenSiFli/sftool/releases/download/0.2.3/sftool-0.2.3-x86_64-pc-windows-msvc.zip",
      archiveFileName: "sftool-0.2.3-x86_64-pc-windows-msvc.zip",
      checksum: "SHA-256:6c87bee076c724d696704af284e48aef3f5c26d6402be462aeb3671166516cd5",
      size: 4765427,
    },
  ],
};

export function sftoolPackageArchiveName(host: string): string {
  const ext = host.endsWith("mingw32") ? ".zip" : ".tar.gz";
  return `sftool-${SFTOOL.version}-${host}${ext}`;
}
