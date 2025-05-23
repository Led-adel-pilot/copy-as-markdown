document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('toggleSwitch');

  // Load the saved state from storage and set the toggle switch
  chrome.storage.local.get('isMarkdownCopyEnabled', (data) => {
    toggleSwitch.checked = data.isMarkdownCopyEnabled !== undefined ? data.isMarkdownCopyEnabled : true;
  });

  // Save the state when the toggle switch is changed
  toggleSwitch.addEventListener('change', function() {
    chrome.storage.local.set({ isMarkdownCopyEnabled: toggleSwitch.checked });
    // No need to explicitly update the context menu here,
    // as background.js already listens for storage changes.
  });
});
