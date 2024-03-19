$get("#stats__open").addEventListener("click", function () {
  if ($get(".stats-section").style.maxHeight === "1000px" || (!this.style.cssText && window.innerWidth >= 768)) {
    this.style.transform = "scaleY(-1)";
    $get(".stats-section").style.maxHeight = "0px";
  } else {
    this.style.transform = "scaleY(1)";
    $get(".stats-section").style.maxHeight = "1000px";
  }
});

document.addEventListener("mouseover", function (e) {
  let tooltipHtml = e.target.closest(".tooltip");
  if (!tooltipHtml) {
    return;
  }
  let tooltipContent = tooltipHtml.querySelector(".tooltip-content");

  let tooltipElem = document.createElement("div");
  tooltipElem.className = "tooltip-content";
  tooltipElem.innerHTML = tooltipContent.innerHTML;
  setTimeout(() => {
    tooltipElem.style.opacity = "1";
  }, 0);
  document.body.append(tooltipElem);

  let targetCoords = tooltipHtml.getBoundingClientRect();
  let left = targetCoords.left + (tooltipHtml.offsetWidth - tooltipElem.offsetWidth) / 2;
  if (left < 0) {
    left = 5;
  }
  let tooltipRight = left + tooltipElem.offsetWidth;
  if (tooltipRight > window.innerWidth) {
    left = window.innerWidth - tooltipElem.offsetWidth - 5;
  }

  let top = targetCoords.top - tooltipElem.offsetHeight - 5;
  if (top < 0) {
    top = targetCoords.top + tooltipHtml.offsetHeight + 5;
  }

  tooltipElem.style.left = left + "px";
  tooltipElem.style.top = top + "px";

  tooltipHtml.addEventListener("mouseleave", function () {
    tooltipElem.style.opacity = "0";
    setTimeout(() => {
      tooltipElem.remove();
    }, 300);
  });
});

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("modal-container")) {
    closeModal("#" + event.target.id);
    return;
  }
  if (event.target.classList.contains("modal__btn-close")) {
    closeModal("#" + event.target.parentNode.parentNode.parentNode.id);
    return;
  }
});

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("target-url")) {
    event.preventDefault();
    function addHttpIfMissing(url) {
      if (!/^https?:\/\//i.test(url)) {
        url = "http://" + url;
      }
      return url;
    }
    chrome.windows.create({ url: addHttpIfMissing(event.target.href), type: "popup", focused: true });
  }
});

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("swap")) {
    if ($get(".swap").textContent == "всё время") {
      statsSection.innerHTML = dataTextYearTime;
    } else if ($get(".swap").textContent == "год") {
      statsSection.innerHTML = dataTextAllTime;
    }
  }
});

let freeBalance = 0;
let cleanBalance = 0;
let balance = 0;
let cachedBalance = 0;
let cachedCleanBalance = 0;

let timePeriod = "";
let dataTextAllTime = "";
let dataTextYearTime = "";
let sameDataText = "";

const formsElements = $getAll(".filterInput");

formsElements.forEach((element) =>
  element.addEventListener("change", async function () {
    await updateInvestSettings(this);
  })
);
btnInvestOpen.addEventListener("click", openInvestPage);
btnInvestClose.addEventListener("click", closeInvestPage);

$get("#events__open").addEventListener("click", () => openModal("#events"));
$get("#event-transactions__open").addEventListener("click", () => transactionsShow());
$get("#event-invests__open").addEventListener("click", () => investHistoryShow());

$get("#portfolio__open").addEventListener("click", () => openModal("#portfolio"));
$get("#portfolio-all__open").addEventListener("click", () => portfolioAllShow());
$get("#npl1__open").addEventListener("click", () => nplShow(1));
$get("#npl15__open").addEventListener("click", () => nplShow(15));
$get("#restructs__open").addEventListener("click", () => restructsShow());
$get("#defaults__open").addEventListener("click", () => defaultsShow());

$get("#revenue__open").addEventListener("click", () => revenueShow());

$get("#analytics__open").addEventListener("click", () => openModal("#analytics"));

$get("#settings__open").addEventListener("click", () => openModal("#settings"));
$get("#autoInvest_mode").addEventListener("change", async (event) => {
  const cache = await getCache("settings", {});
  cache.autoInvestMode = event.target.value;
  chrome.storage.local.set({ settings: cache });
});
$get("#autoInvest_safe").addEventListener("change", async (event) => {
  const cache = await getCache("settings", {});
  cache.autoInvestSafe = event.target.value;
  chrome.storage.local.set({ settings: cache });
});
$get("#autoInvest_interval").addEventListener("change", async (event) => {
  const cache = await getCache("settings", {});
  cache.autoInvestInterval = event.target.value > 6 ? event.target.value : 6;
  chrome.storage.local.set({ settings: cache });
});
$get("#badgeMode_setting").addEventListener("change", async (event) => {
  const cache = await getCache("settings", {});
  cache.badgeMode = event.target.value;
  chrome.storage.local.set({ settings: cache });
});

(async function () {
  const settings = await getCache("settings", {});
  badgeMode_setting.value = settings.badgeMode ?? 0;
  autoInvest_mode.value = settings.autoInvestMode ?? 0;
  autoInvest_safe.value = settings.autoInvestSafe ?? 0;
  autoInvest_interval.value = settings.autoInvestInterval ?? 6;
})();

$get("#newTab__open").addEventListener("click", () => chrome.tabs.create({ url: chrome.runtime.getURL("html/popup.html") }));

$get("#fm-btn-update").addEventListener("click", updateFirstMarket);
$get("#fm-btn-show").addEventListener("click", () => {
  openModal("#fm-list");
  fmCompanyShow(fmInvestCompanyArray, "#fm-list-ul");
});
$get("#fm-btn-stop").addEventListener("click", function () {
  fmCompanyUpdate = false;
});

$get("#fmr-btn-update").addEventListener("click", updateFirstMarketReserv);
$get("#fmr-btn-show").addEventListener("click", () => {
  openModal("#fmr-list");
  fmCompanyShow(fmrInvestCompanyArray, "#fmr-list-ul");
});
$get("#fmr-btn-stop").addEventListener("click", function () {
  fmrCompanyUpdate = false;
});

$get("#sm-btn-update").addEventListener("click", updateSecondMarket);
$get("#sm-btn-show").addEventListener("click", () => {
  openModal("#sm-list");
  smCompanyShow(smInvestCompanyArray, "#sm-list-ul");
});
$get("#sm-btn-stop").addEventListener("click", function () {
  smCompanyUpdate = false;
});

$get("#marketMode").addEventListener("click", marketSwap);
$get("#checkCompany__open").addEventListener("click", () => openModal("#checkCompany__section"));
$get("#checkCompany__btn").addEventListener("click", () => checkCompany());

(async function () {
  const filters = await getCache("investSettings", {});
  const keys = Object.keys(filters);
  keys.forEach((key) => {
    const formFilter = $get("#" + key);
    formFilter.value = filters[key];
  });
})();

async function transactionsShow() {
  $get("#events__btn-section")
    .querySelectorAll(".btn-small")
    .forEach((btn) => btn.classList.remove("btn-small--active"));
  $get("#event-transactions__open").classList.add("btn-small--active");
  const list = $get("#events__list");
  list.innerHTML = spinLoad.innerHTML;
  const transactionsData = await fetchData("https://jetlend.ru/invest/api/account/transactions");
  const operations = {
    purchase: "Покупка займа",
    payment: "Платеж по займу",
    collection: "Судебное взыскание",
    contract: "Выдача займа",
    default: "Дефолт",
    investment: "Пополнение или вывод средтсв",
  };
  if (transactionsData.data) {
    list.innerHTML = "";
    transactionsData.data.transactions.forEach((element) => {
      const listItem = document.createElement("div");
      listItem.classList.add("list-element", "contrast-bg");
      listItem.innerHTML = createListElement(element);
      list.appendChild(listItem);
    });
  } else {
    list.textContent = transactionsData.error;
  }

  function createListElement(element) {
    function setColor(num) {
      if (num > 0) {
        return "limegreen";
      } else {
        return "red";
      }
    }
    return `
    <section class="flex">
      ${element.preview_small_url ? `<img class="list-element__img" src="https://jetlend.ru${element.preview_small_url}">` : ""}
      <div>
        <div style="font-size: 14.5px; font-weight:600; z-index: 1; display: inline-block;">${element.company || "Прочее"}</div>
        <div style="font-size: 14px; margin-top: 5px;">${operations[element.operation_type] ? operations[element.operation_type] : element.operation_type}</div>
      </div>
      <div class="flex flex-col items-end" style="margin-left: auto; font-size: 14px;">
        <div style="font-weight: 600; text-wrap: nowrap;">
          ${element.income && element.income !== 0.0 ? `${toCurrencyFormat(element.income)}` : ""}
        </div>
        <div style="color: orangered; font-weight: 600; text-wrap: nowrap; margin-top: 5px;">
          ${element.expense && element.expense !== 0.0 ? (element.expense > 0 ? `-${toCurrencyFormat(element.expense)}` : `${toCurrencyFormat(element.expense)}`) : ""}
        </div> 
        <div style="color: ${setColor(element.revenue)}; font-weight: 600; text-wrap: nowrap; margin-top: 5px;">
          ${element.revenue && element.revenue !== 0.0 ? (element.revenue > 0 ? `+${toCurrencyFormat(element.revenue)}` : `${toCurrencyFormat(element.revenue)}`) : ""}
        </div> 
      </div>
    </section>
    `;
  }
}

async function investHistoryShow() {
  $get("#events__btn-section")
    .querySelectorAll(".btn-small")
    .forEach((btn) => btn.classList.remove("btn-small--active"));
  $get("#event-invests__open").classList.add("btn-small--active");
  const list = $get("#events__list");
  list.innerHTML = spinLoad.innerHTML;
  let investHistory = [];
  chrome.storage.local.get("investHistory", function (data) {
    if (!data.investHistory) {
      list.innerHTML = "История пуста.";
      return;
    }
    list.innerHTML = "";
    investHistory = data.investHistory;
    investHistory.forEach((element) => {
      const listItem = document.createElement("div");
      listItem.classList.add("list-element", "contrast-bg");
      listItem.innerHTML = createListElement(element);
      list.appendChild(listItem);
    });
  });

  function createListElement(company) {
    return `
    <section class="flex" style="font-size: 14px;">
      <img style="object-fit: cover; height: 50px; width: 50px; border-radius: 100%; margin: 0px 10px 10px 0;" src="https://jetlend.ru${company.img}">
      <div>
        <a class="list-element__loan-name target-url" style="font-weight:600;" href="https://jetlend.ru/invest/v3/company/${company.id || company.loan_id}">
          ${company.name}
        </a>
        <div style="margin-top: 3px;">
          <b style="${company.rating.includes("A") ? "color: limegreen;" : company.rating.includes("B") ? "color: orange;" : "color: orangered;"}">${company.rating}|${ratingArray.indexOf(company.rating)}</b>, 
          <b style="${company.fd === 1 ? "color: limegreen;" : company.fd <= 0.4 ? "color: red;" : "color: orange;"}">ФД: ${(company.fd * 100).toFixed(0)}%</b>
          ${company.class !== undefined ? `, <b style="${company.class === 0 ? "color: limegreen;" : company.class === 1 ? "color: orange;" : "color: orangered;"}">Класс: ${company.class}</b>` : ""}
        </div>
        <div style="margin-top: 3px;">
          ${company.mode === "auto" ? "Эффективная ставка: " : "Ставка: "}
          <b>${toPercentFormat(company.percent)}</b>${company.mode === "auto" ? `, <b style="color: #8888e6;">auto</b>` : ""}
        </div>
      </div>

      <div class="flex flex-col items-end" style="margin-left: auto;">
        <div style="text-wrap: nowrap;">
          <b>${formatReadableDate(company.date)}</b>
        </div>
        <div style="text-wrap: nowrap; margin-top: 3px;">
          Cумма: <b>${toCurrencyFormat(company.investSum)}</b>
        </div>
        ${
          company.price
            ? `  <div style="text-wrap: nowrap; margin-top: 3px;">
                  Цена: <b>${toPercentFormat(company.price)}</b>
                </div>`
            : ""
        }
      </div>
    </section>
    `;
  }
}

async function portfolioAllShow() {
  $get("#portfolio__btn-section")
    .querySelectorAll(".btn-small")
    .forEach((btn) => btn.classList.remove("btn-small--active"));
  $get("#portfolio-all__open").classList.add("btn-small--active");
  const list = $get("#portfolio__list");
  list.innerHTML = spinLoad.innerHTML;
  const allCompays = await fetchChunks("https://jetlend.ru/invest/api/portfolio/loans?");
  const closed = allCompays.data.data.filter((elem) => elem.status === "closed");
  const active = allCompays.data.data.filter((elem) => elem.status === "active");
  const delayed = allCompays.data.data.filter((elem) => elem.status === "delayed");
  const restructured = allCompays.data.data.filter((elem) => elem.status === "restructured");
  const defaulted = allCompays.data.data.filter((elem) => elem.status === "default");
  if (allCompays.data) {
    list.innerHTML = list.innerHTML = `
    <div class="contrast-bg" style="margin-bottom: 12px">
      <p>Всего займов: <b>${allCompays.data.total}</b> шт., из них:</p>
      <p><b>${closed.length}</b> выплачено.</p>
      <p><b>${active.length}</b> выплачивается.</p>
      <p><b>${delayed.length}</b> задержано.</p>
      <p><b>${restructured.length}</b> реструктуризации.</p>
      <p><b>${defaulted.length}</b> дефолты.</p>
      <div class="flex" style="height: 16px;">
        <div class="tooltip" style="background: var(--jle-green); width: ${(active.length / allCompays.data.total) * 100}%">
          <template class="tooltip-content">
            Выплачивается.
          </template>
        </div>
        <div class="tooltip" style="background: lightgreen; width: ${(restructured.length / allCompays.data.total) * 100}%">
          <template class="tooltip-content">
           Реструктуризации.
          </template>
        </div>
        <div class="tooltip" style="background: orange; width: ${(delayed.length / allCompays.data.total) * 100}%">
          <template class="tooltip-content">
            Задержки.
          </template>
        </div>
        <div class="tooltip" style="background: red; width: ${(defaulted.length / allCompays.data.total) * 100}%">
          <template class="tooltip-content">
            Дефолты.
          </template>
        </div>
        <div class="tooltip" style="background: gray; width: ${(closed.length / allCompays.data.total) * 100}%">
          <template class="tooltip-content">
            Выплачено.
          </template>
        </div>
      </div>
    </div>
    `;
  }
}

async function nplShow(nplNum) {
  $get("#portfolio__btn-section")
    .querySelectorAll(".btn-small")
    .forEach((btn) => btn.classList.remove("btn-small--active"));
  $get(`#npl${nplNum}__open`).classList.add("btn-small--active");
  const list = $get("#portfolio__list");
  list.innerHTML = spinLoad.innerHTML;
  const url = "https://jetlend.ru/invest/api/portfolio/loans?aggregate=purchased_amount%2Cpaid_interest%2Cpaid_fine%2Cprincipal_debt%2Cnkd&filter=%5B%7B%22values%22%3A%5B%22delayed%22%5D%2C%22field%22%3A%22status%22%7D%5D&sort_dir=asc&sort_field=company";
  const res = await fetchChunks(url);
  if (res.data) {
    let debtSum = 0;
    let sorted = res.data.data.filter((obj) => dateDiff(obj.next_payment_date) >= nplNum);
    if (nplNum === 1) {
      sorted = sorted.filter((obj) => dateDiff(obj.next_payment_date) < 15);
    }
    if (!sorted.length) {
      list.textContent = "Нет просрочек.";
      return;
    }
    for (elem of sorted) {
      debtSum += elem.principal_debt;
      elem.npl = dateDiff(elem.next_payment_date);
    }
    sorted.sort((a, b) => new Date(b.npl) - new Date(a.npl));
    list.innerHTML = `<div class="contrast-bg" style="margin-bottom: 12px">
        <p>Всего задержанных займов: <b>${res.data.total}</b> шт.</p>
        <p>Сумма NPL${nplNum}+ задержек: <b>${toCurrencyFormat(debtSum)}</b> 
          (<b class="tooltip">${toPercentFormat(debtSum / cleanBalance)}
            <template class="tooltip-content"><b>${toPercentFormat(debtSum / balance)}</b>, если делить на баланс с НПД.</template>
          </b> от портфеля).
        </p>
        <p>Сумма всех задержек: <b class="tooltip">${toCurrencyFormat(res.data.aggregation.principal_debt)}
            <template class="tooltip-content">Сумма инвестиций: <b>${toCurrencyFormat(res.data.aggregation.purchased_amount)}</b>.</template>
          </b> 
          (<b class="tooltip">${toPercentFormat(res.data.aggregation.principal_debt / cleanBalance)}
            <template class="tooltip-content"><b>${toPercentFormat(res.data.aggregation.principal_debt / balance)}</b>, если делить на баланс с НПД.</template>
          </b> от портфеля).
        </p>
        <p>Выплаченные проценты: <b>${toCurrencyFormat(res.data.aggregation.paid_interest)}</b>.</p>
        <p>Выплаченные пени: <b>${toCurrencyFormat(res.data.aggregation.paid_fine)}</b>.</p>
        <p>НПД: <b>${toCurrencyFormat(res.data.aggregation.nkd)}</b>.</p>
      </div>`;
    sorted.forEach((element) => {
      const listItem = document.createElement("div");
      listItem.classList.add("list-element", "contrast-bg");
      listItem.innerHTML = createListElement(element);
      list.appendChild(listItem);
    });
  } else {
    list.textContent = transactionsData.error;
  }

  function createListElement(company) {
    return `
    <section class="flex">
      <img class="list-element__img" src="https://jetlend.ru${company.preview_small_url}">
      <div>
        <a class="list-element__loan-name target-url" style="font-size: 14.5px; font-weight:600; z-index: 1; display: inline-block;" href="https://jetlend.ru/invest/v3/company/${company.loan_id}">
          ${company.loan_name}
        </a>
          <div style="font-size: 14px; margin-top: 3px;">
            <b style="${company.rating.includes("A") ? "color: limegreen;" : company.rating.includes("B") ? "color: orange;" : "color: orangered;"}">${company.rating}|${ratingArray.indexOf(company.rating)}</b>, 
            <span class="tooltip"> 
              NPL <b>${company.npl} д.</b>
              <template class="tooltip-content">
                Срок просрочки.
              </template>
            </span>
          </div>
          <div style="margin-top: 5px; font-size: 14px; text-wrap: nowrap;">
            <span>Инвестиция: </span>
            <b>${toCurrencyFormat(company.amount)}</b>
          </div>
      </div>
      <div class="flex flex-col items-end" style="margin-left: auto; font-size: 14px;">
        <div class="tooltip" style="text-wrap: nowrap;">
          <b>${formatReadableDate(company.next_payment_date, "short")}</b>
          <template class="tooltip-content">
            Дата следующего платежа.
          </template>
        </div>
        <div class="tooltip" style="text-wrap: nowrap; margin-top: 5px;">
          <span>Остаток долга: </span>
          <b style="color: orange;">${toCurrencyFormat(company.principal_debt)}</b>
          <template class="tooltip-content">
            Остаток тела долга по займу.
          </template>
        </div> 
        <div class="tooltip" style="text-wrap: nowrap; margin-top: 5px;">
          <span>Совокупный доход: </span>
          <b>${toCurrencyFormat(company.profit)}</b>
          <template class="tooltip-content">
            Совокупный доход по займу, включая полученный процентный доход, а также пени за просрочку платежей. 
          </template>
        </div> 
      </div>
    </section>
    <div class="progressbar__container" style="margin-top: 5px;">
      <div class="progressbar" style="width: ${company.progress * 100}%; background: ${company.status === "delayed" ? "orange" : "var(--jle-lightGreen)"};"></div>
    </div>
    `;
  }
}

async function restructsShow() {
  $get("#portfolio__btn-section")
    .querySelectorAll(".btn-small")
    .forEach((btn) => btn.classList.remove("btn-small--active"));
  $get("#restructs__open").classList.add("btn-small--active");
  const list = $get("#portfolio__list");
  list.innerHTML = `<div class="load-spinner__container"><span class="load-spinner" style="width: 32px;"></span></div>`;
  const url = "https://jetlend.ru/invest/api/portfolio/loans?aggregate=purchased_amount%2Cpaid_interest%2Cpaid_fine%2Cprincipal_debt%2Cnkd&filter=%5B%7B%22values%22%3A%5B%22restructured%22%5D%2C%22field%22%3A%22status%22%7D%5D&sort_dir=desc&sort_field=principal_debt";
  const res = await fetchChunks(url);
  if (res.data) {
    let sorted = res.data.data;
    if (!sorted.length) {
      list.textContent = "Нет реструктуризированых займов.";
      return;
    }
    sorted.sort((a, b) => new Date(a.next_payment_date) - new Date(b.next_payment_date));
    list.innerHTML = `<div class="contrast-bg" style="margin-bottom: 12px">
      <p>Всего реструктуризаций: <b>${res.data.total}</b> шт.</p>
      <p>Сумма: <b class="tooltip">${toCurrencyFormat(res.data.aggregation.principal_debt)}
          <template class="tooltip-content">Сумма инвестиций: <b>${toCurrencyFormat(res.data.aggregation.purchased_amount)}</b>.</template>
        </b> 
        (<b class="tooltip">${toPercentFormat(res.data.aggregation.principal_debt / cleanBalance)}
          <template class="tooltip-content"><b>${toPercentFormat(res.data.aggregation.principal_debt / balance)}</b>, если делить на баланс с НПД.</template>
        </b> от портфеля).
      </p>
      <p>Выплаченные проценты: <b>${toCurrencyFormat(res.data.aggregation.paid_interest)}</b>.</p>
      <p>Выплаченные пени: <b>${toCurrencyFormat(res.data.aggregation.paid_fine)}</b>.</p>
      <p>НПД: <b>${toCurrencyFormat(res.data.aggregation.nkd)}</b>.</p>
    </div>`;
    sorted.forEach((element) => {
      const listItem = document.createElement("div");
      listItem.classList.add("list-element", "contrast-bg");
      listItem.innerHTML = createListElement(element);
      list.appendChild(listItem);
    });
  } else {
    list.textContent = transactionsData.error;
  }

  function createListElement(company) {
    return `
    <section class="flex">
      <img class="list-element__img" src="https://jetlend.ru${company.preview_small_url}">
      <div>
        <a class="list-element__loan-name target-url" style="font-size: 14.5px; font-weight:600; z-index: 1; display: inline-block;" href="https://jetlend.ru/invest/v3/company/${company.loan_id}">
          ${company.loan_name}
        </a>
          <div style="font-size: 14px; margin-top: 3px;">
            <b style="${company.rating.includes("A") ? "color: limegreen;" : company.rating.includes("B") ? "color: orange;" : "color: orangered;"}">${company.rating}|${ratingArray.indexOf(company.rating)}</b>
          </div>
          <div style="margin-top: 5px; font-size: 14px; text-wrap: nowrap;">
            <span>Инвестиция: </span>
            <b>${toCurrencyFormat(company.amount)}</b>
          </div>
      </div>
      <div class="flex flex-col items-end" style="margin-left: auto; font-size: 14px;">
        <div class="tooltip" style="text-wrap: nowrap;">
          <b>${formatReadableDate(company.next_payment_date, "short")}</b>
          <template class="tooltip-content">
            Дата следующего платежа.
          </template>
        </div>
        <div class="tooltip" style="text-wrap: nowrap; margin-top: 5px;">
          <span>Остаток долга: </span>
          <b style="color: orange;">${toCurrencyFormat(company.principal_debt)}</b>
          <template class="tooltip-content">
            Остаток тела долга по займу.
          </template>
        </div> 
        <div class="tooltip" style="text-wrap: nowrap; margin-top: 5px;">
          <span>Совокупный доход: </span>
          <b>${toCurrencyFormat(company.profit)}</b>
          <template class="tooltip-content">
            Совокупный доход по займу, включая полученный процентный доход, а также пени за просрочку платежей. 
          </template>
        </div> 
      </div>
    </section>
    <div class="progressbar__container" style="margin-top: 5px;">
      <div class="progressbar" style="width: ${company.progress * 100}%; background: var(--jle-lightGreen);"></div>
    </div>
    `;
  }
}

async function defaultsShow() {
  $get("#portfolio__btn-section")
    .querySelectorAll(".btn-small")
    .forEach((btn) => btn.classList.remove("btn-small--active"));
  $get("#defaults__open").classList.add("btn-small--active");
  const list = $get("#portfolio__list");
  list.innerHTML = spinLoad.innerHTML;
  let cache = [];
  chrome.storage.local.get("defaults", function (date) {
    if (date.defaults) {
      cache = date.defaults;
    }
  });
  const url = "https://jetlend.ru/invest/api/portfolio/loans?aggregate=purchased_amount%2Cpaid_interest%2Cpaid_fine%2Cprincipal_debt%2Cnkd&filter=%5B%7B%22values%22%3A%5B%22default%22%5D%2C%22field%22%3A%22status%22%7D%5D";
  const res = await fetchChunks(url);
  if (res.data) {
    let companysArr = res.data.data;
    if (!companysArr.length) {
      list.textContent = "Нет дефолтных займов.";
      return;
    }
    async function memoDefaultsDate(company) {
      const index = cache.findIndex((cacheElem) => cacheElem.id === company.loan_id);
      if (index !== -1) {
        company.default_date = cache[index].default_date;
        company.npl = cache[index].npl;
        return;
      }
      const events = await fetchData(`https://jetlend.ru/invest/api/requests/${company.loan_id}/events`);
      const defaultEvent = events.data.events.find((obj) => obj.event_type === "default");
      company.default_date = defaultEvent.date; // Дата дефолта
      if (company.last_payment_date === null) {
        company.last_payment_date = company.date;
      }
      company.npl = dateDiff(company.last_payment_date, company.default_date);
      cache.push({ id: company.loan_id, default_date: company.default_date, npl: company.npl });
      return;
    }

    for (company of companysArr) {
      await memoDefaultsDate(company);
    }

    chrome.storage.local.set({ defaults: cache });

    companysArr.sort((a, b) => new Date(b.default_date) - new Date(a.default_date));
    const nplArr = companysArr.map((elem) => elem.npl);
    const progressArr = companysArr.map((elem) => elem.progress);
    list.innerHTML = `<div class="contrast-bg" style="margin-bottom: 12px">
      <p>Всего дефолтов: <b>${res.data.total}</b> шт., потери: <b>${toCurrencyFormat(res.data.aggregation.principal_debt)}</b>.</p>
      <p>Сумма инвестиций: <b>${toCurrencyFormat(res.data.aggregation.purchased_amount)}</b>.</p>
      <p>Выплаченные проценты: <b>${toCurrencyFormat(res.data.aggregation.paid_interest)}</b>.</p>
      <p>Пени: <b>${toCurrencyFormat(res.data.aggregation.paid_fine)}</b>.</p>
      <hr>
      <div class="flex justify-between">
        <p>Среднее погашение: <b>${toPercentFormat(getAverage(progressArr))}</b>.</p>
        <p>Средний NPL: <b>${getAverage(nplArr).toFixed()}</b> д.</p>
      </div>
      <div class="flex justify-between">
        <p>Медианное погашение: <b>${toPercentFormat(getMedian(progressArr))}</b>.</p>
        <p>Медианный NPL: <b>${getMedian(nplArr).toFixed()}</b> д.</p>
      </div>
      <div class="flex justify-between">
        <p class="tooltip">Мода погашение: <b>${toPercentFormat(getModa(progressArr))}</b>.
          <template class="tooltip-content">
            <p>Наиболее встречающееся значение.</p>
          </template>
        </p>
        <p class="tooltip">Мода NPL: <b>${getModa(nplArr)}</b> д.
          <template class="tooltip-content">
            <p>Наиболее встречающееся значение.</p>
          </template>
        </p>
      </div>
    </div>`;
    companysArr.forEach((element) => {
      const listItem = document.createElement("div");
      listItem.classList.add("list-element", "contrast-bg");
      listItem.innerHTML = createListElement(element);
      list.appendChild(listItem);
    });
  } else {
    list.textContent = transactionsData.error;
  }

  function createListElement(company) {
    return `
    <section class="flex">
      <img class="list-element__img" src="https://jetlend.ru${company.preview_small_url}">
      <div>
        <a class="list-element__loan-name target-url" style="font-size: 14.5px; font-weight:600; z-index: 1; display: inline-block;" href="https://jetlend.ru/invest/v3/company/${company.loan_id}">
          ${company.loan_name}
        </a>
          <div style="font-size: 14px; margin-top: 3px;">
            <b style="${company.rating.includes("A") ? "color: limegreen;" : company.rating.includes("B") ? "color: orange;" : "color: orangered;"}">${company.rating}|${ratingArray.indexOf(company.rating)}</b>, 
            <span class="tooltip"> 
              NPL <b>${company.npl} д.</b>
              <template class="tooltip-content">
                Срок просрочки.
              </template>
            </span>
          </div>
          <div style="margin-top: 5px; font-size: 14px; text-wrap: nowrap;">
            <span>Инвестиция: </span>
            <b>${toCurrencyFormat(company.purchased_amount)}</b>
          </div>
      </div>
      <div class="flex flex-col items-end" style="margin-left: auto; font-size: 14px;">
        <div class="tooltip" style="text-wrap: nowrap;">
          <b>${formatReadableDate(company.default_date)}</b>
          <template class="tooltip-content">
            Дата дефолта.
          </template>
        </div>
        <div class="tooltip" style="text-wrap: nowrap; margin-top: 5px;">
          <span>Остаток долга: </span>
          <b style="color: orangered;">${toCurrencyFormat(-company.principal_debt)}</b>
          <template class="tooltip-content">
            Остаток тела долга по займу.
          </template>
        </div> 
        <div class="tooltip" style="text-wrap: nowrap; margin-top: 5px;">
          <span>Совокупный доход: </span>
          <b style="color: orangered;">${toCurrencyFormat(company.profit)}</b>
          <template class="tooltip-content">
            Совокупный доход по займу, включая полученный процентный доход, а также пени за просрочку платежей. 
          </template>
        </div> 
      </div>
    </section>
    <div class="progressbar__container" style="margin-top: 5px;">
      <div class="progressbar" style="width: ${company.progress * 100}%; background: orangered;"></div>
    </div>
    `;
  }
}

async function revenueShow() {
  $get("#analytics__btn-section")
    .querySelectorAll(".btn-small")
    .forEach((btn) => btn.classList.remove("btn-small--active"));
  $get("#revenue__open").classList.add("btn-small--active");

  const list = $get("#analytics__list");
  list.innerHTML = spinLoad.innerHTML;
  let cache = [];
  chrome.storage.local.get("defaults", function (date) {
    if (date.defaults) {
      cache = date.defaults;
    }
  });
  const url = "https://jetlend.ru/invest/api/portfolio/loans?aggregate=purchased_amount%2Cpaid_interest%2Cpaid_fine%2Cprincipal_debt%2Cnkd&filter=%5B%7B%22values%22%3A%5B%22default%22%5D%2C%22field%22%3A%22status%22%7D%5D";
  const res = await fetchChunks(url);
  if (res.data) {
    // const obj1 = [{ date: 100 }, { date: 110 }, { date: 120 }];
    // const obj2 = [
    //   { date: 90, id: 1, money: 100 },
    //   { date: 105, id: 2, money: 202 },
    //   { date: 110, id: 3, money: 33 },
    //   { date: 115, id: 4, money: 404 },
    //   { date: 121, id: 5, money: 1000 },
    // ];
    // for (let elem2 of obj2) {
    //   for (let elem1 of obj1) {
    //     const DAY = 10;
    //     if (elem1.date <= elem2.date && elem1.date + 10 > elem2.date) {
    //       elem1.money ? (elem1.money += elem2.money) : (elem1.money = elem2.money);
    //     }
    //   }
    // }

    // https://jetlend.ru/invest/api/portfolio/charts/revenue
    let companysArr = res.data.data;
    if (!companysArr.length) {
      list.textContent = "Нет дефолтных займов.";
      return;
    }
    async function memoDefaultsDate(company) {
      const index = cache.findIndex((cacheElem) => cacheElem.id === company.loan_id);
      if (index !== -1) {
        company.default_date = cache[index].default_date;
        company.npl = cache[index].npl;
        return;
      }
      const events = await fetchData(`https://jetlend.ru/invest/api/requests/${company.loan_id}/events`);
      const defaultEvent = events.data.events.find((obj) => obj.event_type === "default");
      company.default_date = defaultEvent.date; // Дата дефолта
      if (company.last_payment_date === null) {
        company.last_payment_date = company.date;
      }
      company.npl = dateDiff(company.last_payment_date, company.default_date);
      cache.push({ id: company.loan_id, default_date: company.default_date, npl: company.npl });
      return;
    }
    for (company of companysArr) {
      await memoDefaultsDate(company);
    }
    chrome.storage.local.set({ defaults: cache });
    list.innerHTML = `
    <div class="contrast-bg flex flex-col">
      <div class="flex justify-between" style="margin-bottom: 12px">
        <div>20.10.2020</div>
        <div>22.12.2022</div>
      </div>
      <div style="width: 50px; align-self: start; text-wrap: nowrap; justify-self: flex-end">50 000,50 R</div>
      <hr style="border: none; border-top: 2px dashed red" />
      <div class="flex items-end" style="gap: 4px">
        <div class="blackout" style="height: 10px; width: 100%; background: var(--jle-green)"></div>
        <div class="blackout" style="height: 25px; width: 100%; background: var(--jle-green)"></div>
        <div class="blackout" style="height: 20px; width: 100%; background: var(--jle-green)"></div>
      </div>
      <div class="flex items-start" style="gap: 4px">
        <div class="blackout" style="height: 10px; width: 100%; background: gray"></div>
        <div class="blackout" style="height: 25px; width: 100%; background: gray"></div>
        <div class="blackout" style="height: 20px; width: 100%; background: gray"></div>
      </div>
      <hr style="border: none; border-top: 2px dashed red" />
      <div style="width: 50px; align-self: start; text-wrap: nowrap">-50 000,50 R</div>
    </div>
  `;
    companysArr.forEach((element) => {
      // const listItem = document.createElement("div");
      // listItem.classList.add("list-element", "contrast-bg");
      // listItem.innerHTML = createListElement(element);
      // list.appendChild(listItem);
    });
  } else {
    list.textContent = transactionsData.error;
  }
}

async function checkCompany() {
  if (!checkCompany__input.value) {
    return;
  }
  $get("#checkCompany__list").innerHTML = "";
  $get("#checkCompany__spin").innerHTML = spinLoad.innerHTML;
  const companysArr = checkCompany__input.value.split(" ");
  checkCompany__input.value = null;
  const fm = await fetchData("https://jetlend.ru/invest/api/requests/waiting");
  const sm = await fetchChunks("https://jetlend.ru/invest/api/exchange/loans?");
  for (const company of companysArr) {
    const res = await checkingCompany(parseInt(company.replace(/\D/g, "")), fm, sm);
    $get("#checkCompany__list").innerHTML += res;
  }
  $get("#checkCompany__spin").innerHTML = "";
}

function fmCompanyShow(arr, blockId) {
  const removeElement = (index) => arr.splice(index, 1);
  const list = $get(`${blockId}`);
  list.innerHTML = ""; // очищаем текущий список
  function createListElement(company, details) {
    return `
        <header>
          <div class="flex" style="margin-top: 6px;">
            <img class="list-element__img" src="https://jetlend.ru${company.preview_small_url}">
            <div class="flex flex-col" style="text-wrap: nowrap;">
              <a class="list-element__loan-name target-url" style="font-size: 14.5px; font-weight:600; z-index: 1; display: inline-block; width: 0;" 
                href="https://jetlend.ru/invest/v3/company/${company.id}">${company.loan_name}</a>
              <span style="font-size: 14px">${company.loan_isin}</span>
              <span style="font-size: 14px">
                <b style="${company.rating.includes("A") ? "color: limegreen;" : company.rating.includes("B") ? "color: orange;" : "color: orangered;"}">${company.rating}|${ratingArray.indexOf(company.rating)}
                </b>, 
                <b style="${company.financial_discipline === 1 ? "color: limegreen;" : company.financial_discipline <= 0.4 ? "color: red;" : "color: orange;"}">ФД: ${(company.financial_discipline * 100).toFixed(0)}%
                </b> 
              </span>
            </div>
            <div style="display: block; flex: 1; margin-left: -50px; font-size: 14px;">
              <b style="${company.company_investing_amount === null ? "color: limegreen;" : company.company_investing_amount === "0.00" ? "color: #8888e6;" : "color: orange;"}
                            text-wrap: nowrap; float: right">
                            ${company.company_investing_amount === null ? "Заёмщика нет в портфеле" : company.company_investing_amount === "0.00" ? "Заёмщик был в портфеле" : `Компания в портфеле: ${toCurrencyFormat(company.company_investing_amount)}`}
              </b> 
              <div style="${company.investing_amount !== null ? "color: orange;" : ""} font-weight: 600; float: right">
                          ${company.investing_amount !== null ? `Зарезервировано: ${toCurrencyFormat(company.investing_amount)}` : ""}
              </div>
            </div>
          </div>
          <div class="progressbar__container" style="margin-bottom: 8px;">
            <div class="progressbar" style="width: ${company.collected_percentage}%; background: limegreen;"></div>
          </div>
        </header>
        <main>
          <p>${company.company}</p>
          <p>Ставка: <b>${(company.interest_rate * 100).toFixed(2)}%</b>, срок: <b>${company.term}</b> ${daysEnding(company.term)}</p>
          <p>Сумма: <b>${toShortCurrencyFormat(company.amount)}</b>, собрано: <b>(${company.collected_percentage.toFixed(0)}%/100%)</b></p>
          ${
            details
              ? `<p>ИНН: <b>${details.inn}</b>, ОГРН: <b>${details.ogrn}</b></p>
            <p>Выручка за год: <b>${toShortCurrencyFormat(details.revenueForPastYear)}</b>, прибыль за год: <b>${toShortCurrencyFormat(details.profitForPastYear)}</b></p>
            <p>Дата регистрации: <b>${details.registrationDate}</b></p>
            <p>Адрес: ${details.address}</p>
            <p>Деятельность: ${details.primaryCatergory}.</p> 
            <div style="margin-top: 5px">${details.site ? `<a class="target-url link" href="${details.site}">Сайт компании </a>` : "Cайта нет "}|
              <a class="target-url link" href="${details.profile}"> Контур. Фокус </a>|
              <a class="target-url link" href="https://vbankcenter.ru/contragent/search?searchStr=${details.inn}"> ВБЦ </a>|
              <a class="target-url link" href="https://checko.ru/search?query=${details.inn}"> Чекко </a>|
              <a class="target-url link" href="https://www.rusprofile.ru/search?query=${details.inn}"> Rusprofile </a>
            </div>`
              : ""
          }
          </div> 
        </main>
  `;
  }
  arr.forEach((company, index) => {
    const listItem = document.createElement("div");
    listItem.classList.add("list-element", "contrast-bg");
    listItem.innerHTML = createListElement(company);

    if (arr !== fmrInvestCompanyArray) {
      const buttons = document.createElement("div");
      buttons.classList.add("buttons-section");
      const removeBtn = document.createElement("span");
      removeBtn.textContent = "Удалить";
      removeBtn.classList.add("btn");
      removeBtn.style.marginTop = "10px";
      removeBtn.onclick = function () {
        removeElement(index);
        if (arr.length === 0) {
          closeModal("#fm-list");
        }
        updateFmArrayText();
        fmCompanyShow(arr, blockId);
      };
      const detailsBtn = document.createElement("span");
      detailsBtn.textContent = "Подробнее";
      detailsBtn.classList.add("btn");
      detailsBtn.style.marginTop = "10px";
      detailsBtn.onclick = async function () {
        const load = document.createElement("div");
        load.classList.add("list-element__load-block");
        const spin = document.createElement("div");
        spin.classList.add("load-spinner");
        spin.style.width = "64px";
        load.appendChild(spin);
        listItem.appendChild(load);
        const res = await fetchData(`https://jetlend.ru/invest/api/requests/${company.id}/details`);
        if (res.data) {
          listItem.innerHTML = createListElement(company, res.data.data.details);
          listItem.appendChild(removeBtn);
        }
      };
      listItem.appendChild(buttons);
      buttons.appendChild(detailsBtn);
      buttons.appendChild(removeBtn);
    }
    list.appendChild(listItem);
  });
}

function updateFmArrayText() {
  $get("#fm-numOfSortedCompany").textContent = `Найдено: ${fmInvestCompanyArray.length} ${getZaimEnding(fmInvestCompanyArray.length)} `;
  $get("#fm-btn-update").classList.remove("display-none");
  if (fmInvestCompanyArray.length >= 1) {
    $get("#fm-btn-show").classList.remove("display-none");
  } else if (fmInvestCompanyArray.length === 0) {
    $get("#fm-btn-show").classList.add("display-none");
  }
  $get("#fm-btn-stop").classList.add("display-none");
}

function updateSmArrayText() {
  $get("#sm-numOfSortedCompany").textContent = `Найдено: ${smInvestCompanyArray.length} ${getZaimEnding(smInvestCompanyArray.length)} `;
  $get("#sm-btn-update").classList.remove("display-none");
  if (smInvestCompanyArray.length >= 1) {
    $get("#fm-btn-show").classList.remove("display-none");
  } else if (smInvestCompanyArray.length === 0) {
    $get("#sm-btn-show").classList.add("display-none");
  }
  $get("#sm-btn-stop").classList.add("display-none");
}

function smCompanyShow(arr, blockId) {
  const removeElement = (index) => arr.splice(index, 1);
  const list = $get(`${blockId}`);
  list.innerHTML = "";
  function createListElement(company, details) {
    return `
      <header>
        <div class="flex" style="margin-top: 6px;">
          <img class="list-element__img" src="https://jetlend.ru${company.preview_small_url === null ? company.image_url : company.preview_small_url}">
          <div class="flex flex-col" style="text-wrap: nowrap;">
            <a class="list-element__loan-name target-url" style="font-size: 14.5px; font-weight:600; z-index: 1; display: inline-block; width: 0;" 
              href="https://jetlend.ru/invest/v3/company/${company.loan_id}">${company.loan_name}</a>
            <span style="font-size: 14px">${company.loan_isin}</span>
            <span style="font-size: 14px">
              <b style="${company.rating.includes("A") ? "color: limegreen;" : company.rating.includes("B") ? "color: orange;" : "color: orangered;"}">${company.rating}|${ratingArray.indexOf(company.rating)}
              </b>, 
              <b style="${company.financial_discipline === 1 ? "color: limegreen;" : company.financial_discipline <= 0.4 ? "color: red;" : "color: orange;"}">ФД: ${(company.financial_discipline * 100).toFixed(0)}%
              </b>, 
              <b style="${company.loan_class === 0 ? "color: limegreen;" : company.loan_class === 1 ? "color: orange;" : "color: orangered;"}">Класс: ${company.loan_class}
              </b>  
            </span>
          </div>
          <div style="display: block; flex: 1; margin-left: -50px; font-size: 14px;">
            <b style="${company.invested_company_debt === null ? "color: limegreen;" : company.invested_company_debt === 0 ? "color: #8888e6;" : "color: orange;"}
                          text-wrap: nowrap; float: right">
                          ${company.invested_company_debt === null ? "Заёмщика нет в портфеле" : company.invested_company_debt === 0 ? "Заёмщик был в портфеле" : `Компания в портфеле: ${toCurrencyFormat(company.invested_company_debt)}`}
            </b> 
            <div style="${company.invested_debt !== null ? "color: orange;" : ""} font-weight: 600; float: right">
                      ${company.invested_debt !== null ? `Займ в портфеле: ${toCurrencyFormat(company.invested_debt)}` : ""}
            </div>
          </div>
        </div>
        <div class="progressbar__container" style="margin-bottom: 8px">
          <div class="progressbar" style="width: ${company.progress * 100}%; background: limegreen;"></div>
        </div>
      </header>

      <main>
        <p>${company.company}</p>
        <p>Ставка: <b>${(company.interest_rate * 100).toFixed(2)}% (${(company.ytm * 100).toFixed(2)}%)</b>, минимальная цена: <b>${(company.min_price * 100).toFixed(2)}%</b></p>
        <p>Cрок: <b>${company.term + daysEnding(company.term)}</b>, остаток: <b>${company.term_left + daysEnding(company.term_left)}</b>, выплачено: <b>${(company.progress * 100).toFixed(2)}%</b></p>
        ${
          details
            ? `<p>ИНН: <b>${details.inn}</b>, ОГРН: <b>${details.ogrn}</b></p>
          <p>Выручка за год: <b>${toShortCurrencyFormat(details.revenueForPastYear)}</b>, прибыль за год: <b>${toShortCurrencyFormat(details.profitForPastYear)}</b></p>
          <p>Дата регистрации: <b>${details.registrationDate}</b></p>
          <p>Адрес: ${details.address}</p>
          <p>Деятельность: ${details.primaryCatergory}.</p> 
          <div style="margin-top: 5px">${details.site ? `<a class="target-url link" href="${details.site}">Сайт компании </a>` : "Cайта нет "}|
            <a class="target-url link" href="${details.profile}"> Контур. Фокус </a>|
            <a class="target-url link" href="https://vbankcenter.ru/contragent/search?searchStr=${details.inn}"> ВБЦ </a>|
            <a class="target-url link" href="https://checko.ru/search?query=${details.inn}"> Чекко </a>|
            <a class="target-url link" href="https://www.rusprofile.ru/search?query=${details.inn}"> Rusprofile </a>
          </div>`
            : ""
        }
      </main>
    `;
  }
  arr.forEach((company, index) => {
    const listItem = document.createElement("div");
    listItem.classList.add("list-element", "contrast-bg");
    listItem.innerHTML = createListElement(company);
    const buttons = document.createElement("div");
    buttons.classList.add("buttons-section");
    const removeBtn = document.createElement("span");
    removeBtn.textContent = "Удалить";
    removeBtn.classList.add("btn");
    removeBtn.style.marginTop = "10px";
    removeBtn.onclick = function () {
      removeElement(index);
      if (arr.length === 0) {
        closeModal("#sm-list");
      }
      updateSmArrayText();
      smCompanyShow(arr, blockId);
    };
    const detailsBtn = document.createElement("span");
    detailsBtn.textContent = "Подробнее";
    detailsBtn.classList.add("btn");
    detailsBtn.style.marginTop = "10px";
    detailsBtn.onclick = async function () {
      const load = document.createElement("div");
      load.classList.add("list-element__load-block");
      const spin = document.createElement("div");
      spin.classList.add("load-spinner");
      spin.style.width = "64px";
      load.appendChild(spin);
      listItem.appendChild(load);
      const res = await fetchData(`https://jetlend.ru/invest/api/requests/${company.loan_id}/details`);

      if (res.data) {
        listItem.innerHTML = createListElement(company, res.data.data.details);
        listItem.appendChild(removeBtn);
      }
    };
    listItem.appendChild(buttons);
    buttons.appendChild(detailsBtn);
    buttons.appendChild(removeBtn);
    list.appendChild(listItem);
  });
}

chrome.storage.local.get("settings", function (data) {
  if (data.settings) {
    timeSettingBtn.textContent = data.settings.timePeriod;

    if (data.settings.timePeriod == "всё время") {
      timePeriod = "allTime";
    } else if (data.settings.timePeriod == "год") {
      timePeriod = "year";
    }
  } else if (!data.settings || data.settings.timePeriod == undefined || investDays() <= 365) {
    timeSettingBtn.textContent = "всё время";
    timePeriod = "allTime";
  }
});

async function mainUpdateFunction() {
  lastUpdateDateTag.innerHTML = `Все активы <span style="position: relative"><span class="load-spinner" title="Загузка актуальных данных..." style="cursor: pointer; width: 16px"></span></span>`;
  for (let span of $getAll(".invest-section__title-sum")) {
    span.textContent = `(Загрузка...)`;
  }
  const userStatsUrl = "https://jetlend.ru/invest/api/account/details";
  const userDataUrl = "https://jetlend.ru/invest/api/account/info";
  const platformStatsUrl = "https://jetlend.ru/invest/api/public/stats";
  const amountCompanyUrl = "https://jetlend.ru/invest/api/portfolio/distribution/overview";
  const xirrUrl = "https://jetlend.ru/invest/api/account/notifications/v3?filter=%5B%7B%22values%22%3A%5B%22110%22%2C%22120%22%5D%2C%22field%22%3A%22event_type%22%7D%5D&sort_dir=asc&sort_field=date";

  const userStats = await fetchData(userStatsUrl);
  const userData = await fetchData(userDataUrl);
  const platformStats = await fetchData(platformStatsUrl);
  const amountCompany = await fetchData(amountCompanyUrl);
  const xirrData = await fetchChunks(xirrUrl);

  if (userStats.data && platformStats.data && userData.data && amountCompany.data && xirrData.data) {
    const userStatsObj = userStats.data;
    const userObj = userData.data;
    const platformObj = platformStats.data;
    const statAllTime = userStatsObj.data.summary;
    const statYearTime = userStatsObj.data.summary_year;
    const balanceStats = userStatsObj.data.balance;

    balance = balanceStats.total; // Баланс
    cleanBalance = balance - balanceStats.nkd; // Баланс без НПД
    freeBalance = balanceStats.free; // Свободные средства

    const allTime = {
      percentProfit: statAllTime.yield_rate, // Доходность в процентах за всё время
      interest: statAllTime.details.interest, // Процентный доход за всё время
      fine: statAllTime.details.fine, // Пени за всё время
      bonus: statAllTime.details.bonus, // Бонусы за всё время
      reffBonus: statAllTime.details.referral_bonus, // Реферальные бонусы за всё время
      sale: statAllTime.details.sale, // Доход на вторичке за всё время
      loss: statAllTime.loss, // Потери за всё время
      ndfl: statAllTime.profit_ndfl, // НДФЛ за всё время
      get profitWithoutNpd() {
        // Доход без НПД за всё время
        return this.interest + this.fine + this.bonus + this.reffBonus + this.sale - this.loss;
      },
      get cleanProfit() {
        // Чистый доход за всё время
        return this.profitWithoutNpd - this.ndfl;
      },
      get profitWithoutNdfl() {
        // Доход без НДФЛ за всё время
        return this.cleanProfit + balanceStats.nkd;
      },
      xirr: function (type) {
        let cashFlows = [];
        let dates = [];
        if (type === "npd") {
          type = balance;
        } else if (type === "clean") {
          type = cleanBalance;
        }
        for (element of xirrData.data.data) {
          cashFlows.push(element.amount);
          dates.push(new Date(element.date));
        }
        cashFlows.push(-type);
        dates.push(new Date());
        return calculateXIRR(cashFlows, dates);
      },
      get incomeSum() {
        let sum = 0;
        for (element of xirrData.data.data) {
          sum += element.income;
        }
        return sum;
      },
      get expenseSum() {
        let sum = 0;
        for (element of xirrData.data.data) {
          sum += element.expense;
        }
        return sum;
      },
    };

    const yearTime = {
      percentProfit: statYearTime.yield_rate, // Доходность в процентах за год
      interest: statYearTime.details.interest, // Процентный доход за год
      fine: statYearTime.details.fine, // Пени за год
      bonus: statYearTime.details.bonus, // Бонусы за год
      reffBonus: statYearTime.details.referral_bonus, // Реферальные бонусы за год
      sale: statYearTime.details.sale, // Доход на вторичке за год
      loss: statYearTime.loss, // Потери за год
      ndfl: statYearTime.profit_ndfl, // НДФЛ за год
      get profitWithoutNpd() {
        // Доход без НПД за год
        return this.interest + this.fine + this.bonus + this.reffBonus + this.sale - this.loss;
      },
      get cleanProfit() {
        // Чистый доход за год
        return this.profitWithoutNpd - this.ndfl;
      },
      get profitWithoutNdfl() {
        // Доход без НДФЛ за год
        return this.cleanProfit + balanceStats.nkd;
      },
      xirr: function (type) {
        const timeYearAgo = new Date().getTime() - 31536000000; // Время в unix год назад
        let cashFlows = [];
        let dates = [];
        let sumYear = 0; // Сумма транзакций за год
        let beforeFlows = 0; // Сумма транзакций до текущего года
        let profitSum = allTime.cleanProfit - this.cleanProfit; // Профит год назад
        if (type === "npd") {
          type = balance;
          // profitSum = allTime.cleanProfit - this.cleanProfit;
        } else if (type === "clean") {
          type = cleanBalance;
        }
        for (element of xirrData.data.data) {
          if (timeYearAgo < new Date(element.date).getTime()) {
            sumYear += element.amount;
            cashFlows.push(element.amount);
            dates.push(new Date(element.date));
          } else {
            beforeFlows += element.amount;
          }
        }
        cashFlows.unshift(beforeFlows + profitSum);
        dates.unshift(new Date(timeYearAgo));
        // cashFlows[0] += beforeFlows;
        cashFlows.push(-type);
        dates.push(new Date());
        return calculateXIRR(cashFlows, dates);
      },
      get incomeSum() {
        const timeYearAgo = new Date().getTime() - 31536000000;
        let sum = 0;
        for (element of xirrData.data.data) {
          if (timeYearAgo < new Date(element.date).getTime()) {
            sum += element.income;
          }
        }
        return sum;
      },
      get expenseSum() {
        const timeYearAgo = new Date().getTime() - 31536000000;
        let sum = 0;
        for (element of xirrData.data.data) {
          if (timeYearAgo < new Date(element.date).getTime()) {
            sum += element.expense;
          }
        }
        return sum;
      },
    };

    // Функция подсчёта дней инвестирования
    function investDays() {
      const investStartDate = new Date(statAllTime.start_date).getTime(); // Дата начала инвестирования в unix
      const timeDiff = Math.abs(new Date().getTime() - investStartDate); // Разница между сегодняшним днем и началом инвестирования в unix
      const days = (diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))); // Количество дней инвестирования
      return days;
    }

    // Функция подсчёта дней инвестирования + склонение слова "день"
    function getInvestDays() {
      const days = investDays();
      const text = daysEnding(days);
      return days + text;
    }

    if (!timeSettingBtn.clickListenerAdded) {
      timeSettingBtn.addEventListener("click", function () {
        if (timeSettingBtn.textContent == "всё время" && investDays() >= 365) {
          timeSettingBtn.textContent = "год";
          timePeriod = "year";
          updateProfit();
        } else if (timeSettingBtn.textContent == "год") {
          timeSettingBtn.textContent = "всё время";
          timePeriod = "allTime";
          updateProfit();
        }
        let extensionSettings = {
          timePeriod: timeSettingBtn.textContent,
        };
        chrome.storage.local.set({ settings: extensionSettings });
      });
      timeSettingBtn.clickListenerAdded = true;
    }

    for (let span of $getAll(".invest-section__title-sum")) {
      span.textContent = `(Свободно: ${toCurrencyFormat(balanceStats.free)})`;
    }
    fmInvestSumAll.value = balanceStats.free;
    smInvestSumAll.value = balanceStats.free;

    sameDataText = `
      <div class="contrast-bg">
        <h3>Статистика платформы:</h3>
        <p>Ставка на сборе (за всё время / за 30 дней): <b>${toPercentFormat(platformObj.data.average_interest_rate)}</b> / <b>${toPercentFormat(platformObj.data.average_interest_rate_30days)}</b></p>
        <p>Минимальная и максимальная ставки:  <b>${toPercentFormat(platformObj.data.min_interest_rate)}</b> / <b>${toPercentFormat(platformObj.data.max_interest_rate)}</b></p>
        <p>Средняя ставка на вторичном рынке (30 дней): <b>${toPercentFormat(platformObj.data.average_market_interest_rate)}</b></p>
        <p>Дефолтность (за всё время / за 30 дней): <b>${toPercentFormat(platformObj.data.default_rate_all)}</b> / <b>${toPercentFormat(platformObj.data.default_rate)}</b></p>
      </div>
      <br>
      <div class="contrast-bg">
        <h3>Прочее:</h3>
        <p>Айди: <b>${userObj.data.id}</b></p>
        <p>Дата регистрации: <b>${formatReadableDate(userObj.data.register_date)}</b></p>
        <p>Срок инвестирования: <b>${getInvestDays()}</b></p>
        <p>Компаний в портфеле: <b>${amountCompany.data.data.companies_count}</b></p>
      </div>
      <footer style="
      color: gray;
      font-size: 14px;
      padding: 5px 0 5px;
      text-align: center;">JetLend Extension v${version}. 
      <span id="support-btn" style="text-decoration:underline; cursor:pointer; user-select: none;">Поддержать разработку.</span>
      </footer>
    </div>
    `;

    dataTextAllTime = `<div class="container">
      <div class="contrast-bg">
        <h3>Статистика за <span class="swap">всё время</span>:</h3>
        <p>Процентный доход: <b style="color:${decorNumber(allTime.interest)}">${numberSign(allTime.interest)}${toCurrencyFormat(allTime.interest)}</b></p>
        <p>НПД (ожидаемый): <b style="color:${decorNumber(balanceStats.nkd + balanceStats.nkd_ndfl)}">${numberSign(balanceStats.nkd + balanceStats.nkd_ndfl)}${toCurrencyFormat(balanceStats.nkd + balanceStats.nkd_ndfl)}</b></p>
        <p>Пени: <b style="color:${decorNumber(allTime.fine)}">${numberSign(allTime.fine)}${toCurrencyFormat(allTime.fine)}</b></p>
        <p>Бонусы: <b style="color:${decorNumber(allTime.bonus)}">${numberSign(allTime.bonus)}${toCurrencyFormat(allTime.bonus)}</b></p>
        <p>Реферальный доход: <b style="color:${decorNumber(allTime.reffBonus)}">${numberSign(allTime.reffBonus)}${toCurrencyFormat(allTime.reffBonus)}</b></p>
        <p>Доход на вторичном рынке: <b style="color:${decorNumber(allTime.sale)}">${numberSign(allTime.sale)}${toCurrencyFormat(allTime.sale)}</b></p>
        <p>Потери: <b style="color:${decorNumber(-allTime.loss)}">${numberSign(-allTime.loss)}${toCurrencyFormat(-allTime.loss)}</b></p>
        <p>НДФЛ: <b style="color:${decorNumber(-allTime.ndfl)}">${numberSign(-allTime.ndfl)}${toCurrencyFormat(-allTime.ndfl)}</b></p>
        <p>НДФЛ ожидаемый: <b style="color:${decorNumber(-balanceStats.nkd_ndfl)}">${numberSign(-balanceStats.nkd_ndfl)}${toCurrencyFormat(-balanceStats.nkd_ndfl)}</b></p>
        <p>Доход за вычетом НДФЛ: <b style="color:${decorNumber(allTime.profitWithoutNdfl)}">${numberSign(allTime.profitWithoutNdfl)}${toCurrencyFormat(allTime.profitWithoutNdfl)}</b></p>
        <p>Сумма пополнений: <b>${toCurrencyFormat(allTime.incomeSum)}</b></p>
        <p>Сумма выводов: <b>${toCurrencyFormat(allTime.expenseSum)}</b></p>
        <p>Свободные средства: <b style="color:${decorNumber(balanceStats.free)}">${numberSign(balanceStats.free)}${toCurrencyFormat(balanceStats.free)}</b></p>
        <p>XIRR (с НПД / без НПД): <b>${toPercentFormat(allTime.xirr("npd"))}</b> / <b>${toPercentFormat(allTime.xirr("clean"))}</b></p>
      </div>
      <br>
    ${(innerHTML = sameDataText)}
    `;

    dataTextYearTime = `<div class="container">
      <div class="contrast-bg">
        <h3>Статистика за <span class="swap">год</span>:</h3>
        <p>Процентный доход: <b style="color:${decorNumber(yearTime.interest)}">${numberSign(yearTime.interest)}${toCurrencyFormat(yearTime.interest)}</b></p>
        <p>НПД (ожидаемый): <b style="color:${decorNumber(balanceStats.nkd + balanceStats.nkd_ndfl)}">${numberSign(balanceStats.nkd + balanceStats.nkd_ndfl)}${toCurrencyFormat(balanceStats.nkd + balanceStats.nkd_ndfl)}</b></p>
        <p>Пени: <b style="color:${decorNumber(yearTime.fine)}">${numberSign(yearTime.fine)}${toCurrencyFormat(yearTime.fine)}</b></p>
        <p>Бонусы: <b style="color:${decorNumber(yearTime.bonus)}">${numberSign(yearTime.bonus)}${toCurrencyFormat(yearTime.bonus)}</b></p>
        <p>Реферальный доход: <b style="color:${decorNumber(yearTime.reffBonus)}">${numberSign(yearTime.reffBonus)}${toCurrencyFormat(yearTime.reffBonus)}</b></p>
        <p>Доход на вторичном рынке: <b style="color:${decorNumber(yearTime.sale)}">${numberSign(yearTime.sale)}${toCurrencyFormat(yearTime.sale)}</b></p>
        <p>Потери: <b style="color:${decorNumber(-yearTime.loss)}">${numberSign(-yearTime.loss)}${toCurrencyFormat(-yearTime.loss)}</b></p>
        <p>НДФЛ: <b style="color:${decorNumber(-yearTime.ndfl)}">${numberSign(-yearTime.ndfl)}${toCurrencyFormat(-yearTime.ndfl)}</b></p>
        <p>НДФЛ ожидаемый: <b style="color:${decorNumber(-balanceStats.nkd_ndfl)}">${numberSign(-balanceStats.nkd_ndfl)}${toCurrencyFormat(-balanceStats.nkd_ndfl)}</b></p>
        <p>Доход за вычетом НДФЛ: <b style="color:${decorNumber(yearTime.profitWithoutNdfl)}">${numberSign(yearTime.profitWithoutNdfl)}${toCurrencyFormat(yearTime.profitWithoutNdfl)}</b></p>
        <p>Сумма пополнений: <b>${toCurrencyFormat(yearTime.incomeSum)}</b></p>
        <p>Сумма выводов: <b>${toCurrencyFormat(yearTime.expenseSum)}</b></p>
        <p>Свободные средства: <b style="color:${decorNumber(balanceStats.free)}">${numberSign(balanceStats.free)}${toCurrencyFormat(balanceStats.free)}</b></p>
        <p>XIRR (с НПД / без НПД): <b>${toPercentFormat(yearTime.xirr("npd"))}</b> / <b>${toPercentFormat(yearTime.xirr("clean"))}</b></p>
      </div>
      <br>
    ${(innerHTML = sameDataText)}
    `;

    function updateProfit() {
      if (investDays() < 365) {
        incomeTitle.innerHTML = `<span>Доход за ${getInvestDays()} (без НПД | чистый доход)</span> <span>Доходность</span>`;
        $get(".income__currency").innerHTML = `<span id="income">${toCurrencyFormat(allTime.profitWithoutNpd)}</span><span style="opacity: .5;"> | </span><span id="income--clean">${toCurrencyFormat(allTime.cleanProfit)}</span>`;
        $get(".income__percent").innerHTML = `<span><img src="/img/income.svg">${toPercentFormat(allTime.percentProfit)}</span>`;
      } else if (timePeriod == "allTime") {
        incomeTitle.innerHTML = `<span>Доход за всё время (без НПД | чистый доход)</span> <span>Доходность</span>`;
        $get(".income__currency").innerHTML = `<span id="income">${toCurrencyFormat(allTime.profitWithoutNpd)}</span><span style="opacity: .5;"> | </span><span id="income--clean">${toCurrencyFormat(allTime.cleanProfit)}</span>`;
        $get(".income__percent").innerHTML = `<span><img src="/img/income.svg">${toPercentFormat(allTime.percentProfit)}</span>`;
      } else if (timePeriod == "year" && investDays() >= 365) {
        incomeTitle.innerHTML = `<span>Доход за год (без НПД | чистый доход)</span> <span>Доходность</span>`;
        $get(".income__currency").innerHTML = `<span id="income">${toCurrencyFormat(yearTime.profitWithoutNpd)}</span><span style="opacity: .5;"> | </span><span id="income--clean">${toCurrencyFormat(yearTime.cleanProfit)}</span>`;
        $get(".income__percent").innerHTML = `<span><img src="/img/income.svg">${toPercentFormat(yearTime.percentProfit)}</span>`;
      }
    }

    lastUpdateDateTag.innerHTML = `Все активы <span>(${getUpdateTime(new Date().getTime())})</span>`;
    balanceTitle.innerHTML = `<span>Активы | Активы без НПД</span> <span>Ставка на сборе</span>`;
    balanceTag.innerHTML = `<span style="text-wrap: nowrap"><span id="balance">${toCurrencyFormat(balance)}</span><span style="opacity: .5;"> | </span><span id="balance--clean">${toCurrencyFormat(cleanBalance)}</span></span><span style="text-wrap: nowrap">${toPercentFormat(platformObj.data.average_interest_rate_30days)}</span>`;
    currencyAnimation("balance", currencyToFloat(cachedBalance), currencyToFloat($get("#balance").textContent), "hideArrow");
    currencyAnimation("balance--clean", currencyToFloat(cachedCleanBalance), currencyToFloat($get("#balance--clean").textContent));
    cachedBalance = balance;
    cachedCleanBalance = cleanBalance;
    updateProfit();

    if (timePeriod == "year" && investDays() >= 365) {
      statsSection.innerHTML = dataTextYearTime;
    } else if (timePeriod == "allTime") {
      statsSection.innerHTML = dataTextAllTime;
    }

    if (investDays() < 365) {
      await userStats;
      statsSection.innerHTML = dataTextAllTime;
      $get(".swap").textContent = getInvestDays();
      $get(".swap").style.textDecoration = "none";
      $get(".swap").style.userSelect = "auto";
      $get(".swap").style.cursor = "text";
    }

    if (!$get("#support-btn").clickListenerAdded) {
      $get("#support-btn").addEventListener("click", () => openModal("#support-section"));
    }

    // if (!userStatsObj.data.status.qualification.passed) {
    //   $get('#fmInvestAgreeText').textContent = $get('#smInvestAgreeText').textContent;
    // }

    // Сохранение данных
    const cache = {
      balanceTitle: balanceTitle.querySelectorAll("span")[0].textContent, // Текст заголовка активов (согласно настройкам)
      balanceText: balanceTag.querySelectorAll("span")[0].textContent, // Текст активов (согласно настройкам)

      balance: $get("#balance").textContent,
      cleanBalance: $get("#balance--clean").textContent,

      income: $get("#income").textContent,
      cleanIncome: $get("#income--clean").textContent,

      collectionIncomeTitle: balanceTitle.querySelectorAll("span")[1].textContent, // Текст заголовка ставки на сборе
      collectionIncomeText: balanceTag.querySelectorAll("span")[4].textContent, // Текст ставки на сборе

      incomeTitle: incomeTitle.querySelectorAll("span")[0].textContent, // Текст заголовка дохода (согласно настройкам)
      incomeText: $get(".income__currency").textContent, // Текст дохода (согласно настройкам)

      incomePercent: incomeTitle.querySelectorAll("span")[1].textContent, // Текст заголовка процентного дохода
      percentIncomeNum: $get(".income__percent").textContent, // Процентный доход

      updateTime: new Date().getTime(), // Текущее время

      qualification: userStatsObj.data.status.qualification.passed, // Статус квала
    };
    chrome.storage.local.set({ cacheJetlend: cache });
  }

  if (userStats.error) {
    lastUpdateDateTag.textContent = "Нет авторизации";
    $get(".main-section__stats").innerHTML = `<div style="margin: 64px 0px; position: relative; transform: translate(25%, 0%);">Авторизуйтесь на сайте</div>`;
  }
}

mainUpdateFunction();
setInterval(mainUpdateFunction, 60000);

chrome.storage.local.get("cacheJetlend", function (result) {
  const data = result.cacheJetlend;
  if (data) {
    lastUpdateDateTag.innerHTML = `Все активы <span style="position: relative">(${getUpdateTime(data.updateTime)}) <span class="load-spinner" title="Загузка актуальных данных..." style="cursor: pointer; width: 16px"></span></span>`;
    balanceTitle.innerHTML = `<span>${data.balanceTitle}</span> <span>${data.collectionIncomeTitle}</span>`;
    balanceTag.innerHTML = `<div><span class="load-opacity-animation">${data.balance}</span><span style="opacity: .5;"> | </span><span class="load-opacity-animation">${data.cleanBalance}</span></div> <span class="load-opacity-animation">${data.collectionIncomeText}</span>`;
    incomeTitle.innerHTML = `<span>${data.incomeTitle}</span> <span>${data.incomePercent}</span>`;

    $get(".income__currency").innerHTML = `<span class="load-opacity-animation">${data.income}</span><span style="opacity: .5;"> | </span><span class="load-opacity-animation">${data.cleanIncome}</span>`;
    $get(".income__percent").innerHTML = `<span class="load-opacity-animation"><img src="/img/income.svg">${data.percentIncomeNum}</span>`;

    cachedBalance = data.balance;
    cachedCleanBalance = data.cleanBalance;

    if (data.qualification) {
      $get("#fmInvestAgreeText").textContent = $get("#smInvestAgreeText").textContent;
    }
  }
});

// Обновление списка компаний (первичка)
async function updateFirstMarket() {
  fmCompanyUpdate = true;
  fmInvestCompanyArray = [];
  $get("#fm-numOfSortedCompany").textContent = `Загрузка...`;
  $get("#fm-btn-update").classList.add("display-none");
  $get("#fm-btn-show").classList.add("display-none");
  $get("#fm-btn-stop").classList.remove("display-none");
  $get("#market-companyAnaliz").classList.add("load-block-animation");

  await fmLoadLoans();

  $get("#fm-numOfSortedCompany").textContent = `Найдено: ${fmInvestCompanyArray.length} ${getZaimEnding(fmInvestCompanyArray.length)} `;
  $get("#fm-btn-update").classList.remove("display-none");
  if (fmInvestCompanyArray.length >= 1) {
    $get("#fm-btn-show").classList.remove("display-none");
  }
  $get("#fm-btn-stop").classList.add("display-none");

  const updateTotal = await fetchData("https://jetlend.ru/invest/api/requests/waiting");
  if (updateTotal.data) {
    $get("#market-numOfAllCompany").textContent = updateTotal.data.requests.length;
    $get("#market-companyAnaliz").classList.remove("load-block-animation");
  }
}
updateFirstMarket();

// Обновление списка компаний (первичка, резерв)
async function updateFirstMarketReserv() {
  fmrCompanyUpdate = true;
  fmCompanyUpdate = false;
  fmrInvestCompanyArray = [];
  $get("#fmr-numOfSortedCompany").textContent = `Загрузка...`;
  $get("#fmr-btn-update").classList.add("display-none");
  $get("#fmr-btn-show").classList.add("display-none");
  $get("#fmr-btn-stop").classList.remove("display-none");
  const res = await fetchData("https://jetlend.ru/invest/api/requests/waiting");

  if (res.data) {
    fmrInvestCompanyArray = res.data.requests.filter((obj) => obj.collected_percentage !== 100 /* Полоска сбора не заполнена (меньше 100%) */ && obj.investing_amount !== null /* Резервация */);
    $get("#fmr-numOfSortedCompany").textContent = `Загрузка... ()`;
    if (!fmrCompanyUpdate) {
      fmrCompanyUpdate = true;
      return;
    }
    $get("#fmr-numOfSortedCompany").textContent = `Загружено: ${fmrInvestCompanyArray.length} ${getZaimEnding(fmrInvestCompanyArray.length)}`;
    $get("#fmr-btn-update").classList.remove("display-none");
    $get("#fmr-btn-update").textContent = "Обновить";
    if (fmrInvestCompanyArray.length >= 1) {
      $get("#fmr-btn-show").classList.remove("display-none");
    }
    $get("#fmr-btn-stop").classList.add("display-none");
  }
}

// Обновление списка компаний (вторичка)
async function updateSecondMarket() {
  smCompanyUpdate = true;
  smInvestCompanyArray = [];
  $get("#sm-numOfSortedCompany").textContent = `Загрузка...`;
  $get("#sm-btn-update").classList.add("display-none");
  $get("#sm-btn-show").classList.add("display-none");
  $get("#sm-btn-stop").classList.remove("display-none");
  $get("#market-companyAnaliz").classList.add("load-block-animation");

  await smLoadLoans("popup", 0, 100);
  $get("#sm-numOfSortedCompany").textContent = `Найдено: ${smInvestCompanyArray.length} ${getZaimEnding(smInvestCompanyArray.length)}`;
  $get("#sm-btn-update").classList.remove("display-none");
  if (smInvestCompanyArray.length >= 1) {
    $get("#sm-btn-show").classList.remove("display-none");
  }
  $get("#sm-btn-stop").classList.add("display-none");

  const updateTotal = await fetchData("https://jetlend.ru/invest/api/exchange/loans?limit=1&offset=0");
  if (updateTotal.data) {
    $get("#market-numOfAllCompany").textContent = updateTotal.data.total;
    $get("#market-companyAnaliz").classList.remove("load-block-animation");
  }
}

// Распределение средств (первичка)
$get("#firstMarketSubmit").addEventListener("click", function () {
  if ($get("#fmInvestAgree").checked && valueToInt(fmInvestSum.value) <= freeBalance && valueToInt(fmInvestSum.value) >= 100 && !$get("#fm-numOfSortedCompany").textContent.includes("Загрузка...") && freeBalance >= 100 && fmInvestCompanyArray.length >= 1) {
    chrome.storage.local.set({
      fmInvest: {
        array: fmInvestCompanyArray,
        sum: valueToInt(fmInvestSum.value),
        sumAll: currencyToFloat(fmInvestSumAll.value),
        loanMaxSum: currencyToFloat(fmStopLoanSum.value),
        companyMaxSum: currencyToFloat(fmStopCompanySum.value),
        mode: "manual",
      },
    });
    // chrome.tabs.create({ url: "https://jetlend.ru/invest/v3/?state=login" });
    chrome.windows.create({ url: "https://jetlend.ru/invest/v3/?state=login", type: "popup", focused: true });
  }
});

// Распределение средств (вторичка)
$get("#secondMarketSubmit").addEventListener("click", function () {
  if ($get("#smInvestAgree").checked && valueToInt(smInvestSum.value) <= freeBalance && valueToInt(smInvestSum.value) >= 100 && !$get("#sm-numOfSortedCompany").textContent.includes("Загрузка...") && freeBalance >= 100 && smInvestCompanyArray.length >= 1) {
    chrome.storage.local.set({
      smInvest: {
        array: smInvestCompanyArray,
        sum: valueToInt(smInvestSum.value),
        sumAll: currencyToFloat(smInvestSumAll.value),
        minPrice: valueToPercent(smPriceFrom.value),
        maxPrice: valueToPercent(smPriceTo.value),
        ytmMin: valueToPercent(smRateFrom.value),
        ytmMax: valueToPercent(smRateTo.value),
        loanMaxSum: currencyToFloat(smStopLoanSum.value),
        companyMaxSum: currencyToFloat(smStopCompanySum.value),
        mode: "manual",
      },
    });
    // chrome.tabs.create({ url: "https://jetlend.ru/invest/v3/?state=login", active: true });
    chrome.windows.create({ url: "https://jetlend.ru/invest/v3/?state=login", type: "popup", focused: true });
  }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.data === "Распределение средств заверешено") {
    $get("#fm-numOfSortedCompany").textContent = "";
    $get("#fm-btn-show").classList.add("display-none");
    $get("#sm-numOfSortedCompany").textContent = "";
    $get("#sm-btn-show").classList.add("display-none");
    fmInvestCompanyArray = [];
    smInvestCompanyArray = [];
    closeInvestPage();
    mainUpdateFunction();
  }
});
