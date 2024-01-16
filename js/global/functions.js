const darkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;

// Фетч для попапа (исправляет проблемы)
function fetchData(url) {
  return new Promise((resolve, reject) => {
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        {
          action: "fetchData",
          url: url,
        },
        (response) => {
          resolve(response);
        }
      );
    }
  });
}

function daysEnding(days) {
  const lastTwoDigits = days % 100;
  return days === 1 ? ' день' : (lastTwoDigits >= 11 && lastTwoDigits <= 14) ? ' дней' : (lastTwoDigits % 10 === 1) ? ' день' : (lastTwoDigits % 10 >= 2 && lastTwoDigits % 10 <= 4) ? ' дня' : ' дней';
}

function toShortCurrencyFormat(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' млн ₽';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' тыс ₽';
  }
  return toCurrencyFormat(num);
}

function opneModal(modalId) {
  $.get(`${modalId}`).classList.remove('display-none');
  setTimeout(() => {
    $.get(`${modalId}`).style.opacity = '1';
  }, 0);
  document.body.style.overflow = "hidden";
}

function closeModal(modalId) {
  $.get(`${modalId}`).style.opacity = '0';
  setTimeout(() => {
    $.get(`${modalId}`).classList.add('display-none');
  }, 300);
  document.body.style.overflow = "auto";
}

// Функция изменения текста на значке расширения
function setBadge(text, bgColor = false) {
  let color = bgColor;
  if (darkTheme && !color) {
    color = "#1F2022";
  } else if (!darkTheme && !color) {
    color = "#fff";
  }
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({
      action: "setBadge",
      text: text,
      color: color,
    });
  }
}

// Функция обновления настроек инвестирования
function updateInvestSettings() {
  const newSettings = {
    fmDaysFrom: fmDaysFrom.value,
    fmDaysTo: fmDaysTo.value,
    fmRatingFrom: fmRatingFrom.value,
    fmRatingTo: fmRatingTo.value,
    fmRateFrom: fmRateFrom.value,
    fmRateTo: fmRateTo.value,
    fmLoansFrom: fmLoansFrom.value,
    fmLoansTo: fmLoansTo.value,
    fmMaxCompanySum: fmMaxCompanySum.value,
    fmInvestSum: fmInvestSum.value,
    // Вторичка
    smDaysFrom: smDaysFrom.value,
    smDaysTo: smDaysTo.value,
    smRatingFrom: smRatingFrom.value,
    smRatingTo: smRatingTo.value,
    smRateFrom: smRateFrom.value,
    smRateTo: smRateTo.value,
    smFdFrom: smFdFrom.value,
    smFdTo: smFdTo.value,
    smProgressFrom: smProgressFrom.value,
    smProgressTo: smProgressTo.value,
    smClassFrom: smClassFrom.value, 
    smClassTo: smClassTo.value, 
    smMaxCompanySum: smMaxCompanySum.value,
    smPriceFrom: smPriceFrom.value,
    smPriceTo: smPriceTo.value,
    smInvestSum: smInvestSum.value,
  };
  chrome.storage.local.set({ investSettings: newSettings });
}

// Функция открытия инвест страницы
function openInvestPage() {
  document.querySelector(".invest-section").style.top = "0";
  document.body.style.height = "650px";
  $.get('#stats__open').style.transform = 'scaleY(-1)';
  $.get('.stats-section').style.maxHeight = '0px';
}

// Функция закрытия инвест страницы
function closeInvestPage() {
  document.querySelector(".invest-section").style.top = "-5000px";
  document.body.style.height = "";
}

// Функция правильного окончания слова "займ"
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

// Функция преобразования unix в читаемую дату вида 
function formatReadableDate(dateString) {
  const date = new Date(dateString);
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleString('ru-RU', options).replace(',', ''); 
}


// Функция отображения времени последнего обновления
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
  parseFloat(element).toLocaleString("ru-RU", { style: "currency", currency: "RUB" });


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

// Функция отправки уведомлений
function sendNotification(title, text) {
  if (!document.body.contains($.get("#notificationContainer"))) {
    const notificationContainer = document.createElement("div");
    notificationContainer.id = "notificationContainer";
    Object.assign(notificationContainer.style, {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      position: "fixed",
      right: "0",
      bottom: "0",
      boxSizing: "border-box",
      zIndex: "999999999999",
    });
    document.body.appendChild(notificationContainer);
  }
  const notificationContainer = $.get("#notificationContainer");
  let color = "#1e2021";
  let bgColor = "#fff";
  if (darkTheme) {
    color = "#fff";
    bgColor = "#333";
  }

const message = document.createElement('div');
Object.assign(message.style, {
  position: 'relative',
  display: 'flex',
  justifyContent: 'space-between',
  background: bgColor,
  color: color,
  width: '420px',
  margin: '10px',
  padding: '10px 16px',
  borderRadius: '16px',
  lineHeight: '1.5',
  boxSizing: 'border-box',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
  animation: 'slideAnimation .25s ease-in-out'
});

message.innerHTML = `
  <img style="float: left; margin: 10px 10px 10px 0; width: 60px; height: 60px; filter: none;" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxjbGlwUGF0aCBjbGlwUGF0aFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgaWQ9ImEiPgogICAgICA8cGF0aCBkPSJNMCA2NzYuNDQ3aDE2MzAuNzk3VjBIMHY2NzYuNDQ3eiIvPgogICAgPC9jbGlwUGF0aD4KICA8L2RlZnM+CiAgPGcgY2xhc3M9ImxheWVyIj4KICAgIDxnIHRyYW5zZm9ybT0ibWF0cml4KDEuMzMzMzMgMCAwIC0xLjMzMzMzIDAgOTAxLjkzKSIgY2xpcC1wYXRoPSJ1cmwoI2EpIj4KICAgICAgPHBhdGggZmlsbD0iIzBhZDE5NCIgZD0iTTEyMC45NTIgNjc2LjEzMkwwIDY0MS4xMjZsNTAuNDcxLTUwLjQ3IDM3Ljg4OC0zNi4xNiAzMi41OTMgMTIxLjYzNnoiLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPg==">
  <div style="flex: 1">
    <span style="font-size: 18px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; white-space: normal;">
      ${title}
      <span class="close-notification" style="cursor: pointer; font-size: 30px; user-select: none">×</span>
    </span>
    <div style="font-size: 14px; font-weight: 300; margin-top: -5px">${text}</div>
    <div style="font-size: 12px; font-weight: 300; color: gray; float: right; margin-top: 5px;">Расширение JetLend</div>
  </div>
`;

notificationContainer.appendChild(message);
}

// Функция свапа рынков в распределении средств
function marketSwap() {
  if ($.get("#marketMode").textContent === "Первичный рынок") {
    $.get("#marketMode").textContent = "Вторичный рынок";
    $.get("#firstMarket").classList.add("display-none");
    $.get("#secondMarket").classList.remove("display-none");
    document.body.style.height = "790px";
    fmCompanyUpdate = false;
    smCompanyUpdate = true;
    updateSecondMarket();
  } else {
    $.get("#marketMode").textContent = "Первичный рынок";
    $.get("#secondMarket").classList.add("display-none");
    $.get("#firstMarket").classList.remove("display-none");
    document.body.style.height = "650px";
    fmCompanyUpdate = true;
    smCompanyUpdate = false;
    updateFirstMarket();
  }
}

// Удаление уведомлений
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("close-notification")) {
    event.target.parentNode.parentNode.parentNode.remove();
  }
});

// Подробнее о компании
async function fetchDetails(companyId) {
  const response = await fetchData(`https://jetlend.ru/invest/api/requests/${companyId}/details`);
  if (response.data) {
    return response.data.data.details;
  } 
}

function currencyAnimation(blockId, initialValue, finalValue, arrowHide = false) {
  if (initialValue === finalValue) {
    return;
  }
  const duration = 1500; 
  let currentTime = 0;
  const span = document.getElementById(blockId);
  const arrow = document.createElement('span');
  arrow.classList.add('arrow');
  
  if (arrowHide) {
    arrow.style.fontSize = '0px';
  }

  initialValue < finalValue ? arrow.style.bottom = '0px' : arrow.style.top = '0px';

  function animateValue(timestamp) {
    function animation(t) {
      return 1 - Math.pow(1 - t, 3);
    }
    
    if (!currentTime) {
      currentTime = timestamp;
    }

    const progress = timestamp - currentTime;
    const currentValue = initialValue + animation(progress / duration) * (finalValue - initialValue);
    span.innerHTML = `${toCurrencyFormat(currentValue)}`;
    span.appendChild(arrow);
    
    initialValue < finalValue ? arrow.textContent = `▲${toShortCurrencyFormat(currentValue - initialValue)}` : 
                                arrow.textContent = `▼${toShortCurrencyFormat(Math.abs(currentValue - initialValue))}`;
    
    initialValue < finalValue ? span.style.color = '#00ba88' : span.style.color = '#f23c3c';
    
    if (progress < duration) {
      requestAnimationFrame(animateValue);
    } else {
      span.innerHTML = `${toCurrencyFormat(finalValue)}`;
      span.appendChild(arrow);
      requestAnimationFrame(function() {
        arrow.style.opacity = 0;
        initialValue < finalValue ? arrow.style.bottom = '10px' : arrow.style.top = '10px';
        span.style.color = '';
      });
      setTimeout(() => {
        arrow.remove();
      }, 1500);
    }
  }
  requestAnimationFrame(animateValue);
}

function currencyToFloat(currency) {
  const string = currency.toString();
  const stringValue = string.replace(/\s/g, '').replace(',', '.');
  const result = parseFloat(stringValue).toFixed(2);
  return parseFloat(result);
}

function loadInvestSettings() {
  chrome.storage.local.get("investSettings", function(data) {
    if (data.investSettings) {
      function copyObj(sourceObj, targetObj) {
        for (let key in sourceObj) {
          if (key in targetObj) {
            targetObj[key] = sourceObj[key];
          }
        }
      }
      const settings = data.investSettings;
      copyObj(settings, investSettingsObj);
    }
  });
};

// let wasOpen = false;
// if (!wasOpen) {
//   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     if (tabs.length > 0) {
//       chrome.tabs.create({ url: 'html/popup.html' });
//     }
//   });
//   wasOpen = true;
// }

function dateDiff(date) {
  const timeDifference = new Date().getTime() - new Date(date).getTime();
  const dayDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
  return dayDifference;
}



