const version = chrome.runtime.getManifest().version;

const constants = {};

const CURRENT_YEAR = (() => new Date().getFullYear())();
const DAYS_IN_YEAR = (() => (CURRENT_YEAR % 4 === 0 && CURRENT_YEAR % 100 !== 0 ? 366 : 365))();

const user = {
  get cleanBalance() {
    return this.balance - this.npd;
  },
};
const cache = {};
const allTime = {
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
    return this.cleanProfit + user.npd;
  },
  xirr: function (type) {
    let cashFlows = [];
    let dates = [];
    if (type === "npd") {
      type = user.balance;
    } else if (type === "clean") {
      type = user.cleanBalance;
    }
    for (element of user.xirrData) {
      cashFlows.push(element.amount);
      dates.push(new Date(element.date));
    }
    cashFlows.push(-type);
    dates.push(new Date());
    return calculateXIRR(cashFlows, dates);
  },
  get incomeSum() {
    let sum = 0;
    for (element of user.xirrData) {
      sum += element.income;
    }
    return sum;
  },
  get expenseSum() {
    let sum = 0;
    for (element of user.xirrData) {
      sum += element.expense;
    }
    return sum;
  },
};
const yearTime = {
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
    return this.cleanProfit + user.npd;
  },
  xirr: function (type) {
    const timeYearAgo = new Date().getTime() - DAYS_IN_YEAR * 24 * 60 * 60 * 1000; // Время в unix год назад
    let cashFlows = [];
    let dates = [];
    let sumYear = 0; // Сумма транзакций за год
    let beforeFlows = 0; // Сумма транзакций до текущего года
    let profitSum = allTime.cleanProfit - this.cleanProfit; // Профит год назад
    if (type === "npd") {
      type = user.balance;
      // profitSum = allTime.cleanProfit - this.cleanProfit;
    } else if (type === "clean") {
      type = user.cleanBalance;
    }
    for (element of user.xirrData) {
      if (timeYearAgo < new Date(element.date).getTime()) {
        sumYear += element.amount;
        cashFlows.push(element.amount);
        dates.push(new Date(element.date));
      } else {
        beforeFlows += element.amount;
      }
    }
    cashFlows.unshift(beforeFlows + profitSum);
    dates.unshift(new Date(timeYearAgo));
    // cashFlows[0] += beforeFlows;
    cashFlows.push(-type);
    dates.push(new Date());
    return calculateXIRR(cashFlows, dates);
  },
  get incomeSum() {
    const timeYearAgo = new Date().getTime() - DAYS_IN_YEAR * 24 * 60 * 60 * 1000;
    let sum = 0;
    for (element of user.xirrData) {
      if (timeYearAgo < new Date(element.date).getTime()) {
        sum += element.income;
      }
    }
    return sum;
  },
  get expenseSum() {
    const timeYearAgo = new Date().getTime() - DAYS_IN_YEAR * 24 * 60 * 60 * 1000;
    let sum = 0;
    for (element of user.xirrData) {
      if (timeYearAgo < new Date(element.date).getTime()) {
        sum += element.expense;
      }
    }
    return sum;
  },
};

function $get(selector) {
  if (selector.startsWith("#")) {
    return document.getElementById(selector.substring(1));
  }
  return document.querySelector(selector);
}

const $getAll = document.querySelectorAll.bind(document);

let fmCompanyUpdate = true;
let fmrCompanyUpdate = false;
let smCompanyUpdate = false;
let fmInvestCompanyArray = [];
let fmrInvestCompanyArray = [];
let smInvestCompanyArray = [];

const ratingArray = [, "AAA+", "AAA", "AA+", "AA", "A+", "A", "BBB+", "BBB", "BB+", "BB", "B+", "B", "CCC+", "CCC", "CC+", "CC", "C+", "C", "DDD+", "DDD", "DD+", "DD", "D+", "D"];

const spinLoad = document.createElement("div");
spinLoad.innerHTML = `<div class="load-spinner__container"><span class="load-spinner" style="width: 32px;"></span></div>`;
