export const COOKIE_NAME = 'parola_review_v1';
// One digit per source rank: wrong (1), flagged (2), or both (3).
// Even all 500 words in both lists occupy only 503 bytes.
export function encodeReview(wrong, flagged) {
  return 'v1.' + Array.from({length:500}, (_, i) => (wrong.has(i+1) ? 1 : 0) + (flagged.has(i+1) ? 2 : 0)).join('');
}
export function decodeReview(value = '') {
  const wrong = new Set(), flagged = new Set();
  if (!/^v1\.[0-3]{500}$/.test(value)) return {wrong, flagged};
  [...value.slice(3)].forEach((digit, i) => {
    if (Number(digit) & 1) wrong.add(i+1);
    if (Number(digit) & 2) flagged.add(i+1);
  });
  return {wrong, flagged};
}
export function readReview() {
  try { return decodeReview(document.cookie.split('; ').find(c => c.startsWith(COOKIE_NAME + '='))?.slice(COOKIE_NAME.length+1)); }
  catch { return decodeReview(); }
}
export function saveReview(wrong, flagged) {
  const value = encodeReview(wrong, flagged);
  try {
    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=31536000; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    return document.cookie.split('; ').includes(`${COOKIE_NAME}=${value}`);
  } catch { return false; }
}
