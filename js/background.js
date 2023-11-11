chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchData") {
    fetch(request.url, {
      credentials: "include",
      headers: {
        SameSite: "None; Secure",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Проблема с интернет соединением или нет авторизации"
          );
        }
        return response.json();
      })
      .then((json) => {
        sendResponse({ data: json });
      })
      .catch((error) => {
        sendResponse({ error: error.message });
      });
  }
  return true;
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "setBadge") {
    chrome.action.setBadgeText({ text: request.text });
    chrome.action.setBadgeBackgroundColor({ color: request.color });
  }
});

chrome.commands.onCommand.addListener(function(command) {
  if (command === "open_extension") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0 && tabs[0].url !== "chrome://newtab/") {
        chrome.windows.create({url: "html/popup.html", type: "popup"});
      } else {
        chrome.tabs.create({url: chrome.runtime.getURL('html/popup.html')});
      }
    });
  }
});