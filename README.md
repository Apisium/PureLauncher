# PureLauncher ![GitHub package.json version](https://img.shields.io/github/package-json/v/Apisium/PureLauncher) [![codebeat badge](https://codebeat.co/badges/2afd1913-119b-4b47-acb8-dbac54259a4e)](https://codebeat.co/projects/github-com-apisium-purelauncher-master) ![GitHub](https://img.shields.io/github/license/Apisium/PureLauncher) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

An awesome Minecraft Launcher.

## Features

- 🚀 Fast launching.
- 💘 Beautiful GUI.
- 🎉 Custom protocol.
- 🤔 Powerful extension and rich API.
- 🎁 One-click download and install resources.
- ✨ And more...

## Snapshots

![Home](./snapshots/home.jpg)

![Accounts](./snapshots/accounts.jpg)

![Settings](./snapshots/settings.jpg)

## Documentation

For plugins developers, resource creators, testers and advanced users:

[https://github.com/Apisium/PureLauncher/wiki](https://github.com/Apisium/PureLauncher/wiki)

## Build

**Please do not use [Yarn](https://yarnpkg.com) !**

### Requirements

- Nodejs v12.0.0+
- [Rust](https://rustup.rs/)

### Commands

```bash
npm i

npm run build
```

Use taobao registry:

```bash
set REGISTRY=https://registry.npm.taobao.org/
set dist-url=http://npm.taobao.org/mirrors/atom-shell
set ELECTRON_MIRROR=http://npm.taobao.org/mirrors/electron/
set ELECTRON_CUSTOM_DIR=7.1.7
```

### Development

```bash
# Run debugging server:
npm start

# Run Electron:
npm run run
```

## Authors

- Shirasawa
- CI010

## License

[MIT](./LICENSE)
