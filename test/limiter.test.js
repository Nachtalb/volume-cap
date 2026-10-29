import { expect, test } from 'bun:test';

let Limiter;
globalThis.AudioWorkletProcessor = class {
  constructor() { this.port = { postMessage() {} }; }
};
globalThis.registerProcessor = (_name, cls) => { Limiter = cls; };
globalThis.sampleRate = 48000;
await import('../limiter.js');

const BLOCK = 128;

function run(limiter, seconds, signal, params) {
  const out = [];
  for (let n = 0; n < sampleRate * seconds; n += BLOCK) {
    const input = Float32Array.from({ length: BLOCK },
      (_, s) => signal((n + s) / sampleRate));
    const output = [new Float32Array(BLOCK), new Float32Array(BLOCK)];
    limiter.process([[input, input]], [output], params);
    out.push(...output[0]);
  }
  return out;
}

const tone = (amp) => (t) => amp * Math.sin(2 * Math.PI * 440 * t);
const peak = (xs) => xs.reduce((m, v) => Math.max(m, Math.abs(v)), 0);

test('a scream never exceeds the ceiling and quiet audio comes back', () => {
  globalThis.sampleRate = 48000;
  const scream = (t) => tone(t > 1 && t < 1.5 ? 1 : 0.05)(t);
  const out = run(new Limiter(), 4, scream, { ceiling: [-20], bypass: [0] });
  expect(peak(out)).toBeLessThanOrEqual(10 ** (-20 / 20) + 1e-6);
  expect(peak(out.slice(-sampleRate / 2))).toBeCloseTo(0.05, 2);
});

test('bypass passes audio through unchanged', () => {
  globalThis.sampleRate = 48000;
  const out = run(new Limiter(), 0.1, () => 0.9, { ceiling: [-20], bypass: [1] });
  expect(out.at(-1)).toBeCloseTo(0.9, 6);
});

test.each([44100, 48000, 96000])('one graph bar per 0.5 s at %i Hz', (rate) => {
  globalThis.sampleRate = rate;
  const limiter = new Limiter();
  let bars = 0;
  limiter.port.postMessage = () => bars++;
  run(limiter, 5, () => 0, { ceiling: [-20], bypass: [0] });
  expect(bars).toBe(10);
});
