// background.js

// 1. updateContextMenuTitle function
function updateContextMenuTitle(isEnabled) {
  chrome.contextMenus.update("toggleMarkdownCopy", {
    title: isEnabled ? "Disable Markdown Copy" : "Enable Markdown Copy"
  }, () => {
    if (chrome.runtime.lastError) {
      console.warn("Error updating context menu title:", chrome.runtime.lastError.message, "- This might happen if the menu was unexpectedly removed. It should be recreated on next install/startup.");
    }
  });
}

// 2. createContextMenu function (was createOrUpdateContextMenu, renamed as per instructions)
function createContextMenu() {
  chrome.storage.local.get("isMarkdownCopyEnabled", (data) => {
    let isEnabled = true; // Default if not set
    if (typeof data.isMarkdownCopyEnabled !== "undefined") {
      isEnabled = data.isMarkdownCopyEnabled;
    } else {
      // Set the default if it's the very first run
      chrome.storage.local.set({ isMarkdownCopyEnabled: true }, () => {
        console.log("Default value for isMarkdownCopyEnabled set to true.");
      });
    }
    
    chrome.contextMenus.create({
      id: "toggleMarkdownCopy",
      title: isEnabled ? "Disable Markdown Copy" : "Enable Markdown Copy",
      contexts: ["all"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error creating context menu:", chrome.runtime.lastError.message);
      } else {
        console.log("Context menu created successfully.");
      }
    });
  });
}

// 3. onInstalled Listener
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed/updated. Setting up context menu.");
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      // This error is not critical if creation still works.
      console.warn("Error removing all context menus (might be none to remove):", chrome.runtime.lastError.message);
    }
    createContextMenu();
  });
});

// 4. onClicked Listener
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "toggleMarkdownCopy") {
    chrome.storage.local.get("isMarkdownCopyEnabled", (data) => {
      // It's possible isMarkdownCopyEnabled is not yet set if user clicks immediately after install
      // and before createContextMenu's storage.set callback has fired. Default to true for toggle.
      const currentIsEnabled = typeof data.isMarkdownCopyEnabled !== 'undefined' ? data.isMarkdownCopyEnabled : true;
      const newState = !currentIsEnabled;
      chrome.storage.local.set({ isMarkdownCopyEnabled: newState }, () => {
        updateContextMenuTitle(newState);
        console.log(`Markdown Copy ${newState ? 'enabled' : 'disabled'}`);
      });
    });
  }
});

// 5. storage.onChanged Listener
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.isMarkdownCopyEnabled) {
    console.log("Storage change detected for isMarkdownCopyEnabled, updating context menu title.");
    updateContextMenuTitle(changes.isMarkdownCopyEnabled.newValue);
  }
});

// 6. Startup Logic (refreshContextMenu function and onStartup listener)
function refreshContextMenu() {
  chrome.storage.local.get("isMarkdownCopyEnabled", (data) => {
    let isEnabled = true;
    if (typeof data.isMarkdownCopyEnabled !== 'undefined') {
      isEnabled = data.isMarkdownCopyEnabled;
    } else {
      // If state is somehow missing on startup, set it to default
      chrome.storage.local.set({ isMarkdownCopyEnabled: true }, () => {
        console.log("Default value for isMarkdownCopyEnabled set to true during startup refresh.");
      });
    }

    // Attempt to update the existing menu item.
    chrome.contextMenus.update("toggleMarkdownCopy", {
      title: isEnabled ? "Disable Markdown Copy" : "Enable Markdown Copy"
    }, () => {
      if (chrome.runtime.lastError) {
        // This error implies the menu item doesn't exist. Try to (re)create it.
        console.warn("Context menu item 'toggleMarkdownCopy' not found on startup/refresh, attempting to recreate it.", chrome.runtime.lastError.message);
        // Remove all just in case of a very weird state, then create.
        chrome.contextMenus.removeAll(() => {
          if (chrome.runtime.lastError) {
            // Log if removeAll also fails, but proceed to create.
            console.warn("Error removing all context menus during refresh (might be none to remove):", chrome.runtime.lastError.message);
          }
          createContextMenu();
        });
      } else {
        console.log("Context menu title refreshed on startup/refresh.");
      }
    });
  });
}

chrome.runtime.onStartup.addListener(refreshContextMenu);

// 7. Initial Script Execution
// Ensure the context menu is set up when the script first loads (e.g., on enable, or manual reload)
refreshContextMenu();
