$("#version").innerHTML = version;

(async function () {
  await mainUpdateFunction();
})();
setInterval(async () => await mainUpdateFunction(), 60000);

// Загрузка кэша
async function loadCache() {
  const data = await getCache("cacheJetlend");
  $(".lastUpdateDate").innerHTML = `Все активы <span style="position: relative">(${getUpdateTime(data.updateTime ?? new Date().getTime())}) <span class="load-spinner" title="Загузка актуальных данных..." style="cursor: pointer; width: 16px"></span></span>`;
  $(".balance__title").innerHTML = `<span>${data.balanceTitle ?? ""}</span> <span>${data.collectionIncomeTitle ?? ""}</span>`;
  $(".balance__value").innerHTML = `<div><span class="load-opacity-animation">${data.balance ?? "-"}</span><span style="opacity: .5;"> | </span><span class="load-opacity-animation">${data.cleanBalance ?? "-"}</span></div> <span class="load-opacity-animation">${data.collectionIncomeText ?? "-"}</span>`;
  $(".income__title").innerHTML = `<span>${data.incomeTitle ?? ""}</span> <span>${data.incomePercent ?? ""}</span>`;

  $(".income__currency").innerHTML = `<span class="load-opacity-animation">${data.income ?? ""}</span><span style="opacity: .5;"> | </span><span class="load-opacity-animation">${data.cleanIncome ?? ""}</span>`;
  $(".income__percent").innerHTML = `<span class="load-opacity-animation"><img src="/img/income.svg">${data.percentIncomeNum ?? ""}</span>`;
  cache.balance = data.balance;
  cache.cleanBalance = data.cleanBalance;

  const activeInvestPreset = await getCache("investPreset_active", 0);
  user.activePreset = activeInvestPreset;
  $("#presets").querySelectorAll("p")[activeInvestPreset].classList.add("btn-small--active");

  for (let i = 0; i < 5; i++) {
    const cache = await getCache(`investPreset_${i}`);
    const presetName = cache.presetName || `Пресет ${i + 1}`;
    $("#presets").querySelectorAll("p")[i].textContent = presetName;
    $("#autoInvest_preset").querySelectorAll("option")[i].textContent = presetName;
  }

  if (data.qualification) {
    $("#fmInvestAgreeText").textContent = $("#smInvestAgreeText").textContent;
  }

  // const allCacheSize = await getCacheSize();
  const historySize = await getCacheSize("investHistory");

  // $("#clean_cache").textContent += ` (${byteToKB(allCacheSize - historySize)})`;
  $("#clean_history").textContent += ` (${byteToKB(historySize)} KB)`;

  const updateHistory = await fetchData("/updates.json");
  const versionsArray = updateHistory.data.versions;
  // Загрузка истории обновлений
  const listUpdate = $("#update-history-ul");
  versionsArray.forEach((version) => {
    const listItem = $create("div", ["list-element", "contrast-bg"]);
    listItem.innerHTML = `<h2>v${version.version_number}</h2> <h4 style="opacity: .5">${version.update_date}</h4>`;
    if (version.new) (listItem.innerHTML += `<p class="badge bg-green">Новое</p>`) && version.new.forEach((add) => (listItem.innerHTML += `<p>- ${add}</з>`));
    if (version.changes) (listItem.innerHTML += `<p class="badge bg-cian">Изменения</p>`) && version.changes.forEach((change) => (listItem.innerHTML += `<p>- ${change}</p>`));
    if (version.fixed) (listItem.innerHTML += `<p class="badge bg-blue">Исправления</p>`) && version.fixed.forEach((fixed) => (listItem.innerHTML += `<p>- ${fixed}</p>`));
    listUpdate.appendChild(listItem);
  });
  const helloMsg = await getCache("helloMsg");
  if (!helloMsg || helloMsg.version !== version) {
    openModal("#update-history");
    await updateCache("helloMsg", { version: version });
  }
}

// Загрузка настроек
async function loadSetting() {
  const settings = await getCache("settings");
  if (settings.marketMode === "sm") await marketSwap();
  time_setting.value = settings.timePeriod ?? "all";
  theme_setting.value = settings.theme ?? 0;
  updateVisual_setting.checked = settings.updateVisual ?? false;
  badgeMode_setting.value = settings.badgeMode ?? 0;
  autoInvest_mode.value = settings.autoInvestMode ?? 0;
  autoInvest_preset.value = settings.autoInvestPreset ?? "def";
  autoInvest_safe.value = settings.autoInvestSafe ?? 0;
  autoInvest_interval.value = settings.autoInvestInterval ?? 6;
  setTheme(theme_setting.value);
}
(async function () {
  await loadCache();
  await loadSetting();
})();

$on("click", "#stats__open", function () {
  if ($(".stats-section").style.maxHeight === "100%" || (!this.style.cssText && window.innerWidth >= 768)) {
    this.style.transform = "scaleY(-1)";
    $(".stats-section").style.maxHeight = "0px";
  } else {
    this.style.transform = "scaleY(1)";
    $(".stats-section").style.maxHeight = "100%";
  }
});

const formsElements = $$(".filterInput");
formsElements.forEach((e) =>
  e.addEventListener("change", async function () {
    fmCompanyUpdate = false;
    fmrCompanyUpdate = false;
    smCompanyUpdate = false;
    if (this.id.includes("Check")) {
      await updateCache(`investPreset_${user.activePreset}`, { [this.id]: this.checked });
    } else {
      await updateCache(`investPreset_${user.activePreset}`, { [this.id]: this.value });
    }
    const filters = await getCache(`investPreset_${user.activePreset}`);
    await setCache("investSettings", filters);
  })
);

// Загрузка фильтров
async function loadFilters() {
  const activePreset = await getCache("investPreset_active", 0);
  const filters = await getCache(`investPreset_${activePreset}`);
  const keys = Object.keys(filters);
  const formsIds = Array.from(formsElements).map((e) => e.getAttribute("id"));
  const diff = formsIds.filter((x) => !keys.includes(x));
  diff.forEach((id) => {
    if (id.includes("Check")) {
      $("#" + id).checked = false;
    } else {
      $("#" + id).value = "";
    }
  });
  keys
    .filter((key) => key !== "presetName")
    .forEach((key) => {
      const formFilter = $("#" + key);
      if (key.includes("Check")) {
        formFilter.checked = filters[key];
      } else {
        formFilter.value = filters[key];
      }
    });
}
(async function () {
  await loadFilters();
})();

const presetsElements = $("#presets").querySelectorAll("p");
presetsElements.forEach((preset, index) => {
  preset.addEventListener("click", async function () {
    presetsElements.forEach((btn) => btn.classList.remove("btn-small--active"));
    await setCache("investPreset_active", index);
    await loadFilters();
    const filters = await getCache(`investPreset_${index}`);
    await setCache("investSettings", filters);
    user.activePreset = index;
    this.classList.add("btn-small--active");
    fmCompanyUpdate = false;
    fmrCompanyUpdate = false;
    smCompanyUpdate = false;
  });
  preset.addEventListener("contextmenu", function (event) {
    event.preventDefault();
    this.setAttribute("contentEditable", "true");
    this.focus();
  });
  preset.addEventListener("blur", function () {
    this.contentEditable = false;
  });
  preset.addEventListener("input", async function () {
    await updateCache(`investPreset_${index}`, { presetName: this.textContent });
    $("#autoInvest_preset").querySelectorAll("option")[index].textContent = this.textContent;
  });
});

document.addEventListener("mouseover", function (e) {
  let tooltipHtml = e.target.closest(".tooltip");
  if (!tooltipHtml) {
    return;
  }
  let tooltipContent = tooltipHtml.querySelector(".tooltip-content");
  let tooltipElem = $create("div", ["tooltip-content"]);
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

document.addEventListener("click", async function (e) {
  // Таргет урл
  if (e.target.classList.contains("target-url")) {
    e.preventDefault();
    const ensureHttpPrefix = (url) => (!/^https?:\/\//i.test(url) ? "http://" + url : url);
    chrome.windows.create({ url: ensureHttpPrefix(e.target.href), type: "popup", focused: true });
    return;
  }
  // Модалка
  if (e.target.classList.contains("modal-container")) return closeModal("#" + e.target.id);
  // Модалка №2
  if (e.target.classList.contains("modal__btn-close")) return closeModal("#" + e.target.parentNode.parentNode.parentNode.id);
  // Открыть историю обновлений
  if (e.target.classList.contains("open-updates")) return openModal("#update-history");
  // Открыть поддержку проекта
  if (e.target.classList.contains("open-support")) return openModal("#support-section");
  // Рассчитать XIRR
  if (e.target.id.includes("xirr-all")) return await printXIrr("all");
  // Рассчитать XIRR
  if (e.target.id.includes("xirr-year")) return await printXIrr("year");
  // Открыть события
  if (e.target.closest(".open-events")) return openModal("#events");
  // Открыть портфель
  if (e.target.closest(".open-portfolio")) return openModal("#portfolio");
  // Открыть аналитику
  // if (e.target.closest(".open-analytics")) return openModal("#analytics");
  // Открыть настройки
  if (e.target.closest(".open-settings")) return openModal("#settings");
  // Открыть распределение
  // if (e.target.closest(".open-events")) return openModal("#events");
});

$on("click", ".invest-section__btn-open", openInvestPage);
$on("click", ".invest-section__btn-close", closeInvestPage);

$on("click", "#event-transactions__open", transactionsShow);
$on("click", "#event-invests__open", investHistoryShow);

$on("click", "#portfolio-all__open", portfolioAllShow);
$on("click", "#npl1__open", () => nplShow(1));
$on("click", "#npl15__open", () => nplShow(15));
$on("click", "#restructs__open", restructsShow);
$on("click", "#defaults__open", defaultsShow);
$on("click", "#problemLoans__open", problemLoansShow);

// $on('click', "#revenue__open", revenueShow);

$on("change", "#time_setting", async (e) => await updateCache("settings", { timePeriod: e.target.value }));
$on("change", "#theme_setting", async (e) => {
  await updateCache("settings", { theme: e.target.value });
  setTheme(e.target.value);
});
$on("change", "#updateVisual_setting", async (e) => await updateCache("settings", { updateVisual: e.target.checked }));

$on("change", "#autoInvest_mode", async (e) => await updateCache("settings", { autoInvestMode: e.target.value }));
$on("change", "#autoInvest_preset", async (e) => await updateCache("settings", { autoInvestPreset: e.target.value }));
$on("change", "#autoInvest_safe", async (e) => await updateCache("settings", { autoInvestSafe: e.target.value }));
$on("change", "#autoInvest_interval", async (e) => await updateCache("settings", { autoInvestInterval: e.target.value }));
$on("change", "#badgeMode_setting", async (e) => await updateCache("settings", { badgeMode: e.target.value }));

$on("click", ".open-newTab", () => chrome.tabs.create({ url: chrome.runtime.getURL("html/popup.html") }));

$on("click", "#fm-btn-update", updateFirstMarket);
$on("click", "#fm-btn-show", () => {
  openModal("#fm-list");
  fmCompanyShow(fmInvestCompanyArray, "#fm-list-ul");
});
$on("click", "#fm-btn-stop", () => (fmCompanyUpdate = false));

$on("click", "#fmr-btn-update", updateFirstMarketReserv);
$on("click", "#fmr-btn-show", () => {
  openModal("#fmr-list");
  fmCompanyShow(fmrInvestCompanyArray, "#fmr-list-ul");
});
$on("click", "#fmr-btn-stop", () => (fmrCompanyUpdate = false));

$on("click", "#sm-btn-update", updateSecondMarket);
$on("click", "#sm-btn-show", () => {
  openModal("#sm-list");
  smCompanyShow(smInvestCompanyArray, "#sm-list-ul");
});
$on("click", "#sm-btn-stop", () => (smCompanyUpdate = false));

$on("click", "#marketMode", async () => await marketSwap());
$on("click", "#checkCompany__open", () => openModal("#checkCompany__section"));
$on("click", "#checkCompany__btn", () => checkCompany());
$on("click", "#blackList__open", async () => {
  openModal("#blackList__section");
  await blackListShow("#blackList__ul", await getCache("blackList", []));
});
$on("click", "#blackListAddCompany__btn", async () => await addBlackList("comp"));
$on("click", "#blackListAddLoan__btn", async () => await addBlackList("loan"));

$on("click", "#export_cache", copyToClipboard);
$on("click", "#import_cache", async () => await importDataToStorage());
$on("click", "#clean_history", async (e) => {
  await setCache("investHistory", []);
  e.target.textContent = "История очищена (0 KB)";
  e.target.classList.toggle("btn-danger");
  setTimeout(() => {
    e.target.classList.toggle("btn-danger");
    e.target.textContent = "Очистить историю распределения (0 KB)";
  }, 2500);
});

async function importDataToStorage() {
  const clipboardText = await navigator.clipboard.readText();
  const data = JSON.parse(clipboardText);
  chrome.storage.local.set(data, () => {
    if (chrome.runtime.lastError) {
      alert("Ошибка импорта данных: ", chrome.runtime.lastError);
    } else {
      alert("Данные успешно загружены! Необходима перезагрузка расширения.");
      window.close();
    }
  });
}

function copyToClipboard() {
  chrome.storage.local.get(null, (items) => {
    const str = JSON.stringify(items);
    navigator.clipboard
      .writeText(str)
      .then(() => {
        alert("Данные успешно скопированы!");
      })
      .catch((err) => {
        alert("Ошибка при копировании данных: ", err);
      });
  });
}

async function transactionsShow() {
  $("#events__btn-section")
    .querySelectorAll(".btn-small")
    .forEach((btn) => btn.classList.remove("btn-small--active"));
  $("#event-transactions__open").classList.add("btn-small--active");
  const list = $("#events__list");
  printSpinLoad(list, 32);
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
      const listItem = $create("div", ["list-element", "contrast-bg"]);
      listItem.innerHTML = createListElement(element);
      list.appendChild(listItem);
    });
  } else {
    list.textContent = transactionsData.error;
  }

  function createListElement(element) {
    function setColor(num) {
      if (num > 0) {
        return "var(--jle-green)";
      } else {
        return "var(--jle-red)";
      }
    }
    return `
    <section class="flex">
      ${element.preview_small_url ? `<img class="list-element__img" src="https://jetlend.ru${element.preview_small_url}">` : ""}
      <div>
        <div style="font-size: 14.5px; font-weight:600; z-index: 1; display: inline-block;">${element.company || "Прочее"}</div>
        <div class="fz-14 mt-5">${operations[element.operation_type] ? operations[element.operation_type] : element.operation_type}</div>
      </div>
      <div class="flex flex-col items-end fz-14" style="margin-left: auto;">
        <div style="font-weight: 600; text-wrap: nowrap;">
          ${element.income && element.income !== 0.0 ? `${toCurrencyFormat(element.income)}` : ""}
        </div>
        <div class="mt-5" style="color: var(--jle-red); font-weight: 600; text-wrap: nowrap;">
          ${element.expense && element.expense !== 0.0 ? (element.expense > 0 ? `-${toCurrencyFormat(element.expense)}` : `${toCurrencyFormat(element.expense)}`) : ""}
        </div> 
        <div class="mt-5" style="color: ${setColor(element.revenue)}; font-weight: 600; text-wrap: nowrap;">
          ${element.revenue && element.revenue !== 0.0 ? (element.revenue > 0 ? `+${toCurrencyFormat(element.revenue)}` : `${toCurrencyFormat(element.revenue)}`) : ""}
        </div> 
      </div>
    </section>
    `;
  }
}

// История распределения
async function investHistoryShow() {
  $("#events__btn-section")
    .querySelectorAll(".btn-small")
    .forEach((btn) => btn.classList.remove("btn-small--active"));
  $("#event-invests__open").classList.add("btn-small--active");
  const list = $("#events__list");
  printSpinLoad(list, 32);
  const history = await getCache("investHistory", []);
  if (!history.length) {
    list.innerHTML = "История пуста.";
    return;
  }
  list.innerHTML = "";
  // Список не более чем из 200 элементов
  for (let i = 0; i < Math.min(history.length, 200); i++) {
    const listItem = $create("div", ["list-element", "contrast-bg"]);
    listItem.innerHTML = createListElement(history[i], "investHistory");
    list.appendChild(listItem);
  }
}

async function portfolioAllShow() {
  $("#portfolio__btn-section")
    .querySelectorAll(".btn-small")
    .forEach((btn) => btn.classList.remove("btn-small--active"));
  $("#portfolio-all__open").classList.add("btn-small--active");
  const list = $("#portfolio__list");
  printSpinLoad(list, 32);
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
        <div class="tooltip" style="background: var(--jle-orange); width: ${(delayed.length / allCompays.data.total) * 100}%">
          <template class="tooltip-content">
            Задержки.
          </template>
        </div>
        <div class="tooltip" style="background: var(--jle-red); width: ${(defaulted.length / allCompays.data.total) * 100}%">
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
  $("#portfolio__btn-section")
    .querySelectorAll(".btn-small")
    .forEach((btn) => btn.classList.remove("btn-small--active"));
  $(`#npl${nplNum}__open`).classList.add("btn-small--active");
  const list = $("#portfolio__list");
  printSpinLoad(list, 32);
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
          (<b class="tooltip">${toPercentFormat(debtSum / user.cleanBalance)}
            <template class="tooltip-content"><b>${toPercentFormat(debtSum / user.balance)}</b>, если делить на баланс с НПД.</template>
          </b> от портфеля).
        </p>
        <p>Сумма всех задержек: <b class="tooltip">${toCurrencyFormat(res.data.aggregation.principal_debt)}
            <template class="tooltip-content">Сумма инвестиций: <b>${toCurrencyFormat(res.data.aggregation.purchased_amount)}</b>.</template>
          </b> 
          (<b class="tooltip">${toPercentFormat(res.data.aggregation.principal_debt / user.cleanBalance)}
            <template class="tooltip-content"><b>${toPercentFormat(res.data.aggregation.principal_debt / user.balance)}</b>, если делить на баланс с НПД.</template>
          </b> от портфеля).
        </p>
        <p>Выплаченные проценты: <b>${toCurrencyFormat(res.data.aggregation.paid_interest)}</b>.</p>
        <p>Выплаченные пени: <b>${toCurrencyFormat(res.data.aggregation.paid_fine)}</b>.</p>
        <p>НПД: <b>${toCurrencyFormat(res.data.aggregation.nkd)}</b>.</p>
      </div>`;
    sorted.forEach((element) => {
      const listItem = $create("div", ["list-element", "contrast-bg"]);
      listItem.innerHTML = createListElement(element, "npls");
      list.appendChild(listItem);
    });
  } else {
    list.textContent = transactionsData.error;
  }
}

async function restructsShow() {
  $("#portfolio__btn-section")
    .querySelectorAll(".btn-small")
    .forEach((btn) => btn.classList.remove("btn-small--active"));
  $("#restructs__open").classList.add("btn-small--active");
  const list = $("#portfolio__list");
  printSpinLoad(list, 32);
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
        (<b class="tooltip">${toPercentFormat(res.data.aggregation.principal_debt / user.cleanBalance)}
          <template class="tooltip-content"><b>${toPercentFormat(res.data.aggregation.principal_debt / user.balance)}</b>, если делить на баланс с НПД.</template>
        </b> от портфеля).
      </p>
      <p>Выплаченные проценты: <b>${toCurrencyFormat(res.data.aggregation.paid_interest)}</b>.</p>
      <p>Выплаченные пени: <b>${toCurrencyFormat(res.data.aggregation.paid_fine)}</b>.</p>
      <p>НПД: <b>${toCurrencyFormat(res.data.aggregation.nkd)}</b>.</p>
    </div>`;
    sorted.forEach((element) => {
      const listItem = $create("div", ["list-element", "contrast-bg"]);
      listItem.innerHTML = createListElement(element, "restructs");
      list.appendChild(listItem);
    });
  } else {
    list.textContent = transactionsData.error;
  }
}

async function defaultsShow() {
  $("#portfolio__btn-section")
    .querySelectorAll(".btn-small")
    .forEach((btn) => btn.classList.remove("btn-small--active"));
  $("#defaults__open").classList.add("btn-small--active");
  const list = $("#portfolio__list");
  printSpinLoad(list, 32);
  const cache = await getCache("defaults", []);
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

    await setCache("defaults", cache);

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
      const listItem = $create("div", ["list-element", "contrast-bg"]);
      listItem.innerHTML = createListElement(element, "defaults");
      list.appendChild(listItem);
    });
  } else {
    list.textContent = transactionsData.error;
  }
}

async function problemLoansShow() {
  $("#portfolio__btn-section")
    .querySelectorAll(".btn-small")
    .forEach((btn) => btn.classList.remove("btn-small--active"));
  $("#problemLoans__open").classList.add("btn-small--active");
  const list = $("#portfolio__list");
  printSpinLoad(list, 32);

  const url = "https://jetlend.ru/invest/api/portfolio/loans?aggregate=purchased_amount%2Cpaid_interest%2Cpaid_fine%2Cprincipal_debt%2Cnkd&filter=%5B%7B%22values%22%3A%5B%22active%22%5D%2C%22field%22%3A%22status%22%7D%5D";
  const activeLoans = await fetchChunks(url);

  const problemLoans = await loadProblemLoans();

  const userProblemLoans = activeLoans.data.data.filter((loan) => loan.company.includes(problemLoans));

  if (!userProblemLoans.length) {
    list.textContent = "Нет проблемных займов.";
    return;
  }
  list.innerHTML = `<div class="contrast-bg" style="margin-bottom: 12px">
    <p>Активные в портфеле займы, заёмщики которых имеют активную просрочку / реструктуризацию по другим займам.</p>
  </div>`;
  userProblemLoans.forEach((loan) => {
    const listItem = $create("div", ["list-element", "contrast-bg"]);
    listItem.innerHTML = createListElement(loan, "problems");
    list.appendChild(listItem);
  });
}

// Аналитика-поступлений
// async function revenueShow() {
//   btnsSwapActive("#analytics__btn-section", "#revenue__open");

//   const list = $("#analytics__list");
//   printSpinLoad(list, 32);
//   const cache = await getCache("defaults", []);
//   const url = "https://jetlend.ru/invest/api/portfolio/loans?aggregate=purchased_amount%2Cpaid_interest%2Cpaid_fine%2Cprincipal_debt%2Cnkd&filter=%5B%7B%22values%22%3A%5B%22default%22%5D%2C%22field%22%3A%22status%22%7D%5D";
//   const res = await fetchChunks(url);
//   if (res.data) {
//     // const obj1 = [{ date: 100 }, { date: 110 }, { date: 120 }];
//     // const obj2 = [
//     //   { date: 90, id: 1, money: 100 },
//     //   { date: 105, id: 2, money: 202 },
//     //   { date: 110, id: 3, money: 33 },
//     //   { date: 115, id: 4, money: 404 },
//     //   { date: 121, id: 5, money: 1000 },
//     // ];
//     // for (let elem2 of obj2) {
//     //   for (let elem1 of obj1) {
//     //     const DAY = 10;
//     //     if (elem1.date <= elem2.date && elem1.date + 10 > elem2.date) {
//     //       elem1.money ? (elem1.money += elem2.money) : (elem1.money = elem2.money);
//     //     }
//     //   }
//     // }

//     // https://jetlend.ru/invest/api/portfolio/charts/revenue
//     let companysArr = res.data.data;
//     if (!companysArr.length) {
//       list.textContent = "Нет дефолтных займов.";
//       return;
//     }
//     async function memoDefaultsDate(company) {
//       const index = cache.findIndex((cacheElem) => cacheElem.id === company.loan_id);
//       if (index !== -1) {
//         company.default_date = cache[index].default_date;
//         company.npl = cache[index].npl;
//         return;
//       }
//       const events = await fetchData(`https://jetlend.ru/invest/api/requests/${company.loan_id}/events`);
//       const defaultEvent = events.data.events.find((obj) => obj.event_type === "default");
//       company.default_date = defaultEvent.date; // Дата дефолта
//       if (company.last_payment_date === null) {
//         company.last_payment_date = company.date;
//       }
//       company.npl = dateDiff(company.last_payment_date, company.default_date);
//       cache.push({ id: company.loan_id, default_date: company.default_date, npl: company.npl });
//       return;
//     }
//     for (company of companysArr) {
//       await memoDefaultsDate(company);
//     }
//     chrome.storage.local.set({ defaults: cache });
//     list.innerHTML = `
//     <div class="contrast-bg flex flex-col">
//       <div class="flex justify-between" style="margin-bottom: 12px">
//         <div>20.10.2020</div>
//         <div>22.12.2022</div>
//       </div>
//       <div style="width: 50px; align-self: start; text-wrap: nowrap; justify-self: flex-end">50 000,50 R</div>
//       <hr style="border: none; border-top: 2px dashed var(--jle-red)" />
//       <div class="flex items-end" style="gap: 4px">
//         <div class="blackout" style="height: 10px; width: 100%; background: var(--jle-green)"></div>
//         <div class="blackout" style="height: 25px; width: 100%; background: var(--jle-green)"></div>
//         <div class="blackout" style="height: 20px; width: 100%; background: var(--jle-green)"></div>
//       </div>
//       <div class="flex items-start" style="gap: 4px">
//         <div class="blackout" style="height: 10px; width: 100%; background: var(--jle-gray)"></div>
//         <div class="blackout" style="height: 25px; width: 100%; background: var(--jle-gray)"></div>
//         <div class="blackout" style="height: 20px; width: 100%; background: var(--jle-gray)"></div>
//       </div>
//       <hr style="border: none; border-top: 2px dashed var(--jle-red)" />
//       <div style="width: 50px; align-self: start; text-wrap: nowrap">-50 000,50 R</div>
//     </div>
//     `;
//     companysArr.forEach((element) => {
//       // const listItem = $create('div', ["list-element", "contrast-bg"])
//       // listItem.innerHTML = createListElement(element);
//       // list.appendChild(listItem);
//     });
//   } else {
//     list.textContent = transactionsData.error;
//   }
// }

async function checkCompany() {
  if (!checkCompany__input.value) {
    return;
  }
  $("#checkCompany__list").innerHTML = "";
  printSpinLoad($("#checkCompany__spin"), 32);
  const companysArr = checkCompany__input.value.split(" ");
  checkCompany__input.value = null;
  const fm = await fetchData("https://jetlend.ru/invest/api/requests/waiting");
  const sm = await fetchChunks("https://jetlend.ru/invest/api/exchange/loans?");
  for (const company of companysArr) {
    const res = await checkingCompany(parseInt(company.replace(/\D/g, "")), fm, sm);
    $("#checkCompany__list").innerHTML += res;
  }
  $("#checkCompany__spin").innerHTML = "";
}

async function addBlackList(type) {
  const cache = await getCache("blackList", []);
  const loansArr = blackList__input.value.split(" ");
  for (const loanId of loansArr) {
    id = parseInt(loanId.replace(/\D/g, ""));
    if (cache.some((e) => e.id === id && e.type === "comp")) continue;
    if (cache.some((e) => e.id === id && e.type === "loan" && type === "comp")) {
      const index = cache.findIndex((e) => e.id === id && e.type === "loan");
      cache[index].type = "comp";
    } else if (id && id !== NaN && !cache.some((e) => e.id === id && e.type === type)) cache.push({ id, type });
  }
  await setCache("blackList", cache);
  blackList__input.value = null;
  await blackListShow("#blackList__ul", cache);
}

function fmCompanyShow(arr, blockId) {
  const removeElement = (index) => arr.splice(index, 1);
  const list = $(blockId);
  list.innerHTML = "";
  arr.forEach((company, index) => {
    const listItem = $create("div", ["list-element", "contrast-bg"]);
    listItem.innerHTML = createListElement(company, "fm");
    if (arr !== fmrInvestCompanyArray) {
      const buttons = $create("div", ["btn-small__wrapper"]);
      const removeBtn = $create("span", ["btn-small", "flex-1", "m-0", "mt-8"], "width: 100%", "Удалить");
      removeBtn.onclick = function () {
        removeElement(index);
        if (!arr.length) closeModal("#fm-list");
        updateFmArrayText();
        fmCompanyShow(arr, blockId);
      };
      const detailsBtn = $create("span", ["btn-small", "flex-1", "m-0", "mt-8"], null, "Подробнее");
      detailsBtn.onclick = async function () {
        printSpinLoad(listItem, 64, "marketLoad");
        const res = await fetchData(`https://jetlend.ru/invest/api/requests/${company.id}/details`);
        if (res.data) {
          listItem.innerHTML = createListElement(company, "fm", res.data.data.details);
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
  $("#fm-numOfSortedCompany").textContent = `Найдено: ${fmInvestCompanyArray.length} ${getZaimEnding(fmInvestCompanyArray.length)} `;
  $("#fm-btn-update").classList.remove("display-none");
  fmInvestCompanyArray.length > 0 ? $("#fm-btn-show").classList.remove("display-none") : $("#fm-btn-show").classList.add("display-none");
  $("#fm-btn-stop").classList.add("display-none");
}

function updateSmArrayText() {
  $("#sm-numOfSortedCompany").textContent = `Найдено: ${smInvestCompanyArray.length} ${getZaimEnding(smInvestCompanyArray.length)} `;
  $("#sm-btn-update").classList.remove("display-none");
  smInvestCompanyArray.length > 0 ? $("#sm-btn-show").classList.remove("display-none") : $("#sm-btn-show").classList.add("display-none");
  $("#sm-btn-stop").classList.add("display-none");
}

function smCompanyShow(arr, blockId) {
  const removeElement = (index) => arr.splice(index, 1);
  const list = $(blockId);
  list.innerHTML = "";
  arr.forEach((company, index) => {
    const listItem = $create("div", ["list-element", "contrast-bg"]);
    listItem.innerHTML = createListElement(company, "sm");
    const buttons = $create("div", ["btn-small__wrapper"]);
    const removeBtn = $create("span", ["btn-small", "flex-1", "m-0", "mt-8"], "width: 100%", "Удалить");
    removeBtn.onclick = function () {
      removeElement(index);
      if (!arr.length) closeModal("#sm-list");
      updateSmArrayText();
      smCompanyShow(arr, blockId);
    };
    const detailsBtn = $create("span", ["btn-small", "flex-1", "m-0", "mt-8"], null, "Подробнее");
    detailsBtn.onclick = async function () {
      printSpinLoad(listItem, 64, "marketLoad");
      const res = await fetchData(`https://jetlend.ru/invest/api/requests/${company.loan_id}/details`);
      if (res.data) {
        listItem.innerHTML = createListElement(company, "sm", res.data.data.details);
        listItem.appendChild(removeBtn);
      }
    };
    listItem.appendChild(buttons);
    buttons.appendChild(detailsBtn);
    buttons.appendChild(removeBtn);
    list.appendChild(listItem);
  });
}

async function blackListShow(blockId, arr = []) {
  const removeElement = async (index) => {
    arr.splice(index, 1);
    await setCache("blackList", arr);
  };
  const list = $(blockId);
  async function processCompanies(arr) {
    printSpinLoad(list, 32);
    let wasUpdate = false;
    for (const company of arr) {
      if (!company.term) {
        try {
          const info = await fetchData(`https://jetlend.ru/invest/api/requests/${company.id}/info`);
          const { loan_name, term, loan_rating, borrower_rating, interest_rate, loan_isin, preview_small_url } = info.data.data;
          Object.assign(company, { loan_name, term, loan_rating, borrower_rating, interest_rate, loan_isin, preview_small_url, company });
          company.company = info.data.data.company;
          wasUpdate = true;
        } catch (error) {
          arr.splice(arr.indexOf(company), 1);
          wasUpdate = true;
          continue;
        }
      }
    }
    if (wasUpdate) {
      await setCache("blackList", arr);
      arr = await getCache("blackList", []);
      blackListShow(blockId, arr);
    }
  }
  await processCompanies(arr);
  list.innerHTML = "";

  arr.forEach((company, index) => {
    const listItem = $create("div", ["list-element", "contrast-bg"]);
    listItem.innerHTML = createListElement(company, "bl");
    const buttons = $create("div", ["btn-small__wrapper"]);
    const removeBtn = $create("span", ["btn-small", "flex-1", "m-0", "mt-8"], "width: 100%", "Удалить");
    removeBtn.onclick = async function () {
      await removeElement(index);
      if (!arr.length) closeModal("#blackList__section");
      (async function () {
        await blackListShow(blockId, arr);
      })();
    };
    const detailsBtn = $create("span", ["btn-small", "flex-1", "m-0", "mt-8"], null, "Подробнее");
    detailsBtn.onclick = async function () {
      printSpinLoad(listItem, 64, "marketLoad");
      const res = await fetchData(`https://jetlend.ru/invest/api/requests/${company.id}/details`);
      if (res.data) {
        listItem.innerHTML = createListElement(company, "bl", res.data.data.details);
        listItem.appendChild(removeBtn);
      }
    };
    listItem.appendChild(buttons);
    buttons.appendChild(detailsBtn);
    buttons.appendChild(removeBtn);
    list.appendChild(listItem);
  });
}

async function mainUpdateFunction() {
  printSpinLoad(".lastUpdateDate", 16);
  for (let span of $$(".invest-section__title-sum")) {
    span.textContent = `(Загрузка...)`;
  }
  const userStatsUrl = "https://jetlend.ru/invest/api/account/details";
  const userDataUrl = "https://jetlend.ru/invest/api/account/info";
  const platformStatsUrl = "https://jetlend.ru/invest/api/public/stats";
  const amountCompanyUrl = "https://jetlend.ru/invest/api/portfolio/distribution/overview";

  try {
    const [userStats, userData, platformStats, amountCompany] = await Promise.all([fetchData(userStatsUrl), fetchData(userDataUrl), fetchData(platformStatsUrl), fetchData(amountCompanyUrl)]);

    const userStatsObj = userStats.data;
    const platformObj = platformStats.data;
    const statAllTime = userStatsObj.data.summary;
    const statYearTime = userStatsObj.data.summary_year;
    const balanceStats = userStatsObj.data.balance;

    user._userStats = userStatsObj.data;

    user.id = userData.data.data.id; // Айди юзера
    user.register_date = userData.data.data.register_date; // Дата регистрации
    user.companies_count = amountCompany.data.data.companies_count; // Количество компаний
    user.qualification = userStats.data.data.status.qualification.passed; // Статус квала
    user.balance = balanceStats.total; // Баланс
    user.npd = balanceStats.nkd; // НПД
    user.freeBalance = balanceStats.free; // Свободные средства
    user.year_gross = userStats.data.data.yield_rate.year_gross; // Доходность Гаусса
    user.year_gross_xirr = userStats.data.data.yield_rate.year_gross_xirr; // Доходность Гаусса XIRR
    // user.xirrData = xirrData.data.data; // Данные для подсчета xirr (пополнения, выводы)

    allTime.percentProfit = statAllTime.yield_rate; // Доходность в процентах за всё время
    allTime.percentProfit_xirr = statAllTime.yield_rate_xirr; // Доходность в процентах за всё время XIRR
    allTime.gross_xirr = statAllTime.year_gross_xirr; // XIRR по данным джета
    allTime.interest = statAllTime.details.interest; // Процентный доход за всё время
    allTime.fine = statAllTime.details.fine; // Пени за всё время
    allTime.bonus = statAllTime.details.bonus; // Бонусы за всё время
    allTime.reffBonus = statAllTime.details.referral_bonus; // Реферальные бонусы за всё время
    allTime.sale = statAllTime.details.sale; // Доход на вторичке за всё время
    allTime.loss = statAllTime.loss; // Потери за всё время
    allTime.ndfl = statAllTime.profit_ndfl; // НДФЛ за всё время
    allTime.market_making = statAllTime.details.market_making; // Маркет-мейкинг

    yearTime.percentProfit = statYearTime.yield_rate; // Доходность в процентах за год
    yearTime.percentProfit_xirr = statYearTime.yield_rate_xirr; // Доходность в процентах за год XIRR
    yearTime.gross_xirr = statYearTime.year_gross_xirr; // XIRR по данным джета
    yearTime.interest = statYearTime.details.interest; // Процентный доход за год
    yearTime.fine = statYearTime.details.fine; // Пени за год
    yearTime.bonus = statYearTime.details.bonus; // Бонусы за год
    yearTime.reffBonus = statYearTime.details.referral_bonus; // Реферальные бонусы за год
    yearTime.sale = statYearTime.details.sale; // Доход на вторичке за год
    yearTime.loss = statYearTime.loss; // Потери за год
    yearTime.ndfl = statYearTime.profit_ndfl; // НДФЛ за год
    yearTime.market_making = statYearTime.details.market_making; // Маркет-мейкинг

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

    for (let span of $$(".invest-section__title-sum")) {
      span.textContent = `(Свободно: ${toCurrencyFormat(balanceStats.free)})`;
    }
    fmInvestSumAll.value = balanceStats.free;
    smInvestSumAll.value = balanceStats.free;

    const sameDataText = `
      <div class="contrast-bg">
        <h3>Статистика платформы:</h3>
        <br>
        <p>Ставка на сборе (за всё время / за 30 дней): <b>${toPercentFormat(platformObj.data.average_interest_rate)}</b> / <b>${toPercentFormat(platformObj.data.average_interest_rate_30days)}</b></p>
        <p>Минимальная и максимальная ставки:  <b>${toPercentFormat(platformObj.data.min_interest_rate)}</b> / <b>${toPercentFormat(platformObj.data.max_interest_rate)}</b></p>
        <p>Средняя ставка на вторичном рынке (30 дней): <b>${toPercentFormat(platformObj.data.average_market_interest_rate)}</b></p>
        <p>Дефолтность (за всё время / за 30 дней): <b>${toPercentFormat(platformObj.data.default_rate_all)}</b> / <b>${toPercentFormat(platformObj.data.default_rate)}</b></p>
        <br>
        <p>Средняя доходность: <b>${toPercentFormat(platformObj.data.average_interest_rate)}</b></p>
        <p>Средняя доходность (30 дн.): <b>${toPercentFormat(platformObj.data.average_interest_rate_30days)}</b></p>
        <p>Ожидаемая доходность: <b>${toPercentFormat(platformObj.data.waitings_interest_rate)}</b></p>
        <p>Уровень инфляции: <b>${toPercentFormat(platformObj.data.inflation_rate)}</b></p>
        <p>Процент инвесторов, обгоняющих инфляцию: <b>${toPercentFormat(platformObj.data.investors_better_then_inflation)}</b></p>
        <br>
        <p>Всего инвесторов / активные инвесторы: <b>${platformObj.data.investors_count}</b> / <b>${platformObj.data.active_investors_count}</b></p>
        <p>Всего компаний / уникальные компании: <b>${platformObj.data.borrowers_count}</b> / <b>${platformObj.data.success_borrowers_count}</b></p>
      </div>
      <br>
      <div class="contrast-bg">
        <h3>Прочее:</h3>
        <br>
        <p>Айди: <b>${user.id}</b></p>
        <p>Дата регистрации: <b>${formatReadableDate(user.register_date)}</b></p>
        <p>Срок инвестирования: <b>${getInvestDays()}</b></p>
        <p>Компаний в портфеле: <b>${user.companies_count}</b></p>
      </div>
      ${
        window.innerWidth <= 768
          ? `<footer class="footer-text">JetLend Extension v${version}.
              <p class="open-updates">История обновлений</p> 
              <p class="open-support">Поддержать разработку</p>
             </footer>`
          : `<br>`
      }

    </div>
    `;

    const dataTextAllTime = async () => `<div class="container">
      <div class="contrast-bg">
        <h3>Статистика за <span class="swap">всё время</span>:</h3>
        <br>
        <p>Доходность: <b>${toPercentFormat(allTime.percentProfit)}</b></p>
        <p>Процентный доход: <b style="color:${decorNumber(allTime.interest)}">${numberSign(allTime.interest)}${toCurrencyFormat(allTime.interest)}</b></p>
        <p>НПД (ожидаемый): <b style="color:${decorNumber(balanceStats.nkd + balanceStats.nkd_ndfl)}">${numberSign(balanceStats.nkd + balanceStats.nkd_ndfl)}${toCurrencyFormat(balanceStats.nkd + balanceStats.nkd_ndfl)}</b></p>
        <p>Пени: <b style="color:${decorNumber(allTime.fine)}">${numberSign(allTime.fine)}${toCurrencyFormat(allTime.fine)}</b></p>
        <p>Бонусы: <b style="color:${decorNumber(allTime.bonus)}">${numberSign(allTime.bonus)}${toCurrencyFormat(allTime.bonus)}</b></p>
        <p>Реферальный доход: <b style="color:${decorNumber(allTime.reffBonus)}">${numberSign(allTime.reffBonus)}${toCurrencyFormat(allTime.reffBonus)}</b></p>
        <p>Доход на вторичном рынке: <b style="color:${decorNumber(allTime.sale)}">${numberSign(allTime.sale)}${toCurrencyFormat(allTime.sale)}</b></p>
        <p>Маркет-мейкинг: <b style="color:${decorNumber(allTime.market_making)}">${numberSign(allTime.market_making)}${toCurrencyFormat(allTime.market_making)}</b></p>
        <p>Потери: <b style="color:${decorNumber(-allTime.loss)}">${numberSign(-allTime.loss)}${toCurrencyFormat(-allTime.loss)}</b></p>
        <p>НДФЛ: <b style="color:${decorNumber(-allTime.ndfl)}">${numberSign(-allTime.ndfl)}${toCurrencyFormat(-allTime.ndfl)}</b></p>
        <p>НДФЛ ожидаемый: <b style="color:${decorNumber(-balanceStats.nkd_ndfl)}">${numberSign(-balanceStats.nkd_ndfl)}${toCurrencyFormat(-balanceStats.nkd_ndfl)}</b></p>
        <p>Доход за вычетом НДФЛ: <b style="color:${decorNumber(allTime.profitWithoutNdfl)}">${numberSign(allTime.profitWithoutNdfl)}${toCurrencyFormat(allTime.profitWithoutNdfl)}</b></p>
        <p>Свободные средства: <b style="color:${decorNumber(balanceStats.free)}">${numberSign(balanceStats.free)}${toCurrencyFormat(balanceStats.free)}</b></p>
        <br>
        <!--<p>Доходность XIRR (данные JL): <b>${toPercentFormat(allTime.percentProfit_xirr)}</b></p>
        <p>Доходность XIRR брутто (данные JL): <b>${toPercentFormat(allTime.gross_xirr)}</b></p>
        <p>Доходность Гаусса XIRR: <b>${toPercentFormat(user.year_gross_xirr)}</b></p>-->
        <p>Доходность XIRR (данные JL): <b>${toPercentFormat(user.year_gross)}</b></p>
        ${user.xirrData ? await printXIrr("all") : `<p class="btn-small" id="xirr-all" style="width: 100%; mb-0">Рассчитать XIRR</p>`}
      </div>
      <br>
      
    ${sameDataText}
    `;

    const dataTextYearTime = async () => `<div class="container">
      <div class="contrast-bg">
        <h3>Статистика за <span class="swap">год</span>:</h3>
        <br>
        <p>Доходность: <b>${toPercentFormat(yearTime.percentProfit)}</b></p>
        <p>Процентный доход: <b style="color:${decorNumber(yearTime.interest)}">${numberSign(yearTime.interest)}${toCurrencyFormat(yearTime.interest)}</b></p>
        <p>НПД (ожидаемый): <b style="color:${decorNumber(balanceStats.nkd + balanceStats.nkd_ndfl)}">${numberSign(balanceStats.nkd + balanceStats.nkd_ndfl)}${toCurrencyFormat(balanceStats.nkd + balanceStats.nkd_ndfl)}</b></p>
        <p>Пени: <b style="color:${decorNumber(yearTime.fine)}">${numberSign(yearTime.fine)}${toCurrencyFormat(yearTime.fine)}</b></p>
        <p>Бонусы: <b style="color:${decorNumber(yearTime.bonus)}">${numberSign(yearTime.bonus)}${toCurrencyFormat(yearTime.bonus)}</b></p>
        <p>Реферальный доход: <b style="color:${decorNumber(yearTime.reffBonus)}">${numberSign(yearTime.reffBonus)}${toCurrencyFormat(yearTime.reffBonus)}</b></p>
        <p>Доход на вторичном рынке: <b style="color:${decorNumber(yearTime.sale)}">${numberSign(yearTime.sale)}${toCurrencyFormat(yearTime.sale)}</b></p>
        <p>Маркет-мейкинг: <b style="color:${decorNumber(yearTime.market_making)}">${numberSign(yearTime.market_making)}${toCurrencyFormat(yearTime.market_making)}</b></p>
        <p>Потери: <b style="color:${decorNumber(-yearTime.loss)}">${numberSign(-yearTime.loss)}${toCurrencyFormat(-yearTime.loss)}</b></p>
        <p>НДФЛ: <b style="color:${decorNumber(-yearTime.ndfl)}">${numberSign(-yearTime.ndfl)}${toCurrencyFormat(-yearTime.ndfl)}</b></p>
        <p>НДФЛ ожидаемый: <b style="color:${decorNumber(-balanceStats.nkd_ndfl)}">${numberSign(-balanceStats.nkd_ndfl)}${toCurrencyFormat(-balanceStats.nkd_ndfl)}</b></p>
        <p>Доход за вычетом НДФЛ: <b style="color:${decorNumber(yearTime.profitWithoutNdfl)}">${numberSign(yearTime.profitWithoutNdfl)}${toCurrencyFormat(yearTime.profitWithoutNdfl)}</b></p>
        <p>Свободные средства: <b style="color:${decorNumber(balanceStats.free)}">${numberSign(balanceStats.free)}${toCurrencyFormat(balanceStats.free)}</b></p>
        <br>
        <!--<p>Доходность XIRR (данные JL): <b>${toPercentFormat(yearTime.percentProfit_xirr)}</b></p>
        <p>Доходность XIRR брутто (данные JL): <b>${toPercentFormat(yearTime.gross_xirr)}</b></p>
        <p>Доходность Гаусса XIRR: <b>${toPercentFormat(user.year_gross_xirr)}</b></p>-->
        <p>Доходность XIRR (данные JL): <b>${toPercentFormat(user.year_gross)}</b></p>
        ${user.xirrData ? await printXIrr("year") : `<p class="btn-small" id="xirr-year" style="width: 100%; mb-0">Рассчитать XIRR</p>`}
      </div>
      <br>
    ${sameDataText}
    `;

    function updateProfit() {
      const title = time_setting.value === "all" ? "Доход за всё время (без НПД | чистый доход)" : investDays() < DAYS_IN_YEAR ? `Доход за ${getInvestDays()} (без НПД | чистый доход)` : "Доход за год (без НПД | чистый доход)";
      const profit = time_setting.value === "year" && investDays() >= DAYS_IN_YEAR ? yearTime.profitWithoutNpd : allTime.profitWithoutNpd;
      const cleanProfit = time_setting.value === "year" && investDays() >= DAYS_IN_YEAR ? yearTime.cleanProfit : allTime.cleanProfit;
      const percent = time_setting.value === "year" && investDays() >= DAYS_IN_YEAR ? yearTime.percentProfit : allTime.percentProfit;

      $(".income__title").innerHTML = `<span>${title}</span> <span>Доходность</span>`;
      $(".income__currency").innerHTML = `<span id="income">${toCurrencyFormat(profit)}</span><span style="opacity: .5;"> | </span><span id="income--clean">${toCurrencyFormat(cleanProfit)}</span>`;
      $(".income__percent").innerHTML = `<span><img src="/img/income.svg">${toPercentFormat(percent)}</span>`;
    }

    $(".lastUpdateDate").innerHTML = `Все активы <span>(${getUpdateTime(new Date().getTime())})</span>`;
    $(".balance__title").innerHTML = `<span>Активы | Активы без НПД</span> <span>Ставка на сборе</span>`;
    $(".balance__value").innerHTML = `<span style="text-wrap: nowrap"><span id="balance">${toCurrencyFormat(user.balance)}</span><span style="opacity: .5;"> | </span><span id="balance--clean">${toCurrencyFormat(user.cleanBalance)}</span></span><span style="text-wrap: nowrap">${toPercentFormat(platformObj.data.average_interest_rate_30days)}</span>`;
    currencyAnimation("balance", currencyToFloat(cache.balance ?? 0), currencyToFloat(user.balance), "hideArrow");
    currencyAnimation("balance--clean", currencyToFloat(cache.cleanBalance ?? 0), currencyToFloat(user.cleanBalance));
    cache.balance = user.balance;
    cache.cleanBalance = user.cleanBalance;
    updateProfit();

    if (time_setting.value === "year" && investDays() >= DAYS_IN_YEAR) {
      $(".stats-section").innerHTML = await dataTextYearTime();
    } else if (time_setting.value === "all") {
      $(".stats-section").innerHTML = await dataTextAllTime();
    }

    if (investDays() < DAYS_IN_YEAR) {
      $(".stats-section").innerHTML = await dataTextAllTime();
      $(".swap").textContent = getInvestDays();
      $(".swap").style.textDecoration = "none";
      $(".swap").style.userSelect = "auto";
      $(".swap").style.cursor = "text";
    }

    async function handleSwapClick(event) {
      if (event.target.classList.contains("swap")) {
        if (event.target.textContent === "всё время") {
          $(".stats-section").innerHTML = await dataTextYearTime();
        } else if (event.target.textContent === "год") {
          $(".stats-section").innerHTML = await dataTextAllTime();
        }
      }
    }

    $off("click", ".stats-section", handleSwapClick);
    $on("click", ".stats-section", handleSwapClick);

    // Сохранение данных
    const cacheData = {
      balanceTitle: $(".balance__title").querySelectorAll("span")[0].textContent, // Текст заголовка активов (согласно настройкам)
      balanceText: $(".balance__value").querySelectorAll("span")[0].textContent, // Текст активов (согласно настройкам)

      balance: toCurrencyFormat(user.balance),
      cleanBalance: toCurrencyFormat(user.cleanBalance),

      income: $("#income").textContent,
      cleanIncome: $("#income--clean").textContent,

      collectionIncomeTitle: $(".balance__title").querySelectorAll("span")[1].textContent, // Текст заголовка ставки на сборе
      collectionIncomeText: $(".balance__value").querySelectorAll("span")[4].textContent, // Текст ставки на сборе

      incomeTitle: $(".income__title").querySelectorAll("span")[0].textContent, // Текст заголовка дохода (согласно настройкам)
      incomeText: $(".income__currency").textContent, // Текст дохода (согласно настройкам)

      incomePercent: $(".income__title").querySelectorAll("span")[1].textContent, // Текст заголовка процентного дохода
      percentIncomeNum: $(".income__percent").textContent, // Процентный доход

      updateTime: new Date().getTime(), // Текущее время

      qualification: user.qualification, // Статус квала
    };
    await setCache("cacheJetlend", cacheData);
    return;
  } catch (e) {
    $(".lastUpdateDate").textContent = "Нет авторизации";
    $(".main-section__stats").innerHTML = `<div style="margin: 64px 0px; position: relative; transform: translate(25%, 0%);">Авторизуйтесь на сайте</div>`;
    console.log(e);
    return;
  }
}

// Обновление списка компаний (первичка)
async function updateFirstMarket() {
  fmCompanyUpdate = true;
  fmInvestCompanyArray = [];
  $("#fm-numOfSortedCompany").textContent = `Загрузка...`;
  $("#fm-btn-update").classList.add("display-none");
  $("#fm-btn-show").classList.add("display-none");
  $("#fm-btn-stop").classList.remove("display-none");
  // $("#market-companyAnaliz").classList.add("load-block-animation");

  await fmLoadLoans();

  $("#fm-numOfSortedCompany").textContent = `Найдено: ${fmInvestCompanyArray.length} ${getZaimEnding(fmInvestCompanyArray.length)} `;
  $("#fm-btn-update").classList.remove("display-none");
  if (fmInvestCompanyArray.length >= 1) {
    $("#fm-btn-show").classList.remove("display-none");
  }
  $("#fm-btn-stop").classList.add("display-none");
}

// Обновление списка компаний (первичка, резерв)
async function updateFirstMarketReserv() {
  fmrCompanyUpdate = true;
  fmCompanyUpdate = false;
  fmrInvestCompanyArray = [];
  $("#fmr-numOfSortedCompany").textContent = `Загрузка...`;
  $("#fmr-btn-update").classList.add("display-none");
  $("#fmr-btn-show").classList.add("display-none");
  $("#fmr-btn-stop").classList.remove("display-none");
  const res = await fetchData("https://jetlend.ru/invest/api/requests/waiting");

  if (res.data) {
    fmrInvestCompanyArray = res.data.requests.filter((obj) => obj.collected_percentage !== 100 /* Полоска сбора не заполнена (меньше 100%) */ && obj.investing_amount !== null /* Резервация */);
    $("#fmr-numOfSortedCompany").textContent = `Загрузка... ()`;
    if (!fmrCompanyUpdate) {
      fmrCompanyUpdate = true;
      return;
    }
    $("#fmr-numOfSortedCompany").textContent = `Загружено: ${fmrInvestCompanyArray.length} ${getZaimEnding(fmrInvestCompanyArray.length)}`;
    $("#fmr-btn-update").classList.remove("display-none");
    $("#fmr-btn-update").textContent = "Обновить";
    if (fmrInvestCompanyArray.length >= 1) {
      $("#fmr-btn-show").classList.remove("display-none");
    }
    $("#fmr-btn-stop").classList.add("display-none");
  }
}

// Обновление списка компаний (вторичка)
async function updateSecondMarket() {
  smCompanyUpdate = true;
  smInvestCompanyArray = [];
  $("#sm-numOfSortedCompany").textContent = `Загрузка...`;
  $("#sm-btn-update").classList.add("display-none");
  $("#sm-btn-show").classList.add("display-none");
  $("#sm-btn-stop").classList.remove("display-none");
  // $("#market-companyAnaliz").classList.add("load-block-animation");

  await smLoadLoans("popup", 0, 100);
  $("#sm-numOfSortedCompany").textContent = `Найдено: ${smInvestCompanyArray.length} ${getZaimEnding(smInvestCompanyArray.length)}`;
  $("#sm-btn-update").classList.remove("display-none");
  if (smInvestCompanyArray.length >= 1) {
    $("#sm-btn-show").classList.remove("display-none");
  }
  $("#sm-btn-stop").classList.add("display-none");
}

// Распределение средств (первичка)
$on("click", "#firstMarketSubmit", async () => {
  if ($("#fmInvestAgree").checked && valueToInt(fmInvestSum.value) <= user.freeBalance && valueToInt(fmInvestSum.value) >= 100 && !$("#fm-numOfSortedCompany").textContent.includes("Загрузка...") && user.freeBalance >= 100 && fmInvestCompanyArray.length >= 1) {
    await setCache("fmInvest", {
      array: fmInvestCompanyArray,
      sum: valueToInt(fmInvestSum.value),
      sumAll: currencyToFloat(fmInvestSumAll.value),
      loanMaxSum: currencyToFloat(fmStopLoanSum.value),
      companyMaxSum: currencyToFloat(fmStopCompanySum.value),
      mode: "manual",
    });
    chrome.windows.create({ url: "https://jetlend.ru/invest/v3/?state=login", type: "popup", focused: true });
  }
});

// Распределение средств (вторичка)
$on("click", "#secondMarketSubmit", async () => {
  if ($("#smInvestAgree").checked && valueToInt(smInvestSum.value) <= user.freeBalance && valueToInt(smInvestSum.value) >= 100 && !$("#sm-numOfSortedCompany").textContent.includes("Загрузка...") && user.freeBalance >= 100 && smInvestCompanyArray.length >= 1) {
    await setCache("smInvest", {
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
    });
    chrome.windows.create({ url: "https://jetlend.ru/invest/v3/?state=login", type: "popup", focused: true });
  }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.data === "Распределение средств заверешено") {
    $("#fm-numOfSortedCompany").textContent = "";
    $("#fm-btn-show").classList.add("display-none");
    $("#sm-numOfSortedCompany").textContent = "";
    $("#sm-btn-show").classList.add("display-none");
    fmInvestCompanyArray = [];
    smInvestCompanyArray = [];
    closeInvestPage();
    mainUpdateFunction();
  }
});
