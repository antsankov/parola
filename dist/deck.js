export function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function selectRange(words, start, end) {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end > words.length || start > end) {
    throw new RangeError(`Choose whole-number ranks from 1 to ${words.length}, with the start at or below the end.`);
  }
  return words.filter(word => word.rank >= start && word.rank <= end);
}
export function quizDeck(pool) {
  return shuffled(pool).slice(0, 20);
}
export function answerChoices(word, words, reverse = false) {
  const key = reverse ? 'italian' : 'english';
  const correct = word[key];
  const alternatives = [...new Set(words.map(item => item[key]))].filter(value => value !== correct);
  return shuffled([correct, ...shuffled(alternatives).slice(0, 3)]);
}
