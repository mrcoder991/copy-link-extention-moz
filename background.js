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
    console.log("Updating theme", theme);
    
    // For auto theme (empty theme object) or when no theme info is available
    if (!theme.colors && !theme.properties) {
      // Check if browser is using dark theme by looking at toolbar color
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      currentTheme = prefersDark ? 'dark' : 'light';
      console.log("Auto theme detected, using system preference:", currentTheme);
      updateIcons();
      return;
    }
    
    // For manual theme, analyze the sidebar color
    if (theme.colors && theme.colors.sidebar) {
      const sidebarColor = theme.colors.sidebar;
      console.log("Using sidebar color:", sidebarColor);
      
      // Extract RGB values from sidebar color
      const rgb = sidebarColor.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const [r, g, b] = rgb.map(Number);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        currentTheme = brightness < 128 ? 'dark' : 'light';
        console.log("Calculated theme from sidebar:", currentTheme, "Brightness:", brightness);
      } else {
        // If we can't parse the color, check if it's a dark theme by name
        currentTheme = sidebarColor.toLowerCase().includes('dark') ? 'dark' : 'light';
        console.log("Could not parse sidebar color, using theme name:", currentTheme);
      }
    } else {
      // If no sidebar color, check if we have a color scheme property
      if (theme.properties && theme.properties.color_scheme) {
        currentTheme = theme.properties.color_scheme;
        console.log("Using color_scheme property:", currentTheme);
      } else {
        // Default to light theme if we can't determine
        currentTheme = 'light';
        console.log("No theme information found, defaulting to light theme");
      }
    }
    
    updateIcons();
  }).catch(error => {
    console.error('Theme detection error:', error);
    currentTheme = 'light';
    updateIcons();
  });
}

function updateIcons() {
  // Update browser action icon
  browser.action.setIcon({ path: ICONS[currentTheme].link });
  
  // Update page action icons for all tabs
  browser.tabs.query({}).then((tabs) => {
    tabs.forEach((tab) => {
      browser.pageAction.setIcon({ 
        tabId: tab.id,
        path: ICONS[currentTheme].link 
      });
    });
  });
}

// Initial theme detection
updateTheme();

// Update theme when it changes
browser.theme.onUpdated.addListener(updateTheme);

// Listen for system color scheme changes
if (window.matchMedia) {
  const colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  colorSchemeMedia.addEventListener('change', updateTheme);
}

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