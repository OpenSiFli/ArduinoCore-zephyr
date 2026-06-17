> [!IMPORTANT]
> 当前 core 仍处于 **BETA** 阶段。
> 这个 OpenSiFli 下游仓库跟随 Arduino Zephyr core 的上游演进；是否脱离
> beta 取决于上游 core 的稳定进度，以及 SiFli 下游集成和验证的成熟度。
> 功能、API、loader 行为、package 内容和发布机制在后续版本中仍可能变化。
> 建议用于测试和反馈。
>
> [![Default branch status](https://github.com/OpenSiFli/ArduinoCore-zephyr/actions/workflows/package_core.yml/badge.svg?branch=main&event=push)](https://github.com/OpenSiFli/ArduinoCore-zephyr/actions/workflows/package_core.yml)

# 🚧 Arduino Core for Zephyr

这个仓库是 Arduino Core for Zephyr RTOS-based boards 的 OpenSiFli 下游分支。
它保留 Arduino Zephyr core 的上游结构，并加入 OpenSiFli 需要的 SiFli
开发板、loader、打包和发布流程。

当前发布的平台是 `sifli:sf32lb52`，Boards Manager 中的平台标题是
`SiFli Serial Boards`，当前启用的开发板是：

```text
sifli:sf32lb52:sf32lb52devkitlcd
```

Zephyr workspace 使用 `west.yml` 中固定的
[`OpenSiFli/zephyr-downstream`](https://github.com/OpenSiFli/zephyr-downstream)。

英文说明见 [README.md](README.md)。

## 🧐 什么是 Zephyr？

[Zephyr RTOS](https://zephyrproject.org/) 是一个开源实时操作系统，面向低功耗、
资源受限的嵌入式设备。它是模块化、可伸缩的，并支持多种架构。

![Zephyr RTOS Logo](doc/zephyr_logo.jpg)

## ⚙️ 安装

通过 Board Manager 安装 core 和所需工具链。

选择一个 package index URL。

GitHub 版本：

```text
https://github.com/OpenSiFli/ArduinoCore-zephyr/releases/latest/download/package_sifli_index.json
```

中国镜像版本：

```text
https://downloads.sifli.com/github_assets/OpenSiFli/ArduinoCore-zephyr/releases/latest/download/package_sifli_index_cn.json
```

在 Arduino IDE 中：

* 下载并安装最新的 [Arduino IDE](https://www.arduino.cc/en/software)（仅支持 `2.x.x`）。
* 打开 *'Settings / Preferences'*。
* 将上面的其中一个 package index URL 添加到 *'Additional Boards Manager URLs'*。如果已有多个 URL，用英文逗号分隔。
* 从侧边栏打开 *'Boards Manager'*，搜索 *'SiFli Serial Boards'*。
* 安装 `sifli:sf32lb52` 平台。
* 选择 `SiFli SF32LB52 DevKit LCD`。

也可以使用 Arduino CLI 安装：

```bash
SIFLI_INDEX_URL="https://github.com/OpenSiFli/ArduinoCore-zephyr/releases/latest/download/package_sifli_index.json"

arduino-cli core update-index --additional-urls "$SIFLI_INDEX_URL"
arduino-cli core install sifli:sf32lb52 --additional-urls "$SIFLI_INDEX_URL"
```

如果使用中国镜像，将 `SIFLI_INDEX_URL` 换成：

```bash
SIFLI_INDEX_URL="https://downloads.sifli.com/github_assets/OpenSiFli/ArduinoCore-zephyr/releases/latest/download/package_sifli_index_cn.json"
```

## 🏗️ 初次使用

使用 `sf32lb52devkitlcd` 的基本步骤：

* 按照上面的安装说明安装 `SiFli Serial Boards`。
* 选择 FQBN 为 `sifli:sf32lb52:sf32lb52devkitlcd` 的开发板。
* 将开发板连接到串口下载模式。
* 使用 Arduino IDE 或 Arduino CLI 编译并上传 sketch。

一个最小 CLI 示例：

```bash
mkdir -p /tmp/SifliBlink
cat >/tmp/SifliBlink/SifliBlink.ino <<'EOF'
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}
EOF

arduino-cli compile \
  --fqbn sifli:sf32lb52:sf32lb52devkitlcd:link_mode=dynamic \
  /tmp/SifliBlink

arduino-cli upload \
  -p /dev/cu.usbserial-XXXX \
  --fqbn sifli:sf32lb52:sf32lb52devkitlcd:link_mode=dynamic \
  /tmp/SifliBlink
```

请将 `/dev/cu.usbserial-XXXX` 替换为开发板实际暴露的串口。上传工具是
`sftool`。

`Link mode` 菜单也可以切换为 `Static`：

```bash
arduino-cli compile \
  --fqbn sifli:sf32lb52:sf32lb52devkitlcd:link_mode=static \
  /tmp/SifliBlink
```

## 🔧 故障排查

### 常见问题

#### **Q: 我的 Sketch 没有启动**

**A:** 连接 USB-to-UART 或打开开发板串口控制台，读取错误信息。如果 sketch
使用 `Debug` 模式构建，loader shell 会等待你手动运行 `sketch` 命令。对于 OS
crash，串口控制台通常是收集 crash log 的最佳方式。

---

#### **Q: 出现 `<err> llext: Undefined symbol with no entry in symbol table ...`**

**A:** 这通常表示 sketch 使用了尚未导出的 Zephyr 函数。打开
`loader/llext_exports.c`，添加需要的函数，然后重新构建 loader。

---

#### **Q: 我想使用一个未编译进 loader 的 Zephyr 子系统**

**A:** 打开 SiFli variant 对应的 `.conf` 文件，加入需要的 `CONFIG_`，然后重新构建并加载 loader。

---

#### **Q: 出现类似 `<err> os: ***** USAGE FAULT *****` 的 OS crash**

**A:** 这通常是用户代码中的缓冲区溢出或其他编程错误导致的。不过项目仍处于
beta 阶段，一个[高质量 bug report](#-bug-reporting) 可以帮助定位 core、loader
或下游板级集成中的问题。

---

#### **Q: 出现 out of memory 错误**

**A:** Zephyr shell 和动态 sketch 加载都会消耗 RAM。如果你的应用需要更小的
loader 配置，可以调整开发板对应的 `.conf` 文件。

---

#### **Q: 库检测阶段编译失败，但提示的库已经安装**

**A:** 如果你把 core 本地安装到了 Arduino sketchbook，请确保目录名是
`sf32lb52`（`${sketchbook}/hardware/sifli-git/sf32lb52`）。更多信息见
[在 Arduino IDE/CLI 中使用本地 Core](#在-arduino-idecli-中使用本地-core)。

## 📚 Libraries

### core 内置： ###

### 单独提供： ###

- **ArduinoBLE**：Bluetooth 支持取决于目标板 loader 配置。当前 SiFli loader
  配置对齐 raw HCI controller 模式，用于 ArduinoBLE 集成。

## 🧢 Under the hood

与传统 Arduino 实现不同，这个 core 可以生成一个 freestanding `elf` 文件。该文件
由预编译的 Zephyr 固件动态加载，这个固件称为 `loader`。

`loader` 负责管理 sketch 与底层 Zephyr 系统之间的交互。对于这个下游仓库，发布包
会带上 loader 固件，以及让 sketch 与之匹配所需的生成文件。

为了保持灵活性，`loader` 工程尽量保持通用。特定开发板所需的修改应该放在对应的
"DTS overlay" 或特殊的 "fixup" 文件中，并用合适的 guard 保持兼容性。

可以通过 IDE 的 `Mode` 菜单调整 loader 行为：

- `Standard`：自动加载 sketch。
- `Debug`：用户需要在默认 Serial 暴露的 Zephyr shell 中输入 `sketch`。

`Link mode` 菜单控制 sketch 的生成方式：

- `Dynamic`：生成由 Zephyr loader 动态加载的 sketch。
- `Static`：将 sketch 链接成可烧录的二进制文件。

项目中最重要的组件包括：

* [Zephyr based loader](/loader)
* [LLEXT](https://docs.zephyrproject.org/latest/services/llext/index.html)
* [Actual core](/cores/arduino)、[variants](/variants)、常规的 [platform](/platform.txt) 和 [boards](/boards) 文件
* [ArduinoCore-API](https://github.com/arduino/ArduinoCore-API)
* [Bun + TypeScript CI scripts](/scripts/ci)

## 🏃 快速方式：不安装 Zephyr，直接在 Arduino IDE/CLI 使用 Core

> [!TIP]
>
> 如果你只想使用当前的 SiFli 开发板支持，按照[安装](#️-安装)章节安装发布包即可。
> 发布包已经包含 loader 固件、生成后的 `llext-edk`、导出符号脚本，以及 Arduino
> IDE/CLI 编译所需的板级 flags。

如果你要开发 [core](/cores/arduino) 或 [libraries](/libraries) 的本地修改，请使用
下面的本地安装流程。修改 Zephyr 配置、overlay 或导出符号后，需要重新构建 loader。

## 🛠️ 配置 Zephyr 构建环境

本节介绍如何配置开发环境，用于修改并更新 Zephyr core。

仓库保留了一些 shell 脚本来简化安装流程（当前不直接支持 Windows，但可以通过 WSL
使用，见下文）。旧 shell 入口作为兼容 wrapper 保留；这个下游仓库的 CI 和发布流程
已经迁移到 Bun + TypeScript。

### 前置依赖

运行安装脚本前，请确保已经安装 Python、`pip` 和 `venv`。脚本会自动安装 `west`
并管理必要依赖。

同时需要安装 Bun，因为下游构建和打包脚本使用 Bun。安装 Bun 后，再安装
JavaScript 依赖：

```bash
bun install
```

#### Ubuntu 或类似 apt-based 发行版

```bash
sudo apt install python3-pip python3-setuptools python3-venv build-essential git cmake ninja-build zstd jq rsync
```

#### macOS

确保已经安装 Homebrew，然后运行：

```bash
# 安装 Xcode Command Line Tools
xcode-select --install

# 安装所需工具和库
brew install python cmake ninja zstd jq git
```

说明：Homebrew 的 Python 已经包含 `pip`、`setuptools` 和 `venv`。

#### Windows

当前不支持 Windows 原生构建；不过可以通过
[WSL](https://learn.microsoft.com/windows/wsl/about) 配置并构建 loader。安装 WSL 后，
按 Ubuntu 的说明操作。

Windows 上有两种源码放置方式：

1. 把源码放在 Windows 原生文件系统中，然后在 WSL 中进入对应路径，例如 `/mnt/d/github/ArduinoCore-zephyr`。
2. 把源码放在 WSL 文件系统中，例如 `~/git/ArduinoCore-zephyr`。

两种方式各有取舍：

1. 在 Windows 原生文件系统上构建会比较慢，但构建结果可以更方便地直接给 Arduino IDE 使用。
2. 在 WSL 文件系统上构建更快，但需要把构建结果复制回 Windows 目录。Arduino IDE 使用方式见[在 Arduino IDE/CLI 中使用本地 Core](#在-arduino-idecli-中使用本地-core)。

`bootstrap.sh` 完成后，你可能还需要把 `cores\arduino\api` 链接更新到
ArduinoCore-API 的 `api` 文件夹路径。

### Clone 仓库

```bash
mkdir my_new_zephyr_folder && cd my_new_zephyr_folder
git clone https://github.com/OpenSiFli/ArduinoCore-zephyr
```

### 运行 ```bootstrap``` 脚本

```bash
cd ArduinoCore-zephyr
yes | ./extra/bootstrap.sh -o=--filter=tree:0
```

这会安装 Zephyr 构建工具 `west`，并下载 Zephyr 构建需要的包和 SDK 工具链。

> [!NOTE]
> 这个下游仓库使用 package index 中的 Zephyr SDK v1.0.1 toolchain packages
> 进行验证。未测试旧版本兼容性。

## 🛠️ 重新生成编译产物

### 构建 Loader

可以通过兼容 wrapper 构建当前开发板的 loader：

```bash
./extra/build.sh sf32lb52devkitlcd
```

也可以直接使用 CI 中的 Bun + TypeScript 脚本：

```bash
bun run scripts/ci/build-loader.ts sf32lb52devkitlcd
```

固件产物会复制到 [firmwares](/firmwares) 文件夹，对应 variant 会更新生成后的
`llext-edk`、导出符号脚本和 Arduino 编译 flags。

### 烧录 Loader

如果从本地 Zephyr build 目录烧录 loader，可以运行：

```bash
west flash -d build/sf32lb52_devkit_lcd_sf32lb525uc6
```

如果 core 已正确安装，也可以通过 IDE 的 "Burn bootloader" 动作执行。发布包中的
bootloader 产物是 `zephyr-sf32lb52_devkit_lcd_sf32lb525uc6.ftab.hex` 和
`zephyr-sf32lb52_devkit_lcd_sf32lb525uc6.bin`，上传工具是 `sftool`。

### 在 Arduino IDE/CLI 中使用本地 Core

运行 `bootstrap.sh` 并构建 loader 后，可以将 `ArduinoCore-zephyr` 文件夹 symlink 到
`${sketchbook}/hardware/sifli-git/sf32lb52`，也可以手动复制到该位置。

> [!IMPORTANT]
> 请确保 `boards.txt` 的最终路径是
> `${sketchbook}/hardware/sifli-git/sf32lb52/boards.txt`。
>
> 上面的 `sf32lb52` 文件夹名会成为 FQBN 架构名的一部分
> (`packager:architecture:board`)，也会影响库兼容性检查。使用其他架构目录名可能导致：
> - FQBN 不受支持，例如 `sifli-git:wrong_folder:sf32lb52devkitlcd`
> - 架构限定的库没有被选中

完成后，本地开发版会在 IDE/CLI 中显示为 `sifli-git:sf32lb52`，使用的 FQBN 是
`sifli-git:sf32lb52:sf32lb52devkitlcd`。

请记得也通过 IDE Board Manager 安装或更新正式发布版 core，以获取最新工具和依赖。
[⚙️ 安装](#️-安装)。

### 在 Arduino App Lab 中使用 Core

> [!WARNING]
> 当前 OpenSiFli 下游仓库尚未验证 Arduino App Lab 支持。请使用 Arduino IDE 或
> Arduino CLI 测试 `sf32lb52devkitlcd`。

## 🚀 添加新目标

> [!TIP]
>
> 当前下游发布包只发布 `sf32lb52devkitlcd`。新目标可以先在仓库内开发；只有当
> loader、variant、CI 构建和上传流程都准备好后，才应加入 `boards.txt` 和发布包。

如果要添加一个已经被下游 Zephyr tree 支持的目标 `$your_board`，步骤如下：

* 运行 `extra/get_variant_name.sh $your_board` 获取 variant 名。
* 在 [`variants/`](/variants) 目录中创建同名文件夹。
* 在该目录中创建 DTS `<variant>.overlay` 和 Kconfig `<variant>.conf` 文件。

  overlay 必须包含：
  * 名为 `user_sketch` 的 flash partition，通常放在 flash 末尾附近。
  * `zephyr,user` section，用于描述 GPIO、Analog、UART、SPI 和 I2C 设备。如果 Zephyr 暂不支持某些部分，可以留空；对应 API 运行时将不可用，例如 PWM section 为空时 `analogWrite` 不可用。

  Kconfig 文件必须包含该目标所需的板级选项。
* 构建 Loader：运行 `./extra/build.sh $your_board` 或 `bun run scripts/ci/build-loader.ts $your_board`，并开始处理错误。
* 更新 `boards.txt`，加入开发板条目并填写必要字段。

  请确保设置：
   * `build.zephyr_target` 和 `build.zephyr_args`，对应构建调用中使用的参数；
   * `build.zephyr_hals`，即开发板需要的 HAL module 列表，用空格分隔；
   * `build.variant`，即前面识别出的 variant 名。
* 实现开发板上传流程所需的 touch 或串口下载支持。
* 只有目标达到发布状态后，才扩展 CI matrix。

## 📦 CI 与发布流程

主要 workflow 是 `.github/workflows/package_core.yml`。

PR 和普通 push 会执行：

* 安装 Bun 和构建依赖；
* 初始化下游 Zephyr workspace；
* 构建 `sf32lb52devkitlcd` loader；
* 打包 core；
* 生成本地 package index；
* 用 Arduino CLI 安装 package；
* 分别用 dynamic 和 static link mode 编译 Blink。

tag push 会额外执行：

* 创建或更新 GitHub Release；
* 上传 core 包、loader 固件、package index 和本地工具包；
* 生成 GitHub 版和中国镜像版 package index；
* 使用 `OpenSiFli/SiFliMirrorSync@v1` 将 release assets 同步到中国镜像。

release package index 有两个版本：

* `package_sifli_index.json`：指向 GitHub release asset URL。
* `package_sifli_index_cn.json`：package metadata 相同，但将 GitHub asset URL 从 `https://github.com/` 改写为 `https://downloads.sifli.com/github_assets/`。

package 用到的非 OpenSiFli 外部 assets，例如 Zephyr SDK toolchains，通过
`OpenSiFli/MirrorTool` 单独镜像。OpenSiFli release assets 由本仓库 release workflow
处理。

发布新版本：

```bash
git tag -a 0.1.2 -m "0.1.2"
git push origin 0.1.2
```

## 🧪 测试

运行 TypeScript 检查和测试：

```bash
bunx --bun tsc --noEmit
bun test
```

CI release workflow 还会通过 Arduino CLI 对 `sf32lb52devkitlcd` 进行安装和 sketch
编译测试。

## 🐛 Bug Reporting

如需报告 bug，请打开 [issues](/../../issues) 并按模板提供信息。缺少必要信息的 issue
可能会被关闭。

## 🙌 Contributions

欢迎贡献代码。推荐通过 [Pull request](/../../pulls) 提交修改。

> [!WARNING]
> 当前阶段这个下游仓库聚焦于稳定 `sf32lb52devkitlcd`。如果要加入新目标支持，请先
> 开 issue 讨论后再提交较大的 PR。

## 📌 Upcoming features

- [ ] USB: switch to `USB_DEVICE_STACK_NEXT` to support PluggableUSB
- [x] Relocate RODATA in flash to accommodate sketches with large assets
- [ ] Provide better error reporting for failed llext operations
- [ ] Replace [`llext_exports.c`](/loader/llext_exports.c) with proper symbols generation (via includes)
- [ ] Fix corner cases with `std::` includes (like `<iterator>`)
- [ ] Get rid of all warnings

## 🌟 Acknowledgments

这个下游仓库保留了 Arduino Zephyr core 的整体结构和许多上游组件，同时加入
OpenSiFli 所需的 SiFli 板卡、loader、发布和镜像流程。
