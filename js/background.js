// Фетчдата
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchData") {
    fetch(request.url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        SameSite: "None; Secure",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Ошибка загрузки.`);
        }
        return response.json();
      })
      .then((json) => {
        sendResponse({ data: json });
      })
      .catch((error) => {
        sendResponse({ error: error.message });
      });
    return true;
  }
});

// Уведомления баджа
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "setBadge") {
    chrome.action.setBadgeText({ text: request.text });
    chrome.action.setBadgeBackgroundColor({ color: request.color });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "getBadge") {
    new Promise((res) => {
      chrome.action.getBadgeText({}, function (result) {
        res(result ?? null);
      });
    }).then((badgeText) => {
      sendResponse({ badgeText: badgeText });
    });
    return true; // указывает, что мы будем использовать sendResponse асинхронно
  }
});

// Открытие расширения в новом окне сочетанием клавиш
chrome.commands.onCommand.addListener(function (command) {
  if (command === "open_extension") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length > 0 && tabs[0].url !== "chrome://newtab/") {
        chrome.windows.create({ url: "html/popup.html", type: "popup" });
      } else {
        chrome.tabs.create({ url: chrome.runtime.getURL("html/popup.html") });
      }
    });
  }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "createWindow") {
    chrome.windows.create({ url: message.url, focused: false });
  }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "createTab") {
    chrome.tabs.create({ url: message.url, active: false });
  }
});
