// content.js

document.addEventListener('copy', function(event) {
  chrome.storage.local.get('isMarkdownCopyEnabled', (data) => {
    // Default to true if isMarkdownCopyEnabled is undefined,
    // though background.js should initialize it.
    const isEnabled = data.isMarkdownCopyEnabled !== undefined ? data.isMarkdownCopyEnabled : true;

    if (!isEnabled) {
      console.log('Markdown Copy: Extension is disabled. Default copy behavior.');
      return; // Allow default copy behavior
    }

    console.log('Markdown Copy: Intercepted copy event (extension enabled)');
    const selection = window.getSelection();

    if (selection.rangeCount > 0) {
      const container = document.createElement('div');
      for (let i = 0; i < selection.rangeCount; i++) {
        container.appendChild(selection.getRangeAt(i).cloneContents());
      }
      const selectedHTML = container.innerHTML;

      // Ensure TurndownService is available
      if (typeof TurndownService === 'undefined') {
        console.error('Markdown Copy: TurndownService is not available. Make sure lib/turndown.js is loaded. Default copy behavior will be used.');
        // Do not preventDefault, allow default copy behavior
        return;
      }

      const turndownService = new TurndownService();

      try {
        const markdown = turndownService.turndown(selectedHTML);

        // Prevent default copy action ONLY if conversion is successful and we are about to write to clipboard
        event.preventDefault();

        navigator.clipboard.writeText(markdown).then(() => {
          console.log('Markdown Copy: Copied to clipboard:', markdown);
        }).catch(err => {
          console.error('Markdown Copy: Failed to write to clipboard:', err);
          // At this point, default copy was already prevented.
          // User might need to manually re-copy if this fails.
          // Or, we could try to restore the original selection and re-trigger copy, but that's complex.
        });
      } catch (e) {
        console.error('Markdown Copy: Error converting HTML to Markdown:', e);
        // If conversion itself fails, default copy behavior is allowed because preventDefault wasn't called for this error path.
      }
    } else {
      console.log('Markdown Copy: No selection to copy.');
      // No selection, so no custom copy action needed, allow default (which will do nothing).
    }
  });
});
