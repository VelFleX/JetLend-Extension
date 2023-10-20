let timePeriod = "";

// Загрузка данных из хранилища при загрузке контента
chrome.storage.local.get("settings", function (data) {
  if (data.settings) {
    if (data.settings.timePeriod == 'всё время') {
      timePeriod = "allTime";
    } else if (data.settings.timePeriod == 'год') {
      timePeriod = "year";
    }
  } else if (!data.settings || data.settings.timePeriod == undefined) {
    timePeriod = "allTime";
  }
});

async function mainUpdateFunction() {
  console.log(window.location.href);
  if (window.location.href.endsWith("invest/v3") || window.location.href.endsWith("invest/v3/?state=login")) {

    const userStatsUrl = "https://jetlend.ru/invest/api/account/details";
    const platformStatsUrl = "https://jetlend.ru/invest/api/public/stats";

    const userStats = await fetchData(userStatsUrl);
    const platformStats = await fetchData(platformStatsUrl);

    const allAssetsBlock = document.querySelector('.block_header__title__text__g9kpM');       //Заголовок "Все активы" 
    const balanceTitleBlock = document.querySelector(".propertyItem_title__XLj0y");           //Заголовок активов
    
    const balanceBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[0];          //Блок активов
    
    const collectionIncomeBlock = document.querySelectorAll('.propertyItem_value__ZHL6p')[1]; //Значение ставки на сборе
    
    const incomeTitleBlock = document.querySelector(".dashboard_income-title__ly2bD");        //Заголовок доходов
    const incomeBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[2];           //Блок доходов
    
    const incomePercentBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[3];    //Блок доходности в процентах

    if (userStats.data && platformStats.data) {
      const obj = userStats.data.data;
      const platformObj = platformStats.data.data;

      const statAllTime = obj.summary;
      const statYearTime = obj.summary_year;
      const balanceStats = obj.balance;

      const balance = balanceStats.total;                      // Баланс
      const cleanBalance = balance - balanceStats.nkd;         // Баланс без НПД
      
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

      allAssetsBlock.innerHTML = `Все активы <span style="font-weight:300;">(${getUpdateTime((new Date).getTime())})</span>`;
      balanceTitleBlock.innerHTML = `<span>Активы / Активы без НПД</span> <span>Ставка на сборе</span>`;
      balanceBlock.innerHTML = `<span>${toCurrencyFormat(balance)} / ${toCurrencyFormat(cleanBalance)}</span>`;
      collectionIncomeBlock.innerHTML = `<span>${toPercentFormat(platformObj.average_interest_rate_30days)}</span>`;
      
      if (timePeriod == "allTime") {
        incomeTitleBlock.innerHTML = `<span>Доход за всё время (без НПД / чистый доход)</span>`;
        incomeBlock.innerHTML = `<span>${toCurrencyFormat(allTime.profitWithoutNpd)} / ${toCurrencyFormat(allTime.cleanProfit)}</span>`;
        incomePercentBlock.innerHTML = `<span>${toPercentFormat(allTime.percentProfit)}</span>`
      } else if (timePeriod == "year") {
        incomeTitleBlock.innerHTML = `<span>Доход за год (без НПД / чистый доход)</span>`;
        incomeBlock.innerHTML = `<span>${toCurrencyFormat(yearTime.profitWithoutNpd)} / ${toCurrencyFormat(yearTime.cleanProfit)}</span>`;
        incomePercentBlock.innerHTML = `<span>${toPercentFormat(yearTime.percentProfit)}</span>`
      }
    }

    if (userStats.error || platformStats.error) {
      console.error(response.error);
    }
  }
}
mainUpdateFunction();
document.addEventListener("DOMContentLoaded", function() {
  mainUpdateFunction();
});
setInterval(mainUpdateFunction, 60000);

// Распределение средств
chrome.storage.local.get("invest", function (data) {
  if (data.invest) {
    // Запрос на разрешение показа уведомлений
    Notification.requestPermission();

    function invest(companyId) {
      let user = {
        agree: true,
        amount: data.invest.sum
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

    for (element of data.invest.array) {
      invest(element);
    }

    console.log(data.invest.array);
    sendNotification('Готово', 'Средства распределены успешно!');
  }
});
chrome.storage.local.remove('invest');