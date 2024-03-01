// Распределение средств (первичка)
chrome.storage.local.get("fmInvest", function (data) {
  if (data.fmInvest) {
    let investedSum = 0; // Счётчик инвестированной суммы
    let companyCount = 0; // Счётчик компаний, в которых распределены средства
    let companyArrayLength = data.fmInvest.array.length; // Всего компаний
    let errorCount = 0; // Количество ошибок
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
        .then((obj) => {
          if (obj.status.toLowerCase() === "ok") {
            sendNotification("Успешная инвестиция", `Сумма: ${toCurrencyFormat(data.fmInvest.sum)}`);
            investedSum += data.fmInvest.sum;
            companyCount++;
          } else {
            sendNotification("Ошибка", `${obj.error}`);
            errorCount++;
          }
          console.log(obj);
        });
    }

    async function mainFunction() {
      sendNotification("Ожидайте", "Средства распределяются, не закрывайте вкладку.");
      for (company of data.fmInvest.array) {
        await invest(company);
      }
      sendNotification(
        "Распределение заверешено",
        `Общая сумма: ${toCurrencyFormat(investedSum)}. 
                                  Количество займов: ${companyCount} из ${companyArrayLength}. Ошибки: ${errorCount}.`
      );
      setBadge("");
      chrome.runtime.sendMessage({ data: "Распределение средств заверешено" });
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
      console.log("Массив компаний: ", companyArray);
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
        }).then((response) => response.json());
        let timeoutPromise = new Promise((resolve, reject) => {
          setTimeout(() => {
            errorCount++;
            console.log("Таймаут, id: ", companyId);
            reject(new Error(`Время ожидания истекло (10 сек).\nID займа: ${companyId}.`));
          }, 10000);
        });

        try {
          let data = await Promise.race([fetchPromise, timeoutPromise]);
          if (data.status.toLowerCase() === "ok") {
            sendNotification("Успешная инвестиция", `Сумма: ${toCurrencyFormat(data.data.amount)}. ID займа: ${companyId}.`);
            sumAll = parseFloat((sumAll - data.data.amount).toFixed(2));
            investedSum += data.data.amount;
            companyCount++;
          } else {
            sendNotification("Ошибка", `${data.error}\nID займа: ${companyId}.`);
            errorCount++;
          }
        } catch (error) {
          sendNotification("Ошибка", error.message);
        }
      }

      for (companyId of companyArray) {
        const resp = await fetchData(`https://jetlend.ru/invest/api/exchange/loans/${companyId}/dom/records`);
        if (resp.data) {
          const sort = resp.data.data.filter((obj) => obj.count > 0 && obj.price >= min && obj.price <= max && obj.ytm >= ytmMin && obj.ytm <= ytmMax).reverse();
          const secondSort = [];
          let sumOne = sum; // Сумма в один займ
          console.log(sort);
          for (element of sort) {
            const getPrice = (element) => currencyToFloat(element.amount / element.count); // Цена
            if (sumOne > 0) {
              if (element.amount >= sumOne && Math.floor(sumOne / getPrice(element)) > 0) {
                secondSort.push({ id: companyId, price: element.price, count: Math.floor(sumOne / getPrice(element)), amount: getPrice(element) });
                sumOne = 0;
              } else if (element.amount < sumOne) {
                secondSort.push({ id: companyId, price: element.price, count: element.count, amount: getPrice(element) });
                sumOne -= element.amount;
              }
            }
          }
          for (element of secondSort) {
            // Если цена больше чем сумма распределения
            if (element.count * element.amount > sumAll) {
              continue;
            }
            console.log("Цена и сумма: ", element.count * element.amount, sumAll);
            await invest(element.id, element.count, element.price);
          }
        }
      }
    }
    async function mainFunction() {
      sendNotification("Ожидайте", "Средства распределяются, не закрывайте вкладку.");
      await smInvest(data.smInvest.minPrice, data.smInvest.maxPrice, data.smInvest.ytmMin, data.smInvest.ytmMax, data.smInvest.sumAll, data.smInvest.sum, data.smInvest.array);
      sendNotification(
        "Распределение заверешено",
        `Общая сумма: ${toCurrencyFormat(investedSum)}. 
                                  Количество займов: ${companyCount} из ${companyArrayLength}. Ошибки: ${errorCount}.`
      );
      setBadge("");
      chrome.runtime.sendMessage({ data: "Распределение средств заверешено" });

      // setTimeout(() => {
      //   window.close();
      // }, 4000);
    }
    mainFunction();
  }
});

async function updateBadge() {
  if (document.hidden) {
    return;
  }
  const timeCd = 6;
  try {
    const lastData = await new Promise((res, rej) => {
      chrome.storage.local.get("JLE_content", function (result) {
        if (chrome.runtime.lastError) {
          rej(chrome.runtime.lastError);
        } else {
          res(result);
        }
      });
    });

    if (!lastData.JLE_content || lastData.JLE_content.lastUpdate + 60000 * timeCd <= new Date().getTime()) {
      setBadge("⌛");
      const statsUrl = "https://jetlend.ru/invest/api/account/details";
      const statsData = await fetchData(statsUrl);

      if (statsData.data) {
        const freeBalance = statsData.data.data.balance.free;
        chrome.storage.local.set({
          JLE_content: { lastUpdate: new Date().getTime() },
        });

        loadInvestSettings();
        await smLoadLoans("badge", 0, 100);
        await fmLoadLoans("badge");
        setBadge(`${Math.min(fmInvestCompanyArray.length, Math.floor(freeBalance / investSettingsObj.fmInvestSum), 99)}/${Math.min(smInvestCompanyArray.length, Math.floor(freeBalance / investSettingsObj.smInvestSum), 99)}`);
        console.log("f/sm: ", fmInvestCompanyArray, smInvestCompanyArray);
        console.log("f/sm/obj: ", Math.floor(freeBalance / investSettingsObj.fmInvestSum, Math.floor(freeBalance / investSettingsObj.smInvestSum)));
        console.log("obj: ", investSettingsObj.fmInvestSum, investSettingsObj.smInvestSum);
        console.log("bagde: ", `${Math.min(fmInvestCompanyArray.length, Math.floor(freeBalance / investSettingsObj.fmInvestSum), 99)}/${Math.min(smInvestCompanyArray.length, Math.floor(freeBalance / investSettingsObj.smInvestSum), 99)}`);
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

    const userStats = await fetchData(userStatsUrl);
    const platformStats = await fetchData(platformStatsUrl);

    const allAssetsBlock = document.querySelector(".block_header__title__text__g9kpM"); //Заголовок "Все активы"
    const balanceTitleBlock = document.querySelector(".propertyItem_title__XLj0y"); //Заголовок активов

    const balanceBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[0]; //Блок активов

    const collectionIncomeBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[1]; //Значение ставки на сборе

    const incomeTitleBlock = document.querySelector(".dashboard_income-title__ly2bD"); //Заголовок доходов
    const incomeBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[2]; //Блок доходов

    const incomePercentBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[3]; //Блок доходности в процентах

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
      balanceTitleBlock.innerHTML = `<span>Активы / Активы без НПД</span>`;
      balanceBlock.innerHTML = `<span>${toCurrencyFormat(balance)} / ${toCurrencyFormat(cleanBalance)}</span>`;
      collectionIncomeBlock.innerHTML = `<span>${toPercentFormat(platformObj.average_interest_rate_30days)}</span>`;

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

updateBadge();
mainUpdate();

setInterval(function () {
  mainUpdate();
  updateBadge();
}, 60000);
