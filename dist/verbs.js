import { conjugations } from './present-data.js';
export const persons = ['io', 'tu', 'lui / lei', 'noi', 'voi', 'loro'];
export function presentCards(pool) {
  return pool.flatMap(word => {
    const entry = conjugations[word.italian];
    if (!entry) return [];
    return entry.present.flatMap((form, person) => form ? [{...word, person, form}] : []);
  });
}
export function cardKey(word) {
  return `${word.rank}:${word.person ?? 'word'}`;
}
export { conjugations };

export function personLabel(word) {
  if (word.italian === 'bisognare') return 'impersonal';
  if (['accadere', 'avvenire'].includes(word.italian)) return word.person === 2 ? '3rd person singular' : '3rd person plural';
  return persons[word.person];
}
