const $ = document.querySelector.bind(document);
const all = document.querySelectorAll.bind(document);
const id = document.getElementById.bind(document);

const version = "0.7.0";

const lastUpdateDateTag = $(".lastUpdateDate"); //Тэг последнего обновления данных
const balanceTitle = $(".balance__title");      //Заголовок баланса
const balanceTag = $(".balance__value");        //Тэг баланса
const incomeTitle = $(".income__title");        //Заголовок дохода
const incomeTag = $(".income__value");          //Тэг дохода
const btnInvestOpen = $('.invest-section__btn-open '); // Кнопка открытия страницы распределения средств
const btnInvestClose = $('.invest-section__btn-close'); // Кнопка закрытия страницы распределения средств
const statsSection = $('.stats-section');       // Блок подробной статистики
const swapBtn = $('.swap');                     // Свапалка в подробной статистике
const settingsBtn = $('.settings__swap');       // Кнопка-свапалка в настройках

let fmDaysFrom = id('fm-invest-days-from');
let fmDaysTo = id('fm-invest-days-to');
let fmRateFrom = id('fm-rate-from');
let fmRateTo = id('fm-rate-to');
let fmLoansFrom = id('fm-loans-from');
let fmLoansTo = id('fm-loans-to');
let fmInvestSum = id('fm-invest-sum');
let fmInvestSumAll = id('fm-invest-sum-all');

let smDaysFrom = id('sm-invest-days-from');
let smDaysTo = id('sm-invest-days-to');
let smRateFrom = id('sm-rate-from');
let smRateTo = id('sm-rate-to');
let smFdFrom = id('sm-fd-from');
let smFdTo = id('sm-fd-to');
let smProgressFrom = id('sm-progress-from');
let smProgressTo = id('sm-progress-to');
let smPriceFrom = id('sm-price-from');
let smPriceTo = id('sm-price-to');
let smInvestSum = id('sm-invest-sum');
let smInvestSumAll = id('sm-invest-sum-all');

let fmCompanyUpdate = true;
let smCompanyUpdate = false;