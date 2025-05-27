# Arc Like Copy Link with Animation (Firefox Extension)

This extension copies the current tab's URL to your clipboard with a single click. The toolbar icon animates from a link to a checkmark and back, and its color adapts to the browser's light or dark theme.

## Features
- **One-click copy:** Click the extension icon to copy the current page URL.
- **Animated icon:** The icon animates from a link to a checkmark, then returns to a link.
- **Theme-aware:** Icon color changes based on the browser's theme (not the page's theme).

## Installation
1. Clone or download this repository.
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on**.
4. Select the `manifest.json` file from this project.

## Usage
- Pin the extension to your toolbar for easy access.
- Click the icon to copy the current tab's URL. The icon will animate to a checkmark and then revert.
- The icon color will automatically adapt to your browser's theme.

## Development
- SVG icons are in the `icons/` folder.
- The main logic is in `background.js`.

## Notes
- Clipboard access uses the modern API with a fallback for compatibility.
- Theme detection uses the browser's toolbar color for best results. 