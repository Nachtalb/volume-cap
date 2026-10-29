// Owns one audio graph per captured tab:
// tab stream -> boost gain -> limiter worklet -> speakers.
// Capturing mutes the tab, so the graph must end at the destination.

const HISTORY = 20; // graph bars kept per tab, 0.5 s each
const tabs = {};

async function capture(tabId, streamId) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId },
    },
  });
  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule('limiter.js');
  const boost = ctx.createGain();
  const limiter = new AudioWorkletNode(ctx, 'limiter', {
    channelCount: 2,
    channelCountMode: 'explicit',
    outputChannelCount: [2],
  });
  ctx.createMediaStreamSource(stream)
    .connect(boost)
    .connect(limiter)
    .connect(ctx.destination);

  const tab = {
    ctx, stream, boost, limiter,
    settings: {}, history: [], cut: 0, lastAt: 0,
  };
  limiter.port.onmessage = ({ data }) => {
    tab.cut = data.gain;
    tab.lastAt = Date.now();
    tab.history.push(data.peak);
    if (tab.history.length > HISTORY) tab.history.shift();
  };
  // The browser can end the capture on its own (e.g. the tab is discarded).
  stream.getTracks().forEach((track) => {
    track.onended = () => {
      if (tabs[tabId] !== tab) return;
      chrome.runtime.sendMessage({ to: 'sw', type: 'ended', tabId });
    };
  });
  return (tabs[tabId] = tab);
}

function apply(tab, settings) {
  const s = (tab.settings = { ...tab.settings, ...settings });
  tab.boost.gain.value = s.boostOn ? s.boost / 100 : 1;
  tab.limiter.parameters.get('ceiling').value = s.ceiling;
  tab.limiter.parameters.get('bypass').value = s.capOn ? 0 : 1;
}

// Stopping the tracks ends the capture and unmutes the tab.
async function stop(tabId) {
  const tab = tabs[tabId];
  delete tabs[tabId];
  if (tab) {
    tab.limiter.port.onmessage = null;
    tab.stream.getTracks().forEach((track) => track.stop());
    await tab.ctx.close();
  }
  return { active: Object.keys(tabs).length };
}

async function handle({ type, tabId, streamId, settings }) {
  if (type === 'stop') return stop(tabId);
  let tab = tabs[tabId];
  if (type === 'start' && !tab) tab = await capture(tabId, streamId);
  if (!tab) return null;
  if (settings) apply(tab, settings);
  const { history, cut, lastAt } = tab;
  return { settings: tab.settings, history, cut, lastAt };
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.to !== 'offscreen') return;
  handle(msg).then(reply, (e) => reply({ error: e.message || String(e) }));
  return true;
});
