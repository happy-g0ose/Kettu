# Kettu Turbo
A performance-focused fork of [Kettu](https://github.com/C0C0B01/Kettu) for Discord on Mobile: faster cold start, built-in Turbo tweaks and two lightweight themes.

> Using a third-party client/mod may violate Discord's Terms of Service. Use at your own risk.

### What is different
- `__DEV__` is compiled out, bundle is minified (`dist/kettu.min.js`).
- Non-critical startup work (i18n polling, fonts, external plugins, React DevTools) runs after the first frame instead of blocking it.
- New pre-enabled core plugin **bunny.turbo**: list virtualization defaults, capped blur cost, Android image resize method, GC on memory pressure.
- Two Vendetta-format themes in `themes/`.

### Install the bundle (no PC needed after install)
1. Install a Kettu loader (see [Installing](#installing)).
2. In Discord: **Settings → General → Developer Settings → Load from custom url**.
3. Set **Kettu URL** to:
   ```
   https://raw.githubusercontent.com/happy-g0ose/Kettu/github/dist/kettu.min.js
   ```
4. Restart Discord.

### Themes
Install as a Vendetta theme URL, then select it in Kettu → Themes:
- `https://raw.githubusercontent.com/happy-g0ose/Kettu/github/themes/turbo-amoled.json`
- `https://raw.githubusercontent.com/happy-g0ose/Kettu/github/themes/turbo-slate.json`

### Build locally
Node.js is enough (bun is optional):
```
npm install
npm run build -- --release-branch main --build-minify
```
`--release-branch main` is what disables `__DEV__` — keep it for the production bundle.

### [![Discord](https://img.shields.io/discord/1368145952266911755?logo=discord&logoColor=%23ffffffff&color=%231D88CF&link=https%3A%2F%2Fdiscord.gg%2F6cN7wKa8gp)](https://discord.gg/6cN7wKa8gp) [![Static Badge](https://img.shields.io/badge/kofi-cocobo1-%23FF6433?style=flat&logo=ko-fi&labelColor=%23ffffff)](https://www.ko-fi.com/cocobo1) ![Codeberg Last Commit](https://img.shields.io/gitea/last-commit/cocobo1/Kettu?gitea_url=https%3A%2F%2Fwww.codeberg.org&logo=codeberg&logoColor=%23ffffffff)

## Installing

### Android
- **Root** with Xposed - [KettuXposed](https://github.com/C0C0B01/KettuXposed/releases/latest)
- **Non-root** - [KettuManager](https://github.com/C0C0B01/KettuManager/releases/latest)

If you do not know what root is, go with the manager

### iOS

[KettuTweak](https://github.com/C0C0B01/KettuTweak)

## Building
1. Install a Kettu loader with loader config support (any mentioned in the [Installing](#installing) section).
1. Go to Settings > General and enable Developer Settings.
1. Clone the repo:
    ```
    git clone https://codeberg.org/cocobo1/Kettu
    ```
1. Install dependencies:
    ```
    bun i
    ```
1. Build Kettu's code:
    ```
    bun run build
    ```
1. In the newly created `dist` directory, run a HTTP server. I recommend [http-server](https://www.npmjs.com/package/http-server).
1. Go to Settings > Developer enabled earlier. Enable `Load from custom url` and input the IP address and port of the server (e.g. `http://192.168.1.236:4040/kettu.js`) in the new input box labelled `Kettu URL`.
1. Restart Discord. Upon reload, you should notice that your device will download Kettu's bundled code from your server, rather than GitHub.
1. Make your changes, rebuild, reload, go wild!

Alternatively, you can directly *serve* the bundled code by running `bun run serve`. `kettu.js` will be served on your local address under the port 4040. You will then insert `http://<local ip address>:4040/kettu.js` as a custom url and reload. Whenever you restart your mobile client, the script will rebuild the bundle as your client fetches it.
