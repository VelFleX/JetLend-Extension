let timePeriod = "";
document.addEventListener("click", function (event) {
  if (event.target == $.get('.income__value span')) {
    if($.get('.stats-section').style.maxHeight === '1000px') {
      // document.body.style.height = '';
      $.get('.stats-section').style.maxHeight = '0px';
    } else {
      // document.body.style.height = '665px';
      $.get('.stats-section').style.maxHeight = '1000px';
    }
  }
});

document.addEventListener("click", function (event) {
  if (event.target.classList.contains('modal-container')) {
    event.target.classList.add('display-none');
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

let dataTextAllTime = '';
let dataTextYearTime = '';
let sameDataText = '';

const formsElements =[fmDaysFrom, fmDaysTo, fmRateFrom, fmRateTo, fmLoansFrom, fmLoansTo, fmMaxCompanySum, fmInvestSum,
  smDaysFrom, smDaysTo, smRateFrom, smRateTo, smFdFrom, smFdTo, smProgressFrom,
  smProgressTo, smPriceFrom, smPriceTo, smClassFrom, smClassTo, smMaxCompanySum, smInvestSum];

formsElements.forEach(element => element.addEventListener('change', updateInvestSettings))
btnInvestOpen.addEventListener('click', openInvestPage);
btnInvestClose.addEventListener('click', closeInvestPage);

$.get('#fm-btn-update').addEventListener('click', updateFirstMarket);
$.get('#fm-btn-show').addEventListener('click', () => {opneModal('#fm-list'); fmCompanyShow(fmInvestCompanyArray, '#fm-list-ul')});
$.get('#fm-btn-stop').addEventListener('click', function() {fmCompanyUpdate = false});
$.get('#fm-list__btn-close').addEventListener('click', () => closeModal('#fm-list'));

$.get('#fmr-btn-update').addEventListener('click', updateFirstMarketReserv);
$.get('#fmr-btn-show').addEventListener('click', () => {opneModal('#fmr-list'); fmCompanyShow(fmrInvestCompanyArray, '#fmr-list-ul')});
$.get('#fmr-btn-stop').addEventListener('click', function() {fmrCompanyUpdate = false});
$.get('#fmr-list__btn-close').addEventListener('click', () => closeModal('#fmr-list'));

$.get('#sm-btn-update').addEventListener('click', updateSecondMarket);
$.get('#sm-btn-show').addEventListener('click', () => {opneModal('#sm-list'); smCompanyShow(smInvestCompanyArray, '#sm-list-ul')});
$.get('#sm-btn-stop').addEventListener('click', function() {smCompanyUpdate = false});
$.get('#sm-list__btn-close').addEventListener('click', () => closeModal('#sm-list'));

$.get("#support-section__btn-close").addEventListener("click", () => $.get("#support-section").classList.add("display-none"));
$.get('#marketMode').addEventListener('click', marketSwap);

function fmCompanyShow(arr, blockId) {
  const removeElement = index => arr.splice(index, 1);
  const list = $.get(`${blockId}`);
  list.innerHTML = ''; // очищаем текущий список
  function createListElement(element) {
    return `
        <header style="display: flex; margin-top: 6px;">
          <img class="list-element__img" src="https://jetlend.ru${element.preview_small_url === null ? element.image_url : element.preview_small_url}">
          <div style="display: flex; flex-direction: column; text-wrap: nowrap;">
            <a class="list-element__loan-name target-url" style="font-weight:600" href="https://jetlend.ru/invest/v3/company/${element.id}">${element.loan_name}</a>
            <span style="font-size: 14px">${element.loan_isin}</span>
            <span style="font-size: 14px">
              <span style="${element.rating.includes('A') ? 'color: limegreen;' : 
                          element.rating.includes('B') ? 'color: orange;' : 
                          'color: orangered;'} font-weight:600">${element.rating} 
              </span>, 
              <span style="${element.financial_discipline === 1 ? 'color: limegreen;' : 
                          element.financial_discipline <= 0.4 ? 'color: red;' : 
                          'color: orange;'} font-weight:600">ФД: ${(element.financial_discipline*100).toFixed(0)}%
              </span> 
            </span>
          </div>

          <div style="margin-left: auto">
            <span style="${element.company_investing_amount === null ? 'color: limegreen;' : 
                          element.company_investing_amount === '0.00' ? 'color: #8888e6;' : 'color: orange;'}
                          font-size: 14px; text-wrap: nowrap; font-weight:600; float: right">
                          ${element.company_investing_amount === null ? 'Заёмщика нет в портфеле' : 
                          element.company_investing_amount === '0.00' ? 'Займ в портфеле погашен' : 
                          `Компания в портфеле: ${toCurrencyFormat(element.company_investing_amount)}`}
            </span> 


            <div style="${element.investing_amount !== null ? 'color: orange;' : ''} font-size: 14px; font-weight: 600; float: right">
                        ${element.investing_amount !== null ? `Зарезервировано: ${toCurrencyFormat(element.investing_amount)}` : ''}
            </div>
            
          </div>

        </header>
        <main>
        <div style="margin-top: 5px">
          ${element.company}
        </div>
        <div style="margin-top: 5px">
            <span>
              <span>Ставка: <span style="font-weight:600">${(element.interest_rate*100).toFixed(2)}%</span>, срок: </span> 
              <span><span style="font-weight:600">${element.term}</span> ${daysEnding(element.term)} </span> 
            </span>        
        </div>
        <div style="margin-top: 5px">
          <span>Сумма: <span style="font-weight:600">${toShortCurrencyFormat(element.amount)}</span>, собрано: </span>
          <span style="font-weight:600">(${element.collected_percentage.toFixed(0)}%/100%)</span> </div>
        <div style="margin-top: 5px">
            <span>Выручка за год: <span style="font-weight:600">${toShortCurrencyFormat(element.revenueForPastYear)}</span>,</span>
            <span> прибыль за год: <span style="font-weight:600">${toShortCurrencyFormat(element.profitForPastYear)}</span></span> 
        </div>
        <div style="margin-top: 5px"> 
          <span>Дата регистрации: <span style="font-weight:600">${element.registrationDate} </span> </span> 
        </div>
        <div style="margin-top: 5px"> 
        <span>Адрес: ${element.address}</span> 
       </div>
          <div style="margin-top: 5px">
              <span>Деятельность: ${element.primaryCatergory}.</span>
          </div> 
          <div style="margin: 5px 0px 10px">
            <span>${element.site ? `<a class="target-url link" href="${element.site}">Перейти на сайт компании </a>` : 'Cайта нет '}/</span>
            <span>${element.profile ? `<a class="target-url link" href="${element.profile}"> Контур. Фокус</a>` : ' Контур. Фокуса нет'}</span>
        </div> 
        </main>
  `;
  }
  arr.forEach((element, index) => {
    const listItem = document.createElement('div');
    listItem.classList.add('list-element')
    listItem.innerHTML = createListElement(element); 
    listItem.addEventListener('click', async function() {
      const res = await fetchData("https://jetlend.ru/invest/api/requests/waiting");
      const load = document.createElement('div');
      load.classList.add('list-element__load-block');
      load.textContent = 'Загрузка...';
      console.log(load);
      listItem.appendChild(load);
      if (res.data) {
        const company = res.data.requests.find(item => item.id === element.id);
        const details = await fetchDetails(element.id);
        Object.assign(company, details);
        console.log(company);
        listItem.innerHTML = createListElement(company); 
        const buttons = document.createElement('div');
        buttons.classList.add('buttons-section')
        // const focus = document.createElement('span');
        // focus.innerHTML = `${element.profile ? `<a class="target-url btn" href="${element.profile}">Контур. Фокус</a>` : 'Контур. Фокуса нет'}`
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
          console.log(arr);
        }; 
        listItem.appendChild(buttons);
        // buttons.appendChild(focus);
        buttons.appendChild(removeButton); 
        listItem.style.filter = '';
      }
    })

    const buttons = document.createElement('div');
    buttons.classList.add('buttons-section')
    // const focus = document.createElement('span');
    // focus.innerHTML = `${element.profile ? `<a class="target-url btn" href="${element.profile}">Контур. Фокус</a>` : 'Контур. Фокуса нет'}`
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
      console.log(arr);
    }; 
    listItem.appendChild(buttons);
    // buttons.appendChild(focus);
    buttons.appendChild(removeButton); 
    list.appendChild(listItem); 
  });
}

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
    listItem.classList.add('list-element')
    listItem.innerHTML = `
    <div style="display: flex; margin-top: 6px;">
      <img class="list-element__img" src="https://jetlend.ru${element.preview_small_url === null ? element.image_url : element.preview_small_url}">
      <div style="display: flex; flex-direction: column; text-wrap: nowrap;">
        <a class="list-element__loan-name target-url" style="font-weight:600" href="https://jetlend.ru/invest/v3/company/${element.loan_id}">${element.loan_name}</a>
        <span style="font-size: 14px">${element.loan_isin}</span>
        <span style="font-size: 14px">
          <span style="${element.rating.includes('A') ? 'color: limegreen;' : 
                      element.rating.includes('B') ? 'color: orange;' : 
                      'color: orangered;'} font-weight:600">${element.rating} 
          </span>, 
          <span style="${element.financial_discipline === 1 ? 'color: limegreen;' : 
                      element.financial_discipline <= 0.4 ? 'color: red;' : 
                      'color: orange;'} font-weight:600">ФД: ${(element.financial_discipline*100).toFixed(0)}%
          </span>, 
          <span style="${element.loan_class === 0 ? 'color: limegreen;' : 
                      element.loan_class === 1 ? 'color: orange;' : 
                      'color: orangered;'} font-weight:600">Класс: ${element.loan_class}
          </span>  
        </span>
      </div>

      <div style="margin-left: auto">
        <span style="${element.invested_company_debt === null ? 'color: limegreen;' : 
                       element.invested_company_debt === 0 ? 'color: #8888e6;' :  'color: orange;'}
                       font-size: 14px; text-wrap: nowrap; font-weight:600; float: right">
                       ${(element.invested_company_debt === null ? 'Заёмщика нет в портфеле' : 
                       element.invested_company_debt === 0 ? 'Займ в портфеле погашен' : 
                       `Компания в портфеле: ${toCurrencyFormat(element.invested_company_debt)}`)}
        </span> 

        <div style="${element.invested_debt !== null ? 'color: orange;' : ''} font-size: 14px; font-weight: 600; float: right">
                  ${element.invested_debt !== null ? `Займ в портфеле: ${toCurrencyFormat(element.invested_debt)}` : ''}
        </div>
      </div>
    </div>
    <div style="margin: 5px 0">
      ${element.company}
    </div>
      <span>Ставка: 
        <span style="font-weight:600">${(element.interest_rate*100).toFixed(2)}% (${(element.ytm*100).toFixed(2)}%)
        </span>, минимальная цена: 
        <span style="font-weight:600">${(element.min_price*100).toFixed(2)}%</span>
      </span>     

    </div>
    <div style="margin-top: 5px">
      <span>Cрок: 
        <span style="font-weight:600">${element.term}</span> 
        <span style="font-weight:600">${daysEnding(element.term)}</span>, остаток:
        <span style="font-weight:600"> ${element.term_left} ${daysEnding(element.term_left)}</span>,
      </span> 
      <span> выплачено:
        <span style="font-weight:600">${(element.progress*100).toFixed(2)}%</span> 
      </span>
    </div>
    <div style="margin-top: 5px">
        <span>Выручка за год: <span style="font-weight:600">${toShortCurrencyFormat(element.revenueForPastYear)}</span>, </span>
        <span>прибыль за год: <span style="font-weight:600">${toShortCurrencyFormat(element.profitForPastYear)}</span>,</span> 
    </div>
    <div style="margin-top: 5px"> 
     <span>Дата регистрации: <span style="font-weight:600">${element.registrationDate} </span> </span> 
    </div>
    <div style="margin-top: 5px"> 
    <span>Адрес: ${element.address}</span> 
   </div>
    <div style="margin-top: 5px">
        <span>Деятельность: ${element.primaryCatergory}.</span>
    </div> 
    <div style="margin: 5px 0px 10px">
      <span>${element.site ? `<a class="target-url link" href="${element.site}">Перейти на сайт компании </a>` : 'Cайта нет '}/</span>
      <span>${element.profile ? `<a class="target-url link" href="${element.profile}"> Контур. Фокус</a>` : ' Контур. Фокуса нет'}</span>
    </div> 
    `; 
    const buttons = document.createElement('div');
    buttons.classList.add('buttons-section')
    // const focus = document.createElement('span');
    // focus.innerHTML = `${element.profile ? `<a class="target-url btn" href="${element.profile}">Контур. Фокус</a>` : 'Контур. Фокуса нет'}`
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
      console.log(arr);
    }; 
    listItem.appendChild(buttons);
    // buttons.appendChild(focus);
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

chrome.storage.local.get("investSettings", function(data) {
  if (data.investSettings) {
    if (data.investSettings.fmDaysFrom) {
      fmDaysFrom.value = data.investSettings.fmDaysFrom;
    }
    if (data.investSettings.fmDaysTo) {
      fmDaysTo.value = data.investSettings.fmDaysTo
    }
    if (data.investSettings.fmRateFrom) {
      fmRateFrom.value = data.investSettings.fmRateFrom
    }
    if (data.investSettings.fmRateTo) {
      fmRateTo.value = data.investSettings.fmRateTo
    }
    if (data.investSettings.fmLoansFrom) {
      fmLoansFrom.value = data.investSettings.fmLoansFrom
    }
    if (data.investSettings.fmLoansTo) {
      fmLoansTo.value = data.investSettings.fmLoansTo
    }
    if (data.investSettings.fmMaxCompanySum) {
      fmMaxCompanySum.value = data.investSettings.fmMaxCompanySum
    }
    if (data.investSettings.fmInvestSum) {
      fmInvestSum.value = data.investSettings.fmInvestSum
    }
    // Вторичка
    if (data.investSettings.smDaysFrom) {
      smDaysFrom.value = data.investSettings.smDaysFrom
    }
    if (data.investSettings.smDaysTo) {
      smDaysTo.value = data.investSettings.smDaysTo
    }
    if (data.investSettings.smRateFrom) {
      smRateFrom.value = data.investSettings.smRateFrom
    }
    if (data.investSettings.smRateTo) {
      smRateTo.value = data.investSettings.smRateTo
    }
    if (data.investSettings.smFdFrom ) {
      smFdFrom.value = data.investSettings.smFdFrom 
    }
    if (data.investSettings.smFdTo) {
      smFdTo.value = data.investSettings.smFdTo
    }
    if (data.investSettings.smProgressFrom) {
      smProgressFrom.value = data.investSettings.smProgressFrom
    }
    if (data.investSettings.smProgressTo) {
      smProgressTo.value = data.investSettings.smProgressTo
    }
    if (data.investSettings.smClassFrom) {
      smClassFrom.value = data.investSettings.smClassFrom 
    }
    if (data.investSettings.smClassTo) {
      smClassTo.value = data.investSettings.smClassTo
    }
    if (data.investSettings.smMaxCompanySum) {
      smMaxCompanySum.value = data.investSettings.smMaxCompanySum
    }
    if (data.investSettings.smPriceFrom) {
      smPriceFrom.value = data.investSettings.smPriceFrom
    }
    if (data.investSettings.smPriceTo ) {
      smPriceTo.value = data.investSettings.smPriceTo 
    }
    if (data.investSettings.smInvestSum) {
      smInvestSum.value = data.investSettings.smInvestSum
    }
  }
})

async function mainUpdateFunction() {
  lastUpdateDateTag.innerHTML += `<span title="Загузка актуальных данных..." style="cursor:pointer">&#9203;</span>`;

  const userStatsUrl = "https://jetlend.ru/invest/api/account/details";
  const userDataUrl = "https://jetlend.ru/invest/api/account/info";
  const platformStatsUrl = "https://jetlend.ru/invest/api/public/stats";
  const amountCompanyUrl = "https://jetlend.ru/invest/api/portfolio/distribution/overview";
  const xirrUrl = "https://jetlend.ru/invest/api/account/notifications/v3?filter=%5B%7B%22values%22%3A%5B%22110%22%2C%22120%22%5D%2C%22field%22%3A%22event_type%22%7D%5D&limit=100&offset=0&sort_dir=asc&sort_field=date"

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

    const balance = balanceStats.total;               // Баланс
    const cleanBalance = balance - balanceStats.nkd;  // Баланс без НПД
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
      <div>
        <div style="font-size:16px">Статистика платформы</div>
        <div>Ставка на сборе (за всё время / за 30 дней): ${toPercentFormat(platformObj.data.average_interest_rate)} / ${toPercentFormat(platformObj.data.average_interest_rate_30days)}</div>
        <div>Минимальная и максимальная ставки:  ${toPercentFormat(platformObj.data.min_interest_rate)} / ${toPercentFormat(platformObj.data.max_interest_rate)}</div>
        <div>Средняя ставка на вторичном рынке (30 дней): ${toPercentFormat(platformObj.data.average_market_interest_rate)}</div>
        <div>Дефолтность (за всё время / за 30 дней): ${toPercentFormat(platformObj.data.default_rate_all)} / ${toPercentFormat(platformObj.data.default_rate)}</div>
      </div>
      <br>
      <div>
        <div style="font-size:16px">Прочее</div>
        <div>Айди: ${userObj.data.id}</div>
        <div>Дата регистрации: ${formatReadableDate(userObj.data.register_date)}</div>
        <div>Срок инвестирования: ${getInvestDays()}</div>
        <div>Компаний в портфеле: ${amountCompany.data.data.companies_count}</div>
      </div>
      <footer style="
      color: gray;
      font-size: 12px;
      padding: 5px 0 5px;
      text-align: center;">JetLend Extension v${version}. 
      <span id="support-btn" style="text-decoration:underline; cursor:pointer; user-select: none;">Поддержать разработку.</span>
      </footer>
    </div>
    `

    dataTextAllTime = 
    `<div class="container">
      <div>
        <span style="font-size:16px">Статистика за </span><span class="swap">всё время</span>
        <div>Процентный доход: <span style="color:${decorNumber(allTime.interest)}">${numberSign(allTime.interest)}${toCurrencyFormat(allTime.interest)}<span></div>
        <div>НПД (ожидаемый): <span style="color:${decorNumber(balanceStats.nkd + balanceStats.nkd_ndfl)}">${numberSign(balanceStats.nkd + balanceStats.nkd_ndfl)}${toCurrencyFormat(balanceStats.nkd + balanceStats.nkd_ndfl)}</span></div>
        <div>Пени: <span style="color:${decorNumber(allTime.fine)}">${numberSign(allTime.fine)}${toCurrencyFormat(allTime.fine)}</span></div>
        <div>Бонусы: <span style="color:${decorNumber(allTime.bonus)}">${numberSign(allTime.bonus)}${toCurrencyFormat(allTime.bonus)}</span></div>
        <div>Реферальный доход: <span style="color:${decorNumber(allTime.reffBonus)}">${numberSign(allTime.reffBonus)}${toCurrencyFormat(allTime.reffBonus)}</span></div>
        <div>Доход на вторичном рынке: <span style="color:${decorNumber(allTime.sale)}">${numberSign(allTime.sale)}${toCurrencyFormat(allTime.sale)}</span></div>
        <div>Потери: <span style="color:${decorNumber(-allTime.loss)}">${numberSign(-allTime.loss)}${toCurrencyFormat(-allTime.loss)}</span></div>
        <div>НДФЛ: <span style="color:${decorNumber(-allTime.ndfl)}">${numberSign(-allTime.ndfl)}${toCurrencyFormat(-allTime.ndfl)}</span></div>
        <div>НДФЛ ожидаемый: <span style="color:${decorNumber(-balanceStats.nkd_ndfl)}">${numberSign(-balanceStats.nkd_ndfl)}${toCurrencyFormat(-balanceStats.nkd_ndfl)}</span></div>
        <div>Доход за вычетом НДФЛ: <span style="color:${decorNumber(allTime.profitWithoutNdfl)}">${numberSign(allTime.profitWithoutNdfl)}${toCurrencyFormat(allTime.profitWithoutNdfl)}</span></div>
        <div>Свободные средства: <span style="color:${decorNumber(balanceStats.free)}">${numberSign(balanceStats.free)}${toCurrencyFormat(balanceStats.free)}</span></div>
        <div>XIRR (с НПД / без НПД): ${toPercentFormat(allTime.xirr('npd'))} / ${toPercentFormat(allTime.xirr('clean'))}</div>
      </div>
      <br>
    ${innerHTML = sameDataText}
    `

    dataTextYearTime = 
    `<div class="container">
      <div>
        <span style="font-size:16px">Статистика за </span><span class="swap">год</span>
        <div>Процентный доход: <span style="color:${decorNumber(yearTime.interest)}">${numberSign(yearTime.interest)}${toCurrencyFormat(yearTime.interest)}<span></div>
        <div>НПД (ожидаемый): <span style="color:${decorNumber(balanceStats.nkd + balanceStats.nkd_ndfl)}">${numberSign(balanceStats.nkd + balanceStats.nkd_ndfl)}${toCurrencyFormat(balanceStats.nkd + balanceStats.nkd_ndfl)}</span></div>
        <div>Пени: <span style="color:${decorNumber(yearTime.fine)}">${numberSign(yearTime.fine)}${toCurrencyFormat(yearTime.fine)}</span></div>
        <div>Бонусы: <span style="color:${decorNumber(yearTime.bonus)}">${numberSign(yearTime.bonus)}${toCurrencyFormat(yearTime.bonus)}</span></div>
        <div>Реферальный доход: <span style="color:${decorNumber(yearTime.reffBonus)}">${numberSign(yearTime.reffBonus)}${toCurrencyFormat(yearTime.reffBonus)}</span></div>
        <div>Доход на вторичном рынке: <span style="color:${decorNumber(yearTime.sale)}">${numberSign(yearTime.sale)}${toCurrencyFormat(yearTime.sale)}</span></div>
        <div>Потери: <span style="color:${decorNumber(-yearTime.loss)}">${numberSign(-yearTime.loss)}${toCurrencyFormat(-yearTime.loss)}</span></div>
        <div>НДФЛ: <span style="color:${decorNumber(-yearTime.ndfl)}">${numberSign(-yearTime.ndfl)}${toCurrencyFormat(-yearTime.ndfl)}</span></div>
        <div>НДФЛ ожидаемый: <span style="color:${decorNumber(-balanceStats.nkd_ndfl)}">${numberSign(-balanceStats.nkd_ndfl)}${toCurrencyFormat(-balanceStats.nkd_ndfl)}</span></div>
        <div>Доход за вычетом НДФЛ: <span style="color:${decorNumber(yearTime.profitWithoutNdfl)}">${numberSign(yearTime.profitWithoutNdfl)}${toCurrencyFormat(yearTime.profitWithoutNdfl)}</span></div>
        <div>Свободные средства: <span style="color:${decorNumber(balanceStats.free)}">${numberSign(balanceStats.free)}${toCurrencyFormat(balanceStats.free)}</span></div>
        <div>XIRR (с НПД / без НПД): ${toPercentFormat(yearTime.xirr('npd'))} / ${toPercentFormat(yearTime.xirr('clean'))}</div>
      </div>
      <br>
    ${innerHTML = sameDataText}
    `

    function updateProfit() {
      if (investDays() < 365) {
        incomeTitle.innerHTML = `<span>Доход за ${getInvestDays()} (без НПД / чистый доход)</span> <span>Доходность</span>`;
        incomeTag.innerHTML = `<span>${toCurrencyFormat(allTime.profitWithoutNpd)} / ${toCurrencyFormat(allTime.cleanProfit)}</span> <span><img src="/img/arrow.svg">${toPercentFormat(allTime.percentProfit)}</span>`;  
      } else if (timePeriod == "allTime") {
        incomeTitle.innerHTML = `<span>Доход за всё время (без НПД / чистый доход)</span> <span>Доходность</span>`;
        incomeTag.innerHTML = `<span>${toCurrencyFormat(allTime.profitWithoutNpd)} / ${toCurrencyFormat(allTime.cleanProfit)}</span> <span><img src="/img/arrow.svg">${toPercentFormat(allTime.percentProfit)}</span>`;  
      } else if (timePeriod == "year" && investDays() >= 365) {
        incomeTitle.innerHTML = `<span>Доход за год (без НПД / чистый доход)</span> <span>Доходность</span>`;
        incomeTag.innerHTML = `<span>${toCurrencyFormat(yearTime.profitWithoutNpd)} / ${toCurrencyFormat(yearTime.cleanProfit)}</span> <span><img src="/img/arrow.svg">${toPercentFormat(yearTime.percentProfit)}</span>`;  
      }
    }

    lastUpdateDateTag.innerHTML = `Все активы <span>(${getUpdateTime((new Date).getTime())})</span>`;
    balanceTitle.innerHTML = `<span>Активы / Активы без НПД</span> <span>Ставка на сборе</span>`;
    balanceTag.innerHTML = `<span>${toCurrencyFormat(balance)} / ${toCurrencyFormat(cleanBalance)}</span><span>${toPercentFormat(platformObj.data.average_interest_rate_30days)}</span>`;
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
      $.get("#support-btn").addEventListener("click", () => $.get("#support-section").classList.remove("display-none"));
    }
    
  // Сохранение данных
  const cache = {
    balanceTitle: balanceTitle.querySelectorAll('span')[0].textContent,            // Текст заголовка активов (согласно настройкам)
    balanceText: balanceTag.querySelectorAll('span')[0].textContent,               // Текст активов (согласно настройкам)

    collectionIncomeTitle: balanceTitle.querySelectorAll('span')[1].textContent,   // Текст заголовка ставки на сборе
    collectionIncomeText: balanceTag.querySelectorAll('span')[1].textContent,      // Текст ставки на сборе

    incomeTitle: incomeTitle.querySelectorAll('span')[0].textContent,              // Текст заголовка дохода (согласно настройкам)
    incomeText: incomeTag.querySelectorAll('span')[0].textContent,                 // Текст дохода (согласно настройкам)

    incomePercent: incomeTitle.querySelectorAll('span')[1].textContent,            // Текст заголовка процентного дохода
    percentIncomeNum: incomeTag.querySelectorAll('span')[1].textContent,           // Процентный доход
    
    updateTime: new Date().getTime() // Текущее время
  };
  chrome.storage.local.set({ cacheJetlend: cache });
  }

  

  if (userStats.error) {
    $.get('.main-section__stats').innerHTML = `<div style="margin: 64px 112px; text-wrap: nowrap;">Авторизуйтесь на сайте</div>`;
  }
}

mainUpdateFunction();
setInterval(mainUpdateFunction, 60000);


chrome.storage.local.get("cacheJetlend", function (result) {
  const data = result.cacheJetlend;
  if (data) {
   
    lastUpdateDateTag.innerHTML = `Все активы <span>(${getUpdateTime(data.updateTime)}) <span title="Загузка актуальных данных..." style="cursor:pointer">&#9203;</span></span>`;
    balanceTitle.innerHTML = `<span>${data.balanceTitle}</span> <span>${data.collectionIncomeTitle}</span>`;
    balanceTag.innerHTML = `<span class="load-opacity-animation">${data.balanceText}</span> <span class="load-opacity-animation">${data.collectionIncomeText}</span>`;
    incomeTitle.innerHTML = `<span>${data.incomeTitle}</span> <span>${data.incomePercent}</span>`;
    incomeTag.innerHTML = `<span class="load-opacity-animation">${data.incomeText}</span> <span class="load-opacity-animation"><img src="/img/arrow.svg">${data.percentIncomeNum}</span>`;
  }
});

// Обновление списка компаний (первичка)
async function updateFirstMarket() {
  fmCompanyUpdate = true;
  $.get('#fm-numOfSortedCompany').textContent = `Загрузка...`;
  $.get('#fm-btn-update').classList.add('display-none');
  $.get('#fm-btn-show').classList.add('display-none');
  $.get('#fm-btn-stop').classList.remove('display-none');
  $.get('#fm-numOfAllCompany').textContent = 'Загрузка...';
  const res = await fetchData("https://jetlend.ru/invest/api/requests/waiting");

  if (res.data) {
    $.get('#fm-numOfAllCompany').textContent = res.data.requests.length;
    const valueToNum = value => parseFloat((parseFloat((value).toString().replace(',', '.'))/100).toFixed(4));
    const sorted = res.data.requests.filter(obj => (obj.collected_percentage !== 100) /* Полоска сбора не заполнена (меньше 100%) */ 
      && (obj.investing_amount === null) /* Резервация (нет) */ 
      && (obj.company_investing_amount === null || obj.company_investing_amount === "0.00") /* Есть заёмщик портфеле (нет) */
      && (obj.term >= parseInt(fmDaysFrom.value) && obj.term <= parseInt(fmDaysTo.value)) /* Срок займа */
      && (obj.interest_rate >= valueToNum(fmRateFrom.value) && obj.interest_rate <= valueToNum(fmRateTo.value)) /* Процент займа (от 20 до 100) */ 
      && (obj.loan_order >= parseFloat(fmLoansFrom.value) && obj.loan_order <= parseFloat(fmLoansTo.value))  /* Какой по счёту займ на платформе */
      && (obj.company_investing_amount <= parseFloat(fmMaxCompanySum.value)) /* Сумма в одного заёмщика */
      ) 

    async function updateArray() {
      let count = 0;
      let secondSort = [];
      for (const element of sorted) {
        const details = await fetchDetails(element.id);
        Object.assign(element, details);
        count += 1;
        $.get('#fm-numOfSortedCompany').textContent = `Загрузка... Проверяем ФД... (${count}/${sorted.length})`;
        if (element.financial_discipline === 1) { // ФД 100%
          secondSort.push(element);
        }
        if (!fmCompanyUpdate) {
          fmCompanyUpdate = true;
          break;
        }
      }
      console.log('Массив доступных для инвестиций компаний', secondSort); // Вывод обновленного массива
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
      && (obj.investing_amount !== null) /* Резервация (нет) */ 
      ) 

    async function updateArray() {
      let count = 0;
      let secondSort = [];
      for (const element of sorted) {
        const details = await fetchDetails(element.id);
        Object.assign(element, details);
        count += 1;
        secondSort.push(element);
        $.get('#fmr-numOfSortedCompany').textContent = `Загрузка... Проверяем ФД... (${count}/${sorted.length})`;
        if (!fmrCompanyUpdate) {
          fmrCompanyUpdate = true;
          break;
        }
      }
      console.log('Массив зарезервированных компаний', secondSort); // Вывод обновленного массива
      fmrInvestCompanyArray = secondSort;
      $.get('#fmr-numOfSortedCompany').textContent = `Загружено: ${secondSort.length} ${getZaimEnding(secondSort.length)} (всего:  ${sorted.length} ${getZaimEnding(sorted.length)})`;
      $.get('#fmr-btn-update').classList.remove('display-none');
      $.get('#fmr-btn-update').textContent = '(Обновить)';
      if (fmrInvestCompanyArray.length >= 1) {
        $.get('#fmr-btn-show').classList.remove('display-none');
      }
      $.get('#fmr-btn-stop').classList.add('display-none');
    }
    updateArray()
  };
}

// Обновление списка компаний (вторичка)
async function updateSecondMarket() {
  smCompanyUpdate = true;
  $.get('#sm-numOfSortedCompany').textContent = `Загрузка...`;
  $.get('#sm-btn-update').classList.add('display-none');
  $.get('#sm-btn-show').classList.add('display-none');
  $.get('#sm-btn-stop').classList.remove('display-none');
  $.get('#sm-numOfAllCompany').textContent = 'Загрузка...';

  const res = await fetchData("https://jetlend.ru/invest/api/exchange/loans?limit=10000&offset=0&sort_dir=desc&sort_field=ytm");

  if (res.data) {
    $.get('#sm-numOfAllCompany').textContent = res.data.data.length;
    const valueToPercent = value => parseFloat((parseFloat((value).toString().replace(',', '.'))/100).toFixed(4)); // '12,3456' => 0.1234
    const sorted = res.data.data.filter(obj => (obj.invested_debt === null || obj.invested_debt === 0.00) /* Есть в портфеле (нет) */
      && (obj.term_left >= parseFloat(smDaysFrom.value) && obj.term_left <= parseFloat(smDaysTo.value)) /* Остаток срока займа */
      // && (obj.interest_rate >= 0.15 && obj.interest_rate <= 1) /* Изначальный процент займа (от 20 до 100) */
      && (obj.ytm >= valueToPercent(smRateFrom.value) && obj.ytm <= valueToPercent(smRateTo.value)) /* Эффективная ставка (от 20 до 100) */
      // && (obj.loan_order >= 1 && obj.loan_order <= 5)  /* Какой по счёту займ на платформе */
      && (obj.progress >= valueToPercent(smProgressFrom.value) && obj.progress <= valueToPercent(smProgressTo.value)) /* Выплачено (прогресс в %) */
      && (obj.loan_class >= parseInt(smClassFrom.value) && obj.loan_class <= parseInt(smClassTo.value)) /* Класс займа */
      && (obj.min_price >= valueToPercent(smPriceFrom.value) && obj.min_price <= valueToPercent(smPriceTo.value)) /* Мин прайс от 50% до 90% */
      && (obj.invested_company_debt <= parseFloat(smMaxCompanySum.value)) /* Сумма в одного заёмщика */
      && (obj.status === "active")); 

    async function updateArray() {
      let count = 0;
      let secondSort = [];
      for (const element of sorted) {
        const details = await fetchDetails(element.loan_id);
        Object.assign(element, details);
        count += 1;
        $.get('#sm-numOfSortedCompany').textContent = `Загрузка... Проверяем ФД... (${count}/${sorted.length})`;
        if (element.financial_discipline >= valueToPercent(smFdFrom.value) && element.financial_discipline <= valueToPercent(smFdTo.value) /* ФД от до */) {
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
      console.log('Вторая сортировка', smInvestCompanyArray);
    }
    updateArray();
    console.log('Первая сортировка', sorted);
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
    console.log('Проверка пройдена');
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
  } else {
    console.log('Не удовлетворяет условиям');
  };
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
    console.log('Проверка пройдена');
    function numOfCuts() {
      let canInvest = Math.floor(valueToInt(smInvestSumAll.value) / valueToInt(smInvestSum.value));
      if (canInvest > smInvestCompanyArray.length) {
        return smInvestCompanyArray.length;
      } else {
        return canInvest;
      }
    }
    const sliceArray = smInvestCompanyArray.slice(0, numOfCuts());
    const arrOfCompanyId = sliceArray.map(obj => obj.loan_id);
    chrome.storage.local.set({smInvest: {
      array: arrOfCompanyId, 
      sum: valueToInt(smInvestSum.value),
      sumAll: valueToInt(smInvestSumAll.value), 
      minPrice: valueToPercent(smPriceFrom.value), 
      maxPrice: valueToPercent(smPriceTo.value)}});
    chrome.tabs.create({ url: "https://jetlend.ru/invest/v3/?state=login", active: true });
    // chrome.windows.create({ url: "https://jetlend.ru/invest/v3/?state=login", type: 'popup', focused: true });
  } else {
    console.log('Не удовлетворяет условиям');
  };
})