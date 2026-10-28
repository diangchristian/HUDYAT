/*
 * DABEST: the recommended capture for moving signs (HUDYAT Trainer docs/APP_RECOGNITION.md, copied unchanged;
 * only the export line is added). A sign ends when the hands go down, is cut and squeezed to 32 frames the way the
 * models were trained, and a left-handed sign is mirrored.
 */
const PRE_BUFFER_S = 0.1, END_ABSENT_S = 0.2, MAX_WINDOW_S = 3.0, MIN_HANDS_S = 0.2;
const roundHalfUp = x => Math.floor(x + 0.5);
const hasHand = f => f[126] > 0.5 || f[127] > 0.5;

// A sign starts with the first frame with a hand (with the 0.1 s before it) and ends when no hand has been seen for
// 0.2 s, or after 3 s. After a 3-second window the hands must go down before the next sign. A window with less than
// 0.2 s of hands is a detection blip: no sign. push() returns {items, reason} when a sign has ended, else null.
function createSignSegmenter(fps) {
  const n = s => Math.max(1, roundHalfUp(s * fps));
  const nPre = n(PRE_BUFFER_S), nEnd = n(END_ABSENT_S), nMax = n(MAX_WINDOW_S), nMinHands = n(MIN_HANDS_S);
  let ring = [], active = null, absent = 0, waitingForRest = false;
  const remember = entry => { ring.push(entry); if (ring.length > nPre) ring.shift(); };
  const finish = reason => {
    const items = active;
    active = null; absent = 0; waitingForRest = reason === "max_length";
    if (items.filter(e => e.present).length < nMinHands) return null;
    return {items: items.map(e => e.item), reason};
  };
  return {
    get signing() { return active !== null; },
    push(item, present) {
      const entry = {item, present};
      if (!active && waitingForRest) {
        absent = present ? 0 : absent + 1;
        if (absent >= nEnd) { waitingForRest = false; absent = 0; }
        remember(entry);
        return null;
      }
      if (!active) {
        if (!present) { remember(entry); return null; }
        active = [...ring, entry]; ring = []; absent = 0;
        return active.length >= nMax ? finish("max_length") : null;
      }
      active.push(entry);
      absent = present ? 0 : absent + 1;
      if (absent >= nEnd) return finish("hands_gone");
      return active.length >= nMax ? finish("max_length") : null;
    },
  };
}

// Recorder README 6.4: the frames with a hand, plus 0.1 s on each side, at least 8 frames. Inclusive [start, end].
function signWindow(present, fps) {
  const T = present.length;
  const first = present.indexOf(true), last = present.lastIndexOf(true);
  if (first < 0) return [0, T - 1];
  const m = roundHalfUp(0.1 * fps);
  let start = Math.max(0, first - m), end = Math.min(T - 1, last + m);
  const need = Math.min(8, T);
  if (end - start + 1 < need) {
    const centre = (start + end) / 2;
    start = Math.max(0, Math.min(roundHalfUp(centre - (need - 1) / 2), T - need));
    end = start + need - 1;
  }
  return [start, end];
}

// Recorder README 6.5 in the app's layout: a hand is interpolated only when it is present in both frames,
// otherwise copied from the nearest frame; its flag always comes from the nearest frame.
// `extra` (optional) = per hand, more values that travel with it: [[indices of hand 0], [indices of hand 1]].
function resampleSign(frames, n = 32, extra = null) {
  const T = frames.length, D = frames[0].length, out = [];
  const slots = [0, 1].map(h => {
    const idx = Array.from({length: 63}, (_, i) => h * 63 + i);
    return [extra ? idx.concat(extra[h]) : idx, 126 + h];
  });
  for (let j = 0; j < n; j++) {
    const t = n > 1 ? j * (T - 1) / (n - 1) : 0;
    const i0 = Math.floor(t), i1 = Math.min(i0 + 1, T - 1), w = t - i0;
    const near = w < 0.5 ? i0 : i1;
    const o = new Array(D).fill(0);
    for (const [idx, flag] of slots) {
      const both = frames[i0][flag] > 0.5 && frames[i1][flag] > 0.5;
      for (const k of idx) o[k] = both ? (1 - w) * frames[i0][k] + w * frames[i1][k] : frames[near][k];
      o[flag] = frames[near][flag];
    }
    out.push(o);
  }
  return out;
}

// The mirror image of normalized frames (a left-handed signer -> right-handed): every x negated, hands swapped.
function mirrorFrames(frames) {
  return frames.map(f => {
    const x = Array.from(f);                          // plain array: frames may be Float32Array
    for (let i = 0; i < 126; i += 3) x[i] = -x[i];
    return x.slice(63, 126).concat(x.slice(0, 63), [x[127], x[126]]);
  });
}

// Which hand signs (trainer docs/FEATURES.md section 4), from the RAW frames of the cut window (packResult output).
// Mostly one hand visible -> that hand; mostly two -> the hand whose wrist travels further (in hand sizes).
function autoHand(raws, W, H) {
  const a = W / H;
  const rich = raws.map(f => {                        // per hand: wrist (x*a, y, z*a), size |landmark 9 - wrist|
    const o = Array.from(f);                          // plain array (it grows to 136); frames may be Float32Array
    o.length = 136;
    [0, 1].forEach(h => {
      const b = h * 63, base = 128 + 4 * h;
      if (!(f[126 + h] > 0.5)) { o[base] = o[base + 1] = o[base + 2] = o[base + 3] = 0; return; }
      o[base] = f[b] * a; o[base + 1] = f[b + 1]; o[base + 2] = f[b + 2] * a;
      o[base + 3] = Math.hypot((f[b + 27] - f[b]) * a, f[b + 28] - f[b + 1], (f[b + 29] - f[b + 2]) * a);
    });
    return o;
  });
  const win = resampleSign(rich, 32, [[128, 129, 130, 131], [132, 133, 134, 135]]);
  const lp = win.map(f => f[126] > 0.5), rp = win.map(f => f[127] > 0.5);
  const anyH = lp.filter((l, i) => l || rp[i]).length;
  if (anyH === 0) return "right";
  const onlyL = lp.filter((l, i) => l && !rp[i]).length, onlyR = rp.filter((r, i) => r && !lp[i]).length;
  if ((onlyL + onlyR) * 2 > anyH) return onlyL > onlyR ? "left" : "right";
  const median = xs => { const s = [...xs].sort((p, q) => p - q), m = s.length >> 1;
                         return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const path = (pres, base) => {
    const pts = win.filter((f, i) => pres[i]);
    if (pts.length < 2) return 0;
    let d = 0;
    for (let i = 1; i < pts.length; i++)
      d += Math.hypot(pts[i][base] - pts[i - 1][base], pts[i][base + 1] - pts[i - 1][base + 1],
                      pts[i][base + 2] - pts[i - 1][base + 2]);
    const s = median(pts.map(f => f[base + 3]));
    return d / (s > 1e-6 ? s : 1);
  };
  return path(lp, 128) > path(rp, 132) ? "left" : "right";
}

// items: what the segmenter returned, each {raw: packResult frame, norm: normalizeFrame(raw, W, H)}.
// hand: "right" | "left" | "auto" (the learner's setting). Returns the model's (32 x 128) input and the hand used.
function recommendedInput(items, fps, W, H, hand = "auto") {
  const [s, e] = signWindow(items.map(it => hasHand(it.raw)), fps);
  const cut = items.slice(s, e + 1);
  let input = resampleSign(cut.map(it => it.norm));
  const used = hand === "auto" ? autoHand(cut.map(it => it.raw), W, H) : hand;
  if (used === "left") input = mirrorFrames(input);
  return {input, hand: used};
}

export {createSignSegmenter, signWindow, resampleSign, mirrorFrames, autoHand, recommendedInput, hasHand};
