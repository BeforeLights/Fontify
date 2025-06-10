let enabled = true;

chrome.action.onClicked.addListener(async (tab) => {
  enabled = !enabled;
  chrome.action.setBadgeText({ text: enabled ? 'ON' : 'OFF', tabId: tab.id });
  chrome.storage.local.set({ fontifyEnabled: enabled });
  // Send toggle event to all tabs
  const tabs = await chrome.tabs.query({});
  for (const t of tabs) {
    chrome.scripting.executeScript({
      target: { tabId: t.id },
      func: (state) => {
        window.dispatchEvent(new CustomEvent('fontify-toggle', { detail: state }));
      },
      args: [enabled]
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: 'ON' });
  chrome.storage.local.set({ fontifyEnabled: true });
});
