# Volume Cap

[![Test](https://github.com/Nachtalb/volume-cap/actions/workflows/test.yml/badge.svg)](https://github.com/Nachtalb/volume-cap/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/manifest-v3-orange.svg)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![Version](https://img.shields.io/github/manifest-json/v/Nachtalb/volume-cap)](manifest.json)

Boost a tab's volume and cap its peak loudness, so quiet voices are audible
and screams don't blow your ears out. Chrome and Edge.

![popup](docs/popup.png)

## Install

Open `edge://extensions` or `chrome://extensions`, enable Developer mode,
**Load unpacked** and pick this folder.

## Use

Click the icon on a tab. **Boost** turns it up, **Max loudness** is the
ceiling nothing gets past. The graph shows the last few seconds; grey is what
got cut.

## Development

```sh
bun test
uv run tools/make-icons.py  # regenerate icons/
```
