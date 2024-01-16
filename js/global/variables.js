const version = "0.8.3";

const $ = {
  get: function(selector) {
    if (selector.startsWith('#')) {
      return document.getElementById(selector.substring(1));
    }
    return document.querySelector(selector);
  },
  create: function(tag, a, b) {
    let block = document.createElement(tag);

    if (typeof a === 'string') {
      block.textContent = a;
      if (b) {
        props(b);
      }
    } else if (typeof a === 'object') {
      props(a);
      if (b) {
        block.textContent = b;
      }
    }
    
    function props(obj) {
      if (obj.class) {
        for (let name of obj.class) {
          block.classList.add(name);
        }
      }
      
      if (obj.id) {
        block.id = obj.id;
      } 

      if (obj.style) {
        for (let styleKey in obj.style) {
          block.style[styleKey] = obj.style[styleKey];
        }
      }

      if (obj.src) {
        block.src = obj.src;
      }

      if (obj.href) {
        block.href = obj.href;
      }

      if (obj.parent) {
        obj.parent.appendChild(block);
      }

      if (obj.child) {
        for (let child of obj.child) {
          block.appendChild(child);
        }
      }
    }
    return block;
  }
};

const all = document.querySelectorAll.bind(document);

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
let fmRatingFrom = $.get('#fm-rating-from');
let fmRatingTo = $.get('#fm-rating-to');
let fmRateFrom = $.get('#fm-rate-from');
let fmRateTo = $.get('#fm-rate-to');
let fmLoansFrom = $.get('#fm-loans-from');
let fmLoansTo = $.get('#fm-loans-to');
let fmMaxCompanySum = $.get('#fm-max-company-sum');
let fmInvestSum = $.get('#fm-invest-sum');
let fmInvestSumAll = $.get('#fm-invest-sum-all');

let smDaysFrom = $.get('#sm-invest-days-from');
let smDaysTo = $.get('#sm-invest-days-to');
let smRatingFrom = $.get('#sm-rating-from');
let smRatingTo = $.get('#sm-rating-to');
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

let formsElementsObj = {
  fmDaysFrom: '#fm-invest-days-from',
  fmDaysTo: '#fm-invest-days-to',
  fmRatingFrom : '#fm-rating-from',
  fmRatingTo: '#fm-rating-to',
  fmRateFrom: '#fm-rate-from',
  fmRateTo: '#fm-rate-to',
  fmLoansFrom: '#fm-loans-from',
  fmLoansTo: '#fm-loans-to',
  fmMaxCompanySum: '#fm-max-company-sum',
  fmInvestSum: '#fm-invest-sum',
  fmInvestSumAll: '#fm-invest-sum-all',
  smDaysFrom: '#sm-invest-days-from',
  smDaysTo: '#sm-invest-days-to',
  smRatingFrom : '#sm-rating-from',
  smRatingTo: '#sm-rating-to',
  smRateFrom: '#sm-rate-from',
  smRateTo: '#sm-rate-to',
  smFdFrom: '#sm-fd-from',
  smFdTo: '#sm-fd-to',
  smProgressFrom: '#sm-progress-from',
  smProgressTo: '#sm-progress-to',
  smPriceFrom: '#sm-price-from',
  smPriceTo: '#sm-price-to',
  smClassFrom: '#sm-class-from',
  smClassTo: '#sm-class-to',
  smMaxCompanySum: '#sm-max-company-sum',
  smInvestSum: '#sm-invest-sum',
  smInvestSumAll: '#sm-invest-sum-all'
};

let investSettingsObj = {
  fmDaysFrom: 0,
  fmDaysTo: 0,
  fmRatingFrom: 0,
  fmRatingTo: 0,
  fmRateFrom: 0,
  fmRateTo: 0,
  fmLoansFrom: 0,
  fmLoansTo: 0,
  fmMaxCompanySum: 0,
  fmInvestSum: 0,
  fmInvestSumAll: 0,
  smDaysFrom: 0,
  smDaysTo: 0,
  smRatingFrom : 0,
  smRatingTo: 0,
  smRateFrom: 0,
  smRateTo: 0,
  smFdFrom: 0,
  smFdTo: 0,
  smProgressFrom: 0,
  smProgressTo: 0,
  smPriceFrom: 0,
  smPriceTo: 0,
  smClassFrom: 0,
  smClassTo: 0,
  smMaxCompanySum: 0,
  smInvestSum: 0,
  smInvestSumAll: 0
};

const ratingArray = [,'AAA+', 'AAA', 'AA+', 'AA', 'A+', 'A', 'BBB+', 'BBB', 'BB+', 'BB', 'B+', 'B', 'CCC+', 'CCC', 'CC+', 'CC', 'C+', 'C', 'DDD+', 'DDD', 'DD+', 'DD', 'D+', 'D'];
