import { words } from './words.js';
import { shuffled, selectRange, quizDeck, answerChoices } from './deck.js';
import { readReview, saveReview } from './review.js';
import { presentCards, persons, conjugations, cardKey, personLabel } from './verbs.js';
const $ = id => document.getElementById(id);
let top = 100, direction = 'it-en', start = 1, end = 100;
let deck = [], position = 0, revealed = false, round = 1;
let mode = 'practice', reviewRanks = null, quizFinished = false;
let answers = new Map(), quizWrong = new Set(), quizFlagged = new Set();
let choices = [];
const {wrong, flagged} = readReview();
function stopSpeech() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
function persist() {
  const saved = saveReview(wrong, flagged);
  $('storage-status').hidden = saved;
  $('storage-status').textContent = 'Cookies are blocked. Your review list will last only until this page is closed.';
  updateSaved();
}
function updateSaved() {
  const count = new Set([...wrong, ...flagged]).size;
  $('saved-count').textContent = count;
  $('review-saved').disabled = !count;
  $('clear-saved').disabled = !count;
}
function pool() {
  const selected = reviewRanks ? words.filter(word => reviewRanks.has(word.rank)) : selectRange(words, start, end);
  return mode === 'verbs' ? presentCards(selected) : selected;
}
function syncModes() {
  $('practice-mode').setAttribute('aria-pressed', String(mode === 'practice'));
  $('quiz-mode').setAttribute('aria-pressed', String(mode === 'quiz'));
  $('verbs-mode').setAttribute('aria-pressed', String(mode === 'verbs'));
  $('mode-help').textContent = mode === 'quiz' ? 'Choose an answer. Wrong answers are saved automatically; flag any word to review later.' : mode === 'review' ? 'Your review cards. Mark a word learned to remove it from your saved list.' : mode === 'verbs' ? 'Conjugate the verb for the person shown, then flip to check. Saved marks apply to the whole verb.' : 'Flip a card, then mark any words you want to revisit.';
  $('direction').disabled = mode === 'verbs' || (mode === 'quiz' && !quizFinished);
  $('keyboard-help').hidden = mode === 'quiz';
}
function render() {
  syncModes(); updateSaved();
  $('quiz-results').hidden = !quizFinished;
  $('study-content').hidden = quizFinished || !deck.length;
  $('empty-pool').hidden = !!deck.length || quizFinished;
  if (quizFinished || !deck.length) return;
  const word = deck[position], verbPractice = mode === 'verbs', reverse = !verbPractice && direction === 'en-it', quiz = mode === 'quiz';
  const answered = answers.has(word.rank);
  const showAnswer = quiz ? answered : revealed;
  $('card-word').textContent = reverse ? word.english : word.italian;
  $('card-word').lang = reverse ? 'en' : 'it';
  $('card-word').classList.toggle('long-word', (reverse ? word.english : word.italian).length > 20);
  $('card-language').textContent = verbPractice ? 'PRESENT INDICATIVE' : reverse ? 'ENGLISH' : 'ITALIAN';
  $('verb-person').hidden = !verbPractice;
  $('verb-person').textContent = verbPractice ? personLabel(word) : '';
  $('rank').textContent = `#${word.rank} IN FREQUENCY`;
  $('card-answer').textContent = verbPractice ? word.form : reverse ? word.italian : word.english;
  $('card-answer').lang = verbPractice || reverse ? 'it' : 'en';
  $('card-answer').hidden = !showAnswer;
  renderConjugations(word, showAnswer);
  $('card-state').textContent = verbPractice ? (showAnswer ? word.english : `${word.english} · How do you conjugate it?`) : showAnswer ? (reverse ? 'ITALIAN' : 'ENGLISH MEANING') : quiz ? 'Choose the matching answer below.' : reverse ? 'How would you say this in Italian?' : 'What does this word mean?';
  $('card-instruction').textContent = quiz ? `QUESTION ${position + 1} OF ${deck.length}` : revealed ? 'Click to hide' : 'Click to reveal';
  $('flashcard').setAttribute('aria-label', quiz ? `${$('card-language').textContent}: ${$('card-word').textContent}` : `${revealed ? 'Hide' : 'Reveal'} ${verbPractice ? `present tense of ${word.italian} for ${personLabel(word)}` : reverse ? 'Italian word' : 'English meaning'}`);
  $('flashcard').setAttribute('aria-expanded', String(showAnswer));
  $('reveal').textContent = verbPractice ? (revealed ? 'Hide form ↻' : 'Reveal form ↻') : revealed ? 'Hide meaning ↻' : 'Reveal meaning ↻';
  $('reveal').hidden = quiz;
  $('previous').hidden = quiz;
  $('previous').disabled = position === 0;
  $('next').disabled = quiz && !answered;
  $('next').firstChild.textContent = quiz ? (position === deck.length-1 ? 'See results ' : 'Next question ') : position === deck.length-1 ? 'Shuffle again ' : verbPractice ? 'Next form ' : 'Next word ';
  $('mark-wrong').hidden = quiz;
  $('mark-wrong').textContent = wrong.has(word.rank) ? '✓ Marked incorrect' : 'Mark incorrect';
  $('mark-wrong').setAttribute('aria-pressed', String(wrong.has(word.rank)));
  $('mark-review').textContent = flagged.has(word.rank) ? '★ Flagged for review' : '☆ Review later';
  $('mark-review').setAttribute('aria-pressed', String(flagged.has(word.rank)));
  $('mark-learned').hidden = mode !== 'review';
  $('quiz-options').hidden = !quiz;
  $('quiz-feedback').hidden = !quiz || !answered;
  $('quiz-options').replaceChildren();
  if (quiz) {
    const correct = reverse ? word.italian : word.english;
    for (const choice of choices) {
      const button = document.createElement('button');
      button.textContent = choice; button.lang = reverse ? 'it' : 'en'; button.disabled = answered;
      if (answered && choice === correct) button.classList.add('correct');
      else if (answered && choice === answers.get(word.rank)) button.classList.add('incorrect');
      button.addEventListener('click', () => answer(choice));
      $('quiz-options').append(button);
    }
    $('quiz-feedback').textContent = answered ? answers.get(word.rank) === correct ? 'Correct. Ben fatto!' : `Not quite. Correct answer: ${correct}. Saved for review.` : '';
  }
  $('session-counter').textContent = `${quiz ? 'Question' : 'Card'} ${position+1} of ${deck.length}${round>1 ? ` · Round ${round}` : ''}`;
  $('pool-description').textContent = mode === 'review' ? `${deck.length} review words` : `${start===1 ? `Top ${end}` : `Ranks ${start}–${end}`} · ${quiz ? deck.length+' questions' : deck.length+(verbPractice ? ' forms' : ' words')}`;
  $('progress').style.width = `${(position+1)/deck.length*100}%`;
}
function renderConjugations(word, showAnswer) {
  const entry = conjugations[word.italian];
  $('conjugation-panel').hidden = !entry || !showAnswer;
  $('conjugation-rows').replaceChildren();
  if (!entry || !showAnswer) return;
  for (const [person, form] of entry.present.entries()) {
    const row = document.createElement('tr');
    const label = document.createElement('th'); label.scope = 'row';
    label.textContent = word.italian === 'bisognare' && person === 2 ? 'impersonal' : ['accadere', 'avvenire'].includes(word.italian) && person === 2 ? '3rd person singular' : ['accadere', 'avvenire'].includes(word.italian) && person === 5 ? '3rd person plural' : persons[person];
    const value = document.createElement('td'); value.textContent = form || '—'; value.lang = 'it';
    if (!form) value.setAttribute('aria-label', 'Not practiced for this verb');
    if (mode === 'verbs' && person === word.person) row.classList.add('active-person');
    row.append(label, value); $('conjugation-rows').append(row);
  }
  $('conjugation-source').href = entry.source;
  $('conjugation-note').hidden = !entry.note;
  $('conjugation-note').textContent = entry.note || '';
}
function startDeck() {
  deck = mode === 'quiz' ? quizDeck(pool()) : shuffled(pool());
  position = 0; revealed = false; quizFinished = false; round = 1;
  answers = new Map(); quizWrong = new Set(); quizFlagged = new Set(mode === 'quiz' ? deck.filter(word => flagged.has(word.rank)).map(word => word.rank) : []);
  choices = deck.length ? answerChoices(deck[0], words, direction === 'en-it') : [];
  stopSpeech(); render();
}
function flip() { if (mode !== 'quiz' && deck.length && !quizFinished) { revealed = !revealed; render(); } }
function answer(choice) {
  const word = deck[position];
  if (answers.has(word.rank)) return;
  answers.set(word.rank, choice);
  if (choice !== (direction === 'en-it' ? word.italian : word.english)) {
    wrong.add(word.rank); quizWrong.add(word.rank); persist();
  }
  render(); $('next').focus();
}
function finishQuiz() {
  quizFinished = true; stopSpeech();
  $('quiz-score').textContent = `${deck.length - quizWrong.size} / ${deck.length} correct`;
  $('quiz-summary').textContent = `${quizWrong.size} wrong answers · ${quizFlagged.size} flagged for review`;
  $('review-quiz-wrong').textContent = `Review wrong answers (${quizWrong.size})`;
  $('review-quiz-flagged').textContent = `Review flagged words (${quizFlagged.size})`;
  $('review-quiz-wrong').disabled = !quizWrong.size;
  $('review-quiz-flagged').disabled = !quizFlagged.size;
  render(); $('quiz-results').setAttribute('tabindex','-1'); $('quiz-results').focus();
}
function next() {
  if (!deck.length || quizFinished || (mode === 'quiz' && !answers.has(deck[position].rank))) return;
  stopSpeech();
  if (position === deck.length-1) {
    if (mode === 'quiz') { finishQuiz(); return; }
    const last = deck[position]; round++; deck = shuffled(pool());
    if (deck.length>1 && cardKey(deck[0]) === cardKey(last)) [deck[0],deck[1]] = [deck[1],deck[0]];
    position = 0;
  } else position++;
  revealed = false; choices = answerChoices(deck[position],words,direction === 'en-it'); render();
}
function previous() { if (mode !== 'quiz' && position>0 && !quizFinished) { stopSpeech(); position--; revealed = false; render(); } }
function applySettings() {
  const newStart = top === 'custom' ? Number($('range-start').value) : 1;
  const newEnd = top === 'custom' ? Number($('range-end').value) : top;
  try { selectRange(words,newStart,newEnd); }
  catch (error) { $('settings-error').textContent = error.message; $('settings-error').hidden = false; return false; }
  start = newStart; end = newEnd; direction = $('direction').value;
  $('settings-error').hidden = true; return true;
}
function review(ranks) {
  if (!ranks.size) return;
  mode = 'review'; reviewRanks = new Set(ranks); startDeck();
}
document.querySelectorAll('[data-top]').forEach(button => button.addEventListener('click', () => {
  top = button.dataset.top === 'custom' ? 'custom' : Number(button.dataset.top);
  document.querySelectorAll('[data-top]').forEach(item => { const selected = item === button; item.classList.toggle('selected',selected); item.setAttribute('aria-pressed',String(selected)); });
  $('custom-fields').hidden = top !== 'custom'; $('settings-error').hidden = true;
  if (top !== 'custom') {
    if (mode === 'review') mode = 'practice'; reviewRanks = null;
    if (applySettings()) startDeck();
  } else $('range-end').focus();
}));
$('settings-form').addEventListener('submit',event => {
  event.preventDefault();
  if (applySettings()) { if (mode === 'review') mode = 'practice'; reviewRanks = null; startDeck(); }
});
$('practice-mode').addEventListener('click', () => { if (applySettings()) { mode='practice'; reviewRanks=null; startDeck(); } });
$('verbs-mode').addEventListener('click', () => { if (applySettings()) { mode='verbs'; reviewRanks=null; startDeck(); } });
$('quiz-mode').addEventListener('click', () => { if (applySettings()) { mode='quiz'; reviewRanks=null; startDeck(); } });
$('retry-quiz').addEventListener('click', () => { if (applySettings()) { mode='quiz'; reviewRanks=null; startDeck(); } });
$('review-saved').addEventListener('click', () => review(new Set([...wrong,...flagged])));
$('review-quiz-wrong').addEventListener('click', () => review(quizWrong));
$('review-quiz-flagged').addEventListener('click', () => review(quizFlagged));
$('mark-wrong').addEventListener('click', () => { const rank=deck[position].rank; if (wrong.has(rank)) wrong.delete(rank); else wrong.add(rank); persist(); render(); });
$('mark-review').addEventListener('click', () => {
  const rank=deck[position].rank;
  if (flagged.has(rank)) { flagged.delete(rank); quizFlagged.delete(rank); }
  else { flagged.add(rank); if (mode==='quiz') quizFlagged.add(rank); }
  persist(); render();
});
$('mark-learned').addEventListener('click', () => {
  const rank=deck[position].rank;
  wrong.delete(rank); flagged.delete(rank); reviewRanks.delete(rank); persist(); stopSpeech();
  deck=deck.filter(word => word.rank!==rank); position=Math.min(position,deck.length-1); revealed=false;
  if (!deck.length) { mode='practice'; reviewRanks=null; startDeck(); $('mode-help').textContent='Review complete. Those words have been removed from your saved list.'; }
  else render();
});
$('clear-saved').addEventListener('click', () => { wrong.clear(); flagged.clear(); persist(); if (mode==='review') {mode='practice';reviewRanks=null;startDeck();} else render(); });
$('direction').addEventListener('change', () => { direction=$('direction').value; revealed=false; stopSpeech(); render(); });
$('flashcard').addEventListener('click',flip); $('reveal').addEventListener('click',flip);
$('next').addEventListener('click',next); $('previous').addEventListener('click',previous);
$('speak').addEventListener('click', () => {
  if (!('speechSynthesis' in window) || !deck.length) return;
  stopSpeech(); const utterance=new SpeechSynthesisUtterance(mode === 'verbs' && revealed ? deck[position].form : deck[position].italian);
  utterance.lang='it-IT'; utterance.rate=.85;
  const voice=window.speechSynthesis.getVoices().find(voice=>voice.lang.startsWith('it'));
  if (voice) utterance.voice=voice;
  window.speechSynthesis.speak(utterance);
});
if (!('speechSynthesis' in window)) $('speak').hidden=true;
$('about-open').addEventListener('click',()=> $('about').showModal());
$('about-close').addEventListener('click',()=> $('about').close());
$('about').addEventListener('click',event=>{if(event.target===$('about')) {const r=$('about').getBoundingClientRect();if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) $('about').close();}});
document.addEventListener('keydown',event=>{
  if ($('about').open || quizFinished || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.closest('input, select, textarea, button, a')) return;
  if (event.code==='Space') {event.preventDefault();flip();}
  if (event.key==='ArrowRight') {event.preventDefault();next();}
  if (event.key==='ArrowLeft') {event.preventDefault();previous();}
});
startDeck();
