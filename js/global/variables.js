const version = chrome.runtime.getManifest().version;

function $get(selector) {
  if (selector.startsWith("#")) {
    return document.getElementById(selector.substring(1));
  }
  return document.querySelector(selector);
}

const $getAll = document.querySelectorAll.bind(document);

const lastUpdateDateTag = $get(".lastUpdateDate"); //Тэг последнего обновления данных
const balanceTitle = $get(".balance__title"); //Заголовок баланса
const balanceTag = $get(".balance__value"); //Тэг баланса
const incomeTitle = $get(".income__title"); //Заголовок дохода
const incomeTag = $get(".income__value"); //Тэг дохода
const btnInvestOpen = $get(".invest-section__btn-open "); // Кнопка открытия страницы распределения средств
const btnInvestClose = $get(".invest-section__btn-close"); // Кнопка закрытия страницы распределения средств
const statsSection = $get(".stats-section"); // Блок подробной статистики
const timeSettingBtn = $get("#time-setting"); // Кнопка-свапалка в настройках

let fmCompanyUpdate = true;
let fmrCompanyUpdate = false;
let smCompanyUpdate = false;
let fmInvestCompanyArray = [];
let fmrInvestCompanyArray = [];
let smInvestCompanyArray = [];

const ratingArray = [, "AAA+", "AAA", "AA+", "AA", "A+", "A", "BBB+", "BBB", "BB+", "BB", "B+", "B", "CCC+", "CCC", "CC+", "CC", "C+", "C", "DDD+", "DDD", "DD+", "DD", "D+", "D"];

const spinLoad = document.createElement("div");
spinLoad.innerHTML = `<div class="load-spinner__container"><span class="load-spinner" style="width: 32px;"></span></div>`;
