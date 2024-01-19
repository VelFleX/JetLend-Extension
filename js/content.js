// Распределение средств (первичка)
chrome.storage.local.get("fmInvest", function (data) {
  if (data.fmInvest) {
    let investedSum = 0;
    let companyCount = 0;
    let companyArrayLength = data.fmInvest.array.length;
    let errorCount = 0;
    async function invest(companyId) {
      let user = {
        agree: true,
        amount: data.fmInvest.sum,
      };

      await fetch(`https://jetlend.ru/invest/api/requests/${companyId}/invest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "X-Csrftoken": getCookie("csrftoken"),
        },
        credentials: "include",
        body: JSON.stringify(user),
      })
        .then((response) => response.json())
        .then((obj) =>  {
          if (obj.status.toLowerCase() === 'ok') {
            sendNotification('Успешная инвестиция', `Сумма: ${toCurrencyFormat(data.fmInvest.sum)}`);
            investedSum += data.fmInvest.sum;
            companyCount++;
          } else {
            sendNotification('Ошибка', `${obj.error}`);
            errorCount++;
          }
          console.log(obj)
        });
    }

    async function mainFunction() {
      sendNotification("Ожидайте", "Средства распределяются, не закрывайте вкладку.");
      for (element of data.fmInvest.array) {
        await invest(element);
      }
      sendNotification("Распределение заверешено", `Общая сумма: ${toCurrencyFormat(investedSum)}. 
                                  Количество займов: ${companyCount} из ${companyArrayLength}. Ошибки: ${errorCount}.`);
      setBadge("");
      chrome.runtime.sendMessage({data: 'Распределение средств заверешено'});
      chrome.storage.local.remove("fmInvest");
      // setTimeout(() => {
      //   window.close();
      // }, 3000); 
    }
    mainFunction();
  }
});

//https://jetlend.ru/invest/api/exchange/loans/12026/buy/preview
// Распределение средств (вторичка)
chrome.storage.local.get("smInvest", function (data) {
  if (data.smInvest) { 
    let investedSum = 0;
    let companyCount = 0;
    let companyArrayLength = data.smInvest.array.length;
    let errorCount = 0;
    async function smInvest(min, max, ytmMin, ytmMax, all, sum, companyArray) {
      chrome.storage.local.remove("smInvest");
      console.log('Массив компаний: ', companyArray);
      let sumAll = all; // Свободные средства
      async function invest(companyId, count, price) {
        let user = {
          count: count,
          max_price: price, // Процент
        };
      
        // Создание промиса для fetch запроса
        let fetchPromise = fetch(`https://jetlend.ru/invest/api/exchange/loans/${companyId}/buy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            "X-Csrftoken": getCookie("csrftoken"),
          },
          credentials: "include",
          body: JSON.stringify(user),
        })
        .then((response) => response.json());
        let timeoutPromise = new Promise((resolve, reject) => {
          setTimeout(() => {
            errorCount++;
            reject(new Error(`Время ожидания истекло (10 сек).\nID займа: ${companyId}.`));
          }, 10000);
        });
      
        try {
          let data = await Promise.race([fetchPromise, timeoutPromise]);
            if (data.status.toLowerCase() === 'ok') {
              sendNotification('Успешная инвестиция', `Сумма: ${toCurrencyFormat(data.data.amount)}`);
              sumAll = parseFloat((sumAll - data.data.amount).toFixed(2))
              investedSum += data.data.amount;
              companyCount++;
            } else {
              sendNotification('Ошибка', `${data.error}\nID займа: ${companyId}.`);
              errorCount++;
            }
        } catch (error) {
          sendNotification('Ошибка', error.message);
        }
      }
      
      for (companyId of companyArray) {
        const resp = await fetchData(`https://jetlend.ru/invest/api/exchange/loans/${companyId}/dom/records`);
        if (resp.data) {
          const sort = resp.data.data.filter(obj => (obj.count > 0)
            && (obj.price >= min && obj.price <= max) 
            && (obj.ytm >= ytmMin && obj.ytm <= ytmMax)).reverse();
          const secondSort = [];
          let sumOne = sum; // Сумма в один займ
          console.log(sort);
          for (element of sort) {
            const getPrice = element => currencyToFloat(element.amount / element.count); // Цена
            if (sumOne > 0) {
              if (element.amount >= sumOne && Math.floor(sumOne/getPrice(element)) > 0) {
                secondSort.push({id: companyId, price: element.price, count: Math.floor(sumOne/getPrice(element)), amount: getPrice(element)});
                sumOne = 0;
              } else if (element.amount < sumOne) {
                secondSort.push({id: companyId, price: element.price, count: element.count, amount: getPrice(element)});
                sumOne -= element.amount;
              } 
            }
          }
          for (element of secondSort) {
            // Если цена больше чем сумма распределения
            if (element.count * element.amount > sumAll) { 
              continue;
            }
            console.log('Цена и сумма: ', element.count * element.amount, sumAll);
            await invest(element.id, element.count, element.price);
          }
        }
      }
    }  
    async function mainFunction() {
      sendNotification("Ожидайте", "Средства распределяются, не закрывайте вкладку.");
      await smInvest(data.smInvest.minPrice, data.smInvest.maxPrice, data.smInvest.ytmMin, data.smInvest.ytmMax, data.smInvest.sumAll, data.smInvest.sum, data.smInvest.array);
      sendNotification("Распределение заверешено", `Общая сумма: ${toCurrencyFormat(investedSum)}. 
                                  Количество займов: ${companyCount} из ${companyArrayLength}. Ошибки: ${errorCount}.`);
      setBadge("");
      chrome.runtime.sendMessage({data: 'Распределение средств заверешено'});
      
      // setTimeout(() => {
      //   window.close();
      // }, 4000); 
    }
    mainFunction();
  }
});

async function updateBadgeInfo() {
  if (document.hidden) {
    return;
  }
  
  const timeCd = 6;
  
  try {
    const topData = await new Promise((resolve, reject) => {
      chrome.storage.local.get("JLE_content", function (result) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });

    if (
      !topData.JLE_content ||
      topData.JLE_content.lastUpdate + 60000 * timeCd <= new Date().getTime()
    ) {
      const data = await new Promise((resolve, reject) => {
        chrome.storage.local.get("investSettings", function (result) {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result);
          }
        });
      });

      let fm = {
        daysFrom: 0,
        daysTo: 2000,
        ratingFrom: 1,
        ratingTo: 20,
        rateFrom: 0,
        rateTo: 35,
        loansFrom: 1,
        loansTo: 100,
        maxCompanySum: 357,
        investSum: 100,
      };

      let sm = {
        daysFrom: 0,
        daysTo: 2000,
        ratingFrom: 1,
        ratingTo: 20,
        rateFrom: 0,
        rateTo: 100,
        fdFrom: 0,
        fdTo: 100,
        progressFrom: 0,
        progressTo: 100,
        classFrom: 0,
        classTo: 0,
        maxCompanySum: 357,
        priceFrom: 1,
        priceTo: 100,
        investSum: 100,
      };
      if (data.investSettings) {
        if (data.investSettings.fmDaysFrom) {
          fm.daysFrom = parseFloat(data.investSettings.fmDaysFrom);
        }
        if (data.investSettings.fmDaysTo) {
          fm.daysTo = parseFloat(data.investSettings.fmDaysTo);
        }
        if (data.investSettings.fmRatingFrom) {
          fm.ratingFrom = parseFloat(data.investSettings.fmRatingFrom);
        }
        if (data.investSettings.fmRatingTo) {
          fm.ratingTo = parseFloat(data.investSettings.fmRatingTo);
        }
        if (data.investSettings.fmRateFrom) {
          fm.rateFrom = parseFloat(data.investSettings.fmRateFrom);
        }
        if (data.investSettings.fmRateTo) {
          fm.rateTo = parseFloat(data.investSettings.fmRateTo);
        }
        if (data.investSettings.fmLoansFrom) {
          fm.loansFrom = parseFloat(data.investSettings.fmLoansFrom);
        }
        if (data.investSettings.fmLoansTo) {
          fm.loansTo = parseFloat(data.investSettings.fmLoansTo);
        }
        if (data.investSettings.fmMaxCompanySum) {
          fm.maxCompanySum = parseFloat(data.investSettings.fmMaxCompanySum);
        }
        if (data.investSettings.fmInvestSum) {
          fm.investSum = parseFloat(data.investSettings.fmInvestSum);
        }
        // Вторичка
        if (data.investSettings.smDaysFrom) {
          sm.daysFrom = parseFloat(data.investSettings.smDaysFrom);
        }
        if (data.investSettings.smDaysTo) {
          sm.daysTo = parseFloat(data.investSettings.smDaysTo);
        }
        if (data.investSettings.smRatingFrom) {
          sm.ratingFrom = parseFloat(data.investSettings.smRatingFrom);
        }
        if (data.investSettings.smRatingTo) {
          sm.ratingTo = parseFloat(data.investSettings.smRatingTo);
        }
        if (data.investSettings.smRateFrom) {
          sm.rateFrom = parseFloat(data.investSettings.smRateFrom);
        }
        if (data.investSettings.smRateTo) {
          sm.rateTo = parseFloat(data.investSettings.smRateTo);
        }
        if (data.investSettings.smFdFrom) {
          sm.fdFrom = parseFloat(data.investSettings.smFdFrom);
        }
        if (data.investSettings.smFdTo) {
          sm.fdTo = parseFloat(data.investSettings.smFdTo);
        }
        if (data.investSettings.smProgressFrom) {
          sm.progressFrom = parseFloat(data.investSettings.smProgressFrom);
        }
        if (data.investSettings.smProgressTo) {
          sm.progressTo = parseFloat(data.investSettings.smProgressTo);
        }
        if (data.investSettings.smClassFrom) {
          sm.classFrom = parseFloat(data.investSettings.smClassFrom);          
        }
        if (data.investSettings.smClassTo) {
          sm.classTo = parseFloat(data.investSettings.smClassTo);      
        }
        if (data.investSettings.smMaxCompanySum) {
          sm.maxCompanySum = parseFloat(data.investSettings.smMaxCompanySum);
        }
        if (data.investSettings.smPriceFrom) {
          sm.priceFrom = parseFloat(data.investSettings.smPriceFrom);
        }
        if (data.investSettings.smPriceTo) {
          sm.priceTo = parseFloat(data.investSettings.smPriceTo);
        }
        if (data.investSettings.smInvestSum) {
          sm.investSum = parseFloat(data.investSettings.smInvestSum);
        }
      }

      sortCompanyUpdate(fm, sm);
    }
  } catch (error) {
    console.error(error); // Скорее всего контекст инвалид из-за обновления приложения и не обновления страницы после этого
  }
}

async function sortCompanyUpdate(fm, sm) {
  setBadge("⌛");
  const fmUrl = "https://jetlend.ru/invest/api/requests/waiting";
  const smUrl = "https://jetlend.ru/invest/api/exchange/loans?limit=10000&offset=0&sort_dir=desc&sort_field=ytm";
  const statsUrl = "https://jetlend.ru/invest/api/account/details";
  const fmData = await fetchData(fmUrl);
  const smData = await fetchData(smUrl);
  const statsData = await fetchData(statsUrl);

  async function fetchDetails(companyId) {
    const response = await fetchData(
      `https://jetlend.ru/invest/api/requests/${companyId}/details`
    );
    if (response.data) {
      return response.data.data.details.financial_discipline;
    }
  }

  if (fmData.data && smData.data && statsData.data) {

    chrome.storage.local.set({
      JLE_content: { lastUpdate: new Date().getTime() },
    });

    const freeBalance = statsData.data.data.balance.free;
    let fmSortedLength = 0;
    let smSortedLength = 0;
    let fmCount = 0;
    let smCount = 0;
    let fmInvestCompanyArray = [];
    let smInvestCompanyArray = [];
    const sortCap = 25;
    
    async function updateFirstMarket() {
      if (fmData.data) {
        const valueToNum = (value) =>
          parseFloat(
            (parseFloat(value.toString().replace(",", ".")) / 100).toFixed(4)
          );
        const fmSorted = fmData.data.requests.filter(
          (obj) =>
            (obj.collected_percentage !== 100) /* Полоска сбора не заполнена (меньше 100%) */ 
            && (obj.investing_amount === null) /* Резервация (нет) */ 
            && (ratingArray.indexOf(obj.rating) >= parseInt(fm.ratingFrom) && ratingArray.indexOf(obj.rating) <= parseInt(fm.ratingTo)) /* Рейтинг займа */
            && (obj.term >= fm.daysFrom && obj.term <= fm.daysTo) /* Срок займа */ 
            && (obj.interest_rate >= valueToNum(fm.rateFrom)) && (obj.interest_rate <= valueToNum(fm.rateTo)) /* Процент займа (от 20 до 100) */ 
            && (obj.loan_order >= fm.loansFrom) && (obj.loan_order <= fm.loansTo) /* Какой по счёту займ на платформе */
            && (obj.company_investing_amount <= (parseFloat(fm.maxCompanySum) - parseFloat(fm.investSum)))) /* Сумма в одного заёмщика */ 
        fmSortedLength = Math.min(sortCap, fmSorted.length);

          let fmSecondSort = [];
          for (const element of fmSorted) {
            const fd = await fetchDetails(element.id);
            element.financial_discipline = fd;
            if (fd === 1) {
              fmSecondSort.push(element);
            }
            fmCount++;
            if (
              fmCount === sortCap ||
              fmSecondSort.length >= Math.floor(freeBalance / fm.investSum)
            ) {
              break;
            }
            setBadge(
              `${((fmCount / fmSortedLength ) * 50).toFixed(0)}%`
            );
            

          }
          
          fmInvestCompanyArray = fmSecondSort;
          
        
      }
      setBadge(`50%`);
      fmUpdate = true;
    }

    // Обновление списка компаний (вторичка)
    async function updateSecondMarket() {
      if (smData.data) {
        const valueToPercent = (value) =>
          parseFloat(
            (parseFloat(value.toString().replace(",", ".")) / 100).toFixed(4)
          ); // '12,3456' => 0.1234
        const smFilters = {
          daysFrom: sm.daysFrom,
          daysTo: sm.daysTo,
          ratingFrom: parseInt(sm.ratingFrom),
          ratingTo: parseInt(sm.ratingTo),
          ytmFrom: valueToPercent(sm.rateFrom),
          ytmTo: valueToPercent(sm.rateTo),
          progressFrom: valueToPercent(sm.progressFrom),
          progressTo: valueToPercent(sm.progressTo),
          classFrom: parseInt(sm.classFrom),
          classTo: parseInt(sm.classTo),
          investDebt: parseFloat(sm.maxCompanySum)
        }
        const smSorted = smData.data.data.filter(
          (obj) =>
            (obj.invested_debt === null || obj.invested_debt === 0.00) /* Есть в портфеле (нет) */ 
            && (obj.term_left >= sm.daysFrom && obj.term_left <= sm.daysTo) /* Остаток срока займа */ 
            && (ratingArray.indexOf(obj.rating) >= parseInt(sm.ratingFrom) && ratingArray.indexOf(obj.rating) <= parseInt(sm.ratingTo)) /* Рейтинг займа */
            && (obj.ytm >= valueToPercent(sm.rateFrom) && obj.ytm <= valueToPercent(sm.rateTo)) /* Эффективная ставка (от 20 до 100) */ 
            && (obj.progress >= valueToPercent(sm.progressFrom) && obj.progress <= valueToPercent(sm.progressTo)) /* Выплачено (прогресс в %) */ 
            && (obj.min_price >= valueToPercent(sm.priceFrom) && obj.min_price <= valueToPercent(sm.priceTo)) /* Мин прайс от 50% до 90% */ 
            && (obj.loan_class >= parseInt(sm.classFrom) && obj.loan_class <= parseInt(sm.classTo)) /* Класс займа */
            && (obj.invested_company_debt <= (parseFloat(sm.maxCompanySum) - parseFloat(sm.investSum))) /* Сумма в одного заёмщика */
            && (obj.status === "active"));
        smSortedLength = Math.min(sortCap, smSorted.length);

          let smSecondSort = [];
          for (const element of smSorted) {
            const fd = await fetchDetails(element.loan_id);
            element.financial_discipline = fd;
            if (
              fd >= valueToPercent(sm.fdFrom) &&
              fd <= valueToPercent(sm.fdTo) /* ФД от до */
            ) {
              smSecondSort.push(element);
            }
            smCount++;
            if (
              smCount === sortCap ||
              smSecondSort.length >= Math.floor(freeBalance / sm.investSum)
            ) {
              break;
            }
            setBadge(
              `${((smCount / smSortedLength ) * 50 + 50).toFixed(0)}%`
            );
          }
          smInvestCompanyArray = smSecondSort;
      }
      setBadge(`100%`);
    }

    await updateFirstMarket();
    await updateSecondMarket();
    setBadge(
      `${Math.min(
        fmInvestCompanyArray.length,
        Math.floor(freeBalance / fm.investSum)
      )}/${Math.min(
        smInvestCompanyArray.length,
        Math.floor(freeBalance / sm.investSum)
      )}`
    );
  } else {
    setBadge('🔒❌');
  }
}

async function mainUpdate() {
  if (
    window.location.href.endsWith("invest/v3") ||
    window.location.href.endsWith("invest/v3/?state=login")
  ) {
    const userStatsUrl = "https://jetlend.ru/invest/api/account/details";
    const platformStatsUrl = "https://jetlend.ru/invest/api/public/stats";

    const userStats = await fetchData(userStatsUrl);
    const platformStats = await fetchData(platformStatsUrl);

    const allAssetsBlock = document.querySelector(
      ".block_header__title__text__g9kpM"
    ); //Заголовок "Все активы"
    const balanceTitleBlock = document.querySelector(
      ".propertyItem_title__XLj0y"
    ); //Заголовок активов

    const balanceBlock = document.querySelectorAll(
      ".propertyItem_value__ZHL6p"
    )[0]; //Блок активов

    const collectionIncomeBlock = document.querySelectorAll(
      ".propertyItem_value__ZHL6p"
    )[1]; //Значение ставки на сборе

    const incomeTitleBlock = document.querySelector(
      ".dashboard_income-title__ly2bD"
    ); //Заголовок доходов
    const incomeBlock = document.querySelectorAll(
      ".propertyItem_value__ZHL6p"
    )[2]; //Блок доходов

    const incomePercentBlock = document.querySelectorAll(
      ".propertyItem_value__ZHL6p"
    )[3]; //Блок доходности в процентах


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
          return (
            this.interest +
            this.fine +
            this.bonus +
            this.reffBonus +
            this.sale -
            this.loss
          );
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
          return (
            this.interest +
            this.fine +
            this.bonus +
            this.reffBonus +
            this.sale -
            this.loss
          );
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

      allAssetsBlock.innerHTML = `Все активы <span style="font-weight:300;">(${getUpdateTime(
        new Date().getTime()
      )})</span>`;
      balanceTitleBlock.innerHTML = `<span>Активы / Активы без НПД</span>`;
      balanceBlock.innerHTML = `<span>${toCurrencyFormat(
        balance
      )} / ${toCurrencyFormat(cleanBalance)}</span>`;
      collectionIncomeBlock.innerHTML = `<span>${toPercentFormat(
        platformObj.average_interest_rate_30days
      )}</span>`;


       // Загрузка настроек из хранилища
      chrome.storage.local.get("settings", function (data) {
        if (data.settings) {
          if (!data.settings || data.settings.timePeriod == undefined || data.settings.timePeriod == "всё время") {
            incomeTitleBlock.innerHTML = `<span>Доход за всё время (без НПД / чистый доход)</span>`;
            incomeBlock.innerHTML = `<span>${toCurrencyFormat(allTime.profitWithoutNpd)} / ${toCurrencyFormat(allTime.cleanProfit)}</span>`;
            incomePercentBlock.innerHTML = `<span>${toPercentFormat(allTime.percentProfit)}</span>`;
          } else if (data.settings.timePeriod == "год") {
            incomeTitleBlock.innerHTML = `<span>Доход за год (без НПД / чистый доход)</span>`;
            incomeBlock.innerHTML = `<span>${toCurrencyFormat(yearTime.profitWithoutNpd)} / ${toCurrencyFormat(yearTime.cleanProfit)}</span>`;
            incomePercentBlock.innerHTML = `<span>${toPercentFormat(yearTime.percentProfit)}</span>`;
          }
        }
      });
    }

    if (userStats.error || platformStats.error) {
      console.error(response.error);
    }
  }
}

updateBadgeInfo();
mainUpdate();

setInterval(function () {
  mainUpdate();
  updateBadgeInfo();
}, 60000);

