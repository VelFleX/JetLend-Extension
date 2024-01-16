let timePeriod = "";
$.get('#stats__open').addEventListener("click", function () {
  if($.get('.stats-section').style.maxHeight === '1000px' || (!this.style.cssText && window.innerWidth >= 768)) {
    this.style.transform = 'scaleY(-1)';
    $.get('.stats-section').style.maxHeight = '0px';
  } else {
    this.style.transform = 'scaleY(1)';
    $.get('.stats-section').style.maxHeight = '1000px';
  }
});

document.addEventListener("click", function (event) {
  if (event.target.classList.contains('modal-container')) {
    closeModal('#'+event.target.id);
    return;
  }
  if (event.target.classList.contains('modal__btn-close')) {
    closeModal('#'+event.target.parentNode.parentNode.parentNode.id);
    return;
  }
});

document.addEventListener("click", function (event) {
  if (event.target.classList.contains('target-url')) {
    event.preventDefault();
    function addHttpIfMissing(url) {
      if (!/^https?:\/\//i.test(url)) {
        url = 'http://' + url;
      }
      return url;
    }
    chrome.windows.create({ url: addHttpIfMissing(event.target.href), type: 'popup', focused: true });
  }
});

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("swap")) {
    if($.get('.swap').textContent == 'всё время') {
      statsSection.innerHTML = dataTextYearTime;
    } else if ($.get('.swap').textContent == 'год') {
      statsSection.innerHTML = dataTextAllTime;
    }
  }
});
let fmInvestCompanyArray = [];
let fmrInvestCompanyArray = [];
let smInvestCompanyArray = [];
let freeBalance = 0;
let cleanBalance = 0;
let balance = 0;
let cachedBalance = 0;
let cachedCleanBalance = 0;

let dataTextAllTime = '';
let dataTextYearTime = '';
let sameDataText = '';

const formsElements = [fmDaysFrom, fmDaysTo, fmRatingFrom, fmRatingTo, fmRateFrom, fmRateTo, fmLoansFrom, fmLoansTo, fmMaxCompanySum, fmInvestSum,
  smDaysFrom, smDaysTo, smRatingFrom, smRatingTo, smRateFrom, smRateTo, smFdFrom, smFdTo, smProgressFrom,
  smProgressTo, smPriceFrom, smPriceTo, smClassFrom, smClassTo, smMaxCompanySum, smInvestSum];

formsElements.forEach(element => element.addEventListener('change', updateInvestSettings));
btnInvestOpen.addEventListener('click', openInvestPage);
btnInvestClose.addEventListener('click', closeInvestPage);

$.get('#events__open').addEventListener('click', () => {opneModal('#events'); });
$.get('#event-transactions__open').addEventListener('click', () => transactionsShow());
$.get('#event-defaults__open').addEventListener('click', () => lastDefaultsShow());
$.get('#settings__open').addEventListener('click', () => {opneModal('#settings')});
$.get('#newTab__open').addEventListener('click', () => chrome.tabs.create({url: chrome.runtime.getURL('html/popup.html')}));

$.get('#fm-btn-update').addEventListener('click', updateFirstMarket);
$.get('#fm-btn-show').addEventListener('click', () => {opneModal('#fm-list'); fmCompanyShow(fmInvestCompanyArray, '#fm-list-ul')});
$.get('#fm-btn-stop').addEventListener('click', function() {fmCompanyUpdate = false});

$.get('#fmr-btn-update').addEventListener('click', updateFirstMarketReserv);
$.get('#fmr-btn-show').addEventListener('click', () => {opneModal('#fmr-list'); fmCompanyShow(fmrInvestCompanyArray, '#fmr-list-ul')});
$.get('#fmr-btn-stop').addEventListener('click', function() {fmrCompanyUpdate = false});

$.get('#sm-btn-update').addEventListener('click', updateSecondMarket);
$.get('#sm-btn-show').addEventListener('click', () => {opneModal('#sm-list'); smCompanyShow(smInvestCompanyArray, '#sm-list-ul')});
$.get('#sm-btn-stop').addEventListener('click', function() {smCompanyUpdate = false});

$.get('#marketMode').addEventListener('click', marketSwap);

chrome.storage.local.get("investSettings", function(data) {
  if (data.investSettings) {
    const settings = data.investSettings;
    const keys = Object.keys(settings);
    keys.forEach(key => {
      const element = $.get(formsElementsObj[key]);
      if (element && settings[key]) {
        element.value = settings[key];
      }
    });
  }
});

async function transactionsShow() {
  // if ($.get('#event-transactions__open').classList.contains('btn-small--active')) {
  //   return;
  // };
  $.get('#events__btn-section').querySelectorAll('.btn-small').forEach(btn => btn.classList.remove('btn-small--active'));
  $.get('#event-transactions__open').classList.add('btn-small--active');
  const list = $.get('#events__list');
  list.innerHTML = `<div class="load-spinner__container"><span class="load-spinner" style="width: 32px;"></span></div>`;
  const transactionsData = await fetchData('https://jetlend.ru/invest/api/account/transactions');
  const operations = {
    purchase: 'Покупка займа',
    payment: 'Платеж по займу',
    collection: 'Судебное взыскание',
    contract: 'Выдача займа',
    default: 'Дефолт'
  }
  if (transactionsData.data) {
    list.innerHTML = '';
    transactionsData.data.transactions.forEach(element => {
      const listItem = document.createElement('div');
      listItem.classList.add('list-element', 'contrast-bg');
      listItem.innerHTML = createListElement(element); 
      list.appendChild(listItem); 
    })
  } else {
    list.textContent = transactionsData.error;
  }

  function createListElement(element) {
    function setColor(num) {
      if (num > 0) {
        return 'limegreen';
      } else {
        return 'red';
      }
    }
    return `
    <section style="display: flex; margin-top: 6px;">
      <img class="list-element__img" src="https://jetlend.ru${element.preview_small_url}">
      <div>
        <div class="list-element__loan-name" style="font-size: 14.5px; font-weight:600; z-index: 1; display: inline-block;">${element.company}</div>
        <div style="font-size: 14px; margin-top: 5px;">${operations[element.operation_type] ? operations[element.operation_type] : element.operation_type}</div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; margin-left: auto; font-size: 14px;">
        <div style="font-weight: 600; text-wrap: nowrap;">
          ${element.income !== null && element.income !== 0.00 ? `${toCurrencyFormat(element.income)}` : ''}
        </div>
        <div style="color: ${setColor(element.expense)}; font-weight: 600; text-wrap: nowrap; margin-top: 5px;">
          ${element.expense !== null && element.expense !== 0.00 ? element.expense > 0 ? `${+toCurrencyFormat(element.expense)}` : `${toCurrencyFormat(element.expense)}` : ''}
        </div> 
        <div style="color: ${setColor(element.revenue)}; font-weight: 600; text-wrap: nowrap; margin-top: 5px;">
          ${element.revenue !== null && element.revenue !== 0.00 ? element.revenue > 0 ? `${+toCurrencyFormat(element.revenue)}` : `${toCurrencyFormat(element.revenue)}` : ''}
        </div> 
      </div>
    </section>
    `
  }
}

async function lastDefaultsShow() {
  // if ($.get('#event-defaults__open').classList.contains('btn-small--active')) {
  //   return;
  // };
  $.get('#events__btn-section').querySelectorAll('.btn-small').forEach(btn => btn.classList.remove('btn-small--active'));
  $.get('#event-defaults__open').classList.add('btn-small--active');
  const list = $.get('#events__list');
  list.innerHTML = `<div class="load-spinner__container"><span class="load-spinner" style="width: 32px;"></span></div>`;
  const url = 'https://jetlend.ru/invest/api/portfolio/loans?aggregate=purchased_amount%2Cpaid_interest%2Cpaid_fine%2Cprincipal_debt%2Cnkd&filter=%5B%7B%22values%22%3A%5B%22default%22%5D%2C%22field%22%3A%22status%22%7D%5D&limit=10000&offset=0&sort_dir=asc&sort_field=status';
  const res = await fetchData(url);
  if (res.data) {
    const sorted = res.data.data.filter(obj => dateDiff(obj.last_payment_date) <= 120);
    sorted.forEach(elem => {
      elem.delay_days = dateDiff(elem.last_payment_date);
    })
    for (elem of sorted) {
      const events = await fetchData(`https://jetlend.ru/invest/api/requests/${elem.loan_id}/events`);
      const defaultEvent = events.data.events.find(obj => obj.event_type === 'default');
      elem.default_date = defaultEvent.date;
    }
    sorted.sort((a, b) => new Date(b.default_date) - new Date(a.default_date));
    list.innerHTML = '';
    sorted.forEach(element => {
      const listItem = document.createElement('div');
      listItem.classList.add('list-element', 'contrast-bg');
      listItem.innerHTML = createListElement(element); 
      list.appendChild(listItem); 
    })
  } else {
    list.textContent = transactionsData.error;
  }

  function createListElement(element) {
    return `
    <section style="display: flex; margin-top: 6px;">
      <img class="list-element__img" src="https://jetlend.ru${element.preview_small_url}">
      <div>
        <a class="list-element__loan-name target-url" style="font-size: 14.5px; font-weight:600; z-index: 1; display: inline-block;" href="https://jetlend.ru/invest/v3/company/${element.loan_id}">
          ${element.loan_name}
        </a>
        <div style="font-size: 14px; margin-top: 5px;">Дефолт</div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; margin-left: auto; font-size: 14px;">
        <div style="font-weight: 600; text-wrap: nowrap;">
          ${formatReadableDate(element.default_date)}
        </div>
        <div style="color: orangered; font-weight: 600; text-wrap: nowrap; margin-top: 5px;">
          ${toCurrencyFormat(-element.principal_debt)}
        </div> 
      </div>
    </section>
    `
 }
}

function fmCompanyShow(arr, blockId) {
  const removeElement = index => arr.splice(index, 1);
  const list = $.get(`${blockId}`);
  list.innerHTML = ''; // очищаем текущий список
  function createListElement(element) {
    return `
        <header style="display: flex; margin-top: 6px;">
          <img class="list-element__img" src="https://jetlend.ru${element.preview_small_url === null ? element.image_url : element.preview_small_url}">
          <div style="display: flex; flex-direction: column; text-wrap: nowrap;">
            <a class="list-element__loan-name target-url" style="font-size: 14.5px; font-weight:600; z-index: 1; display: inline-block; width: 0;" 
              href="https://jetlend.ru/invest/v3/company/${element.id}">${element.loan_name}</a>
            <span style="font-size: 14px">${element.loan_isin}</span>
            <span style="font-size: 14px">
              <b style="${element.rating.includes('A') ? 'color: limegreen;' : 
                          element.rating.includes('B') ? 'color: orange;' : 
                          'color: orangered;'}">${element.rating}|${ratingArray.indexOf(element.rating)}
              </b>, 
              <b style="${element.financial_discipline === 1 ? 'color: limegreen;' : 
                          element.financial_discipline <= 0.4 ? 'color: red;' : 
                          'color: orange;'}">ФД: ${(element.financial_discipline*100).toFixed(0)}%
              </b> 
            </span>
          </div>
          <div style="display: block; flex: 1; margin-left: -50px; font-size: 14px;">
            <b style="${element.company_investing_amount === null ? 'color: limegreen;' : 
                          element.company_investing_amount === '0.00' ? 'color: #8888e6;' : 'color: orange;'}
                          text-wrap: nowrap; float: right">
                          ${element.company_investing_amount === null ? 'Заёмщика нет в портфеле' : 
                          element.company_investing_amount === '0.00' ? 'Заёмщик был в портфеле' : 
                          `Компания в портфеле: ${toCurrencyFormat(element.company_investing_amount)}`}
            </b> 
            <div style="${element.investing_amount !== null ? 'color: orange;' : ''} font-weight: 600; float: right">
                        ${element.investing_amount !== null ? `Зарезервировано: ${toCurrencyFormat(element.investing_amount)}` : ''}
            </div>
          </div>
        </header>
        
        <main>
          <p>${element.company}</p>
          <p>ИНН: <b>${element.inn}</b>, ОГРН: <b>${element.ogrn}</b></p>
          <p>Ставка: <b>${(element.interest_rate*100).toFixed(2)}%</b>, срок: <b>${element.term}</b> ${daysEnding(element.term)}</p>
          <p>Сумма: <b>${toShortCurrencyFormat(element.amount)}</b>, собрано: <b>(${element.collected_percentage.toFixed(0)}%/100%)</b></p>
          <p>Выручка за год: <b>${toShortCurrencyFormat(element.revenueForPastYear)}</b>, прибыль за год: <b>${toShortCurrencyFormat(element.profitForPastYear)}</b></p>
          <p>Дата регистрации: <b>${element.registrationDate}</b></p>
          <p>Адрес: ${element.address}</p>
          <p>Деятельность: ${element.primaryCatergory}.</p> 
          <div style="margin: 5px 0px 10px">${element.site ? `<a class="target-url link" href="${element.site}">Сайт компании </a>` : 'Cайта нет '}|
            <a class="target-url link" href="${element.profile}"> Контур. Фокус </a>|
            <a class="target-url link" href="https://vbankcenter.ru/contragent/search?searchStr=${element.inn}"> ВБЦ </a>|
            <a class="target-url link" href="https://checko.ru/search?query=${element.inn}"> Чекко </a>|
            <a class="target-url link" href="https://www.rusprofile.ru/search?query=${element.inn}"> Rusprofile </a>
          </div> 
        </main>

  `;
  }
  arr.forEach((element, index) => {
    const listItem = document.createElement('div');
    listItem.classList.add('list-element', 'contrast-bg');
    listItem.innerHTML = createListElement(element); 
    // listItem.addEventListener('click', async function() {
    //   const res = await fetchData("https://jetlend.ru/invest/api/requests/waiting");
    //   const load = document.createElement('div');
    //   load.classList.add('list-element__load-block');
    //   load.textContent = 'Загрузка...';
    //   listItem.appendChild(load);
    //   if (res.data) {
    //     const company = res.data.requests.find(item => item.id === element.id);
    //     const details = await fetchDetails(element.id);
    //     Object.assign(company, details);
    //     listItem.innerHTML = createListElement(company); 
    //     const buttons = document.createElement('div');
    //     buttons.classList.add('buttons-section')
    //     const removeButton = document.createElement('span');
    //     removeButton.textContent = 'Удалить';
    //     removeButton.classList.add('btn');
    //     removeButton.onclick = function() {
    //       removeElement(index);
    //       if (arr.length === 0) {
    //         closeModal('#fm-list')
    //       }
    //       updateFmArrayText();
    //       fmCompanyShow(arr, blockId);
    //     }; 
    //     listItem.appendChild(buttons);
    //     // buttons.appendChild(focus);
    //     buttons.appendChild(removeButton); 
    //     listItem.style.filter = '';
    //   }
    // });
    if (arr !== fmrInvestCompanyArray) {
      const buttons = document.createElement('div');
      buttons.classList.add('buttons-section');
      const removeButton = document.createElement('span');
      removeButton.textContent = 'Удалить';
      removeButton.classList.add('btn');
      removeButton.onclick = function() {
        removeElement(index);
        if (arr.length === 0) {
          closeModal('#fm-list')
         }
        updateFmArrayText();
        fmCompanyShow(arr, blockId);
      }; 
      listItem.appendChild(buttons);
      buttons.appendChild(removeButton); 
    }

    list.appendChild(listItem); 
  });
};

function updateFmArrayText() {
  $.get('#fm-numOfSortedCompany').textContent = `Доступно: ${fmInvestCompanyArray.length} ${getZaimEnding(fmInvestCompanyArray.length)} `;
  $.get('#fm-btn-update').classList.remove('display-none');
  if (fmInvestCompanyArray.length >= 1) {
    $.get('#fm-btn-show').classList.remove('display-none');
  } else if (fmInvestCompanyArray.length === 0) {
    $.get('#fm-btn-show').classList.add('display-none');
  }
  $.get('#fm-btn-stop').classList.add('display-none');
}

function updateSmArrayText() {
  $.get('#sm-numOfSortedCompany').textContent = `Доступно: ${smInvestCompanyArray.length} ${getZaimEnding(smInvestCompanyArray.length)} `;
  $.get('#sm-btn-update').classList.remove('display-none');
  if (smInvestCompanyArray.length >= 1) {
    $.get('#fm-btn-show').classList.remove('display-none');
  } else if (smInvestCompanyArray.length === 0) {
    $.get('#sm-btn-show').classList.add('display-none');
  }
  $.get('#sm-btn-stop').classList.add('display-none');
}

function smCompanyShow(arr, blockId) {
  const removeElement = index => arr.splice(index, 1);
  const list = $.get(`${blockId}`);
  list.innerHTML = ''; // очищаем текущий список
  arr.forEach((element, index) => {
    const listItem = document.createElement('div');
    listItem.classList.add('list-element', 'contrast-bg');
    listItem.innerHTML = `
    <header>
      <div style="display: flex; margin-top: 6px;">
        <img class="list-element__img" src="https://jetlend.ru${element.preview_small_url === null ? element.image_url : element.preview_small_url}">
        <div style="display: flex; flex-direction: column; text-wrap: nowrap;">
          <a class="list-element__loan-name target-url" style="font-size: 14.5px; font-weight:600; z-index: 1; display: inline-block; width: 0;" 
            href="https://jetlend.ru/invest/v3/company/${element.loan_id}">${element.loan_name}</a>
          <span style="font-size: 14px">${element.loan_isin}</span>
          <span style="font-size: 14px">
            <b style="${element.rating.includes('A') ? 'color: limegreen;' : 
                        element.rating.includes('B') ? 'color: orange;' : 
                        'color: orangered;'}">${element.rating}|${ratingArray.indexOf(element.rating)}
            </b>, 
            <b style="${element.financial_discipline === 1 ? 'color: limegreen;' : 
                        element.financial_discipline <= 0.4 ? 'color: red;' : 
                        'color: orange;'}">ФД: ${(element.financial_discipline*100).toFixed(0)}%
            </b>, 
            <b style="${element.loan_class === 0 ? 'color: limegreen;' : 
                        element.loan_class === 1 ? 'color: orange;' : 
                        'color: orangered;'}">Класс: ${element.loan_class}
            </b>  
          </span>
        </div>
        <div style="display: block; flex: 1; margin-left: -50px; font-size: 14px;">
          <b style="${element.invested_company_debt === null ? 'color: limegreen;' : 
                        element.invested_company_debt === 0 ? 'color: #8888e6;' :  'color: orange;'}
                         text-wrap: nowrap; float: right">
                        ${(element.invested_company_debt === null ? 'Заёмщика нет в портфеле' : 
                        element.invested_company_debt === 0 ? 'Заёмщик был в портфеле' : 
                        `Компания в портфеле: ${toCurrencyFormat(element.invested_company_debt)}`)}
          </b> 
          <div style="${element.invested_debt !== null ? 'color: orange;' : ''} font-weight: 600; float: right">
                    ${element.invested_debt !== null ? `Займ в портфеле: ${toCurrencyFormat(element.invested_debt)}` : ''}
          </div>
        </div>
      </div>
    </header>

    <main>
      <p>${element.company}</p>
      <p>ИНН: <b>${element.inn}</b>, ОГРН: <b>${element.ogrn}</b></p>
      <p>Ставка: <b>${(element.interest_rate*100).toFixed(2)}% (${(element.ytm*100).toFixed(2)}%)</b>, минимальная цена: <b>${(element.min_price*100).toFixed(2)}%</b></p>
      <p>Cрок: <b>${element.term + daysEnding(element.term)}</b>, остаток: <b>${element.term_left + daysEnding(element.term_left)}</b>, выплачено: <b>${(element.progress*100).toFixed(2)}%</b></p>
      <p>Выручка за год: <b>${toShortCurrencyFormat(element.revenueForPastYear)}</b>, прибыль за год: <b>${toShortCurrencyFormat(element.profitForPastYear)}</b></p>
      <p>Дата регистрации: <b>${element.registrationDate}</b></p>
      <p>Адрес: ${element.address}</p>
      <p>Деятельность: ${element.primaryCatergory}.</p> 
      <div style="margin: 5px 0px 10px">${element.site ? `<a class="target-url link" href="${element.site}">Сайт компании </a>` : 'Cайта нет '}|
        <a class="target-url link" href="${element.profile}"> Контур. Фокус </a>|
        <a class="target-url link" href="https://vbankcenter.ru/contragent/search?searchStr=${element.inn}"> ВБЦ </a>|
        <a class="target-url link" href="https://checko.ru/search?query=${element.inn}"> Чекко </a>|
        <a class="target-url link" href="https://www.rusprofile.ru/search?query=${element.inn}"> Rusprofile </a>
      </div> 
    </main>
    `; 
    const buttons = document.createElement('div');
    buttons.classList.add('buttons-section')
    const removeButton = document.createElement('span');
    removeButton.textContent = 'Удалить';
    removeButton.classList.add('btn');
    removeButton.onclick = function() {
      removeElement(index);
      if (arr.length === 0) {
        closeModal('#sm-list')
       }
      updateSmArrayText();
      smCompanyShow(arr, blockId);
    }; 
    listItem.appendChild(buttons);
    buttons.appendChild(removeButton); 
    list.appendChild(listItem); 
  });
}

chrome.storage.local.get("settings", function (data) {
  if (data.settings) {
    settingsBtn.textContent = data.settings.timePeriod;

    if (data.settings.timePeriod == 'всё время') {
      timePeriod = "allTime";
    } else if (data.settings.timePeriod == 'год') {
      timePeriod = "year";
    }

  } else if (!data.settings || data.settings.timePeriod == undefined || investDays() <= 365) {
    settingsBtn.textContent = 'всё время';
    timePeriod = "allTime";
  }
});

async function mainUpdateFunction() {
  lastUpdateDateTag.innerHTML = `Все активы <span style="position: relative"><span class="load-spinner" title="Загузка актуальных данных..." style="cursor: pointer; width: 16px"></span></span>`;
  $.get('.invest-section__title-sum').textContent = `(Загрузка...)`;
  const userStatsUrl = "https://jetlend.ru/invest/api/account/details";
  const userDataUrl = "https://jetlend.ru/invest/api/account/info";
  const platformStatsUrl = "https://jetlend.ru/invest/api/public/stats";
  const amountCompanyUrl = "https://jetlend.ru/invest/api/portfolio/distribution/overview";
  const xirrUrl = "https://jetlend.ru/invest/api/account/notifications/v3?filter=%5B%7B%22values%22%3A%5B%22110%22%2C%22120%22%5D%2C%22field%22%3A%22event_type%22%7D%5D&limit=10000&offset=0&sort_dir=asc&sort_field=date"

  const userStats = await fetchData(userStatsUrl);
  const userData = await fetchData(userDataUrl);
  const platformStats = await fetchData(platformStatsUrl);
  const amountCompany = await fetchData(amountCompanyUrl);
  const xirrData = await fetchData(xirrUrl);

  if (userStats.data && platformStats.data && userData.data && amountCompany.data && xirrData.data) {
    const userStatsObj = userStats.data;
    const userObj = userData.data;
    const platformObj = platformStats.data;
    const statAllTime = userStatsObj.data.summary;
    const statYearTime = userStatsObj.data.summary_year;
    const balanceStats = userStatsObj.data.balance;

    balance = balanceStats.total;               // Баланс
    cleanBalance = balance - balanceStats.nkd;  // Баланс без НПД
    freeBalance = balanceStats.free;                  // Свободные средства
    
    const allTime = {
      percentProfit: statAllTime.yield_rate,          // Доходность в процентах за всё время
      interest: statAllTime.details.interest,         // Процентный доход за всё время
      fine: statAllTime.details.fine,                 // Пени за всё время
      bonus: statAllTime.details.bonus,               // Бонусы за всё время
      reffBonus: statAllTime.details.referral_bonus,  // Реферальные бонусы за всё время
      sale: statAllTime.details.sale,                 // Доход на вторичке за всё время
      loss: statAllTime.loss,                         // Потери за всё время
      ndfl: statAllTime.profit_ndfl,                  // НДФЛ за всё время
      get profitWithoutNpd() {                        // Доход без НПД за всё время
        return this.interest + this.fine + this.bonus + this.reffBonus + this.sale - this.loss;
      },
      get cleanProfit() {                             // Чистый доход за всё время
        return this.profitWithoutNpd - this.ndfl;
      },
      get profitWithoutNdfl() {                       // Доход без НДФЛ за всё время
        return this.cleanProfit + balanceStats.nkd;
      },
      xirr: function(type) {
        let cashFlows = [];
        let dates = [];
        if (type === 'npd') {
          type = balance;
        } else if (type === 'clean') {
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
      }
    }
    
    const yearTime = {
      percentProfit: statYearTime.yield_rate,         // Доходность в процентах за год
      interest: statYearTime.details.interest,        // Процентный доход за год
      fine: statYearTime.details.fine,                // Пени за год
      bonus: statYearTime.details.bonus,              // Бонусы за год
      reffBonus: statYearTime.details.referral_bonus, // Реферальные бонусы за год
      sale: statYearTime.details.sale,                // Доход на вторичке за год
      loss: statYearTime.loss,                        // Потери за год
      ndfl: statYearTime.profit_ndfl,                 // НДФЛ за год
      get profitWithoutNpd() {                        // Доход без НПД за год
        return this.interest + this.fine + this.bonus + this.reffBonus + this.sale - this.loss;
      },
      get cleanProfit() {                             // Чистый доход за год
        return this.profitWithoutNpd - this.ndfl;
      },
      get profitWithoutNdfl() {                       // Доход без НДФЛ за год
        return this.cleanProfit + balanceStats.nkd;
      },
      xirr: function(type) {
        const timeYearAgo = new Date().getTime()-31536000000; // Время в unix год назад
        let cashFlows = [];
        let dates = [];
        let sumYear = 0;
        if (type === 'npd') {
          type = this.cleanProfit + balanceStats.nkd;
        } else if (type === 'clean') {
          type = this.cleanProfit;
        }
        for (element of xirrData.data.data) {
          if (timeYearAgo < new Date(element.date).getTime()) {
            sumYear += element.amount;
            cashFlows.push(element.amount);
            dates.push(new Date(element.date));
          }
        }
        cashFlows.push(-(sumYear + type));
        dates.push(new Date());
        return calculateXIRR(cashFlows, dates);
      },
      get incomeSum() {
        const timeYearAgo = new Date().getTime()-31536000000;
        let sum = 0;
        for (element of xirrData.data.data) {
          if (timeYearAgo < new Date(element.date).getTime()) {
            sum += element.income;
          }
        }
        return sum;
      },
      get expenseSum() {
        const timeYearAgo = new Date().getTime()-31536000000;
        let sum = 0;
        for (element of xirrData.data.data) {
          if (timeYearAgo < new Date(element.date).getTime()) {
            sum += element.expense;
          }
        }
        return sum;
      }
    }

    // Функция подсчёта дней инвестирования 
    function investDays() {
      const investStartDate = new Date(statAllTime.start_date).getTime();      // Дата начала инвестирования в unix
      const timeDiff = Math.abs(new Date().getTime() - investStartDate);       // Разница между сегодняшним днем и началом инвестирования в unix
      const days = (diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)));      // Количество дней инвестирования
      return days;
    }

    // Функция подсчёта дней инвестирования + склонение слова "день"
    function getInvestDays() {
      const days = investDays();
      const text = daysEnding(days);
      return days + text;
    }

    if (!settingsBtn.clickListenerAdded) {
      settingsBtn.addEventListener("click", function () {
        if (settingsBtn.textContent == 'всё время' && investDays() >= 365) {
          settingsBtn.textContent = 'год';
          timePeriod = "year";
          updateProfit();
        } else if (settingsBtn.textContent == 'год') {
          settingsBtn.textContent = 'всё время';
          timePeriod = "allTime";
          updateProfit();
        }
        let extensionSettings = {
          timePeriod: settingsBtn.textContent,
        };
        chrome.storage.local.set({ settings: extensionSettings });
      });
      settingsBtn.clickListenerAdded = true;
    }
    
    $.get('.invest-section__title-sum').textContent = `(Свободно: ${toCurrencyFormat(balanceStats.free)})`;
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
    `

    dataTextAllTime = 
    `<div class="container">
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
        <p>XIRR (с НПД / без НПД): <b>${toPercentFormat(allTime.xirr('npd'))}</b> / <b>${toPercentFormat(allTime.xirr('clean'))}</b></p>
      </div>
      <br>
    ${innerHTML = sameDataText}
    `

    dataTextYearTime = 
    `<div class="container">
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
        <p>XIRR (с НПД / без НПД): <b>${toPercentFormat(yearTime.xirr('npd'))}</b> / <b>${toPercentFormat(yearTime.xirr('clean'))}</b></p>
      </div>
      <br>
    ${innerHTML = sameDataText}
    `

    function updateProfit() {
      if (investDays() < 365) {
        incomeTitle.innerHTML = `<span>Доход за ${getInvestDays()} (без НПД | чистый доход)</span> <span>Доходность</span>`;
        $.get('.income__currency').innerHTML = `<span id="income">${toCurrencyFormat(allTime.profitWithoutNpd)}</span><span style="opacity: .5;"> | </span><span id="income--clean">${toCurrencyFormat(allTime.cleanProfit)}</span>`;  
        $.get('.income__percent').innerHTML = `<span><img src="/img/income.svg">${toPercentFormat(allTime.percentProfit)}</span>`;
      } else if (timePeriod == "allTime") {
        incomeTitle.innerHTML = `<span>Доход за всё время (без НПД | чистый доход)</span> <span>Доходность</span>`;
        $.get('.income__currency').innerHTML = `<span id="income">${toCurrencyFormat(allTime.profitWithoutNpd)}</span><span style="opacity: .5;"> | </span><span id="income--clean">${toCurrencyFormat(allTime.cleanProfit)}</span>`;  
        $.get('.income__percent').innerHTML = `<span><img src="/img/income.svg">${toPercentFormat(allTime.percentProfit)}</span>`;
      } else if (timePeriod == "year" && investDays() >= 365) {
        incomeTitle.innerHTML = `<span>Доход за год (без НПД | чистый доход)</span> <span>Доходность</span>`;
        $.get('.income__currency').innerHTML = `<span id="income">${toCurrencyFormat(yearTime.profitWithoutNpd)}</span><span style="opacity: .5;"> | </span><span id="income--clean">${toCurrencyFormat(yearTime.cleanProfit)}</span>`;  
        $.get('.income__percent').innerHTML = `<span><img src="/img/income.svg">${toPercentFormat(yearTime.percentProfit)}</span>`;
      }      
    }

    lastUpdateDateTag.innerHTML = `Все активы <span>(${getUpdateTime((new Date).getTime())})</span>`;
    balanceTitle.innerHTML = `<span>Активы | Активы без НПД</span> <span>Ставка на сборе</span>`;
    balanceTag.innerHTML = `<span style="text-wrap: nowrap"><span id="balance">${toCurrencyFormat(balance)}</span><span style="opacity: .5;"> | </span><span id="balance--clean">${toCurrencyFormat(cleanBalance)}</span></span><span style="text-wrap: nowrap">${toPercentFormat(platformObj.data.average_interest_rate_30days)}</span>`;
    currencyAnimation('balance', currencyToFloat(cachedBalance), currencyToFloat($.get('#balance').textContent), 'hideArrow');
    currencyAnimation('balance--clean', currencyToFloat(cachedCleanBalance), currencyToFloat($.get('#balance--clean').textContent));
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
      $.get('.swap').textContent = getInvestDays();
      $.get('.swap').style.textDecoration = 'none';
      $.get('.swap').style.userSelect = 'auto';
      $.get('.swap').style.cursor = 'text';
    }

    if (!$.get("#support-btn").clickListenerAdded) {
      $.get("#support-btn").addEventListener("click", () => opneModal('#support-section'));
    }
    
    // if (!userStatsObj.data.status.qualification.passed) {
    //   $.get('#fmInvestAgreeText').textContent = $.get('#smInvestAgreeText').textContent;
    // }

  // Сохранение данных
  const cache = {
    balanceTitle: balanceTitle.querySelectorAll('span')[0].textContent,            // Текст заголовка активов (согласно настройкам)
    balanceText: balanceTag.querySelectorAll('span')[0].textContent,               // Текст активов (согласно настройкам)

    balance: $.get('#balance').textContent,
    cleanBalance: $.get('#balance--clean').textContent,

    income: $.get('#income').textContent,
    cleanIncome: $.get('#income--clean').textContent,

    collectionIncomeTitle: balanceTitle.querySelectorAll('span')[1].textContent,   // Текст заголовка ставки на сборе
    collectionIncomeText: balanceTag.querySelectorAll('span')[4].textContent,      // Текст ставки на сборе

    incomeTitle: incomeTitle.querySelectorAll('span')[0].textContent,              // Текст заголовка дохода (согласно настройкам)
    incomeText: $.get('.income__currency').textContent,                            // Текст дохода (согласно настройкам)

    incomePercent: incomeTitle.querySelectorAll('span')[1].textContent,            // Текст заголовка процентного дохода
    percentIncomeNum: $.get('.income__percent').textContent,                       // Процентный доход
    
    updateTime: new Date().getTime(),                                              // Текущее время

    qualification: userStatsObj.data.status.qualification.passed                   // Статус квала
  };
    chrome.storage.local.set({ cacheJetlend: cache });
  }
  
  if (userStats.error) {
    lastUpdateDateTag.textContent = 'Нет авторизации';
    $.get('.main-section__stats').innerHTML = `<div style="margin: 64px 0px; position: relative; transform: translate(25%, 0%);">Авторизуйтесь на сайте</div>`;
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
    
    $.get('.income__currency').innerHTML = `<span class="load-opacity-animation">${data.income}</span><span style="opacity: .5;"> | </span><span class="load-opacity-animation">${data.cleanIncome}</span>`;
    $.get('.income__percent').innerHTML = `<span class="load-opacity-animation"><img src="/img/income.svg">${data.percentIncomeNum}</span>`
    
    cachedBalance = data.balance;
    cachedCleanBalance = data.cleanBalance;

    if (data.qualification) {
      $.get('#fmInvestAgreeText').textContent = $.get('#smInvestAgreeText').textContent;
    }
  }
});

// Обновление списка компаний (первичка)
async function updateFirstMarket() {
  loadInvestSettings();
  fmCompanyUpdate = true;
  $.get('#fm-numOfSortedCompany').textContent = `Загрузка...`;
  $.get('#fm-btn-update').classList.add('display-none');
  $.get('#fm-btn-show').classList.add('display-none');
  $.get('#fm-btn-stop').classList.remove('display-none');
  $.get('#market-companyAnaliz').classList.add('load-block-animation');
  const res = await fetchData("https://jetlend.ru/invest/api/requests/waiting");
  if (res.data) {
    $.get('#market-averagePercent').textContent = '0%';
    if (res.data.requests.length) {
      $.get('#market-averagePercent').textContent = toPercentFormat(res.data.requests.reduce((acc, curr) => acc + curr.interest_rate, 0)/res.data.requests.length);
    }
    $.get('#market-numOfAllCompany').textContent = res.data.requests.length;
    $.get('#market-companyAnaliz').classList.remove('load-block-animation');
    const valueToNum = value => parseFloat((parseFloat((value).toString().replace(',', '.'))/100).toFixed(4));
    const sorted = res.data.requests.filter(obj => (obj.collected_percentage !== 100) /* Полоска сбора не заполнена (меньше 100%) */ 
      && (obj.investing_amount === null) /* Резервация (нет) */ 
      // && (obj.company_investing_amount === null || obj.company_investing_amount === "0.00") /* Есть заёмщик портфеле (нет) */
      && (obj.term >= parseInt(investSettingsObj.fmDaysFrom) && obj.term <= parseInt(investSettingsObj.fmDaysTo)) /* Срок займа */
      && (ratingArray.indexOf(obj.rating) >= parseInt(investSettingsObj.fmRatingFrom) && ratingArray.indexOf(obj.rating) <= parseInt(investSettingsObj.fmRatingTo)) /* Рейтинг займа */
      && (obj.interest_rate >= valueToNum(investSettingsObj.fmRateFrom) && obj.interest_rate <= valueToNum(investSettingsObj.fmRateTo)) /* Процент займа (от 20 до 100) */ 
      && (obj.loan_order >= parseFloat(investSettingsObj.fmLoansFrom) && obj.loan_order <= parseFloat(investSettingsObj.fmLoansTo))  /* Какой по счёту займ на платформе */
      && (obj.company_investing_amount <= (parseFloat(fmMaxCompanySum.value) - parseFloat(fmInvestSum.value))) /* Сумма в одного заёмщика */
      );

    async function updateArray() {
      let count = 0;
      let secondSort = [];
      for (const element of sorted) {
        const details = await fetchDetails(element.id);
        Object.assign(element, details);
        count++;
        $.get('#fm-numOfSortedCompany').textContent = `Загрузка... Проверяем ФД... (${count}/${sorted.length})`;
        if (element.financial_discipline === 1) { // ФД 100%
          secondSort.push(element);
        }
        if (!fmCompanyUpdate) {
          fmCompanyUpdate = true;
          break;
        }
      }
      fmInvestCompanyArray = secondSort;
      $.get('#fm-numOfSortedCompany').textContent = `Доступно: ${secondSort.length} ${getZaimEnding(secondSort.length)} `;
      $.get('#fm-btn-update').classList.remove('display-none');
      if (fmInvestCompanyArray.length >= 1) {
        $.get('#fm-btn-show').classList.remove('display-none');
      }
      $.get('#fm-btn-stop').classList.add('display-none');
    }
    updateArray()
  };
}
updateFirstMarket();

// Обновление списка компаний (первичка, резерв)
async function updateFirstMarketReserv() {
  fmrCompanyUpdate = true;
  fmCompanyUpdate = false;
  $.get('#fmr-numOfSortedCompany').textContent = `Загрузка...`;
  $.get('#fmr-btn-update').classList.add('display-none');
  $.get('#fmr-btn-show').classList.add('display-none');
  $.get('#fmr-btn-stop').classList.remove('display-none');
  const res = await fetchData("https://jetlend.ru/invest/api/requests/waiting");

  if (res.data) {
    const sorted = res.data.requests.filter(obj => (obj.collected_percentage !== 100) /* Полоска сбора не заполнена (меньше 100%) */ 
      && (obj.investing_amount !== null) /* Резервация */ 
      ) 

    async function updateArray() {
      let count = 0;
      let secondSort = [];
      for (const element of sorted) {
        const details = await fetchDetails(element.id);
        Object.assign(element, details);
        count++;
        secondSort.push(element);
        $.get('#fmr-numOfSortedCompany').textContent = `Загрузка... Проверяем ФД... (${count}/${sorted.length})`;
        if (!fmrCompanyUpdate) {
          fmrCompanyUpdate = true;
          break;
        }
      }
      fmrInvestCompanyArray = secondSort;
      $.get('#fmr-numOfSortedCompany').textContent =
        `Загружено: ${secondSort.length} ${getZaimEnding(secondSort.length)} ${sorted.length > count ? `(всего:  ${sorted.length})` : ''}`;
      $.get('#fmr-btn-update').classList.remove('display-none');
      $.get('#fmr-btn-update').textContent = 'Обновить';
      if (fmrInvestCompanyArray.length >= 1) {
        $.get('#fmr-btn-show').classList.remove('display-none');
      }
      $.get('#fmr-btn-stop').classList.add('display-none');
    }
    updateArray()
  };
}

// Обновление списка компаний (вторичка)
// async function updateSecondMarket() {
//   smCompanyUpdate = true;
//   $.get('#sm-numOfSortedCompany').textContent = `Загрузка...`;
//   $.get('#sm-btn-update').classList.add('display-none');
//   $.get('#sm-btn-show').classList.add('display-none');
//   $.get('#sm-btn-stop').classList.remove('display-none');
//   $.get('#market-companyAnaliz').classList.add('load-block-animation');
//   const res = await fetchData("https://jetlend.ru/invest/api/exchange/loans?limit=10000&offset=0&sort_dir=desc&sort_field=ytm");
//   if (res.data) {
//     const notZeroYtmObj = res.data.data.filter(obj => (obj.ytm !== 0));
//     $.get('#market-numOfAllCompany').textContent = res.data.data.length;
//     $.get('#market-averagePercent').textContent = toPercentFormat(notZeroYtmObj.reduce((acc, curr) => acc + curr.ytm, 0)/notZeroYtmObj.length);
//     $.get('#market-companyAnaliz').classList.remove('load-block-animation');
//     const valueToPercent = value => parseFloat((parseFloat((value).toString().replace(',', '.'))/100).toFixed(4)); // '12,3456' => 0.1234

//     const sorted = res.data.data.filter(obj => (obj.term_left >= parseFloat(smDaysFrom.value) && obj.term_left <= parseFloat(smDaysTo.value)) /* Остаток срока займа */
//       && (ratingArray.indexOf(obj.rating) >= parseInt(smRatingFrom.value) && ratingArray.indexOf(obj.rating) <= parseInt(smRatingTo.value)) /* Рейтинг займа */
//       && (obj.ytm >= valueToPercent(smRateFrom.value) && obj.ytm <= valueToPercent(smRateTo.value)) /* Эффективная ставка (от 20 до 100) */
//       && (obj.progress >= valueToPercent(smProgressFrom.value) && obj.progress <= valueToPercent(smProgressTo.value)) /* Выплачено (прогресс в %) */
//       && (obj.loan_class >= parseInt(smClassFrom.value) && obj.loan_class <= parseInt(smClassTo.value)) /* Класс займа */
//       && (obj.min_price >= valueToPercent(smPriceFrom.value) && obj.min_price <= valueToPercent(smPriceTo.value)) /* Мин прайс от 50% до 90% */
//       && (obj.invested_company_debt <= (parseFloat(smMaxCompanySum.value) - parseFloat(smInvestSum.value))) /* Сумма в одного заёмщика */
//       ); 

//     async function updateArray() {
//       let count = 0;
//       let secondSort = [];
//       for (const element of sorted) {
//         const details = await fetchDetails(element.loan_id);
//         Object.assign(element, details);
//         count += 1;
//         $.get('#sm-numOfSortedCompany').textContent = `Загрузка... Проверяем ФД... (${count}/${sorted.length})`;
//         if (element.financial_discipline >= valueToPercent(smFdFrom.value) && element.financial_discipline <= valueToPercent(smFdTo.value) /* ФД от до */) {
//           secondSort.push(element);
//         }
//         if (!smCompanyUpdate) {
//           smCompanyUpdate = true;
//           break;
//         }
//       }
//       smInvestCompanyArray = secondSort;
//       $.get('#sm-numOfSortedCompany').textContent = `Доступно: ${secondSort.length} ${getZaimEnding(secondSort.length)} `;
//       $.get('#sm-btn-update').classList.remove('display-none');
//       if (smInvestCompanyArray.length >= 1) {
//         $.get('#sm-btn-show').classList.remove('display-none');
//       }
//       $.get('#sm-btn-stop').classList.add('display-none');    
//     }
//     updateArray();
//   };
// }

async function updateSecondMarket() {
  loadInvestSettings();
  smCompanyUpdate = true;
  $.get('#sm-numOfSortedCompany').textContent = `Загрузка...`;
  $.get('#sm-btn-update').classList.add('display-none');
  $.get('#sm-btn-show').classList.add('display-none');
  $.get('#sm-btn-stop').classList.remove('display-none');
  $.get('#market-companyAnaliz').classList.add('load-block-animation');
  const res = await fetchData("https://jetlend.ru/invest/api/exchange/loans?limit=10000&offset=0&sort_dir=desc&sort_field=ytm");
  if (res.data) {
    const notZeroYtmObj = res.data.data.filter(obj => (obj.ytm !== 0));
    $.get('#market-numOfAllCompany').textContent = res.data.data.length;
    $.get('#market-averagePercent').textContent = toPercentFormat(notZeroYtmObj.reduce((acc, curr) => acc + curr.ytm, 0)/notZeroYtmObj.length);
    $.get('#market-companyAnaliz').classList.remove('load-block-animation');
    const valueToPercent = value => parseFloat((parseFloat((value).toString().replace(',', '.'))/100).toFixed(4)); // '12,3456' => 0.1234

    const sorted = res.data.data.filter(obj => (obj.term_left >= parseFloat(investSettingsObj.smDaysFrom) && obj.term_left <= parseFloat(investSettingsObj.smDaysTo)) /* Остаток срока займа */
      && (ratingArray.indexOf(obj.rating) >= parseInt(investSettingsObj.smRatingFrom) && ratingArray.indexOf(obj.rating) <= parseInt(investSettingsObj.smRatingTo)) /* Рейтинг займа */
      && (obj.ytm >= valueToPercent(investSettingsObj.smRateFrom) && obj.ytm <= valueToPercent(investSettingsObj.smRateTo)) /* Эффективная ставка (от 20 до 100) */
      && (obj.progress >= valueToPercent(investSettingsObj.smProgressFrom) && obj.progress <= valueToPercent(investSettingsObj.smProgressTo)) /* Выплачено (прогресс в %) */
      && (obj.loan_class >= parseInt(investSettingsObj.smClassFrom) && obj.loan_class <= parseInt(investSettingsObj.smClassTo)) /* Класс займа */
      && (obj.min_price >= valueToPercent(investSettingsObj.smPriceFrom) && obj.min_price <= valueToPercent(investSettingsObj.smPriceTo)) /* Мин прайс от 50% до 90% */
      && (obj.invested_company_debt <= (parseFloat(smMaxCompanySum.value) - parseFloat(smInvestSum.value))) /* Сумма в одного заёмщика */
      ); 

    async function updateArray() {
      let count = 0;
      let secondSort = [];
      for (const element of sorted) {
        const details = await fetchDetails(element.loan_id);
        Object.assign(element, details);
        count++;
        $.get('#sm-numOfSortedCompany').textContent = `Загрузка... Проверяем ФД... (${count}/${sorted.length})`;
        if (element.financial_discipline >= valueToPercent(investSettingsObj.smFdFrom) && element.financial_discipline <= valueToPercent(investSettingsObj.smFdTo) /* ФД от до */) {
          secondSort.push(element);
        }
        if (!smCompanyUpdate) {
          smCompanyUpdate = true;
          break;
        }
      }
      smInvestCompanyArray = secondSort;
      $.get('#sm-numOfSortedCompany').textContent = `Доступно: ${secondSort.length} ${getZaimEnding(secondSort.length)} `;
      $.get('#sm-btn-update').classList.remove('display-none');
      if (smInvestCompanyArray.length >= 1) {
        $.get('#sm-btn-show').classList.remove('display-none');
      }
      $.get('#sm-btn-stop').classList.add('display-none');    
    }
    updateArray();
  };
}


// Распределение средств (первичка)
$.get('#firstMarketSubmit').addEventListener('click', function() {
  const valueToInt = value => parseInt((value).toString().replace(',', '.'));

  if ($.get('#fmInvestAgree').checked 
    && valueToInt(fmInvestSum.value) <= freeBalance 
    && valueToInt(fmInvestSum.value) >= 100 
    && !$.get('#fm-numOfSortedCompany').textContent.includes("Загрузка...")
    && freeBalance >= 100
    && fmInvestCompanyArray.length >= 1) {
    function numOfCuts() {
      let canInvest = Math.floor(valueToInt(fmInvestSumAll.value) / valueToInt(fmInvestSum.value));
      if (canInvest > fmInvestCompanyArray.length) {
        return fmInvestCompanyArray.length;
      } else {
        return canInvest;
      }
    }
    const sliceArray = fmInvestCompanyArray.slice(0, numOfCuts());
    const arrOfCompanyId = sliceArray.map(obj => obj.id);
    chrome.storage.local.set({fmInvest: {array: arrOfCompanyId, sum: valueToInt(fmInvestSum.value)}});
    // chrome.tabs.create({ url: "https://jetlend.ru/invest/v3/?state=login" });
    chrome.windows.create({ url: "https://jetlend.ru/invest/v3/?state=login", type: 'popup', focused: true });
  }
})

// Распределение средств (вторичка)
$.get('#secondMarketSubmit').addEventListener('click', function() {
  const valueToInt = value => parseInt((value).toString().replace(',', '.'));
  const valueToPercent = value => parseFloat((parseFloat((value).toString().replace(',', '.'))/100).toFixed(4));
  if ($.get('#smInvestAgree').checked 
    && valueToInt(smInvestSum.value) <= freeBalance 
    && valueToInt(smInvestSum.value) >= 100 
    && !$.get('#sm-numOfSortedCompany').textContent.includes("Загрузка...")
    && freeBalance >= 100
    && smInvestCompanyArray.length >= 1) {
    const arrOfCompanyId = smInvestCompanyArray.map(obj => obj.loan_id);
    chrome.storage.local.set({smInvest: {
      array: arrOfCompanyId, 
      sum: valueToInt(smInvestSum.value),
      sumAll: currencyToFloat(smInvestSumAll.value), 
      minPrice: valueToPercent(smPriceFrom.value), 
      maxPrice: valueToPercent(smPriceTo.value)}});
    // chrome.tabs.create({ url: "https://jetlend.ru/invest/v3/?state=login", active: true });
    chrome.windows.create({ url: "https://jetlend.ru/invest/v3/?state=login", type: 'popup', focused: true });
  }
})

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.data === 'Распределение средств заверешено') {
    $.get('#fm-numOfSortedCompany').textContent = '';
    $.get('#fm-btn-show').classList.add('display-none');
    $.get('#sm-numOfSortedCompany').textContent = '';
    $.get('#sm-btn-show').classList.add('display-none');
    fmInvestCompanyArray = [];
    smInvestCompanyArray = [];
    closeInvestPage();
    mainUpdateFunction();
  }
});

