> [!IMPORTANT]
> This core is in **BETA**.
> This OpenSiFli downstream follows Arduino's Zephyr core work and will remain
> beta until the upstream core and the SiFli downstream integration are stable.
> Features, APIs, loader behavior, package contents, and release mechanics may
> still change between releases. Use for testing only and provide feedback.
>
> [![Default branch status](https://github.com/OpenSiFli/ArduinoCore-zephyr/actions/workflows/package_core.yml/badge.svg?branch=main&event=push)](https://github.com/OpenSiFli/ArduinoCore-zephyr/actions/workflows/package_core.yml)

# 🚧 Arduino Core for Zephyr

This repository is the OpenSiFli downstream fork of the [Arduino Core for
Zephyr RTOS-based boards](https://github.com/zephyrproject-rtos/arduino-core-zephyr)
that includes support for Arduino software tools, allowing it to be seamlessly
used by the [Arduino IDE](https://docs.arduino.cc/software/ide/) and
[Arduino CLI](https://docs.arduino.cc/arduino-cli/).

This downstream currently publishes the `sifli:sf32lb52` package, with
`SiFli Serial Boards` as the Boards Manager title and
`sifli:sf32lb52:sf32lb52devkitlcd` as the active board FQBN. The Zephyr
workspace uses [`OpenSiFli/zephyr-downstream`](https://github.com/OpenSiFli/zephyr-downstream)
as pinned by `west.yml`.

Simplified Chinese documentation is available in [README.zh-CN.md](README.zh-CN.md).

## 🧐 What is Zephyr?

[Zephyr RTOS](https://zephyrproject.org/) is an open-source, real-time operating system designed for low-power, resource-constrained devices. It's modular, scalable, and supports multiple architectures.

![Zephyr RTOS Logo](doc/zephyr_logo.jpg)

## ⚙️ Installation

Install the core and its toolchains via Board Manager:
* Download and install the latest [Arduino IDE](https://www.arduino.cc/en/software) (only versions `2.x.x` are supported).
* Open the *'Settings / Preferences'* window.
* Add one of the following URLs to the *'Additional Boards Manager URLs'* field:
  * GitHub: `https://github.com/OpenSiFli/ArduinoCore-zephyr/releases/latest/download/package_sifli_index.json`
  * China mirror: `https://downloads.sifli.com/github_assets/OpenSiFli/ArduinoCore-zephyr/releases/latest/download/package_sifli_index_cn.json`
* Open the *'Boards Manager'* from the side menu and search for *'SiFli Serial Boards'*.
* Install the `sifli:sf32lb52` platform.
* Select the `SiFli SF32LB52 DevKit LCD` board.

Alternatively, to install the core using the command line, run the following command with the Arduino CLI:

```bash
arduino-cli core install sifli:sf32lb52 \
  --additional-urls https://github.com/OpenSiFli/ArduinoCore-zephyr/releases/latest/download/package_sifli_index.json
```

For users in China, use the mirrored package index:

```bash
arduino-cli core install sifli:sf32lb52 \
  --additional-urls https://downloads.sifli.com/github_assets/OpenSiFli/ArduinoCore-zephyr/releases/latest/download/package_sifli_index_cn.json
```

## 🏗️ First Use

To get started with `sf32lb52devkitlcd`:
* Put the board in serial download mode.
* Select the board with FQBN `sifli:sf32lb52:sf32lb52devkitlcd`.
* Compile and upload your first sketch from the IDE/CLI. The upload tool is `sftool`.

For example, using Arduino CLI:

```bash
arduino-cli compile \
  --fqbn sifli:sf32lb52:sf32lb52devkitlcd:link_mode=dynamic \
  /path/to/YourSketch

arduino-cli upload \
  -p /dev/cu.usbserial-XXXX \
  --fqbn sifli:sf32lb52:sf32lb52devkitlcd:link_mode=dynamic \
  /path/to/YourSketch
```

> [!NOTE]
> Replace `/dev/cu.usbserial-XXXX` with the serial port exposed by your board.
> The `Link mode` menu can be set to either `Dynamic` or `Static`.

## 🔧 Troubleshooting

### Common Issues

#### **Q: My Sketch doesn't start (Serial doesn't appear)**
**A:** Connect a USB-to-UART adapter to the default UART and read the error message (with the sketch compiled in `Standard` mode). If you compile the sketch in `Debug` mode, the shell will wait until you run the `sketch` command. For OS crashes, the USB-to-UART adapter is usually the best way to collect the crash.

---

#### **Q: I did it and I get the error: `<err> llext: Undefined symbol with no entry in symbol table ...`**
**A:** This means you are trying to use a Zephyr function which has not yet been exported. Open `loader/llext_exports.c`, add the function you need and recompile/upload the loader.

---

#### **Q: I want to use a Zephyr subsystem which is not compiled in**
**A:** Open the `.conf` file for your board, add the required `CONFIG_`, recompile/upload the loader.

---

#### **Q: I get an OS crash, like `<err> os: ***** USAGE FAULT *****`**
**A:** This is usually due to a buffer overflow or coding error in the user's own code. However, since the project is still in beta, a [good bug report](#-bug-reporting) could help identify any issues in the core, loader, or downstream board integration.

---

#### **Q: I get an out of memory error**
**A:** Zephyr's shell and dynamic sketch loading both consume RAM. Adjust your board's `.conf` file to reduce the stack size if your platform doesn't have enough RAM.

---

#### **Q: I get a compilation error during library detection, but the mentioned libraries are installed**
**A:** If you have installed the core locally in your Arduino sketchbook, make sure the Zephyr core is installed in a folder named `sf32lb52` (`${sketchbook}/hardware/sifli-git/sf32lb52`).
See the [Using the Core in Arduino IDE/CLI](#using-the-core-in-arduino-idecli) section for further details on the installation.

## 📚 Libraries

### Included with the core: ###

### Separately supplied: ###
- **ArduinoBLE**: Bluetooth support depends on the loader configuration for the target board. The current SiFli loader configuration is aligned with raw HCI controller mode for ArduinoBLE integration.

## 🧢 Under the hood

Unlike traditional Arduino implementations, where the final output is a standalone binary loaded by a bootloader, this core generates a freestanding `elf` file. This file is dynamically loaded by a precompiled Zephyr firmware, referred to as the `loader`.

The `loader` is responsible for managing the interaction between your sketches and the underlying Zephyr system. The downstream package ships the loader firmware and the generated files required to compile sketches against it.

To ensure flexibility, the `loader` project is designed to be generic. Any necessary modifications for specific boards should be made in the corresponding "DTS overlay" or a special "fixup" file, using appropriate guards to maintain compatibility.

The behavior of the `loader` can be adjusted through the `Mode` menu of the IDE:
- `Standard`: The sketch is loaded automatically.
- `Debug`: The user must type `sketch` in Zephyr's shell, which is accessible via the default Serial.

The behavior of the sketch build can be adjusted through the `Link mode` menu of the IDE:
- `Dynamic`: The sketch is packaged for dynamic loading by the Zephyr loader.
- `Static`: The sketch is linked into a flashable binary.

The most important components of this project are:

* [Zephyr based loader](/loader)
* [LLEXT](https://docs.zephyrproject.org/latest/services/llext/index.html)
* [Actual core](/cores/arduino) with [variants](/variants) and the usual [platform](/platform.txt) and [boards](/boards) files
* [ArduinoCore-API](https://github.com/arduino/ArduinoCore-API)
* [Bun + TypeScript CI scripts](/scripts/ci)

## 🏃 Shortcut: using the Core in Arduino IDE/CLI without installing Zephyr

> [!TIP]
>
> If you are only interested in using the current SiFli board support, install
> the released package from the [Installation](#️-installation) section. The
> package already contains the loader firmware, `llext-edk`, exported symbol
> scripts, and board-specific compile flags needed by Arduino IDE/CLI.

For local core or library development, follow the instructions in [Using the Core in Arduino IDE/CLI](#using-the-core-in-arduino-idecli) and remember to [update the loader on your board](#flash-the-loader) after changing Zephyr configuration, overlays, or exported symbols.

## 🛠️ Setup a Zephyr build environment

In this section, we’ll guide you through setting up your environment to work on and update the Zephyr core.

Shell scripts are available to simplify the installation process (Windows is not directly supported at the moment, but there are some tricks - see below). The legacy shell entry points are kept as compatibility wrappers; the downstream CI and release path uses Bun + TypeScript.

### Pre-requirements
Before running the installation script, ensure that Python, `pip` and `venv` are installed on your system. The script will automatically install `west` and manage the necessary dependencies.

Install Bun as well, then install the JavaScript dependencies:

```bash
bun install
```

#### On Ubuntu or similar apt-based distros
```bash
sudo apt install python3-pip python3-setuptools python3-venv build-essential git cmake ninja-build zstd jq rsync
```
#### On macOS
Make sure you have Homebrew installed. Then run:

```bash
# Install Xcode Command Line Tools (needed for compilers and make)
xcode-select --install

# Install required tools and libraries
brew install python cmake ninja zstd jq git
```
Note: Homebrew’s Python installation already includes `pip`, `setuptools` and `venv`.

#### On Windows
Building natively on Windows is not currently supported; however, it is possible to setup and build the loader using [WSL](https://learn.microsoft.com/windows/wsl/about). Once you have that installed, you will need to follow these instructions as if you had Ubuntu.

There are two strategies to set up the sources for building the loader on Windows:
1) Install the sources in the native Windows filesystem (NTFS, FAT32, etc) and within WSL, cd to the root directory where you installed your sources, like: `/mnt/d/github/ArduinoCore-zephyr`.
2) Install the sources within the WSL file system, like: `~/git/ArduinoCore-zephyr`

There are pros and cons to both strategies:
1) Builds on the native Windows file system are relatively very slow, but once done, you can use the results directly within the Arduino IDE.
2) Builds on WSL's file system are a lot faster, however, you need to copy the resulting build back to somewhere in your Windows directory structure. Use this location in the Arduino IDE as mentioned below in the [Using the Core in Arduino IDE/CLI](#using-the-core-in-arduino-idecli) section.

After `bootstrap.sh` has completed, you may also have to update the `cores\arduino\api` link to the path of the ArduinoCore-API's `api` folder.

### Clone the repository
```bash
mkdir my_new_zephyr_folder && cd my_new_zephyr_folder
git clone https://github.com/OpenSiFli/ArduinoCore-zephyr
```

### Run the ```bootstrap``` script
```bash
cd ArduinoCore-zephyr
yes | ./extra/bootstrap.sh -o=--filter=tree:0
```

This will take care of installing `west`, the Zephyr build tool. It will then
download all packages required for a Zephyr build in addition to the toolchains
in the Zephyr SDK.

> [!NOTE]
> This downstream is validated with version v1.0.1 of the Zephyr SDK toolchain packages used by the package index. Compatibility with older versions has not been tested.

## 🛠️ Regenerate the compiled core files

### Build the Loader

The loader is compiled for the active board by running the `./extra/build.sh` compatibility wrapper or the Bun + TypeScript script used by CI.
The target is specified with the Arduino board name as defined in `boards.txt`.

For example, to build for the SiFli SF32LB52 DevKit LCD:
```bash
./extra/build.sh sf32lb52devkitlcd
```

or:

```bash
bun run scripts/ci/build-loader.ts sf32lb52devkitlcd
```

The firmwares will be copied to the [firmwares](/firmwares) folder, and the
associated variant will be updated with the generated `llext-edk`, exported
symbol scripts, and Arduino compile flags.

### Flash the Loader

To flash the loader, run:

```bash
west flash -d build/sf32lb52_devkit_lcd_sf32lb525uc6
```

The `<variant-name>` appears in the build output when you run the build script. For example:

```bash
% ./extra/build.sh sf32lb52devkitlcd

Build target: sf32lb52_devkit_lcd -- -DZEPHYR_EXTRA_MODULES=...
Build variant: sf32lb52_devkit_lcd_sf32lb525uc6
-- west build: generating a build system
...
```

This can also be performed via the "Burn bootloader" action in the IDE if the core is properly installed, as detailed below. The packaged bootloader file is `zephyr-sf32lb52_devkit_lcd_sf32lb525uc6.bin`, and the upload tool is `sftool`.

### Using the Core in Arduino IDE/CLI

After running the `bootstrap.sh` script, you can create a symlink from the
`ArduinoCore-zephyr` folder to `${sketchbook}/hardware/sifli-git/sf32lb52`,
or manually copy the whole folder to that location.

> [!IMPORTANT]
> Make sure the final location of the `boards.txt` file is exactly
> `${sketchbook}/hardware/sifli-git/sf32lb52/boards.txt`.
>
> The `sf32lb52` folder name above is used as part of the FQBN architecture
> (`packager:architecture:board`) and is considered for library
> compatibility checks.
> Using a different architecture folder name may result in:
> - an unsupported FQBN (e.g. `sifli-git:wrong_sf32lb52_folder:sf32lb52devkitlcd`)
> - architecture-specific libraries not being selected

Once this is done, your development folder will appear in the IDE/CLI package
list as `sifli-git:sf32lb52`, and the Fully Qualified Board Name (FQBN) to use
will be `sifli-git:sf32lb52:sf32lb52devkitlcd`.

Remember to also install and/or update the officially published core in the IDE Board Manager to get the latest tools and dependencies.
[⚙️ Installation](#️-installation).

### Using the Core in the Arduino App Lab

> [!WARNING]
> Arduino App Lab support is not currently validated for this OpenSiFli
> downstream. Use Arduino IDE or Arduino CLI for `sf32lb52devkitlcd` testing.

## 🚀 Adding a new target

> [!TIP]
>
> The downstream package currently publishes only `sf32lb52devkitlcd`. New
> targets can be developed in-tree, but they should only be added to
> `boards.txt` and the release package once their loader, variant, CI build, and
> upload flow are ready.

To add a new board that is already supported by the downstream Zephyr tree with the target `$your_board`, follow these steps:

* Get the variant name from your board by running `extra/get_variant_name.sh $your_board`.
* Create a folder in the [`variants/`](/variants) directory with the same name as the variant for your new board.
* Create the DTS `<variant>.overlay` and Kconfig `<variant>.conf` files in that directory.

  The overlay must include:
  * A flash partition called `user_sketch`, typically located near the end of the flash.
  * A `zephyr,user` section containing the description for GPIOs, Analog, UART, SPI and I2C devices. Feel free to leave some fields empty in case Zephyr support is missing. This will result in some APIs not being available at runtime (eg. `analogWrite` if PWM section is empty).

  The Kconfig file must include any board-specific options required by this target.
* Build the Loader: run `./extra/build.sh $your_board` and start debugging the errors. :grin:
* Update the `boards.txt`: add an entry for your board, manually filling the required fields.

  Make sure to set:
   * `build.zephyr_target` and `build.zephyr_args` to the arguments used in the `build.sh` call;
   * `build.zephyr_hals` to the (space-separated list of) HAL modules required by the board;
   * `build.variant` to the variant name identified above.
* Implement touch or serial-download support required by the board upload flow.
* Extend the CI matrix only after the board is ready to be published.

## 📦 CI and release flow

The main workflow is `.github/workflows/package_core.yml`.

On pull requests and pushes it builds the `sf32lb52devkitlcd` loader, packages the core, generates a local package index, installs the package with Arduino CLI, and compiles Blink in both dynamic and static link modes.

On tag pushes it also creates or updates the GitHub Release, uploads the core archive, loader firmware, package indexes, and local tool archives, then syncs release assets to the China mirror with `OpenSiFli/SiFliMirrorSync@v1`.

The release package index has two variants:
* `package_sifli_index.json`: GitHub release asset URLs.
* `package_sifli_index_cn.json`: the same package metadata, but GitHub asset URLs are rewritten from `https://github.com/` to `https://downloads.sifli.com/github_assets/`.

External non-OpenSiFli assets used by the package, such as Zephyr SDK toolchains, are mirrored separately through `OpenSiFli/MirrorTool`. OpenSiFli release assets are handled by this repository's release workflow.

To publish a release:

```bash
git tag -a 0.1.2 -m "0.1.2"
git push origin 0.1.2
```

## 🧪 Tests

Run TypeScript checks and tests:

```bash
bunx --bun tsc --noEmit
bun test
```

The CI release workflow also performs an Arduino CLI install and sketch compile test for `sf32lb52devkitlcd`.

## 🐛 Bug Reporting

To report a bug, open the [issues](/../../issues) and follow the instructions. Any issue opened without the needed information will be discarded.

## 🙌 Contributions

Contributions are always welcome. The preferred way to receive code contribution is by submitting a [Pull request](/../../pulls).

> [!WARNING]
> At this stage of development, this downstream is focused on stabilizing
> `sf32lb52devkitlcd`. Please discuss new target support before opening a large
> pull request.

## 📌 Upcoming features

- [ ] USB: switch to `USB_DEVICE_STACK_NEXT` to support PluggableUSB
- [x] Relocate RODATA in flash to accommodate sketches with large assets
- [ ] Provide better error reporting for failed llext operations
- [ ] Replace [`llext_exports.c`](/loader/llext_exports.c) with proper symbols generation (via includes)
- [ ] Fix corner cases with `std::` includes (like `<iterator>`)
- [ ] Get rid of all warnings

## 🌟 Acknowledgments

This downstream keeps the Arduino Zephyr core structure and many upstream
components while adding the SiFli-specific board, loader, release, and mirror
flow required by OpenSiFli.
