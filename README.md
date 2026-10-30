# Volume Cap

[![Test](https://github.com/Nachtalb/volume-cap/actions/workflows/test.yml/badge.svg)](https://github.com/Nachtalb/volume-cap/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/manifest-v3-orange.svg)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![Version](https://img.shields.io/github/manifest-json/v/Nachtalb/volume-cap)](manifest.json)
[![Edge Add-ons](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Fhpajfcdpgmbejnechkkcdjmbpbocibnf&query=%24.version&prefix=v&label=edge%20add-ons)](https://microsoftedge.microsoft.com/addons/detail/volume-cap/hpajfcdpgmbejnechkkcdjmbpbocibnf)
<!-- Chrome Web Store, once approved:
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/inhjbllcpbgbpocobddlbcganfhhikdn?label=chrome%20web%20store)](https://chromewebstore.google.com/detail/inhjbllcpbgbpocobddlbcganfhhikdn)
-->

<a href="https://microsoftedge.microsoft.com/addons/detail/volume-cap/hpajfcdpgmbejnechkkcdjmbpbocibnf"><img src="docs/edge-badge.png" alt="Get it from Microsoft Edge" height="58"></a>
<!-- Chrome Web Store, once approved:
<a href="https://chromewebstore.google.com/detail/inhjbllcpbgbpocobddlbcganfhhikdn"><img src="docs/chrome-badge.png" alt="Available in the Chrome Web Store" height="58"></a>
-->

Boost a tab's volume and cap its peak loudness, so quiet voices are audible
and screams don't blow your ears out. Chrome and Edge.

![popup](docs/popup.png)

## Install

Get it from [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/volume-cap/hpajfcdpgmbejnechkkcdjmbpbocibnf).
<!-- Chrome Web Store, once approved:
Get it from [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/volume-cap/hpajfcdpgmbejnechkkcdjmbpbocibnf) or the
[Chrome Web Store](https://chromewebstore.google.com/detail/inhjbllcpbgbpocobddlbcganfhhikdn).
-->

Or from source: open `edge://extensions` or `chrome://extensions`, enable
Developer mode, **Load unpacked** and pick this folder.

## Use

Click the icon on a tab. **Boost** turns it up, **Max loudness** is the
ceiling nothing gets past. The graph shows the last few seconds; grey is what
got cut.

## Development

```sh
bun test
uv run tools/make-icons.py  # regenerate icons/
```
