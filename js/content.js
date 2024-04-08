const normalizedURL = window.location.href.replace(/(https?:\/\/)?(www\.)?/i, "").replace(/\/$/, "");
console.log("url: ", normalizedURL);
// Распределение средств (первичка)
async function fmInvest() {
  if (normalizedURL !== "jetlend.ru/invest/v3/?state=login") return;
  const cache = await getCache("fmInvest", null);
  if (!cache) return;
  chrome.storage.local.remove("fmInvest");
  document.title = "Распределение средств";
  let investedSum = 0; // Счётчик инвестированной суммы
  let companyCount = 0; // Счётчик компаний, в которых распределены средства
  let errorCount = 0; // Количество ошибок
  let companyArrayLength = cache.array.length; // Всего компаний
  const investMode = cache.investMode;
  const investHistory = await getCache("investHistory", []);
  async function invest(company) {
    let user = {
      agree: true,
      amount: cache.sum,
    };
    await fetch(`https://jetlend.ru/invest/api/requests/${company.id}/invest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "X-Csrftoken": getCookie("csrftoken"),
      },
      credentials: "include",
      body: JSON.stringify(user),
    })
      .then((response) => response.json())
      .then((res) => {
        if (res.status.toLowerCase() === "ok") {
          sendNotification(`Успешная инвестиция ID${company.id}`, companyHtmlNotification(company, { sum: cache.sum }));
          investedSum += cache.sum;
          companyCount++;
          investHistory.unshift({ id: company.id, name: company.loan_name, img: company.preview_small_url, fd: company.financial_discipline, rating: company.rating, investSum: cache.sum, percent: company.interest_rate, date: new Date().getTime(), mode: investMode });
        } else {
          sendNotification(`Ошибка ID${company.id}`, companyHtmlNotification(company, { error: res.error }));
          errorCount++;
        }
        console.log(res);
      });
  }

  async function mainFunction() {
    sendNotification("Ожидайте", "Средства распределяются, не закрывайте вкладку.");
    for (company of cache.array) {
      if (investedSum + cache.sum > cache.sumAll) {
        break;
      }
      if (company.company_investing_amount + cache.sum > cache.companyMaxSum || company.investing_amount + cache.sum > cache.loanMaxSum) {
        continue;
      }
      await invest(company);
    }
    sendNotification(
      "Распределение заверешено",
      `Общая сумма: ${toCurrencyFormat(investedSum)}. 
      Количество займов: ${companyCount} из ${companyArrayLength}. Ошибки: ${errorCount}.`
    );
    const settings = await getCache("settings");
    const badgeMode = settings.badgeMode;
    if (badgeMode === "money") {
      const statsUrl = "https://jetlend.ru/invest/api/account/details";
      const statsData = await fetchData(statsUrl);
      if (statsData.data) {
        const freeBalance = statsData.data.data.balance.free;
        setBadge(toSuperShortCurrencyFormat(freeBalance));
      }
    } else {
      setBadge("");
    }
    chrome.storage.local.set({ investHistory: investHistory });
    chrome.runtime.sendMessage({ data: "Распределение средств заверешено" });
    investMode === "auto" && window.close();
  }
  mainFunction();
}
fmInvest();

// Распределение средств (вторичка)
//https://jetlend.ru/invest/api/exchange/loans/12026/buy/preview
async function smInvest() {
  if (normalizedURL !== "jetlend.ru/invest/v3/?state=login") return;
  const cache = await getCache("smInvest", null);
  if (!cache) return;
  chrome.storage.local.remove("smInvest");
  document.title = "Распределение средств";
  let investedSum = 0;
  let companyCount = 0;
  let errorCount = 0;
  let companyArrayLength = cache.array.length;
  const investMode = cache.mode;
  const investHistory = await getCache("investHistory", []);
  async function invest(min, max, ytmMin, ytmMax, sumAll, sum, companyArray) {
    async function loanInvest(company, count, price) {
      let user = {
        count: count,
        max_price: price, // Процент
      };
      // Создание промиса для fetch запроса
      const fetchPromise = fetch(`https://jetlend.ru/invest/api/exchange/loans/${company.loan_id}/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "X-Csrftoken": getCookie("csrftoken"),
        },
        credentials: "include",
        body: JSON.stringify(user),
      }).then((response) => response.json());

      const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error(`Время ожидания истекло (10 сек).\nID займа: ${company.loan_id}.`));
        }, 10000);
      });

      try {
        const data = await Promise.race([fetchPromise, timeoutPromise]);
        if (data.status.toLowerCase() === "ok") {
          sendNotification(`Успешная инвестиция ID${company.loan_id}`, companyHtmlNotification(company, { sum: data.data.amount, price: price }));
          sumAll = parseFloat((sumAll - data.data.amount).toFixed(2));
          investedSum += data.data.amount;
          companyCount++;
          investHistory.unshift({ id: company.loan_id, name: company.loan_name, img: company.preview_small_url, fd: company.financial_discipline, rating: company.rating, investSum: data.data.amount, percent: data.data.ytm, date: new Date().getTime(), mode: investMode, price: price, class: company.loan_class });
        } else {
          sendNotification(`Ошибка ID${company.loan_id}`, companyHtmlNotification(company, { error: data.error }));
          errorCount++;
        }
      } catch (error) {
        sendNotification(`Ошибка ID${company.loan_id}`, companyHtmlNotification(company, { error: error.message }));
        errorCount++;
      }
    }

    for (company of companyArray) {
      const resp = await fetchData(`https://jetlend.ru/invest/api/exchange/loans/${company.loan_id}/dom/records`);
      if (resp.data) {
        const sort = resp.data.data.filter((obj) => obj.count > 0 && obj.price >= min && obj.price <= max && obj.ytm >= ytmMin && obj.ytm <= ytmMax).reverse();
        const secondSort = [];
        let sumOne = sum; // Сумма в один займ
        let stopLoanSum = cache.loanMaxSum - company.invested_debt; // Ограничение в займ
        let stopCompanySum = cache.companyMaxSum - company.invested_company_debt; // Ограничение в компанию
        let minSum = () => Math.min(sumOne, stopLoanSum, stopCompanySum);
        for (element of sort) {
          const getPrice = (element) => currencyToFloat(element.amount / element.count); // Цена за 1 лот
          if (sumOne > 0 && stopCompanySum - getPrice(element) > 0 && stopLoanSum - getPrice(element) > 0) {
            if (element.amount >= sumOne && Math.floor(minSum() / getPrice(element)) > 0) {
              secondSort.push({ company: company, price: element.price, count: Math.floor(minSum() / getPrice(element)), amount: getPrice(element) });
              sumOne = 0;
            } else if (sumOne >= element.amount && stopLoanSum - getPrice(element) >= element.amount && stopCompanySum - getPrice(element) >= element.amount) {
              secondSort.push({ company: company, price: element.price, count: element.count, amount: getPrice(element) });
              sumOne -= element.amount;
              stopLoanSum -= element.amount;
              stopCompanySum -= element.amount;
            }
          }
        }

        for (element of secondSort) {
          console.log("secondSort: ", secondSort);
          // Если цена больше чем сумма распределения
          if (element.count * element.amount > sumAll) {
            continue;
          }
          if (element.company.invested_company_debt + element.amount * element.count > cache.companyMaxSum || element.company.invested_debt + element.amount * element.count > cache.loanMaxSum) {
            continue;
          }
          await loanInvest(element.company, element.count, element.price);
        }
      }
    }
  }
  async function mainFunction() {
    sendNotification("Ожидайте", "Средства распределяются, не закрывайте вкладку.");
    await invest(cache.minPrice, cache.maxPrice, cache.ytmMin, cache.ytmMax, cache.sumAll, cache.sum, cache.array);
    sendNotification(
      "Распределение заверешено",
      `Общая сумма: ${toCurrencyFormat(investedSum)}. 
                                  Количество займов: ${companyCount} из ${companyArrayLength}. Ошибки: ${errorCount}.`
    );
    const settings = await getCache("settings");
    const badgeMode = settings.badgeMode;
    if (badgeMode === "money") {
      const statsUrl = "https://jetlend.ru/invest/api/account/details";
      const statsData = await fetchData(statsUrl);
      if (statsData.data) {
        const freeBalance = statsData.data.data.balance.free;
        setBadge(toSuperShortCurrencyFormat(freeBalance));
      }
    } else {
      setBadge("");
    }
    chrome.storage.local.set({ investHistory: investHistory });
    chrome.runtime.sendMessage({ data: "Распределение средств заверешено" });
    investMode === "auto" && window.close();
  }
  mainFunction();
}
smInvest();

async function updateBadge() {
  if (document.hidden) return;
  const settings = await getCache("settings");
  const badgeMode = settings.badgeMode ?? "0";
  const autoInvestMode = settings.autoInvestMode ?? "0";
  const safe = settings.autoInvestSafe ?? 0;
  const investInterval = settings.autoInvestInterval ?? 6;
  const lastData = await getCache("JLE_content");
  const lastUpdateTime = lastData.lastUpdate ?? 0;
  const lastAutoInvest = lastData.lastAutoInvest ?? 0;
  const timeCd = 6;
  const MINUTE = 60000;
  try {
    if (lastUpdateTime + MINUTE * timeCd <= new Date().getTime()) {
      setBadge("⌛");
      const statsUrl = "https://jetlend.ru/invest/api/account/details";
      const statsData = await fetchData(statsUrl);
      if (statsData.data) {
        const freeBalance = statsData.data.data.balance.free;
        chrome.storage.local.set({
          JLE_content: { lastUpdate: new Date().getTime() },
        });
        const filters = await getCache("investSettings");
        if (badgeMode === "loans") {
          await smLoadLoans("badge", 0, 100);
          await fmLoadLoans("badge");
          setBadge(`${Math.min(fmInvestCompanyArray.length, Math.floor(freeBalance / filters.fmInvestSum), 99)}/${Math.min(smInvestCompanyArray.length, Math.floor(freeBalance / filters.smInvestSum), 99)}`);
        } else if (badgeMode === "money") {
          setBadge(toSuperShortCurrencyFormat(freeBalance));
          if (autoInvestMode !== "0") {
            if (autoInvestMode === "fm" && freeBalance - safe < filters.fmInvestSum && lastAutoInvest + MINUTE * investInterval > new Date().getTime()) {
              return;
            } else if (autoInvestMode === "sm" && freeBalance - safe < filters.smInvestSum && lastAutoInvest + MINUTE * investInterval > new Date().getTime()) {
              return;
            } else {
              await smLoadLoans("loadLoans", 0, 100);
              await fmLoadLoans("loadLoans");
              console.log();
            }
          }
        } else {
          setBadge("");
          if (autoInvestMode !== "0") {
            if (autoInvestMode === "fm" && freeBalance - safe < filters.fmInvestSum && lastAutoInvest + MINUTE * investInterval > new Date().getTime()) {
              return;
            } else if (autoInvestMode === "sm" && freeBalance - safe < filters.smInvestSum && lastAutoInvest + MINUTE * investInterval > new Date().getTime()) {
              return;
            }
          }
        }
        if (autoInvestMode === "fm" && freeBalance - safe > filters.fmInvestSum && fmInvestCompanyArray.length !== 0) {
          const currentTime = new Date().getTime();
          chrome.storage.local.set({
            JLE_content: { lastUpdate: currentTime, lastAutoInvest: currentTime },
          });
          chrome.storage.local.set({
            fmInvest: {
              array: fmInvestCompanyArray,
              sum: valueToInt(filters.fmInvestSum),
              sumAll: currencyToFloat(freeBalance - safe),
              loanMaxSum: currencyToFloat(filters.fmStopLoanSum),
              companyMaxSum: currencyToFloat(filters.fmStopCompanySum),
              mode: "auto",
            },
          });
          chrome.runtime.sendMessage({ action: "createTab", url: "https://jetlend.ru/invest/v3/?state=login" });
        } else if (autoInvestMode === "sm" && freeBalance - safe > filters.smInvestSum && smInvestCompanyArray !== 0) {
          const currentTime = new Date().getTime();
          chrome.storage.local.set({
            JLE_content: { lastUpdate: currentTime, lastAutoInvest: currentTime },
          });
          chrome.storage.local.set({
            smInvest: {
              array: smInvestCompanyArray,
              sum: valueToInt(filters.smInvestSum),
              sumAll: currencyToFloat(freeBalance - safe),
              minPrice: valueToPercent(filters.smPriceFrom),
              maxPrice: valueToPercent(filters.smPriceTo),
              ytmMin: valueToPercent(filters.smRateFrom),
              ytmMax: valueToPercent(filters.smRateTo),
              loanMaxSum: currencyToFloat(filters.smStopLoanSum),
              companyMaxSum: currencyToFloat(filters.smStopCompanySum),
              mode: "auto",
            },
          });
          chrome.runtime.sendMessage({ action: "createTab", url: "https://jetlend.ru/invest/v3/?state=login" });
        }
        return;
      } else {
        setBadge("🔒❌");
      }
    }
  } catch (error) {
    console.error("Ошибка: ", error);
  }
}

async function mainUpdate() {
  if (window.location.href.endsWith("invest/v3") || window.location.href.endsWith("invest/v3/?state=login")) {
    const userStatsUrl = "https://jetlend.ru/invest/api/account/details";
    const platformStatsUrl = "https://jetlend.ru/invest/api/public/stats";

    const [userStats, platformStats] = await Promise.all([fetchData(userStatsUrl), fetchData(platformStatsUrl)]);

    const allAssetsBlock = document.querySelector(".block_header__title__text__NTBZ-"); //Заголовок "Все активы"
    const balanceTitleBlock = document.querySelector(".SummaryBlock_property-item-title__VbKja"); //Заголовок активов

    const balanceBlock = document.querySelectorAll(".propertyItem_value__ZVbTz")[0]; //Блок активов

    const collectionIncomeBlock = document.querySelectorAll(".propertyItem_value__ZVbTz")[1]; //Значение ставки на сборе

    const incomeTitleBlock = document.querySelector(".dashboard_income-title__ly2bD"); //Заголовок доходов
    const incomeBlock = document.querySelectorAll(".propertyItem_value__ZVbTz")[2]; //Блок доходов

    const incomePercentBlock = document.querySelectorAll(".propertyItem_value__ZVbTz")[3]; //Блок доходности в процентах

    if (userStats.data && platformStats.data) {
      const obj = userStats.data.data;
      const platformObj = platformStats.data.data;

      const statAllTime = obj.summary;
      const statYearTime = obj.summary_year;
      const balanceStats = obj.balance;

      const balance = balanceStats.total; // Баланс
      const cleanBalance = balance - balanceStats.nkd; // Баланс без НПД

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
      };

      allAssetsBlock.innerHTML = `Все активы <span style="font-weight:300;">(${getUpdateTime(new Date().getTime())})</span>`;
      balanceTitleBlock.innerHTML = `<span>Активы | Активы без НПД</span>`;
      balanceBlock.innerHTML = `<span>${toCurrencyFormat(balance)} <span style="opacity: 0.5">|</span> ${toCurrencyFormat(cleanBalance)}</span>`;
      collectionIncomeBlock.innerHTML = `<span>${toPercentFormat(platformObj.average_interest_rate_30days)}</span>`;

      // Загрузка настроек из хранилища
      const cache = await getCache("settings");
      if (!cache.timePeriod || cache.timePeriod === "all") {
        incomeTitleBlock.innerHTML = `<span>Доход за всё время (без НПД | чистый доход)</span>`;
        incomeBlock.innerHTML = `<span>${toCurrencyFormat(allTime.profitWithoutNpd)} <span style="opacity: 0.5">|</span> ${toCurrencyFormat(allTime.cleanProfit)}</span>`;
        incomePercentBlock.innerHTML = `<span>${toPercentFormat(allTime.percentProfit)}</span>`;
      } else if (cache.timePeriod === "year") {
        incomeTitleBlock.innerHTML = `<span>Доход за год (без НПД | чистый доход)</span>`;
        incomeBlock.innerHTML = `<span>${toCurrencyFormat(yearTime.profitWithoutNpd)} <span style="opacity: 0.5">|</span> ${toCurrencyFormat(yearTime.cleanProfit)}</span>`;
        incomePercentBlock.innerHTML = `<span>${toPercentFormat(yearTime.percentProfit)}</span>`;
      }
    }

    if (userStats.error || platformStats.error) {
      console.error(response.error);
    }
  }
}

updateBadge();
mainUpdate();

setInterval(function () {
  mainUpdate();
  updateBadge();
}, 60000);
