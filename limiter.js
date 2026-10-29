// Lookahead brickwall limiter: the output never exceeds `ceiling` dBFS.
//
// Per sample, the gain needed to keep that sample under the ceiling goes into
// a ring covering the lookahead window. The envelope follows the window's
// minimum instantly downwards and releases slowly upwards. Box-averaging the
// envelope over the same window ramps the gain down before a peak leaves the
// delay line, and every averaged value covers that peak, so it can't overshoot.
//
// Every 0.5 s of audio it posts the window's peak input level and the deepest
// gain reduction (both dB) for the popup graph.

const LOOKAHEAD_S = 0.005;
const RELEASE_S = 0.3;
const BAR_S = 0.5;

class Limiter extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'ceiling', defaultValue: -20, minValue: -60, maxValue: 0,
        automationRate: 'k-rate' },
      { name: 'bypass', defaultValue: 0, minValue: 0, maxValue: 1,
        automationRate: 'k-rate' },
    ];
  }

  constructor() {
    super();
    const n = (this.n = Math.max(1, Math.round(sampleRate * LOOKAHEAD_S)));
    this.need = new Float32Array(n).fill(1); // gain each sample needs
    this.envs = new Float64Array(n).fill(1); // envelope history to average
    this.delay = [new Float32Array(n), new Float32Array(n)];
    this.sum = n;
    this.env = 1;
    this.pos = 0;
    this.release = Math.exp(-1 / (sampleRate * RELEASE_S));
    this.barFrames = Math.round(sampleRate * BAR_S);
    this.frames = 0;
    this.barPeak = 0;
    this.barGain = 1;
  }

  process([input], [output], { ceiling, bypass }) {
    const c = bypass[0] ? Infinity : 10 ** (ceiling[0] / 20);
    const { n, need, envs, delay, release } = this;
    const inL = input[0], inR = input[1] || input[0];
    const frames = output[0].length;

    for (let s = 0; s < frames; s++) {
      const a = inL ? inL[s] : 0, b = inR ? inR[s] : 0;
      const peak = Math.max(Math.abs(a), Math.abs(b));
      if (peak > this.barPeak) this.barPeak = peak;

      const i = this.pos;
      need[i] = peak > c ? c / peak : 1;
      let min = 1;
      for (let k = 0; k < n; k++) if (need[k] < min) min = need[k];
      this.env = min < this.env ? min : min + (this.env - min) * release;
      this.sum += this.env - envs[i];
      envs[i] = this.env;
      const gain = Math.min(1, this.sum / n);
      if (gain < this.barGain) this.barGain = gain;

      delay[0][i] = a;
      delay[1][i] = b;
      const oldest = (i + 1) % n;
      for (let ch = 0; ch < 2; ch++) {
        const v = delay[ch][oldest] * gain;
        output[ch][s] = v > c ? c : v < -c ? -c : v; // float-error guard
      }
      this.pos = oldest;
    }

    this.frames += frames;
    if (this.frames >= this.barFrames) {
      this.frames -= this.barFrames;
      this.port.postMessage({
        peak: 20 * Math.log10(this.barPeak),
        gain: 20 * Math.log10(this.barGain),
      });
      this.barPeak = 0;
      this.barGain = 1;
    }
    return true;
  }
}

registerProcessor('limiter', Limiter);
