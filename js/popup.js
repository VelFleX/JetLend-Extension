let timePeriod = "";

let fmInvestCompanyArray = [];
let smInvestCompanyArray = [];
let freeBalance = 0;

const formsElements =[fmDaysFrom, fmDaysTo, fmRateFrom, fmRateTo, fmLoansFrom, fmLoansTo, fmInvestSum,
  smDaysFrom, smDaysTo, smRateFrom, smRateTo, smFdFrom, smFdTo, smProgressFrom,
  smProgressTo, smPriceFrom, smPriceTo, smInvestSum];

formsElements.forEach(element => element.addEventListener('change', updateInvestSettings))
btnInvestOpen.addEventListener('click', openInvestPage);
btnInvestClose.addEventListener('click', closeInvestPage);

id('fm-btn-update').addEventListener('click', updateFirstMarket);
id('fm-btn-stop').addEventListener('click', function() {fmCompanyUpdate = false});

id('sm-btn-update').addEventListener('click', updateSecondMarket);
id('sm-btn-stop').addEventListener('click', function() {smCompanyUpdate = false});
$(".support-section__btn-close").addEventListener("click", closeSupportPage);
id('marketMode').addEventListener('click', marketSwap);


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
      const lastTwoDigits = days % 100;
      const text = days === 1 ? ' день' : (lastTwoDigits >= 11 && lastTwoDigits <= 14) ? ' дней' : (lastTwoDigits % 10 === 1) ? ' день' : (lastTwoDigits % 10 >= 2 && lastTwoDigits % 10 <= 4) ? ' дня' : ' дней';
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

    $('.invest-section__title-sum').textContent = `(Свободно: ${toCurrencyFormat(balanceStats.free)})`;
    fmInvestSumAll.value = balanceStats.free;
    smInvestSumAll.value = balanceStats.free;

    const sameDataText = `
    <div style="font-size:16px">Статистика платформы</div>
    <div>Ставка на сборе (за всё время / за 30 дней): ${toPercentFormat(platformObj.data.average_interest_rate)} / ${toPercentFormat(platformObj.data.average_interest_rate_30days)}</div>
    <div>Минимальная и максимальная ставки:  ${toPercentFormat(platformObj.data.min_interest_rate)} / ${toPercentFormat(platformObj.data.max_interest_rate)}</div>
    <div>Средняя ставка на вторичном рынке (30 дней): ${toPercentFormat(platformObj.data.average_market_interest_rate)}</div>
    <div>Дефолтность (за всё время / за 30 дней): ${toPercentFormat(platformObj.data.default_rate_all)} / ${toPercentFormat(platformObj.data.default_rate)}</div>
    <br>
    <div style="font-size:16px">Прочее</div>
    <div>Айди: ${userObj.data.id}</div>
    <div>Дата регистрации: ${formatReadableDate(userObj.data.register_date)}</div>
    <div>Срок инвестирования: ${getInvestDays()}</div>
    <div>Компаний в портфеле: ${amountCompany.data.data.companies_count}</div>
    <footer style="
    color: gray;
    font-size: 12px;
    padding: 5px 0 5px;
    text-align: center;
">JetLend Extension v${version}. <span id="support-btn" style="text-decoration:underline; cursor:pointer; user-select: none;">Поддержать разработку.</span></footer>
    `

    const dataTextAllTime = 
    `
    <div style="font-size:16px">Статистика за</div>
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
    <br>
    ${innerHTML = sameDataText}
    `

    const dataTextYearTime = 
    `
    <div style="font-size:16px">Статистика за</div>
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
    <br>
    ${innerHTML = sameDataText}
    `

    function updateProfit() {
      if (timePeriod == "allTime") {
        if (investDays() < 365) {
          incomeTitle.innerHTML = `<span>Доход за ${getInvestDays()} (без НПД / чистый доход)</span> <span>Доходность</span>`;
        } else {
          incomeTitle.innerHTML = `<span>Доход за всё время (без НПД / чистый доход)</span> <span>Доходность</span>`;
        }
        incomeTag.innerHTML = `<span>${toCurrencyFormat(allTime.profitWithoutNpd)} / ${toCurrencyFormat(allTime.cleanProfit)}</span> <span><img src="/img/arrow.svg">${toPercentFormat(allTime.percentProfit)}</span>`;  
      
        $('.income__value span').addEventListener("click", function() {
          if(document.body.classList.contains('bigBody')) {
            document.body.classList.remove('bigBody');
          } else {
            document.body.classList.add('bigBody');
          }
        });
      } else if (timePeriod == "year" && investDays() >= 365) {
        incomeTitle.innerHTML = `<span>Доход за год (без НПД / чистый доход)</span> <span>Доходность</span>`;
        incomeTag.innerHTML = `<span>${toCurrencyFormat(yearTime.profitWithoutNpd)} / ${toCurrencyFormat(yearTime.cleanProfit)}</span> <span><img src="/img/arrow.svg">${toPercentFormat(yearTime.percentProfit)}</span>`;  
      
        $('.income__value span').addEventListener("click", function() {
          if(document.body.classList.contains('bigBody')) {
            document.body.classList.remove('bigBody');
          } else {
            document.body.classList.add('bigBody');
          }
        });
      }
    }

    lastUpdateDateTag.innerHTML = `Все активы <span>(${getUpdateTime((new Date).getTime())})</span>`;
    balanceTitle.innerHTML = `<span>Активы / Активы без НПД</span> <span>Ставка на сборе</span>`;
    balanceTag.innerHTML = `<span>${toCurrencyFormat(balance)} / ${toCurrencyFormat(cleanBalance)}</span><span>${toPercentFormat(platformObj.data.average_interest_rate_30days)}</span>`;
    updateProfit();
    
    if (timePeriod == "year" && investDays() >= 365) {
      statsSection.innerHTML = dataTextYearTime;
      swapBtn.textContent = 'год';
    } else if (timePeriod == "allTime") {
      statsSection.innerHTML = dataTextAllTime;
      swapBtn.textContent = 'всё время';
    }
    
    if (swapBtn.classList.contains('display-none')) {
      swapBtn.classList.remove('display-none');
      if (investDays() < 365) {
        swapBtn.textContent = getInvestDays();
        swapBtn.style.textDecoration = 'none';
        swapBtn.style.userSelect = 'auto';
        swapBtn.style.cursor = 'text';
      }
    } 
    
    if (investDays() >= 365) {
      if (!swapBtn.clickListenerAdded) {
        swapBtn.addEventListener('click', function() {
          if(swapBtn.textContent == 'всё время') {
            swapBtn.textContent = 'год'
            statsSection.innerHTML = dataTextYearTime;
          } else if (swapBtn.textContent == 'год') {
            swapBtn.textContent = 'всё время'
            statsSection.innerHTML = dataTextAllTime;
          }
        });
        swapBtn.clickListenerAdded = true;
      }
    } else {
      statsSection.innerHTML = dataTextAllTime;
    }

    if (!id("support-btn").clickListenerAdded) {
      id("support-btn").addEventListener("click", openSupportPage);
      swapBtn.clickListenerAdded = true;
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
    $('.main-section').innerHTML = `<div style="margin: 64px 112px; text-wrap: nowrap;">Авторизуйтесь на сайте</div>`;
  }
}

mainUpdateFunction();
setInterval(mainUpdateFunction, 60000);


chrome.storage.local.get("cacheJetlend", function (result) {
  const data = result.cacheJetlend;
  if (data) {
   
    lastUpdateDateTag.innerHTML = `Все активы <span>(${getUpdateTime(data.updateTime)}) <span title="Загузка актуальных данных..." style="cursor:pointer">&#9203;</span></span>`;
    balanceTitle.innerHTML = `<span>${data.balanceTitle}</span> <span>${data.collectionIncomeTitle}</span>`;
    balanceTag.innerHTML = `<span>${data.balanceText}</span> <span>${data.collectionIncomeText}</span>`;
    incomeTitle.innerHTML = `<span>${data.incomeTitle}</span> <span>${data.incomePercent}</span>`;
    incomeTag.innerHTML = `<span>${data.incomeText}</span> <span><img src="/img/arrow.svg">${data.percentIncomeNum}</span=>`;

    $('.income__value span').addEventListener("click", function() {
      if(document.body.classList.contains('bigBody')) {
        document.body.classList.remove('bigBody');
      } else {
      document.body.classList.add('bigBody');
      }
    });
  }
});

// Обновление списка компаний (первичка)
async function updateFirstMarket() {
  fmCompanyUpdate = true;
  id('fm-numOfSortedCompany').textContent = `Загрузка...`;
  id('fm-btn-update').classList.add('display-none');
  id('fm-btn-stop').classList.remove('display-none');

  const res = await fetchData("https://jetlend.ru/invest/api/requests/waiting");

  if (res.data) {
    const valueToNum = value => parseFloat((parseFloat((value).toString().replace(',', '.'))/100).toFixed(4));
    const sorted = res.data.requests.filter(obj => (obj.collected_percentage !== 100 /* Полоска сбора не заполнена (меньше 100%) */) 
      && (obj.investing_amount === null /* Резервация (нет) */) 
      && (obj.company_investing_amount === null || obj.company_investing_amount === "0.00" /* Есть в портфеле (нет) */)
      && (obj.term >= fmDaysFrom.value && obj.term <= fmDaysTo.value /* Срок займа */)
      && (obj.interest_rate >= valueToNum(fmRateFrom.value) && obj.interest_rate <= valueToNum(fmRateTo.value) /* Процент займа (от 20 до 100) */) 
      && (obj.loan_order >= fmLoansFrom.value && obj.loan_order <= fmLoansTo.value  /* Какой по счёту займ на платформе */))
    
    async function fetchDetails(companyId) {
      const response = await fetchData(`https://jetlend.ru/invest/api/requests/${companyId}/details`);
      if (response.data) {
        return response.data.data.details.financial_discipline;
      } else {
        console.log('Что-то пошло не так');
      }
    }

    async function updateArray() {
      let count = 0;
      let secondSort = [];
      for (const element of sorted) {
        const fd = await fetchDetails(element.id);
        element.financial_discipline = fd;
        count += 1;
        id('fm-numOfSortedCompany').textContent = `Загрузка... Проверяем ФД... (${count}/${sorted.length})`;
        if (fd === 1) {
          secondSort.push(element);
        }
        if (!fmCompanyUpdate) {
          fmCompanyUpdate = true;
          break;
        }
      }
      console.log('Массив доступных для инвестиций компаний', secondSort); // Вывод обновленного массива
      id('fm-numOfSortedCompany').textContent = `Доступно: ${secondSort.length} ${getZaimEnding(secondSort.length)} `;
      id('fm-btn-update').classList.remove('display-none');
      id('fm-btn-stop').classList.add('display-none');
      fmInvestCompanyArray = secondSort;
    }
    updateArray()
  };
}
updateFirstMarket();

// Распределение средств (первичка)
id('firstMarketSubmit').addEventListener('click', function() {
  const valueToInt = value => parseInt((value).toString().replace(',', '.'));

  if (id('fmInvestAgree').checked 
    && valueToInt(fmInvestSum.value) <= freeBalance 
    && valueToInt(fmInvestSum.value) >= 100 
    && !id('fm-numOfSortedCompany').textContent.includes("Загрузка...")
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
    chrome.tabs.create({ url: "https://jetlend.ru/invest/v3/?state=login" });
  } else {
    console.log('Не удовлетворяет условиям');
  };
})

// Распределение средств (вторичка)
id('secondMarketSubmit').addEventListener('click', function() {
  const valueToInt = value => parseInt((value).toString().replace(',', '.'));
  const valueToPercent = value => parseFloat((parseFloat((value).toString().replace(',', '.'))/100).toFixed(4));
  if (id('smInvestAgree').checked 
    && valueToInt(smInvestSum.value) <= freeBalance 
    && valueToInt(smInvestSum.value) >= 100 
    && !id('sm-numOfSortedCompany').textContent.includes("Загрузка...")
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
  } else {
    console.log('Не удовлетворяет условиям');
  };
})


















// Обновление списка компаний (вторичка)
async function updateSecondMarket() {
  smCompanyUpdate = true;
  id('sm-numOfSortedCompany').textContent = `Загрузка...`;
  id('sm-btn-update').classList.add('display-none');
  id('sm-btn-stop').classList.remove('display-none');

  const res = await fetchData("https://jetlend.ru/invest/api/exchange/loans?limit=10000&offset=0&sort_dir=desc&sort_field=ytm");

  if (res.data) {
    const valueToPercent = value => parseFloat((parseFloat((value).toString().replace(',', '.'))/100).toFixed(4)); // '12,3456' => 0.1234
    const sorted = res.data.data.filter(obj => (obj.invested_debt === null || obj.invested_debt === "0.00") /* Есть в портфеле (нет) */
      && (obj.term_left >= smDaysFrom.value && obj.term_left <= smDaysTo.value) /* Остаток срока займа */
      // && (obj.interest_rate >= 0.15 && obj.interest_rate <= 1) /* Изначальный процент займа (от 20 до 100) */
      && (obj.ytm >= valueToPercent(smRateFrom.value) && obj.ytm <= valueToPercent(smRateTo.value)) /* Эффективная ставка (от 20 до 100) */
      // && (obj.loan_order >= 1 && obj.loan_order <= 5)  /* Какой по счёту займ на платформе */
      && (obj.progress >= valueToPercent(smProgressFrom.value) && obj.progress <= valueToPercent(smProgressTo.value)) /* Выплачено (прогресс в %) */
      && (obj.min_price >= valueToPercent(smPriceFrom.value) && obj.min_price <= valueToPercent(smPriceTo.value)) /* Мин прайс от 50% до 90% */
      && (obj.status === "active")) 
  

    async function fetchDetails(companyId) {
      const response = await fetchData(`https://jetlend.ru/invest/api/requests/${companyId}/details`);
      if (response.data) {
        return response.data.data.details.financial_discipline;
      } else {
        console.log('Что-то пошло не так');
      }
    }

    async function updateArray() {
      let count = 0;
      let secondSort = [];
      for (const element of sorted) {
        const fd = await fetchDetails(element.loan_id);
        element.financial_discipline = fd;
        count += 1;
        id('sm-numOfSortedCompany').textContent = `Загрузка... Проверяем ФД... (${count}/${sorted.length})`;
        if (fd >= valueToPercent(smFdFrom.value) && fd <= valueToPercent(smFdTo.value) /* ФД от до */) {
          secondSort.push(element);
        }
        if (!smCompanyUpdate) {
          smCompanyUpdate = true;
          break;
        }
      }
      id('sm-numOfSortedCompany').textContent = `Доступно: ${secondSort.length} ${getZaimEnding(secondSort.length)} `;
      id('sm-btn-update').classList.remove('display-none');
      id('sm-btn-stop').classList.add('display-none');
      smInvestCompanyArray = secondSort;
      console.log('Вторая сортировка', smInvestCompanyArray);
    }
    updateArray();
    console.log('Первая сортировка', sorted);
  };
}



