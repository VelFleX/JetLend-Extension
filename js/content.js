async function updateBadgeInfo() {
  const timeCd = 5;
  
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
        rateFrom: 0,
        rateTo: 100,
        loansFrom: 1,
        loansTo: 100,
        investSum: 100,
      };

      let sm = {
        daysFrom: 0,
        daysTo: 2000,
        rateFrom: 0,
        rateTo: 100,
        fdFrom: 0,
        fdTo: 100,
        progressFrom: 0,
        progressTo: 100,
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
    console.error(error);
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
    const sortCap = 30;
    
    async function updateFirstMarket() {
      if (fmData.data) {
        const valueToNum = (value) =>
          parseFloat(
            (parseFloat(value.toString().replace(",", ".")) / 100).toFixed(4)
          );
        const fmSorted = fmData.data.requests.filter(
          (obj) =>
            obj.collected_percentage !==
              100 /* Полоска сбора не заполнена (меньше 100%) */ &&
            obj.investing_amount === null /* Резервация (нет) */ &&
            (obj.company_investing_amount === null ||
              obj.company_investing_amount ===
                "0.00") /* Есть в портфеле (нет) */ &&
            obj.term >= fm.daysFrom &&
            obj.term <= fm.daysTo /* Срок займа */ &&
            obj.interest_rate >= valueToNum(fm.rateFrom) &&
            obj.interest_rate <=
              valueToNum(fm.rateTo) /* Процент займа (от 20 до 100) */ &&
            obj.loan_order >= fm.loansFrom &&
            obj.loan_order <= fm.loansTo /* Какой по счёту займ на платформе */
        );
        fmSortedLength = getMin(sortCap, fmSorted.length);

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
              `${(
                ((fmCount + smCount) / (fmSortedLength + smSortedLength)) *
                100
              ).toFixed(0)}%`
            );
            

          }
          
          fmInvestCompanyArray = fmSecondSort;
          
        
      }
      fmUpdate = true;
    }

    // Обновление списка компаний (вторичка)
    async function updateSecondMarket() {
      if (smData.data) {
        const valueToPercent = (value) =>
          parseFloat(
            (parseFloat(value.toString().replace(",", ".")) / 100).toFixed(4)
          ); // '12,3456' => 0.1234
          
        const smSorted = smData.data.data.filter(
          (obj) =>
            (obj.invested_debt === null ||
              obj.invested_debt === "0.00") /* Есть в портфеле (нет) */ &&
            obj.term_left >= sm.daysFrom &&
            obj.term_left <= sm.daysTo /* Остаток срока займа */ &&
            // && (obj.interest_rate >= 0.15 && obj.interest_rate <= 1) /* Изначальный процент займа (от 20 до 100) */
            obj.ytm >= valueToPercent(sm.rateFrom) &&
            obj.ytm <=
              valueToPercent(
                sm.rateTo
              ) /* Эффективная ставка (от 20 до 100) */ &&
            // && (obj.loan_order >= 1 && obj.loan_order <= 5)  /* Какой по счёту займ на платформе */
            obj.progress >= valueToPercent(sm.progressFrom) &&
            obj.progress <=
              valueToPercent(sm.progressTo) /* Выплачено (прогресс в %) */ &&
            obj.min_price >= valueToPercent(sm.priceFrom) &&
            obj.min_price <=
              valueToPercent(sm.priceTo) /* Мин прайс от 50% до 90% */ &&
            obj.status === "active"
        );
        smSortedLength = getMin(sortCap, smSorted.length);

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
              `${(
                ((fmCount + smCount) / (fmSortedLength + smSortedLength)) *
                100
              ).toFixed(0)}%`
            );
            

          }
          smInvestCompanyArray = smSecondSort;
          
          

          setBadge(
            `${getMin(
              fmInvestCompanyArray.length,
              Math.floor(freeBalance / fm.investSum)
            )}/${getMin(
              smInvestCompanyArray.length,
              Math.floor(freeBalance / sm.investSum)
            )}`
          );
        
        
      

      }
    }

    updateFirstMarket();
    updateSecondMarket();

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

// Распределение средств (первичка)
chrome.storage.local.get("fmInvest", function (data) {
  if (data.fmInvest) {
    function invest(companyId) {
      let user = {
        agree: true,
        amount: data.fmInvest.sum,
      };

      fetch(`https://jetlend.ru/invest/api/requests/${companyId}/invest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "X-Csrftoken": getCookie("csrftoken"),
        },
        credentials: "include",
        body: JSON.stringify(user),
      })
        .then((response) => response.json())
        .then((data) => console.log(data));
    }

    for (element of data.fmInvest.array) {
      invest(element);
    }


    sendNotification("Готово", "Средства распределены успешно!");
    setBadge("");
  }
});
chrome.storage.local.remove("fmInvest");

// Распределение средств (вторичка)
chrome.storage.local.get("smInvest", function (data) {
  if (data.smInvest) {



    
  
  
  
  
  
    async function smInvest(min, max, all, sum, companyArray) {
      let sumAll = all; // Свободные средства
      async function invest(companyId, count, price) {
        let user = {
          count: count,
          max_price: price, // Процент
        };
    
        await fetch(`https://jetlend.ru/invest/api/exchange/loans/${companyId}/buy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            "X-Csrftoken": getCookie("csrftoken"),
          },
          credentials: "include",
          body: JSON.stringify(user),
        })
          .then((response) => response.json())
          .then((data) => console.log(data));
      }
      for (companyId of companyArray) {
        const resp = await fetchData(`https://jetlend.ru/invest/api/exchange/loans/${companyId}/dom/records`);
        if (resp.data) {
          const sort = resp.data.data.filter(obj => (obj.count > 0) && (obj.price >= min && obj.price <= max)).reverse();
          const secondSort = [];
          let sumOne = sum; // Сумма в один займ
          console.log('sort', sort);
          console.log('companyId', companyId);
          for (element of sort) {
            const getPrice = element => element.amount / element.count + 5; // Погрешность 5р
            if (sumOne > 0) {
              if (element.amount >= sumOne && Math.floor(sumOne/getPrice(element)) > 0) {
                secondSort.push({id: companyId, price: element.price, count: Math.floor(sumOne/getPrice(element)), amount: getPrice(element)});
                // sendNotification('Инвестиция', `id: ${companyId}, прайс: ${element.price}, количество: ${Math.floor(sumOne/getPrice(element))}, сумма: ${getPrice(element)}`);
                sumAll -= sumOne;
                sumOne = 0;
              } else if (element.amount < sumOne) {
                secondSort.push({id: companyId, price: element.price, count: element.count, amount: getPrice(element)});
                // sendNotification('Инвестиция', `id: ${companyId}, прайс: ${element.price}, количество: ${element.count}, сумма: ${getPrice(element)}`);
                sumAll -= element.amount;
                sumOne -= element.amount;
              } 
            }
          }
          for (element of secondSort) {
            await invest(element.id, element.count, element.price)
          }
        }
      }
    }  
    async function mainFunction() {
      sendNotification("Ожидайте", "Средства распределяются, не закрывайте вкладку.");
      await smInvest(data.smInvest.minPrice, data.smInvest.maxPrice, data.smInvest.sumAll, data.smInvest.sum, data.smInvest.array);
      sendNotification("Готово", "Средства распределены успешно!");
      setBadge("");
    }
    mainFunction();
  }
});
chrome.storage.local.remove("smInvest");


    