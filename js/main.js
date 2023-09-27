let cached = true;
let loadCache = false;

chrome.storage.local.get("settings", function (data) {
  if (data.settings) {
    loadCache = data.settings.saveCache;
  }
})

window.addEventListener("load", function() {
  chrome.storage.local.get("settings", function (data) {
    if (data.settings) {
      loadCache = data.settings.saveCache;
    }
  })

  // Загрузка данных
chrome.storage.local.get("cacheJetlend", function (result) {
  const data = result.cacheJetlend;

  const allAssetsBlock = document.querySelector('.block_header__title__text__g9kpM');       //Заголовок "Все активы" 
  const balanceTitleBlock = document.querySelector(".propertyItem_title__XLj0y");           //Заголовок активов
  const balanceBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[0];          //Блок активов
  const collectionIncomeBlock = document.querySelectorAll('.propertyItem_value__ZHL6p')[1]; //Значение ставки на сборе
  const incomeTitleBlock = document.querySelector(".dashboard_income-title__ly2bD");        //Заголовок доходов
  const incomeBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[2];           //Блок доходов
  const incomePercentBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[3];    //Блок доходности в процентах

  if (data&&loadCache) {
    const updateTime = data.updateTime;
  
    const date = new Date(updateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
  
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
  
    const currentTime = new Date().getTime();
    const formattedDateTime = `Обновлено${currentTime - 86_400_000 > updateTime ? ` ${day}.${month}.${year}` : ""} в ${hours}:${minutes}`;
    
    allAssetsBlock.innerHTML += `<span style="font-weight: 300;"> (${formattedDateTime})</span>`;
    balanceTitleBlock.textContent = data.balanceTitle;
    balanceBlock.innerHTML = data.balanceInner;
    // incomeTitleBlock.textContent += `(${data.incomeTitle.split('(')[1]}`;
    incomeTitleBlock.textContent += `(без НПД / чистый доход без НПД)`;
    incomeBlock.innerHTML = data.incomeInner;
    // cached = true;
  } else {
    allAssetsBlock.innerHTML += `<span title='Наведите курсор на "Доходы" для обновления' style="color: #E1BB45; font-weight: 300; cursor: pointer;"> (Не обновлено)</span>`;
  }
});
});

function statUpdate(cached) {
  const tippy = document.querySelector(
    "#tippy-19 div:last-child div:last-child div:last-child"
  );

  const arr = tippy.querySelectorAll("p");
  const allAssetsBlock = document.querySelector('.block_header__title__text__g9kpM');                  //Заголовок "Все активы" 
  const balanceTitleBlock = document.querySelector(".propertyItem_title__XLj0y");                      //Заголовок активов
  let balanceBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[0].querySelector('span'); //Блок баланса
  const collectionIncomeBlock = document.querySelectorAll('.propertyItem_value__ZHL6p')[1];            //Значение ставки на сборе
  const incomeTitleBlock = document.querySelector(".dashboard_income-title__ly2bD");                   //Заголовок доходов
  let incomeBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[2].querySelector('span');  //Блок доходов
  const incomePercentBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[3];      //Блок доходности в процентах

  const balanceInnerBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[0];
  const incomeInnerBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[2];

  const actualBalance = document.querySelectorAll('.chartBlockHeader_value__DuZg7')[2];     //Баланс с НПД (правильный)

  // if (cached) {
  //   balanceBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[0].querySelector('span');
  //   incomeBlock = document.querySelectorAll(".propertyItem_value__ZHL6p")[2].querySelector('span');
  // }

  const [
    percentIncome,
    futureNpd,
    peni,
    bonus,
    refBonus,
    secondaryMarket,
    losses,
    ,
    ndfl,
    futureNdfl,
    cleanIncome,
  ] = arr;

  const percentIncomeNum = tagToNum(percentIncome);     //Процентный доход
  const futureNpdNum = tagToNum(futureNpd);             //НПД ожидаемый
  const peniNum = tagToNum(peni);                       //Пени
  const bonusNum = tagToNum(bonus);                     //Бонусы
  const refBonusNum = tagToNum(refBonus);               //Доход за друзей
  const secondaryMarketNum = tagToNum(secondaryMarket); //Доход на вторичке
  const lossesNum = tagToNum(losses);                   //Потери
  const ndflNum = tagToNum(ndfl);                       //НДФЛ
  const futureNdflNum = tagToNum(futureNdfl);           //НДФЛ от НПД
  const cleanIncomeNum = tagToNum(cleanIncome);         //Доход после НДФЛ

  function tagToNum(tag, span = true) {
    if (span) {
      tag = tag.querySelector("span");
    }
    return parseFloat(tag.textContent.replace(",", ".").replace(/\s/g, ""));
  }

  const getTime = () => {
    const time = new Date();
    const hours = String(time.getHours()).padStart(2, "0");
    const minutes = String(time.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  const toCurrencyFormat = (element) => element.toLocaleString("ru-RU", { style: "currency", currency: "RUB" });

  const cleanBalance = () => toCurrencyFormat(parseFloat(actualBalance.textContent.replace(",", ".").replace(/\s/g, "")) - futureNpdNum);
  const income = () => toCurrencyFormat(percentIncomeNum + peniNum + bonusNum + refBonusNum + secondaryMarketNum + lossesNum - 0.01);
  // const netIncome = () => toCurrencyFormat(cleanIncomeNum - futureNpdNum - futureNdflNum);
  const netIncome = () => toCurrencyFormat(percentIncomeNum + peniNum + bonusNum + refBonusNum + secondaryMarketNum + lossesNum + ndflNum);
  // const netIncome = () => toCurrencyFormat(cleanIncomeNum - futureNdflNum);

  allAssetsBlock.innerHTML = `Все активы<span style="font-weight: 300;"> (Обновлено в ${getTime()})</span>`;
  balanceTitleBlock.textContent = "Активы / Активы без НПД";
  // incomeTitleBlock.innerHTML = `${incomeTitleBlock.textContent.replace(' (без НПД / чистый доход без НПД)', '')} (без НПД / чистый доход без НПД)`;
  incomeTitleBlock.textContent += incomeTitleBlock.textContent.includes('(без НПД / чистый доход без НПД)') ? '' : ' (без НПД / чистый доход без НПД)';

  if (cached) {
    balanceInnerBlock.innerHTML = `<span>${toCurrencyFormat(tagToNum(actualBalance, false))}</span> <span>/</span> <span>${cleanBalance()}</span>`;
    incomeInnerBlock.innerHTML = `<span>${income()}</span> <span>/</span> <span>${netIncome()}</span>`;
  } else {
    balanceBlock.innerHTML = `<span>${toCurrencyFormat(tagToNum(actualBalance, false))}</span> <span>/</span> <span>${cleanBalance()}</span>`;
    incomeBlock.innerHTML = `<span>${income()}</span> <span>/</span> <span>${netIncome()}</span>`;
  }

  // Сохранение данных
  const cache = {
    balanceInner: balanceInnerBlock.innerHTML,
    incomeInner: incomeInnerBlock.innerHTML,
    balanceTitle: balanceTitleBlock.textContent,          //Текст заголовка баланса (согласно настройкам)
    balanceText: balanceBlock.textContent,                //Текст активов (согласно настройкам)
    collectionIncome: collectionIncomeBlock.textContent,  //Текст ставки на сборе
    incomeTitle: incomeTitleBlock.textContent,            //Текст заголовка дохода (согласно настройкам)
    incomeText: incomeBlock.textContent,                  //Текст дохода (согласно настройкам)
    incomePercent: incomePercentBlock.textContent,
    percentIncomeNum: percentIncomeNum,                   //Процентный доход
    futureNpdNum: futureNpdNum,
    peniNum: peniNum,
    bonusNum: bonusNum,
    refBonusNum: refBonusNum,
    secondaryMarketNum: secondaryMarketNum,
    lossesNum: lossesNum,
    ndflNum: ndflNum,
    futureNdflNum: futureNdflNum,
    cleanIncomeNum: cleanIncomeNum,
    updateTime: new Date().getTime()
  };
  chrome.storage.local.set({ cacheJetlend: cache });
}

const targetId = "tippy-19";

const observer = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {
    const addedNode = Array.from(mutation.addedNodes).find(
      (node) => node.id === targetId
    );
    if (addedNode) {
      statUpdate(cached);
      // if (!cached) {
      //   observer.disconnect();
      // }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
