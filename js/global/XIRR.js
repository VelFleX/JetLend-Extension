// Функция для расчета XIRR
function calculateXIRR(cashFlows, dates) {
  // Функция для расчета NPV (Net Present Value)
  function calculateNPV(rate) {
    let npv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + rate, daysBetween(dates[i], dates[0]) / 365);
    }
    return npv;
  }
  // Функция для нахождения значения XIRR с помощью метода Ньютона
  function calculateXIRRNewton(guess) {
    const MAX_ITERATIONS = 100;
    const ACCURACY = 0.00001;
    let x0 = guess;
    let x1 = 0;
    let f = 0;
    let f1 = 0;
    let count = 0;
    
    do {
      f = calculateNPV(x0);
      f1 = calculateNPVDerivative(x0);
      x1 = x0 - f / f1;
      if (Math.abs(x1 - x0) < ACCURACY) {
        return x1;
      }
      x0 = x1;
      count++;
    } while (count < MAX_ITERATIONS);
    
    return NaN;
  }

  // Функция для расчета производной NPV
  function calculateNPVDerivative(rate) {
    let npvDerivative = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      npvDerivative -= daysBetween(dates[i], dates[0]) / 365 * cashFlows[i] / Math.pow(1 + rate, (daysBetween(dates[i], dates[0]) / 365) + 1);
    }
    return npvDerivative;
  }

  // Функция для расчета разницы в днях между двумя датами
  function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000; // Количество миллисекунд в одном дне
    const diffDays = Math.round(Math.abs((date1 - date2) / oneDay));
    return diffDays;
  }

  // Вызов функции для расчета XIRR
  return calculateXIRRNewton(0.1);
}