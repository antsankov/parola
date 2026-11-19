import { test } from 'node:test';
import assert from 'node:assert/strict';
import { words } from '../dist/words.js';
import { selectRange, shuffled } from '../dist/deck.js';
test('source includes complete unique ranks and usable cards', () => {
  assert.equal(words.length, 500);
  assert.deepEqual(words.map(word => word.rank), Array.from({ length: 500 }, (_, i) => i + 1));
  assert.equal(new Set(words.map(word => word.italian)).size, 500);
  assert.ok(words.every(word => word.italian && word.english));
});
test('top-N and custom ranges include the exact endpoints', () => {
  for (const end of [1, 73, 100, 250, 500]) assert.equal(selectRange(words, 1, end).length, end);
  const range = selectRange(words, 101, 174);
  assert.equal(range.length, 74);
  assert.equal(range[0].rank, 101);
  assert.equal(range.at(-1).rank, 174);
  assert.deepEqual(selectRange(words, 500, 500), [words[499]]);
});
test('invalid ranges fail rather than creating empty or misleading decks', () => {
  for (const [start, end] of [[0, 100], [1, 501], [150, 100], [1.5, 100], [1, NaN]]) {
    assert.throws(() => selectRange(words, start, end), RangeError);
  }
});
test('shuffling samples without replacement and preserves source order', () => {
  const source = selectRange(words, 1, 100);
  const result = shuffled(source, () => 0);
  assert.equal(result.length, 100);
  assert.equal(new Set(result.map(word => word.rank)).size, 100);
  assert.notDeepEqual(result, source);
  assert.equal(source[0].rank, 1);
  assert.deepEqual([...result].sort((a,b) => a.rank-b.rank), source);
});
