const $ = document.querySelector.bind(document);
const all = document.querySelectorAll.bind(document);
const id = document.getElementById.bind(document);

const version = "0.6.1";

const lastUpdateDateTag = $(".lastUpdateDate"); //Тэг последнего обновления данных
const balanceTitle = $(".balance__title");      //Заголовок баланса
const balanceTag = $(".balance__value");        //Тэг баланса
const incomeTitle = $(".income__title");        //Заголовок дохода
const incomeTag = $(".income__value");          //Тэг дохода
const btnInvestOpen = $('.invest-section__btn-open '); // Кнопка открытия страницы распределения средств
const btnInvestClose = $('.invest-section__btn-close'); // Кнопка закрытия страницы распределения средств
const statsSection = $('.stats-section'); // Блок подробной статистики
const swapBtn = $('.swap'); // Свапалка в подробной статистике
const settingsBtn = $('.settings__swap'); // Кнопка-свапалка в настройках

let daysFrom = id('invest-days-from');
let daysTo = id('invest-days-to');
let rateFrom = id('rate-from');
let rateTo = id('rate-to');
let loansFrom = id('loans-from');
let loansTo = id('loans-to');
let investSum = id('invest-sum');
let investSumAll = id('invest-sum-all');

let cashFlows = [];                               // Движение средств для XIRR
let cashFlowsWithNpd = [];                        // Движение средств для XIRR с НПД
let dates = [];                                   // Даты для XIRR