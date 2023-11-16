const $ = {
  get: function(selector) {
    if (selector.startsWith('#')) {
      return document.getElementById(selector.substring(1));
    }
    return document.querySelector(selector);
  },
};

const all = document.querySelectorAll.bind(document);

const version = "0.8.0 beta 2";

const lastUpdateDateTag = $.get(".lastUpdateDate"); //Тэг последнего обновления данных
const balanceTitle = $.get(".balance__title");      //Заголовок баланса
const balanceTag = $.get(".balance__value");        //Тэг баланса
const incomeTitle = $.get(".income__title");        //Заголовок дохода
const incomeTag = $.get(".income__value");          //Тэг дохода
const btnInvestOpen = $.get('.invest-section__btn-open '); // Кнопка открытия страницы распределения средств
const btnInvestClose = $.get('.invest-section__btn-close'); // Кнопка закрытия страницы распределения средств
const statsSection = $.get('.stats-section');       // Блок подробной статистики
const settingsBtn = $.get('.settings__swap');       // Кнопка-свапалка в настройках

let fmDaysFrom = $.get('#fm-invest-days-from');
let fmDaysTo = $.get('#fm-invest-days-to');
let fmRateFrom = $.get('#fm-rate-from');
let fmRateTo = $.get('#fm-rate-to');
let fmLoansFrom = $.get('#fm-loans-from');
let fmLoansTo = $.get('#fm-loans-to');
let fmMaxCompanySum = $.get('#fm-max-company-sum');
let fmInvestSum = $.get('#fm-invest-sum');
let fmInvestSumAll = $.get('#fm-invest-sum-all');

let smDaysFrom = $.get('#sm-invest-days-from');
let smDaysTo = $.get('#sm-invest-days-to');
let smRateFrom = $.get('#sm-rate-from');
let smRateTo = $.get('#sm-rate-to');
let smFdFrom = $.get('#sm-fd-from');
let smFdTo = $.get('#sm-fd-to');
let smProgressFrom = $.get('#sm-progress-from');
let smProgressTo = $.get('#sm-progress-to');
let smPriceFrom = $.get('#sm-price-from');
let smPriceTo = $.get('#sm-price-to');
let smClassFrom = $.get('#sm-class-from');
let smClassTo = $.get('#sm-class-to');
let smMaxCompanySum = $.get('#sm-max-company-sum');
let smInvestSum = $.get('#sm-invest-sum');
let smInvestSumAll = $.get('#sm-invest-sum-all');

let fmCompanyUpdate = true;
let fmrCompanyUpdate = false;
let smCompanyUpdate = false;