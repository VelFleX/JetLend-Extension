// Фетч для попапа (исправляет проблемы)
function fetchData(url) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "fetchData",
        url: url,
      },
      (response) => {
        resolve(response);
      }
    );
  });
}

// Функуия обновления настроек инвестирования
function updateInvestSettings() {
  const newSettings = {
    daysFrom: daysFrom.value,
    daysTo: daysTo.value,
    rateFrom: rateFrom.value,
    rateTo: rateTo.value,
    loansFrom: loansFrom.value,
    loansTo: loansTo.value,
    investSum: investSum.value,
  };
  chrome.storage.local.set({ investSettings: newSettings });
}

// Функция отправки браузерных уведомления
function sendNotification(title, text) {
  const image =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxjbGlwUGF0aCBjbGlwUGF0aFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgaWQ9ImEiPgogICAgICA8cGF0aCBkPSJNMCA2NzYuNDQ3aDE2MzAuNzk3VjBIMHY2NzYuNDQ3eiIvPgogICAgPC9jbGlwUGF0aD4KICA8L2RlZnM+CiAgPGcgY2xhc3M9ImxheWVyIj4KICAgIDxnIHRyYW5zZm9ybT0ibWF0cml4KDEuMzMzMzMgMCAwIC0xLjMzMzMzIDAgOTAxLjkzKSIgY2xpcC1wYXRoPSJ1cmwoI2EpIj4KICAgICAgPHBhdGggZmlsbD0iIzBhZDE5NCIgZD0iTTEyMC45NTIgNjc2LjEzMkwwIDY0MS4xMjZsNTAuNDcxLTUwLjQ3IDM3Ljg4OC0zNi4xNiAzMi41OTMgMTIxLjYzNnoiLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPg==";
  let notification = new Notification(title, {
    body: text,
    icon: image,
  });
  return notification;
}

// Функция открытия инвест страницы
function openInvestPage() {
  document.querySelector(".invest-section").style.top = "0";
  document.body.style.height = "470px";
  if (document.body.classList.contains("bigBody")) {
    document.body.classList.remove("bigBody");
  }
}

// Функция закрытия инвест страницы
function closeInvestPage() {
  document.querySelector(".invest-section").style.top = "-1000px";
  document.body.style.height = "";
}

// Функция открытия страницы поддержки
function openSupportPage() {
  let popup = document.querySelector(".support-section");
  popup.classList.remove("display-none");
}

// Функция закрытия страницы поддержки
function closeSupportPage() {
  let popup = document.querySelector(".support-section");
  popup.classList.add("display-none");
}

// Функция правильного окончания "займа"
function getZaimEnding(n) {
  let ending = "";
  if (n % 10 === 1 && n % 100 !== 11) {
    ending = "займ";
  } else if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) {
    ending = "займа";
  } else {
    ending = "займов";
  }
  return ending;
}

// Функция преобразования unix в читаемую дату вида 20 февраля 2020 г. в 20:20:20
function formatReadableDate(dateString) {
  const date = new Date(dateString);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  };
  return date.toLocaleDateString(undefined, options);
}

// Функция отображения времени последнего обноления
function getUpdateTime(unixTime) {
  const date = new Date(unixTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const currentTime = new Date().getTime();
  const formattedDateTime = `Обновлено${
    currentTime - 86_400_000 > unixTime ? ` ${day}.${month}.${year}` : ""
  } в ${hours}:${minutes}`;
  return formattedDateTime;
}

// Функция перевода из числового в денежный формат (20.20 => 20,20 ₽)
const toCurrencyFormat = (element) =>
  element.toLocaleString("ru-RU", { style: "currency", currency: "RUB" });

// Функция перевода из числа в проценты (0.2 => 20 %)
const toPercentFormat = (element) =>
  `${(element * 100).toFixed(2).replace(".", ",")} %`;

// Функция получения цвета в зависимости от числа (зеленый, красный, дефолт)
const decorNumber = (element) =>
  element > 0 ? "#00ba88" : element != 0 ? "#f23c3c" : "var(--var-fontColor)";

// Функция добавления знака "+" положительным числам
const numberSign = (number) => (number > 0 ? "+" : "");

// Функция получения куки
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}
