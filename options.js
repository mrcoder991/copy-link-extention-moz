// Load saved preferences
browser.storage.local.get('showPageAction').then((result) => {
  document.getElementById('showPageAction').checked = result.showPageAction !== false; // default to true
});

// Save preferences when changed
document.getElementById('showPageAction').addEventListener('change', (e) => {
  const showPageAction = e.target.checked;
  browser.storage.local.set({ showPageAction });
}); 