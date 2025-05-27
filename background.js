const ICONS = {
  light: {
    link: {
      16: 'icons/link-dark.svg',
      32: 'icons/link-dark.svg',
    },
    check: {
      16: 'icons/check-dark.svg',
      32: 'icons/check-dark.svg',
    },
  },
  dark: {
    link: {
      16: 'icons/link-light.svg',
      32: 'icons/link-light.svg',
    },
    check: {
      16: 'icons/check-light.svg',
      32: 'icons/check-light.svg',
    },
  },
};

let currentTheme = 'light';

function updateTheme() {
  browser.theme.getCurrent().then(theme => {
    if (theme.colors && theme.colors.toolbar) {
      // Heuristic: if toolbar color is dark, use light icons
      const rgb = theme.colors.toolbar.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const [r, g, b] = rgb.map(Number);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        currentTheme = brightness < 128 ? 'dark' : 'light';
      } else {
        currentTheme = 'light';
      }
    } else {
      currentTheme = 'light';
    }
    browser.action.setIcon({
      path: ICONS[currentTheme].link
    });
  });
}

browser.theme.onUpdated.addListener(updateTheme);
updateTheme();

browser.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.url) return;
  try {
    await navigator.clipboard.writeText(tab.url);
  } catch (e) {
    // fallback for clipboardWrite permission
    const textarea = document.createElement('textarea');
    textarea.value = tab.url;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
  // Animate icon: link -> check -> link
  browser.action.setIcon({ path: ICONS[currentTheme].check });
  setTimeout(() => {
    browser.action.setIcon({ path: ICONS[currentTheme].link });
  }, 1200);
}); 