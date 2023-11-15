let wasOpen = false;
if (!wasOpen) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs.length > 0) {
      chrome.tabs.create({ url: 'html/popup.html' });
    }
  });
  wasOpen = true;
}