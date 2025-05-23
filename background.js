// background.js

// Function to update context menu title
function updateContextMenuTitle(isEnabled) {
  chrome.contextMenus.update("toggleMarkdownCopy", {
    title: isEnabled ? "Disable Markdown Copy" : "Enable Markdown Copy"
  }, () => {
    if (chrome.runtime.lastError) {
      // This can happen if the menu item doesn't exist yet, though `onInstalled` should handle creation.
      // Or if the extension was just reloaded and the item ID is somehow clashing before onInstalled runs fully.
      // console.warn("Error updating context menu:", chrome.runtime.lastError.message);
      // For robustness, especially during development, we could try to recreate it if update fails.
      // However, the onInstalled logic should be the primary place for creation.
    }
  });
}

// On extension installed/updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed/updated.");

  // Remove any existing context menu item to prevent errors on reload, then recreate.
  chrome.contextMenus.remove("toggleMarkdownCopy", () => {
    // After attempting removal (and ignoring errors if it didn't exist), get/set state and create menu.
    chrome.storage.local.get("isMarkdownCopyEnabled", (data) => {
      let initialIsEnabled = true; // Default to true
      if (typeof data.isMarkdownCopyEnabled !== "undefined") {
        initialIsEnabled = data.isMarkdownCopyEnabled;
      } else {
        // Set the default state if it's not already set
        chrome.storage.local.set({ isMarkdownCopyEnabled: true }, () => {
          console.log("Markdown Copy is enabled by default.");
        });
      }

      // Create the context menu item
      chrome.contextMenus.create({
        id: "toggleMarkdownCopy",
        title: initialIsEnabled ? "Disable Markdown Copy" : "Enable Markdown Copy",
        contexts: ["all"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error creating context menu:", chrome.runtime.lastError.message);
        } else {
          console.log("Context menu created/updated.");
        }
      });
    });
  });
});

// Listener for context menu item clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "toggleMarkdownCopy") {
    chrome.storage.local.get("isMarkdownCopyEnabled", (data) => {
      const currentIsEnabled = data.isMarkdownCopyEnabled;
      const newState = !currentIsEnabled;
      chrome.storage.local.set({ isMarkdownCopyEnabled: newState }, () => {
        updateContextMenuTitle(newState);
        console.log(`Markdown Copy ${newState ? 'enabled' : 'disabled'}`);
        // Later, we will notify content scripts here if needed.
      });
    });
  }
});

// Optional: Listen for storage changes to keep context menu updated
// This is useful if the state could be changed by other parts of the extension (e.g., a popup options page)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.isMarkdownCopyEnabled) {
    console.log("isMarkdownCopyEnabled changed, updating context menu title.");
    updateContextMenuTitle(changes.isMarkdownCopyEnabled.newValue);
  }
});

// Initialize the context menu title when the extension first starts (not just onInstalled)
// This covers cases like browser startup or enabling the extension after it was disabled.
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get("isMarkdownCopyEnabled", (data) => {
        let isEnabled = true; // Default
        if (data && typeof data.isMarkdownCopyEnabled !== 'undefined') {
            isEnabled = data.isMarkdownCopyEnabled;
        }
        // Attempt to update. If it doesn't exist, onInstalled should create it.
        // Or, ensure it's created if it's missing for some reason.
        // For simplicity, we'll just update. onInstalled handles creation.
        updateContextMenuTitle(isEnabled);
    });
});

// A more robust way to ensure the menu exists and title is correct on browser start or extension enable:
// Check and create if necessary, then update title.
// This can be combined with onStartup or run independently.
function ensureContextMenu() {
  chrome.storage.local.get("isMarkdownCopyEnabled", (data) => {
    let isEnabled = true;
    if (typeof data.isMarkdownCopyEnabled !== 'undefined') {
      isEnabled = data.isMarkdownCopyEnabled;
    } else {
      // If state is somehow missing, set it to default
      chrome.storage.local.set({ isMarkdownCopyEnabled: true });
    }

    // Check if menu item exists
    chrome.contextMenus.get("toggleMarkdownCopy", (item) => {
      if (chrome.runtime.lastError) { // An error means it likely doesn't exist
        console.log("Context menu item 'toggleMarkdownCopy' not found on startup/enable, creating it.");
        chrome.contextMenus.create({
          id: "toggleMarkdownCopy",
          title: isEnabled ? "Disable Markdown Copy" : "Enable Markdown Copy",
          contexts: ["all"]
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error creating context menu during ensureContextMenu:", chrome.runtime.lastError.message);
          }
        });
      } else {
        // It exists, just update its title
        updateContextMenuTitle(isEnabled);
      }
    });
  });
}

// Call ensureContextMenu when the extension starts up and when the extension is enabled (if it was previously disabled).
chrome.runtime.onStartup.addListener(ensureContextMenu);
// Note: There isn't a direct "onEnabled" event. `onInstalled` covers initial install and updates.
// `runtime.onStartup` covers browser start. Manual enabling by user means the background script restarts.
// So, just running `ensureContextMenu()` when the script initializes should be sufficient.
ensureContextMenu(); // Run when the script is first loaded/evaluated.
