let timePeriod = "";
const lastUpdateDateTag = document.querySelector(".lastUpdateDate"); //Тэг последнего обновления данных
const balanceTitle = document.querySelector(".balance__title");      //Заголовок баланса
const balanceTag = document.querySelector(".balance__value");        //Тэг баланса
const incomeTitle = document.querySelector(".income__title");        //Заголовок дохода
const incomeTag = document.querySelector(".income__value");          //Тэг дохода
const btnInvestOpen = document.querySelector('.invest-section__btn-open '); // Кнопка открытия страницы распределения средств
const btnInvestClose = document.querySelector('.invest-section__btn-close'); // Кнопка закрытия страницы распределения средств
const statsSection = document.querySelector('.stats-section'); // Блок подробной статистики
const swapBtn = document.querySelector('.swap'); // Свапалка в подробной статистике
const settingsBtn = document.querySelector('.settings__swap'); // Кнопка-свапалка в настройках

let daysFrom = document.getElementById('invest-days-from');
let daysTo = document.getElementById('invest-days-to');
let rateFrom = document.getElementById('rate-from');
let rateTo = document.getElementById('rate-to');
let loansFrom = document.getElementById('loans-from');
let loansTo = document.getElementById('loans-to');
let investSum = document.getElementById('invest-sum');
let investSumAll = document.getElementById('invest-sum-all');
let investCompanyArray = [];
let freeBalance = 0;

daysFrom.addEventListener('change', updateInvestSettings);
daysTo.addEventListener('change', updateInvestSettings);
rateFrom.addEventListener('change', updateInvestSettings);
rateTo.addEventListener('change', updateInvestSettings);
loansFrom.addEventListener('change', updateInvestSettings);
loansTo.addEventListener('change', updateInvestSettings);
investSum.addEventListener('change', updateInvestSettings);

// Функция отправки уведомления
function sendNotification(title, text) {
  let notification = new Notification(title,  {
    body: text,
    icon: "/img/icons/jetlend-logo-min.svg"
  });
  return notification;
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
    investSum: investSum.value
  };
  chrome.storage.local.set({ investSettings: newSettings });
}

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












function openInvestPage() {
  document.querySelector('.invest-section').style.top = "0";
  document.body.style.height = '470px';
  if(document.body.classList.contains('bigBody')) {
    document.body.classList.remove('bigBody');
  }
}

function closeInvestPage() {
  document.querySelector('.invest-section').style.top = "-1000px";
  document.body.style.height = '';
}

btnInvestOpen.addEventListener('click', openInvestPage);
btnInvestClose.addEventListener('click', closeInvestPage);

// Функция для расчета XIRR
function calculateXIRR(cashFlows, dates) {
  // Функция для расчета NPV (Net Present Value)
  function calculateNPV(rate) {
    let npv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + rate, daysBetween(dates[i], dates[0]) / 365);
    }
    return npv;
  }
  // Функция для нахождения значения XIRR с помощью метода Ньютона
  function calculateXIRRNewton(guess) {
    const MAX_ITERATIONS = 100;
    const ACCURACY = 0.00001;
    let x0 = guess;
    let x1 = 0;
    let f = 0;
    let f1 = 0;
    let count = 0;
    
    do {
      f = calculateNPV(x0);
      f1 = calculateNPVDerivative(x0);
      x1 = x0 - f / f1;
      if (Math.abs(x1 - x0) < ACCURACY) {
        return x1;
      }
      x0 = x1;
      count++;
    } while (count < MAX_ITERATIONS);
    
    return NaN;
  }

  // Функция для расчета производной NPV
  function calculateNPVDerivative(rate) {
    let npvDerivative = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      npvDerivative -= daysBetween(dates[i], dates[0]) / 365 * cashFlows[i] / Math.pow(1 + rate, (daysBetween(dates[i], dates[0]) / 365) + 1);
    }
    return npvDerivative;
  }

  // Функция для расчета разницы в днях между двумя датами
  function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000; // Количество миллисекунд в одном дне
    const diffDays = Math.round(Math.abs((date1 - date2) / oneDay));
    return diffDays;
  }

  // Вызов функции для расчета XIRR
  return calculateXIRRNewton(0.1);
}

function getZaimEnding(n) {
  let ending = '';
  if (n % 10 === 1 && n % 100 !== 11) {
    ending = 'займ';
  } else if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) {
    ending = 'займа';
  } else {
    ending = 'займов';
  }
  return ending;
}

function formatReadableDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

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

const toCurrencyFormat = element => element.toLocaleString("ru-RU", { style: "currency", currency: "RUB" });

const toPercentFormat = element => `${(element * 100).toFixed(2).replace(".", ",")} %`;

const decorNumber = element => element > 0 ? '#00ba88' : element != 0 ? '#f23c3c' : 'var(--var-fontColor)';

const numberSign = number => number > 0 ? '+' : '';

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

async function combinedFunction() {
  lastUpdateDateTag.innerHTML += `<span id="loadingIcon" title="Загузка актуальных данных..." style="cursor:pointer">&#9203;</span>`;


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
    const obj = userStats.data;
    const userObj = userData.data;
    const platformObj = platformStats.data;
    const statAllTime = obj.data.summary;
    const statYearTime = obj.data.summary_year;
    const balanceStats = obj.data.balance;

    const balance = balanceStats.total;                      // Баланс
    const cleanBalance = balance - balanceStats.nkd;         // Баланс без НПД
    
    const allPercentProfit = statAllTime.yield_rate;         // Доходность в процентах за всё время
    const allInterest = statAllTime.details.interest;        // Процентный доход за всё время
    const allFine = statAllTime.details.fine;                // Пени за всё время
    const allBonus = statAllTime.details.bonus;              // Бонусы за всё время
    const allReffBonus = statAllTime.details.referral_bonus; // Реферальные бонусы за всё время
    const allSale = statAllTime.details.sale;                // Доход на вторичке за всё время
    const allLoss = statAllTime.loss;                        // Потери за всё время
    const allNdfl = statAllTime.profit_ndfl;                 // НДФЛ за всё время

    const yearPercentProfit = statYearTime.yield_rate;         // Доходность в процентах за год
    const yearInterest = statYearTime.details.interest;        // Процентный доход за год
    const yearFine = statYearTime.details.fine;                // Пени за год
    const yearBonus = statYearTime.details.bonus;              // Бонусы за год
    const yearReffBonus = statYearTime.details.referral_bonus; // Реферальные бонусы за год
    const yearSale = statYearTime.details.sale;                // Доход на вторичке за год
    const yearLoss = statYearTime.loss;                        // Потери за год
    const yearNdfl = statYearTime.profit_ndfl;                 // НДФЛ за год

    freeBalance = balanceStats.free; // Свободные средства

    function getInvestDays() {
      const investStartDate = new Date(obj.data.summary.start_date).getTime(); // Дата начала инвестирования в unix
      const timeDiff = Math.abs(new Date().getTime() - investStartDate);       // Разница между сегодняшним днем и началом инвестирования в unix
      const days = (diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)));      // Количество дней инвестирования
      const text = days === 1 ? ' день' : days >=2 && days <= 4 ? ' дня' : ' дней';
      return days + text;
    }



    const allProfitWithoutNpd = () =>
      allInterest + allFine + allBonus + allReffBonus + allSale - allLoss;
      
    const allCleanProfit = () => allProfitWithoutNpd() - allNdfl;

    const allProfitWithoutNdfl = () => allCleanProfit() + balanceStats.nkd;

    const yearProfitWithoutNpd = () =>
    yearInterest + yearFine + yearBonus + yearReffBonus + yearSale - yearLoss;
    
    const yearCleanProfit = () => yearProfitWithoutNpd() - yearNdfl;

    const yearProfitWithoutNdfl = () => yearCleanProfit() + balanceStats.nkd;


    let cashFlows = [];        // Движение средств для XIRR
    let cashFlowsWithNpd = []; // Движение средств для XIRR с НПД
    let dates = [];            // Даты для XIRR
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
        // Сохранение информации в локальное хранилище
        chrome.storage.local.set({ settings: extensionSettings });
      });
      settingsBtn.clickListenerAdded = true;
    }

    document.querySelector('.invest-section__title-sum').textContent = `(Свободно: ${toCurrencyFormat(balanceStats.free)})`;
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
">Jetlend Extension v0.6.0. <span id="support-btn" style="text-decoration:underline; cursor:pointer; user-select: none;">Поддержать разработку.</span></footer>
    `

    const dataTextAllTime = 
    `
    <div style="font-size:16px">Статистика за</div>
    <div>Процентный доход: <span style="color:${decorNumber(allInterest)}">${numberSign(allInterest)}${toCurrencyFormat(allInterest)}<span></div>
    <div>НПД (ожидаемый): <span style="color:${decorNumber(balanceStats.nkd + balanceStats.nkd_ndfl)}">${numberSign(balanceStats.nkd + balanceStats.nkd_ndfl)}${toCurrencyFormat(balanceStats.nkd + balanceStats.nkd_ndfl)}</span></div>
    <div>Пени: <span style="color:${decorNumber(allFine)}">${numberSign(allFine)}${toCurrencyFormat(allFine)}</span></div>
    <div>Бонусы: <span style="color:${decorNumber(allBonus)}">${numberSign(allBonus)}${toCurrencyFormat(allBonus)}</span></div>
    <div>Реферальный доход: <span style="color:${decorNumber(allReffBonus)}">${numberSign(allReffBonus)}${toCurrencyFormat(allReffBonus)}</span></div>
    <div>Доход на вторичном рынке: <span style="color:${decorNumber(allSale)}">${numberSign(allSale)}${toCurrencyFormat(allSale)}</span></div>
    <div>Потери: <span style="color:${decorNumber(-allLoss)}">${numberSign(-allLoss)}${toCurrencyFormat(-allLoss)}</span></div>
    <div>НДФЛ: <span style="color:${decorNumber(-allNdfl)}">${numberSign(-allNdfl)}${toCurrencyFormat(-allNdfl)}</span></div>
    <div>НДФЛ ожидаемый: <span style="color:${decorNumber(-balanceStats.nkd_ndfl)}">${numberSign(-balanceStats.nkd_ndfl)}${toCurrencyFormat(-balanceStats.nkd_ndfl)}</span></div>
    <div>Доход за вычетом НДФЛ: <span style="color:${decorNumber(allProfitWithoutNdfl())}">${numberSign(allProfitWithoutNdfl())}${toCurrencyFormat(allProfitWithoutNdfl())}</span></div>
    ${innerHTML = sameDataText}
    `

    const dataTextYearTime = 
    `
    <div style="font-size:16px">Статистика за</div>
    <div>Процентный доход: <span style="color:${decorNumber(yearInterest)}">${numberSign(yearInterest)}${toCurrencyFormat(yearInterest)}<span></div>
    <div>НПД (ожидаемый): <span style="color:${decorNumber(balanceStats.nkd + balanceStats.nkd_ndfl)}">${numberSign(balanceStats.nkd + balanceStats.nkd_ndfl)}${toCurrencyFormat(balanceStats.nkd + balanceStats.nkd_ndfl)}</span></div>
    <div>Пени: <span style="color:${decorNumber(yearFine)}">${numberSign(yearFine)}${toCurrencyFormat(yearFine)}</span></div>
    <div>Бонусы: <span style="color:${decorNumber(yearBonus)}">${numberSign(yearBonus)}${toCurrencyFormat(yearBonus)}</span></div>
    <div>Реферальный доход: <span style="color:${decorNumber(yearReffBonus)}">${numberSign(yearReffBonus)}${toCurrencyFormat(yearReffBonus)}</span></div>
    <div>Доход на вторичном рынке: <span style="color:${decorNumber(yearSale)}">${numberSign(yearSale)}${toCurrencyFormat(yearSale)}</span></div>
    <div>Потери: <span style="color:${decorNumber(-yearLoss)}">${numberSign(-yearLoss)}${toCurrencyFormat(-yearLoss)}</span></div>
    <div>НДФЛ: <span style="color:${decorNumber(-yearNdfl)}">${numberSign(-yearNdfl)}${toCurrencyFormat(-yearNdfl)}</span></div>
    <div>НДФЛ ожидаемый: <span style="color:${decorNumber(-balanceStats.nkd_ndfl)}">${numberSign(-balanceStats.nkd_ndfl)}${toCurrencyFormat(-balanceStats.nkd_ndfl)}</span></div>
    <div>Доход за вычетом НДФЛ: <span style="color:${decorNumber(yearProfitWithoutNdfl())}">${numberSign(yearProfitWithoutNdfl())}${toCurrencyFormat(yearProfitWithoutNdfl())}</span></div>
    ${innerHTML = sameDataText}
    `

    function updateProfit() {
      if (timePeriod == "allTime") {
        incomeTitle.innerHTML = `<span>Доход за всё время (без НПД / чистый доход)</span> <span>Доходность</span>`;
        incomeTag.innerHTML = `<span>${toCurrencyFormat(allProfitWithoutNpd())} / ${toCurrencyFormat(allCleanProfit())}</span> <span><img src="/img/arrow.svg">${toPercentFormat(allPercentProfit)}</span>`;  
      
        document.querySelector('.income__value span').addEventListener("click", function() {
          if(document.body.classList.contains('bigBody')) {
            document.body.classList.remove('bigBody');
          } else {
            document.body.classList.add('bigBody');
          }
        });
      } else if (timePeriod == "year") {
        incomeTitle.innerHTML = `<span>Доход за год (без НПД / чистый доход)</span> <span>Доходность</span>`;
        incomeTag.innerHTML = `<span>${toCurrencyFormat(yearProfitWithoutNpd())} / ${toCurrencyFormat(yearCleanProfit())}</span> <span><img src="/img/arrow.svg">${toPercentFormat(yearPercentProfit)}</span>`;  
      
        document.querySelector('.income__value span').addEventListener("click", function() {
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

    if (!document.getElementById("support-btn").clickListenerAdded) {
      document.getElementById("support-btn").addEventListener("click", openSupportPage);
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
    document.querySelector('.main-section').innerHTML = `<div style="margin: 64px 112px; text-wrap: nowrap;">Авторизуйтесь на сайте</div>`;
  }
}

combinedFunction();
setInterval(combinedFunction, 60000);

// document.getElementById('fetchButton').addEventListener('click', combinedFunction);

chrome.storage.local.get("cacheJetlend", function (result) {
  const data = result.cacheJetlend;
  if (data) {
   
    lastUpdateDateTag.innerHTML = `Все активы <span>(${getUpdateTime(data.updateTime)}) <span title="Загузка актуальных данных..." style="cursor:pointer">&#9203;</span></span>`;
    balanceTitle.innerHTML = `<span>${data.balanceTitle}</span> <span>${data.collectionIncomeTitle}</span>`;
    balanceTag.innerHTML = `<span>${data.balanceText}</span> <span>${data.collectionIncomeText}</span>`;
    incomeTitle.innerHTML = `<span>${data.incomeTitle}</span> <span>${data.incomePercent}</span>`;
    incomeTag.innerHTML = `<span>${data.incomeText}</span> <span><img src="/img/arrow.svg">${data.percentIncomeNum}</span=>`;

    document.querySelector('.income__value span').addEventListener("click", function() {
      if(document.body.classList.contains('bigBody')) {
        document.body.classList.remove('bigBody');
      } else {
      document.body.classList.add('bigBody');
      }
    });
  }
});


// Обновление отсортированного списка компаний
async function companyListUpdate() {
  document.getElementById('numOfSortedCompany').textContent = `Загрузка...`;
  document.querySelector('.invest-section__btn-update').classList.add('display-none');

  const res = await fetchData("https://jetlend.ru/invest/api/requests/waiting");

  if (res.data) {
    const valueToNum = value => parseFloat((parseFloat((value).toString().replace(',', '.'))/100).toFixed(4));
    const sorted = res.data.requests.filter(obj => (obj.collected_percentage !== 100 /* Полоска сбора не заполнена (меньше 100%) */) 
      && (obj.investing_amount === null /* Резервация (нет) */) 
      && (obj.company_investing_amount === null || obj.company_investing_amount === "0.00" /* Есть в портфеле (нет) */)
      && (obj.term >= daysFrom.value && obj.term <= daysTo.value /* Срок займа */)
      && (obj.interest_rate >= valueToNum(rateFrom.value) && obj.interest_rate <= valueToNum(rateTo.value) /* Процент займа (от 20 до 100) */) 
      && (obj.loan_order >= loansFrom.value && obj.loan_order <= loansTo.value  /* Какой по счёту займ на платформе */))
    
    async function fetchDetails(id) {
      const response = await fetchData(`https://jetlend.ru/invest/api/requests/${id}/details`);
      if (response.data) {
        return response.data.data.details.financial_discipline;
      } else {
        console.log('Что-то пошло не так');
      }
    }
    

    async function updateArray() {
      for (const element of sorted) {
        const fd = await fetchDetails(element.id);
        element.financial_discipline = fd;
      }
      console.log(sorted); // Вывод обновленного массива
      document.getElementById('numOfSortedCompany').textContent = `Доступно: ${sorted.length} ${getZaimEnding(sorted.length)} `;
      document.querySelector('.invest-section__btn-update').classList.remove('display-none');
      investCompanyArray = sorted;
    }
    updateArray()
  };
}

document.querySelector('.invest-section__btn-update').addEventListener('click', companyListUpdate)
document.querySelector(".support-section__btn-close").addEventListener("click", closeSupportPage);
companyListUpdate();


function openSupportPage() {
  let popup = document.querySelector(".support-section");
  popup.classList.remove('display-none');
}

function closeSupportPage() {
  let popup = document.querySelector(".support-section");
  popup.classList.add('display-none');
}


































document.getElementById('investSubmit').addEventListener('click', function() {
  const valueToInt = value => parseInt((value).toString().replace(',', '.'));

  if (document.getElementById('investAgree').checked 
    && valueToInt(investSum.value) <= freeBalance 
    && valueToInt(investSum.value) >= 100 
    && document.getElementById('numOfSortedCompany').textContent !== "Загрузка..."
    && freeBalance >= 100
    && investCompanyArray.length >= 1) {
      console.log('Проверка прошла');
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


function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function distributeFunds(companyId) {
  let user = {
    agree: true,
    amount: 100
  }
  
fetch(`https://jetlend.ru/invest/api/requests/${companyId}/invest`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'X-Csrftoken': getCookie('csrftoken')
    },
    credentials: 'include',
    body: JSON.stringify(user)
  }).then((response) => response.json()).then((data) => console.log(data))
}


