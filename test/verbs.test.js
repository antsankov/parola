import {test} from 'node:test';
import assert from 'node:assert/strict';
import {words} from '../dist/words.js';
import {conjugations, presentCards, cardKey, personLabel} from '../dist/verbs.js';
import {selectRange} from '../dist/deck.js';
test('all verb senses in the frequency list have six sourced slots without raw markup',()=>{
  const verbs=words.filter(word=>/^(to |can|must)/.test(word.english));
  assert.equal(verbs.length,126);
  assert.deepEqual(Object.keys(conjugations).sort(),verbs.map(w=>w.italian).sort());
  for(const word of verbs){
    const entry=conjugations[word.italian];
    assert.equal(entry.present.length,6,word.italian);
    assert.match(entry.source,/^https:\/\/en.wiktionary.org\//);
    assert.ok(entry.present.every(form=>form===null || /^[a-zàèéìòù]+$/.test(form)),word.italian);
  }
});
test('reference examples preserve irregular, accented and spelling-changing forms',()=>{
  for(const [verb,forms] of Object.entries({
    essere:['sono','sei','è','siamo','siete','sono'],
    avere:['ho','hai','ha','abbiamo','avete','hanno'],
    andare:['vado','vai','va','andiamo','andate','vanno'],
    potere:['posso','puoi','può','possiamo','potete','possono'],
    dare:['do','dai','dà','diamo','date','danno'],
    parlare:['parlo','parli','parla','parliamo','parlate','parlano'],
    capire:['capisco','capisci','capisce','capiamo','capite','capiscono'],
    cercare:['cerco','cerchi','cerca','cerchiamo','cercate','cercano'],
    uscire:['esco','esci','esce','usciamo','uscite','escono'],
    scegliere:['scelgo','scegli','sceglie','scegliamo','scegliete','scelgono'],
    promuovere:['promuovo','promuovi','promuove','promuoviamo','promuovete','promuovono']
  }))assert.deepEqual(conjugations[verb].present,forms,verb);
});
test('verb decks respect rank ranges, exclude nonverbs and distinguish all persons',()=>{
  assert.deepEqual(presentCards(selectRange(words,1,4)),[]);
  const cards=presentCards(selectRange(words,90,90));
  assert.equal(cards.length,6);
  assert.equal(new Set(cards.map(cardKey)).size,6);
  assert.ok(cards.every(c=>c.rank===90 && c.italian==='parlare'));
  assert.equal(cards.find(c=>c.person===3).form,'parliamo');
  assert.equal(personLabel(cards[3]),'noi');
  assert.equal(presentCards(words.filter(w=>['particolare','militare','carabiniere'].includes(w.italian))).length,0);
});
test('impersonal verbs never create cards for unavailable forms',()=>{
  const cards=presentCards(words.filter(w=>w.italian==='bisognare'));
  assert.equal(cards.length,1); assert.equal(cards[0].form,'bisogna');
  assert.equal(personLabel(cards[0]),'impersonal');
  const events=presentCards(words.filter(w=>['avvenire','accadere'].includes(w.italian)));
  assert.equal(events.length,4); assert.ok(events.every(c=>c.person===2 || c.person===5));
});
