let timePeriod = "";

let investCompanyArray = [];
let freeBalance = 0;

daysFrom.addEventListener('change', updateInvestSettings);
daysTo.addEventListener('change', updateInvestSettings);
rateFrom.addEventListener('change', updateInvestSettings);
rateTo.addEventListener('change', updateInvestSettings);
loansFrom.addEventListener('change', updateInvestSettings);
loansTo.addEventListener('change', updateInvestSettings);
investSum.addEventListener('change', updateInvestSettings);

btnInvestOpen.addEventListener('click', openInvestPage);
btnInvestClose.addEventListener('click', closeInvestPage);

$('.invest-section__btn-update').addEventListener('click', updateCompanyList)
$(".support-section__btn-close").addEventListener("click", closeSupportPage);

// Загрузка данных из хранилища при загрузке попапа
chrome.storage.local.get("settings", function (data) {
  if (data.settings) {
    settingsBtn.textContent = data.settings.timePeriod;

    if (data.settings.timePeriod == 'всё время') {
      timePeriod = "allTime";
    } else if (data.settings.timePeriod == 'год') {
      timePeriod = "year";
    }

  } else if (!data.settings || data.settings.timePeriod == undefined) {
    settingsBtn.textContent = 'всё время';
    timePeriod = "allTime";
  }
});


chrome.storage.local.get("investSettings", function(data) {
  if (data.investSettings) {
    if (data.investSettings.daysFrom) {
      daysFrom.value = data.investSettings.daysFrom;
    }
    if (data.investSettings.daysTo) {
      daysTo.value = data.investSettings.daysTo
    }
    if (data.investSettings.rateFrom) {
      rateFrom.value = data.investSettings.rateFrom
    }
    if (data.investSettings.rateTo) {
      rateTo.value = data.investSettings.rateTo
    }
    if (data.investSettings.loansFrom) {
      loansFrom.value = data.investSettings.loansFrom
    }
    if (data.investSettings.loansTo) {
      loansTo.value = data.investSettings.loansTo
    }
    if (data.investSettings.investSum) {
      investSum.value = data.investSettings.investSum
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
      } 
    }

    // Функция подсчёта дней инвестирования 
    function getInvestDays() {
      const investStartDate = new Date(statAllTime.start_date).getTime();      // Дата начала инвестирования в unix
      const timeDiff = Math.abs(new Date().getTime() - investStartDate);       // Разница между сегодняшним днем и началом инвестирования в unix
      const days = (diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)));      // Количество дней инвестирования
      const text = days === 1 ? ' день' : days >=2 && days <= 4 ? ' дня' : ' дней';
      return days + text;
    }

    // Функция пуша данных для подсчёта XIRR
    (function() {
      const arr = xirrData.data.data;
      for (let i = 0; i < arr.length; i++) {
        cashFlows.push(arr[i].amount);
        dates.push(new Date(arr[i].date));
      }
      cashFlowsWithNpd = [...cashFlows, -balance];   
      cashFlows.push(-cleanBalance); 
      dates.push(new Date());
    })();

    if (!settingsBtn.clickListenerAdded) {
      settingsBtn.addEventListener("click", function () {
        if (settingsBtn.textContent == 'всё время') {
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
    investSumAll.value = balanceStats.free;

    const sameDataText = `
    <div>Свободные средства: <span style="color:${decorNumber(balanceStats.free)}">${numberSign(balanceStats.free)}${toCurrencyFormat(balanceStats.free)}</span></div>
    <div>XIRR (с НПД / без НПД): ${toPercentFormat(calculateXIRR(cashFlowsWithNpd, dates))} / ${toPercentFormat(calculateXIRR(cashFlows, dates))}</div>
    <br>
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
">Jetlend Extension v${version}. <span id="support-btn" style="text-decoration:underline; cursor:pointer; user-select: none;">Поддержать разработку.</span></footer>
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
    ${innerHTML = sameDataText}
    `

    function updateProfit() {
      if (timePeriod == "allTime") {
        incomeTitle.innerHTML = `<span>Доход за всё время (без НПД / чистый доход)</span> <span>Доходность</span>`;
        incomeTag.innerHTML = `<span>${toCurrencyFormat(allTime.profitWithoutNpd)} / ${toCurrencyFormat(allTime.cleanProfit)}</span> <span><img src="/img/arrow.svg">${toPercentFormat(allTime.percentProfit)}</span>`;  
      
        $('.income__value span').addEventListener("click", function() {
          if(document.body.classList.contains('bigBody')) {
            document.body.classList.remove('bigBody');
          } else {
            document.body.classList.add('bigBody');
          }
        });
      } else if (timePeriod == "year") {
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
    
    if (timePeriod == "year") {
      statsSection.innerHTML = dataTextYearTime;
      swapBtn.textContent = 'год';
    } else if (timePeriod == "allTime") {
      statsSection.innerHTML = dataTextAllTime;
      swapBtn.textContent = 'всё время';
    }
    
    if (swapBtn.classList.contains('display-none')) {
      swapBtn.classList.remove('display-none');
    }
    
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

// Обновление отсортированного списка компаний
async function updateCompanyList() {
  id('numOfSortedCompany').textContent = `Загрузка...`;
  $('.invest-section__btn-update').classList.add('display-none');

  const res = await fetchData("https://jetlend.ru/invest/api/requests/waiting");

  if (res.data) {
    const valueToNum = value => parseFloat((parseFloat((value).toString().replace(',', '.'))/100).toFixed(4));
    const sorted = res.data.requests.filter(obj => (obj.collected_percentage !== 100 /* Полоска сбора не заполнена (меньше 100%) */) 
      && (obj.investing_amount === null /* Резервация (нет) */) 
      && (obj.company_investing_amount === null || obj.company_investing_amount === "0.00" /* Есть в портфеле (нет) */)
      && (obj.term >= daysFrom.value && obj.term <= daysTo.value /* Срок займа */)
      && (obj.interest_rate >= valueToNum(rateFrom.value) && obj.interest_rate <= valueToNum(rateTo.value) /* Процент займа (от 20 до 100) */) 
      && (obj.loan_order >= loansFrom.value && obj.loan_order <= loansTo.value  /* Какой по счёту займ на платформе */))
    
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
      for (const element of sorted) {
        const fd = await fetchDetails(element.id);
        element.financial_discipline = fd;
        count += 1;
        id('numOfSortedCompany').textContent = `Загрузка... (${count}/${sorted.length})`;
        console.log(id('numOfSortedCompany').textContent.includes("Загрузка..."));
      }
      console.log(sorted); // Вывод обновленного массива
      document.getElementById('numOfSortedCompany').textContent = `Доступно: ${sorted.length} ${getZaimEnding(sorted.length)} `;
      document.querySelector('.invest-section__btn-update').classList.remove('display-none');
      investCompanyArray = sorted;
    }
    updateArray()
  };
}
updateCompanyList();

// Распределение средств
id('investSubmit').addEventListener('click', function() {
  const valueToInt = value => parseInt((value).toString().replace(',', '.'));

  if (id('investAgree').checked 
    && valueToInt(investSum.value) <= freeBalance 
    && valueToInt(investSum.value) >= 100 
    && !id('numOfSortedCompany').textContent.includes("Загрузка...")
    && freeBalance >= 100
    && investCompanyArray.length >= 1) {
    console.log('Проверка пройдена');
    function numOfCuts() {
      let canInvest = Math.floor(valueToInt(investSumAll.value) / valueToInt(investSum.value));
      if (canInvest > investCompanyArray.length) {
        return investCompanyArray.length;
      } else {
        return canInvest;
      }
    }
    const sliceArray = investCompanyArray.slice(0, numOfCuts());
    const arrOfCompanyId = sliceArray.map(obj => obj.id);
    chrome.storage.local.set({invest: {array: arrOfCompanyId, sum: valueToInt(investSum.value)}});
    chrome.tabs.create({ url: "https://jetlend.ru/invest/v3/?state=login" });
  } else {
    console.log('Не удовлетворяет условиям');
  };
})
