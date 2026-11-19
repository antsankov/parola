import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeReview, decodeReview } from '../dist/review.js';
import { quizDeck, answerChoices } from '../dist/deck.js';
import { words } from '../dist/words.js';
test('cookie stores both flags, round-trips every word, and fits comfortably in one cookie', () => {
  const wrong=new Set([1,100,500]), flagged=new Set([1,250]);
  const result=decodeReview(encodeReview(wrong,flagged));
  assert.deepEqual(result.wrong,wrong); assert.deepEqual(result.flagged,flagged);
  const all=new Set(words.map(w=>w.rank));
  const value=encodeReview(all,all);
  assert.ok(value.length<1000);
  assert.deepEqual(decodeReview(value),{wrong:all,flagged:all});
  assert.deepEqual(decodeReview(encodeReview(new Set(),new Set())),{wrong:new Set(),flagged:new Set()});
});
test('malformed and old cookie values are ignored',()=>{
  for(const value of ['', 'v0.123', 'v1.3', 'v1.'+'9'.repeat(500)]) {
    assert.deepEqual(decodeReview(value),{wrong:new Set(),flagged:new Set()});
  }
});
test('quiz draws 20 unique words from the chosen pool, including small pools',()=>{
  const pool=words.slice(100,150), deck=quizDeck(pool);
  assert.equal(deck.length,20); assert.equal(new Set(deck.map(w=>w.rank)).size,20);
  assert.ok(deck.every(w=>pool.includes(w)));
  assert.equal(quizDeck(words.slice(0,3)).length,3);
  assert.equal(quizDeck([words[0]]).length,1);
});
test('answer choices include one correct answer with distinct distractors in each direction',()=>{
  for(const word of words) for(const reverse of [false,true]) {
    const options=answerChoices(word,words,reverse);
    assert.equal(options.length,4); assert.equal(new Set(options).size,4);
    assert.equal(options.filter(value=>value===word[reverse?'italian':'english']).length,1);
  }
});
