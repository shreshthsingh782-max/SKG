import { BetColor, BetSize, PeriodHistoryItem } from '../types';

export function getNumberColor(num: number): BetColor {
  if (num === 0) return 'red-violet';
  if (num === 5) return 'green-violet';
  if ([1, 3, 7, 9].includes(num)) return 'green';
  return 'red';
}

export function getNumberSize(num: number): BetSize {
  return num >= 5 ? 'Big' : 'Small';
}

export function generatePeriodId(prefixDate?: Date): string {
  const d = prefixDate || new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const minutesOfDay = d.getHours() * 60 + d.getMinutes();
  const sequence = String(minutesOfDay + 1).padStart(4, '0');
  return `${yyyy}${mm}${dd}${sequence}`;
}

export function generateInitialHistory(count = 20): PeriodHistoryItem[] {
  const history: PeriodHistoryItem[] = [];
  const now = Date.now();
  
  for (let i = count; i >= 1; i--) {
    const num = Math.floor(Math.random() * 10);
    const time = new Date(now - i * 60 * 1000);
    const periodId = generatePeriodId(time);
    const hash = '00000000000x' + Math.random().toString(16).substring(2, 10) + num;
    
    history.push({
      periodId,
      number: num,
      color: getNumberColor(num),
      size: getNumberSize(num),
      hash,
      timestamp: time.getTime()
    });
  }
  return history;
}

export function calculateWin(
  targetType: 'color' | 'number' | 'size',
  targetValue: string | number,
  outcome: { number: number; color: BetColor; size: BetSize },
  totalBetAmount: number
): { isWin: boolean; winAmount: number; multiplier: number } {
  const taxDeduction = 0.02; // standard 2% platform fee on turnover
  const actualBet = totalBetAmount * (1 - taxDeduction);

  if (targetType === 'number') {
    const chosenNum = Number(targetValue);
    if (chosenNum === outcome.number) {
      const multiplier = 9;
      return { isWin: true, winAmount: actualBet * multiplier, multiplier };
    }
    return { isWin: false, winAmount: 0, multiplier: 0 };
  }

  if (targetType === 'size') {
    const chosenSize = String(targetValue);
    if (chosenSize === outcome.size) {
      const multiplier = 2;
      return { isWin: true, winAmount: actualBet * multiplier, multiplier };
    }
    return { isWin: false, winAmount: 0, multiplier: 0 };
  }

  if (targetType === 'color') {
    const chosenColor = String(targetValue).toLowerCase();
    
    if (chosenColor === 'green') {
      if ([1, 3, 7, 9].includes(outcome.number)) {
        return { isWin: true, winAmount: actualBet * 2, multiplier: 2 };
      }
      if (outcome.number === 5) {
        // Green + Violet half win
        return { isWin: true, winAmount: actualBet * 1.5, multiplier: 1.5 };
      }
    } else if (chosenColor === 'red') {
      if ([2, 4, 6, 8].includes(outcome.number)) {
        return { isWin: true, winAmount: actualBet * 2, multiplier: 2 };
      }
      if (outcome.number === 0) {
        // Red + Violet half win
        return { isWin: true, winAmount: actualBet * 1.5, multiplier: 1.5 };
      }
    } else if (chosenColor === 'violet') {
      if (outcome.number === 0 || outcome.number === 5) {
        return { isWin: true, winAmount: actualBet * 4.5, multiplier: 4.5 };
      }
    }
  }

  return { isWin: false, winAmount: 0, multiplier: 0 };
}
