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
  return days === 1 ? " день" : lastTwoDigits >= 11 && lastTwoDigits <= 14 ? " дней" : lastTwoDigits % 10 === 1 ? " день" : lastTwoDigits % 10 >= 2 && lastTwoDigits % 10 <= 4 ? " дня" : " дней";
}

function toShortCurrencyFormat(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "").replace(".", ",") + " млн ₽";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "").replace(".", ",") + " тыс ₽";
  }
  return toCurrencyFormat(num);
}

function opneModal(modalId) {
  $.get(`${modalId}`).classList.remove("display-none");
  setTimeout(() => {
    $.get(`${modalId}`).style.opacity = "1";
  }, 0);
  document.body.style.overflow = "hidden";
}

function closeModal(modalId) {
  $.get(`${modalId}`).style.opacity = "0";
  setTimeout(() => {
    $.get(`${modalId}`).classList.add("display-none");
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
    fmMaxLoanSum: fmMaxLoanSum.value,
    fmStopLoanSum: fmStopLoanSum.value,
    fmStopCompanySum: fmStopCompanySum.value,
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
    smMaxLoanSum: smMaxLoanSum.value,
    smPriceFrom: smPriceFrom.value,
    smPriceTo: smPriceTo.value,
    smStopLoanSum: smStopLoanSum.value,
    smStopCompanySum: smStopCompanySum.value,
    smInvestSum: smInvestSum.value,
  };
  chrome.storage.local.set({ investSettings: newSettings });
}

// Функция открытия инвест страницы
function openInvestPage() {
  document.querySelector(".invest-section").style.top = "0";
  document.body.style.height = "650px";
  $.get("#stats__open").style.transform = "scaleY(-1)";
  $.get(".stats-section").style.maxHeight = "0px";
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
function formatReadableDate(dateString, short) {
  const date = new Date(dateString);
  let options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  if (short) {
    options = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    };
  }
  return date.toLocaleString("ru-RU", options).replace(",", "");
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
  const formattedDateTime = `Обновлено${currentTime - 86_400_000 > unixTime ? ` ${day}.${month}.${year}` : ""} в ${hours}:${minutes}`;
  return formattedDateTime;
}

// Функция перевода из числового в денежный формат (20.20 => 20,20 ₽)
const toCurrencyFormat = (element) => parseFloat(element).toLocaleString("ru-RU", { style: "currency", currency: "RUB" });

const valueToPercent = (value) => parseFloat((parseFloat(value.toString().replace(",", ".")) / 100).toFixed(4)); // '12,3456' => 0.1234

// Функция перевода из числа в проценты (0.2 => 20 %)
const toPercentFormat = (element) => `${(element * 100).toFixed(2).replace(".", ",")} %`;

// Функция получения цвета в зависимости от числа (зеленый, красный, дефолт)
const decorNumber = (element) => (element > 0 ? "#00ba88" : element != 0 ? "#f23c3c" : "var(--var-fontColor)");

// Функция добавления знака "+" положительным числам
const numberSign = (number) => (number > 0 ? "+" : "");

// Функция получения куки
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

// Функция отправки уведомлений
function sendNotification(title, content) {
  if (!document.body.contains($.get("#notificationContainer"))) {
    const notificationContainer = document.createElement("div");
    notificationContainer.id = "notificationContainer";
    Object.assign(notificationContainer.style, {
      height: "100vh",
      overflowY: "scroll",
      overflowX: "hidden",
      display: "flex",
      flexDirection: "column-reverse",
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
    bgColor = "#1F2022";
  }

  const message = document.createElement("div");
  Object.assign(message.style, {
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    background: bgColor,
    color: color,
    width: "550px",
    margin: "10px",
    padding: "10px 16px",
    borderRadius: "16px",
    lineHeight: "1.5",
    boxSizing: "border-box",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
    animation: "slideAnimation .25s ease-in-out",
  });

  message.innerHTML = `
  <img style="float: left; margin: 10px 10px 10px 0; width: 60px; height: 60px; filter: none;" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxjbGlwUGF0aCBjbGlwUGF0aFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgaWQ9ImEiPgogICAgICA8cGF0aCBkPSJNMCA2NzYuNDQ3aDE2MzAuNzk3VjBIMHY2NzYuNDQ3eiIvPgogICAgPC9jbGlwUGF0aD4KICA8L2RlZnM+CiAgPGcgY2xhc3M9ImxheWVyIj4KICAgIDxnIHRyYW5zZm9ybT0ibWF0cml4KDEuMzMzMzMgMCAwIC0xLjMzMzMzIDAgOTAxLjkzKSIgY2xpcC1wYXRoPSJ1cmwoI2EpIj4KICAgICAgPHBhdGggZmlsbD0iIzBhZDE5NCIgZD0iTTEyMC45NTIgNjc2LjEzMkwwIDY0MS4xMjZsNTAuNDcxLTUwLjQ3IDM3Ljg4OC0zNi4xNiAzMi41OTMgMTIxLjYzNnoiLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPg==">
  <div style="flex: 1">
    <span style="font-size: 18px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; white-space: normal;">
      ${title}
      <span class="close-notification" style="cursor: pointer; font-size: 30px; user-select: none">×</span>
    </span>
    <div style="font-size: 14px; font-weight: 300; margin-top: -5px">${content}</div>
    <div style="font-size: 12px; font-weight: 300; color: gray; float: right; margin-top: 5px;">Расширение JetLend</div>
  </div>
`;

  notificationContainer.insertBefore(message, notificationContainer.firstChild);
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
  const arrow = document.createElement("span");
  arrow.classList.add("arrow");

  if (arrowHide) {
    arrow.style.fontSize = "0px";
  }

  initialValue < finalValue ? (arrow.style.bottom = "0px") : (arrow.style.top = "0px");

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

    initialValue < finalValue ? (arrow.textContent = `▲${toShortCurrencyFormat(currentValue - initialValue)}`) : (arrow.textContent = `▼${toShortCurrencyFormat(Math.abs(currentValue - initialValue))}`);

    initialValue < finalValue ? (span.style.color = "#00ba88") : (span.style.color = "#f23c3c");

    if (progress < duration) {
      requestAnimationFrame(animateValue);
    } else {
      span.innerHTML = `${toCurrencyFormat(finalValue)}`;
      span.appendChild(arrow);
      requestAnimationFrame(function () {
        arrow.style.opacity = 0;
        initialValue < finalValue ? (arrow.style.bottom = "10px") : (arrow.style.top = "10px");
        span.style.color = "";
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
  const stringValue = string.replace(/\s/g, "").replace(",", ".");
  const result = parseFloat(stringValue).toFixed(2);
  return parseFloat(result);
}

function loadInvestSettings() {
  chrome.storage.local.get("investSettings", function (data) {
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
}

// let wasOpen = false;
// if (!wasOpen) {
//   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     if (tabs.length > 0) {
//       chrome.tabs.create({ url: 'html/popup.html' });
//     }
//   });
//   wasOpen = true;
// }

function dateDiff(firstDate, secondDate = 0) {
  let timeDifference = 0;
  if (!secondDate) {
    timeDifference = new Date().setHours(0, 0, 0, 0) - new Date(firstDate).getTime();
  } else {
    timeDifference = new Date(secondDate).getTime() - new Date(firstDate).getTime();
  }
  const dayDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
  return dayDifference;
}

async function fmLoadLoans(mode) {
  const res = await fetchData("https://jetlend.ru/invest/api/requests/waiting");
  if (res.data) {
    fmInvestCompanyArray = res.data.requests.filter(
      (obj) =>
        obj.collected_percentage !== 100 /* Полоска сбора не заполнена (меньше 100%) */ &&
        obj.investing_amount === null /* Резервация (нет) */ &&
        obj.term >= parseInt(investSettingsObj.fmDaysFrom) &&
        obj.term <= parseInt(investSettingsObj.fmDaysTo) /* Срок займа */ &&
        ratingArray.indexOf(obj.rating) >= parseInt(investSettingsObj.fmRatingFrom) &&
        ratingArray.indexOf(obj.rating) <= parseInt(investSettingsObj.fmRatingTo) /* Рейтинг займа */ &&
        obj.interest_rate >= valueToPercent(investSettingsObj.fmRateFrom) &&
        obj.interest_rate <= valueToPercent(investSettingsObj.fmRateTo) /* Ставка */ &&
        obj.loan_order >= parseFloat(investSettingsObj.fmLoansFrom) &&
        obj.loan_order <= parseFloat(investSettingsObj.fmLoansTo) /* Какой по счёту займ на платформе */ &&
        // && (obj.company_investing_amount <= (parseFloat(investSettingsObj.fmMaxCompanySum) - parseFloat(investSettingsObj.fmInvestSum))) /* Сумма в одного заёмщика */
        obj.investing_amount <= parseFloat(investSettingsObj.fmMaxLoanSum) /* Сумма в один займ */ &&
        obj.company_investing_amount <= parseFloat(investSettingsObj.fmMaxCompanySum) /* Сумма в одного заёмщика */ &&
        obj.financial_discipline === 1 /* ФД заёмщика */
    );
    if (!fmCompanyUpdate && mode !== "badge") {
      fmCompanyUpdate = true;
      return;
    }
    if (mode === "badge") {
      setBadge("100%");
    }
  }
}

async function smLoadLoans(mode, offset, limit, total = 0) {
  if (!smCompanyUpdate && mode !== "badge") {
    smCompanyUpdate = true;
    return;
  }
  if (offset > total) {
    return;
  }
  const url = `https://jetlend.ru/invest/api/exchange/loans?limit=${limit}&offset=${offset}&sort_dir=desc&sort_field=ytm`;
  const res = await fetchData(url);
  if (res.data) {
    smInvestCompanyArray = smInvestCompanyArray.concat(
      res.data.data.filter(
        (obj) =>
          obj.term_left >= parseFloat(investSettingsObj.smDaysFrom) &&
          obj.term_left <= parseFloat(investSettingsObj.smDaysTo) /* Остаток срока займа */ &&
          ratingArray.indexOf(obj.rating) >= parseInt(investSettingsObj.smRatingFrom) &&
          ratingArray.indexOf(obj.rating) <= parseInt(investSettingsObj.smRatingTo) /* Рейтинг займа */ &&
          obj.ytm >= valueToPercent(investSettingsObj.smRateFrom) &&
          obj.ytm <= valueToPercent(investSettingsObj.smRateTo) /* Эффективная ставка в % */ &&
          obj.progress >= valueToPercent(investSettingsObj.smProgressFrom) &&
          obj.progress <= valueToPercent(investSettingsObj.smProgressTo) /* Выплачено (прогресс в %) */ &&
          obj.loan_class >= parseInt(investSettingsObj.smClassFrom) &&
          obj.loan_class <= parseInt(investSettingsObj.smClassTo) /* Класс займа */ &&
          obj.min_price >= valueToPercent(investSettingsObj.smPriceFrom) &&
          obj.min_price <= valueToPercent(investSettingsObj.smPriceTo) /* Мин прайс в % */ &&
          // && (obj.invested_company_debt <= (parseFloat(investSettingsObj.smMaxCompanySum) - parseFloat(investSettingsObj.smInvestSum))) /* Сумма в одного заёмщика */
          obj.invested_debt <= parseFloat(investSettingsObj.smMaxLoanSum) /* Сумма в один займ */ &&
          obj.invested_company_debt <= parseFloat(investSettingsObj.smMaxCompanySum) /* Сумма в одного заёмщика */ &&
          obj.financial_discipline >= valueToPercent(investSettingsObj.smFdFrom) &&
          obj.financial_discipline <= valueToPercent(investSettingsObj.smFdTo) /* ФД заёмщика */ &&
          obj.status === "active" /* Статус - выплачивается */
      )
    );
    // Удаление дубликатов
    smInvestCompanyArray = smInvestCompanyArray.filter((obj, index, self) => index === self.findIndex((t) => t.loan_id === obj.loan_id));
    if (res.data.data[res.data.data.length - 1].ytm < valueToPercent(investSettingsObj.smRateFrom)) {
      return;
    }
    offset += limit;
    if (mode === "popup") {
      $.get("#sm-numOfSortedCompany").textContent = `Загрузка... (${toPercentFormat(offset / res.data.total)})`;
    }

    if (mode === "badge") {
      setBadge(((offset / res.data.total) * 100).toFixed(0) + "%");
    }
    await smLoadLoans(mode, offset, limit, res.data.total);
  }
}

async function checkingCompany(companyId) {
  loadInvestSettings();
  const errors = [];
  const fm = await fetchData("https://jetlend.ru/invest/api/requests/waiting");
  const sm = await fetchData("https://jetlend.ru/invest/api/exchange/loans");
  if (fm.data && sm.data) {
    let company = null;
    const fmCompany = fm.data.requests.find((obj) => obj.id === companyId);
    const smCompany = sm.data.data.find((obj) => obj.loan_id === companyId);
    const errorsHtml = function () {
      return `
        <div class="list-element contrast-bg">
          <div style="display: flex; margin-top: 6px;">
            <img class="list-element__img" src="https://jetlend.ru${company.preview_small_url}">
            <div style="display: flex; flex-direction: column; text-wrap: nowrap;">
              <a class="list-element__loan-name target-url" style="font-size: 14.5px; font-weight:600; z-index: 1; display: inline-block; width: 0;" 
                href="https://jetlend.ru/invest/v3/company/${company.id || company.loan_id}">${company.loan_name}</a>
              <span style="font-size: 14px">${company.loan_isin}</span>
              <span style="font-size: 14px">
                <b style="${company.rating.includes("A") ? "color: limegreen;" : company.rating.includes("B") ? "color: orange;" : "color: orangered;"}">${company.rating}|${ratingArray.indexOf(company.rating)}
                </b>, 
                <b style="${company.financial_discipline === 1 ? "color: limegreen;" : company.financial_discipline <= 0.4 ? "color: red;" : "color: orange;"}">ФД: ${(company.financial_discipline * 100).toFixed(0)}%
                </b> 
              </span>
            </div>
          </div>
          ${
            !errors.length
              ? `<div style="margin: 8px 0">Займ удовлетворяет всем фильтрам.</div>`
              : `Проблемы:
              ${errors
                .map((error) => {
                  return `<div style="margin: 8px 0">${error}</div>`;
                })
                .join("")}`
          }
        </div>`;
    };

    if (fmCompany) {
      company = fmCompany;
      if (company.investing_amount === null) {
        errors.push(`Займ уже зарезервирован на сумму ${toCurrencyFormat(company.investing_amount)}.`);
      }
      if (company.term < parseInt(investSettingsObj.fmDaysFrom) || company.term > parseInt(investSettingsObj.fmDaysTo)) {
        errors.push(`Срок займа (${company.term}) не входит в диапазон от ${parseInt(investSettingsObj.fmDaysFrom)} до ${parseInt(investSettingsObj.fmDaysTo)}.`);
      }
      if (ratingArray.indexOf(company.rating) < parseInt(investSettingsObj.fmRatingFrom) || ratingArray.indexOf(company.rating) > parseInt(investSettingsObj.fmRatingTo)) {
        errors.push(`Рейтинг займа (${ratingArray.indexOf(company.rating)}) не входит в диапазон от ${parseInt(investSettingsObj.fmRatingFrom)} до ${parseInt(investSettingsObj.fmRatingTo)}.`);
      }
      if (company.interest_rate < valueToPercent(investSettingsObj.fmRateFrom) || company.interest_rate > valueToPercent(investSettingsObj.fmRateTo)) {
        errors.push(`Процентная ставка (${company.interest_rate}) не входит в диапазон от ${valueToPercent(investSettingsObj.fmRateFrom)} до ${valueToPercent(investSettingsObj.fmRateTo)}.`);
      }
      if (company.loan_order < parseFloat(investSettingsObj.fmLoansFrom) || company.loan_order > parseFloat(investSettingsObj.fmLoansTo)) {
        errors.push(`Ордер займа (${company.loan_order}) не входит в диапазон от ${parseFloat(investSettingsObj.fmLoansFrom)} до ${parseFloat(investSettingsObj.fmLoansTo)}.`);
      }
      // if (company.company_investing_amount > (parseFloat(investSettingsObj.fmMaxCompanySum) - parseFloat(investSettingsObj.fmInvestSum))) {
      //   errors.push(`Сумма инвестий в компанию (${toCurrencyFormat(company.company_investing_amount)}) превышает ${toCurrencyFormat((parseFloat(investSettingsObj.fmMaxCompanySum) - parseFloat(investSettingsObj.fmInvestSum)))}
      //   (считается как "максимальная сумма в компанию (${toCurrencyFormat(investSettingsObj.fmMaxCompanySum)})" - "сумма в один займ (${toCurrencyFormat(investSettingsObj.fmInvestSum)})).`);
      // }
      if (company.investing_amount > parseFloat(investSettingsObj.fmMaxLoanSum)) {
        errors.push(`Сумма инвестий в займ (${toCurrencyFormat(company.investing_amount)}) превышает ${toCurrencyFormat(parseFloat(investSettingsObj.fmMaxLoanSum))}.`);
      }
      if (company.company_investing_amount > parseFloat(investSettingsObj.fmMaxCompanySum)) {
        errors.push(`Сумма инвестий в компанию (${toCurrencyFormat(company.company_investing_amount)}) превышает ${toCurrencyFormat(parseFloat(investSettingsObj.fmMaxCompanySum))}.`);
      }
      if (company.financial_discipline !== 1) {
        errors.push(`ФД заёмщика (${toPercentFormat(company.financial_discipline)}) меньше 100%.`);
      }
      return errorsHtml();
    } else if (smCompany) {
      company = smCompany;
      if (company.term_left < parseFloat(investSettingsObj.smDaysFrom) || company.term_left > parseFloat(investSettingsObj.smDaysTo)) {
        errors.push(`Остаток срока займа (${company.term_left}) не входит в диапазон от ${parseFloat(investSettingsObj.smDaysFrom)} до ${parseFloat(investSettingsObj.smDaysTo)}.`);
      }
      if (ratingArray.indexOf(company.rating) < parseInt(investSettingsObj.smRatingFrom) || ratingArray.indexOf(company.rating) > parseInt(investSettingsObj.smRatingTo)) {
        errors.push(`Рейтинг займа (${ratingArray.indexOf(company.rating)}) не входит в диапазон от ${parseInt(investSettingsObj.smRatingFrom)} до ${parseInt(investSettingsObj.smRatingTo)}.`);
      }
      if (company.ytm < valueToPercent(investSettingsObj.smRateFrom) || company.ytm > valueToPercent(investSettingsObj.smRateTo)) {
        errors.push(`Эффективная ставка (${toPercentFormat(company.ytm)}) не входит в диапазон от ${toPercentFormat(valueToPercent(investSettingsObj.smRateFrom))} до ${toPercentFormat(valueToPercent(investSettingsObj.smRateTo))}.`);
      }
      if (company.progress < valueToPercent(investSettingsObj.smProgressFrom) || company.progress > valueToPercent(investSettingsObj.smProgressTo)) {
        errors.push(`Прогресс погашения займа (${toPercentFormat(company.progress)}) не входит в диапазон от ${toPercentFormat(investSettingsObj.smProgressFrom / 100)} до ${toPercentFormat(investSettingsObj.smProgressTo / 100)}.`);
      }
      if (company.loan_class < parseInt(investSettingsObj.smClassFrom) || company.loan_class > parseInt(investSettingsObj.smClassTo)) {
        errors.push(`Класс займа (${company.loan_class}) не входит в диапазон от ${parseInt(investSettingsObj.smClassFrom)} до ${parseInt(investSettingsObj.smClassTo)}.`);
      }
      if (company.min_price < valueToPercent(investSettingsObj.smPriceFrom) || company.min_price > valueToPercent(investSettingsObj.smPriceTo)) {
        errors.push(`Минимальная цена займа (${toPercentFormat(company.min_price)}) не входит в диапазон от ${toPercentFormat(investSettingsObj.smPriceFrom / 100)} до ${toPercentFormat(investSettingsObj.smPriceTo / 100)}.`);
      }
      // if (company.invested_company_debt > (parseFloat(investSettingsObj.smMaxCompanySum) - parseFloat(investSettingsObj.smInvestSum))) {
      //   errors.push(`Сумма инвестий в компанию (${toCurrencyFormat(company.invested_company_debt)}) превышает ${toCurrencyFormat((parseFloat(investSettingsObj.smMaxCompanySum) - parseFloat(investSettingsObj.smInvestSum)))}
      //   (считается как "максимальная сумма в компанию (${toCurrencyFormat(investSettingsObj.smMaxCompanySum)})" - "сумма в один займ (${toCurrencyFormat(investSettingsObj.smInvestSum)})).`);
      // }
      if (company.invested_debt > parseFloat(investSettingsObj.smMaxLoanSum)) {
        errors.push(`Сумма инвестий в займ (${toCurrencyFormat(company.invested_debt)}) превышает ${toCurrencyFormat(parseFloat(investSettingsObj.smMaxLoanSum))}.`);
      }
      if (company.invested_company_debt > parseFloat(investSettingsObj.smMaxCompanySum)) {
        errors.push(`Сумма инвестий в компанию (${toCurrencyFormat(company.invested_company_debt)}) превышает ${toCurrencyFormat(parseFloat(investSettingsObj.smMaxCompanySum))}.`);
      }
      if (company.financial_discipline < valueToPercent(investSettingsObj.smFdFrom) || company.financial_discipline > valueToPercent(investSettingsObj.smFdTo)) {
        errors.push(`ФД заёмщика (${toPercentFormat(company.financial_discipline)}) не входит в диапазон от ${toPercentFormat(investSettingsObj.smFdFrom / 100)} до ${toPercentFormat(investSettingsObj.smFdTo / 100)}.`);
      }
      if (company.status !== "active") {
        errors.push(`Статус займа (${company.status}) - просрочен, либо реструктуризирован.`);
      }
      return errorsHtml();
    }
    return `<div class="list-element contrast-bg"><div style="margin: 8px 0">Компания ${companyId} не найдена.</div></div>`;
  }
  return `<div class="list-element contrast-bg"><div style="margin: 8px 0">Ошибка загрузки.</div></div>`;
}

// const currentVersion = chrome.runtime.getManifest().version;

// console.log(currentVersion);

chrome.storage.local.set({
  test: {
    array: [
      { id: 1, name: "lol" },
      { id: 2, name: "lol2" },
    ],
  },
});

chrome.storage.local.get("test", function (data) {
  if (data.test) {
    console.log(data.test.array);
    console.log(data.test.array[1].name);
  }
});

const smc = {
  company: 'ООО "СТАНКОСАРАТОВ"',
  image_url: "/media/images/e2/d3/e2d3065f-64bd-463d-a468-81237a987b5e.jpg",
  preview_small_url: "/media/images/e2/d3/e2d3065f-64bd-463d-a468-81237a987b5e_160x160.jpg",
  preview_url: "/media/images/e2/d3/e2d3065f-64bd-463d-a468-81237a987b5e_1024x1024.jpg",
  loan_id: 2945,
  loan_class: 1,
  loan_isin: "JL0000002945",
  loan_name: "СТАНКОСАРАТО-В02",
  loan_order: 2,
  financial_discipline: 0,
  term: 882,
  term_left: 203,
  interest_rate: 0.223,
  rating: "BBB+",
  status: "restructured",
  end_date: "2024-09-17",
  progress: 0.80457412625,
  amount: 4075.01,
  principal_debt: 4494.2,
  ytm: 2.2803205040260073,
  min_price: 0.65,
  invested_contracts_count: null,
  invested_debt: null,
  invested_company_debt: null,
  region: "",
};

const fmc = {
  company: "ИП Хаметова Наталья Павловна",
  image_url: "/media/images/b4/44/b444861b-c556-4ac2-b854-2924fba29e8d.jpg",
  preview_small_url: "/media/images/b4/44/b444861b-c556-4ac2-b854-2924fba29e8d_160x160.jpg",
  preview_url: "/media/images/b4/44/b444861b-c556-4ac2-b854-2924fba29e8d_1024x1024.jpg",
  id: 19412,
  amount: "914500.00",
  interest_rate: 0.331,
  term: 660,
  investing_amount: null,
  company_investing_amount: "114.90",
  financial_discipline: 1,
  rating: "CC",
  start_date: "2024-02-26T08:18:08.419163+03:00",
  collect_time: "2024-03-11T08:18:08.534221+03:00",
  collected_percentage: 100,
  status: "waiting",
  promo: [],
  loan_isin: "JL0000019412",
  loan_name: "ХаметоваНП-В20",
  loan_order: 20,
  allow_delete: false,
  allow_delete_cause: "Отмена резерва доступна только в течение 5 дней с момента его создания.",
  allow_delete_amount: null,
  ignored: false,
  region: "",
};

const companyHtmlNotification = (company, invest) => {
  return `
<section style="display: flex;">
<img style="object-fit: cover; height: 50px; width: 50px; border-radius: 100%; margin: 0px 10px 10px 0;" src="https://jetlend.ru${company.image_url || company.preview_small_url}">
<div>
  <a style="text-decoration: underline; color: var(--jle-fontColor);" href="https://jetlend.ru/invest/v3/company/${company.id || company.loan_id}" target="_blank">
    <b>${company.loan_name}</b>
  </a>
  <div style="margin-top: 3px;">
    <b style="${company.rating.includes("A") ? "color: limegreen;" : company.rating.includes("B") ? "color: orange;" : "color: orangered;"}">${company.rating}|${ratingArray.indexOf(company.rating)}</b>, 
    <b style="${company.financial_discipline === 1 ? "color: limegreen;" : company.financial_discipline <= 0.4 ? "color: red;" : "color: orange;"}">ФД: ${(company.financial_discipline * 100).toFixed(0)}%</b>
    ${
      company.loan_class
        ? `, 
    <b style="${company.loan_class === 0 ? "color: limegreen;" : company.loan_class === 1 ? "color: orange;" : "color: orangered;"}">Класс: ${company.loan_class}</b>`
        : ""
    }
  </div>
</div>
${
  invest.error
    ? ""
    : `
<div style="display: flex; flex-direction: column; align-items: flex-end; margin-left: auto;">
  <div style="text-wrap: nowrap;">
    Cумма: <b>${toCurrencyFormat(invest.sum)}</b>
  </div>
  ${
    invest.price
      ? `  <div style="text-wrap: nowrap; margin-top: 3px;">
             Цена: <b>${toPercentFormat(invest.price)}</b>
           </div>`
      : ""
  }
</div>
  `
}
</section>
<div style="background: var(--jle-universalColor); width: 100%; height: 4px; border-radius: 5px; margin-top: 5px;">
  <div style="background: limegreen; width: 40%; height: inherit; border-radius: inherit;"></div>
</div>
${invest.error ? `<div style="margin-top: 5px;">${invest.error}</div>` : ""}
`;
};

// sendNotification(`Успешная инвестиция id${smc.loan_id}`, companyHtmlNotification(smc, { sum: 100, price: 99 }));
// sendNotification(`Успешная инвестиция id${smc.loan_id}`, companyHtmlNotification(smc, { error: "Ошибка стоп 0x0000000000" }));

// sendNotification(`Успешная инвестиция id${fmc.id}`, companyHtmlNotification(fmc, { sum: 100 }));
// sendNotification(`Успешная инвестиция id${fmc.id}`, companyHtmlNotification(fmc, { error: "Ошибка стоп 0x0000000000" }));
