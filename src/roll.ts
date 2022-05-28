function rollDie(die: number): number {
  return Math.floor(Math.random() * die) + 1;
}

export function roll1D6(): number {
  return rollDie(6);
}

export function roll2D6(): [number, number] {
  return [roll1D6(), roll1D6()];
}

export function roll2D6Total(): number {
  return roll2D6().reduce((acc, v) => acc + v, 0);
}
