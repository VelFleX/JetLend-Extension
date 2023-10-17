let timePeriod = "";

// Загрузка данных из хранилища при загрузке попапа
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


// Уведомления
function sendNotification(title, text) {
  let notification = new Notification(title,  {
    body: text,
    icon: "https://psv4.userapi.com/c909628/u433752091/docs/d8/1b1b30e2b88e/icon48.png"
  });
  return notification;
}

// Запрос на разрешение показа уведомлений
Notification.requestPermission()

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

const toCurrencyFormat = (element) =>
  element.toLocaleString("ru-RU", { style: "currency", currency: "RUB" });

const toPercentFormat = (element) =>
  `${(element * 100).toFixed(2).replace(".", ",")} %`;




function fetchData(url) {
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Ошибка, статус: ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      throw new Error(`Ошибка: ${error}`);
    });
}
  

async function combinedFunction() {
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
      const obj = userStats.data;
      const platformObj = platformStats.data;

      const statAllTime = obj.summary;
      const statYearTime = obj.summary_year;
      const balanceStats = obj.balance;

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


      const allProfitWithoutNpd = () =>
      allInterest + allFine + allBonus + allReffBonus + allSale - allLoss;
      
      const allCleanProfit = () => allProfitWithoutNpd() - allNdfl;

      // const allProfitWithoutNdfl = () => allCleanProfit() + balanceStats.nkd;

      const yearProfitWithoutNpd = () =>
      yearInterest + yearFine + yearBonus + yearReffBonus + yearSale - yearLoss;
      
      const yearCleanProfit = () => yearProfitWithoutNpd() - yearNdfl;

      // const yearProfitWithoutNdfl = () => yearCleanProfit() + balanceStats.nkd;

      allAssetsBlock.innerHTML = `Все активы <span style="font-weight:300;">(${getUpdateTime((new Date).getTime())})</span>`;
      balanceTitleBlock.innerHTML = `<span>Активы / Активы без НПД</span> <span>Ставка на сборе</span>`;
      balanceBlock.innerHTML = `<span>${toCurrencyFormat(balance)} / ${toCurrencyFormat(cleanBalance)}</span>`;
      collectionIncomeBlock.innerHTML = `<span>${toPercentFormat(platformObj.average_interest_rate_30days)}</span>`;
      
      if (timePeriod == "allTime") {
        incomeTitleBlock.innerHTML = `<span>Доход за всё время (без НПД / чистый доход)</span>`;
        incomeBlock.innerHTML = `<span>${toCurrencyFormat(allProfitWithoutNpd())} / ${toCurrencyFormat(allCleanProfit())}</span>`;
        incomePercentBlock.innerHTML = `<span>${toPercentFormat(allPercentProfit)}</span>`
      } else if (timePeriod == "year") {
        incomeTitleBlock.innerHTML = `<span>Доход за год (без НПД / чистый доход)</span>`;
        incomeBlock.innerHTML = `<span>${toCurrencyFormat(yearProfitWithoutNpd())} / ${toCurrencyFormat(yearCleanProfit())}</span>`;
        incomePercentBlock.innerHTML = `<span>${toPercentFormat(yearPercentProfit)}</span>`
      }
      

    }

    if (userStats.error || platformStats.error) {
      console.error(response.error);
    }
  } 
}
combinedFunction();
document.addEventListener("DOMContentLoaded", function() {
  combinedFunction();
});
setInterval(combinedFunction, 60000);

function x2(n) {
  return n*2;
}




function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

chrome.storage.local.get("invest", function (data) {
  if (data.invest) {

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

