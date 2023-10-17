chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchData') {
    fetch(request.url, {
      credentials: 'include',
      headers: {
        'SameSite': 'None; Secure'
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Проблема с интернет соединением или нет авторизации");
        }
        return response.json();
      })
      .then((json) => {
        sendResponse({data: json});
      })
      .catch((error) => {
        sendResponse({error: error.message});
      });
  }
  return true;
});


  

