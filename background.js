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
    // Update both action and page action icons
    browser.action.setIcon({ path: ICONS[currentTheme].link });
    browser.pageAction.setIcon({ path: ICONS[currentTheme].link });
  }).catch(error => {
    console.error('Theme detection error:', error);
    currentTheme = 'light';
  });
}

// Update theme when it changes
browser.theme.onUpdated.addListener(updateTheme);
// Initial theme detection
updateTheme();

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // For each tab that updates, decide if we show/hide the page action.
  showHidePageAction(tabId);
});

// We'll also check all existing tabs once on startup
browser.tabs.query({}).then((tabs) => {
  tabs.forEach((tab) => showHidePageAction(tab.id));
});

async function showHidePageAction(tabId) {
  const { showPageAction } = await browser.storage.local.get('showPageAction');
  if (showPageAction !== false) { // default to true if not set
    browser.pageAction.show(tabId);
  } else {
    browser.pageAction.hide(tabId);
  }
}

// Listen for preference changes
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.showPageAction) {
    // Update all tabs when preference changes
    browser.tabs.query({}).then((tabs) => {
      tabs.forEach((tab) => showHidePageAction(tab.id));
    });
  }
});

async function copyUrlAndAnimateIcon(tab, source) {
  if (!tab || !tab.url) return;
  
  try {
    await navigator.clipboard.writeText(tab.url);
    
    // Only change the icon that was clicked
    const checkIcon = ICONS[currentTheme].check;
    const linkIcon = ICONS[currentTheme].link;
    
    if (source === 'action') { // extension icon clicked
      await browser.action.setIcon({ path: checkIcon });
      setTimeout(async () => {
        await browser.action.setIcon({ path: linkIcon });
      }, 1200);
    } else if (source === 'pageAction') { // url bar icon clicked
      await browser.pageAction.setIcon({ 
        tabId: tab.id,
        path: checkIcon 
      });
      setTimeout(async () => {
        await browser.pageAction.setIcon({ 
          tabId: tab.id,
          path: linkIcon 
        });
      }, 1200);
    }
    
  } catch (e) {
    console.error('Copy failed:', e);
    // Fallback for clipboardWrite permission
    const textarea = document.createElement('textarea');
    textarea.value = tab.url;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
}

// Handle browser action click
browser.action.onClicked.addListener((tab) => {
  copyUrlAndAnimateIcon(tab, 'action');
});

// Handle page action click
browser.pageAction.onClicked.addListener((tab) => {
  copyUrlAndAnimateIcon(tab, 'pageAction');
}); 