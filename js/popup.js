

// Загрузка данных
chrome.storage.local.get("cacheJetlend", function (result) {
  const data = result.cacheJetlend;
  if (data) {
    const updateTime = data.updateTime;
  
    const date = new Date(updateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
  
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
  
    const currentTime = new Date().getTime();
    const formattedDateTime = `Обновлено${currentTime - 86_400_000 > updateTime ? ` ${day}.${month}.${year}` : ""} в ${hours}:${minutes}`;
  
    const lastUpdateDateTag = document.querySelector('.lastUpdateDate'); //Тэг последнего обновления данных
    const balanceTitle = document.querySelector('.balance__title'); //Заголовок баланса
    const balanceTag = document.querySelector('.balance__value'); //Тэг баланса
    const incomeTitle = document.querySelector('.income__title'); //Заголовок дохода
    const incomeTag = document.querySelector('.income__value'); //Тэг дохода
  
    lastUpdateDateTag.innerHTML = `Все активы <span>(${formattedDateTime})</span>`;
    balanceTitle.innerHTML = `${data.balanceTitle} <span>Ставка на сборе</span>`;
    // balanceTag.innerHTML = `${data.balanceText} <span>${data.collectionIncome}</span>`;
    balanceTag.innerHTML = `${data.balanceInner} <span style="float: right;">${data.collectionIncome}</span>`;
    incomeTitle.innerHTML = `${data.incomeTitle} <span>Доходность</span>`;
    incomeTag.innerHTML = `${data.incomeInner} <span style="float: right;"><img src="/img/arrow.svg">${data.incomePercent}</span>`;
  }
});

// // Загрузка данных из хранилища при загрузке попапа
// chrome.storage.local.get("info", function (data) {
//   if (data.info) {
//     document.getElementById("infoInput").value = data.info;
//   }
// });



// // Добавление обработчика на кнопку сохранения
// document.getElementById("saveBtn").addEventListener("click", function () {
//   const info = document.getElementById("infoInput").value;
//   // Сохранение информации в локальное хранилище
//   chrome.storage.local.set({ info: info });

// function calculateFormula(formula, values) {
//   // Разделяем формулу на отдельные операнды и операции
//   const operands = formula.replace(/\s/g,'').toLowerCase().split(/[+-]/);
//   const operations = formula.match(/[+-]/g);

//   // Вычисляем результат формулы
//   let result = parseFloat(values[operands[0]]);

//   for (let i = 1; i < operands.length; i++) {
//     let operandValue = parseFloat(values[operands[i]]);

//     if (operations[i-1] === '+') {
//       result += operandValue;
//     } else {
//       result -= operandValue;
//     }
//   }

//   return result;
// }

// // Пример использования функции
// let formula = "a + B-c+d";
// let values = { a: 5, b: 3, c: 2, d: 1 };
// let result = calculateFormula(formula, values);
// console.log(result);
