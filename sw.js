// Relays popup messages to the offscreen document, which owns the audio.
// Tab capture itself must be started here, from the popup's user gesture.

const OFFSCREEN = 'offscreen.html';

const toOffscreen = (msg) =>
  chrome.runtime.sendMessage({ ...msg, to: 'offscreen' });

async function hasOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN)],
  });
  return contexts.length > 0;
}

async function ensureOffscreen() {
  if (await hasOffscreen()) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN,
    reasons: ['USER_MEDIA'],
    justification: 'Process tab audio',
  });
}

async function handle(msg) {
  await ensureOffscreen();
  if (msg.type !== 'start') return toOffscreen(msg);

  // Capturing an already captured tab fails, so reuse the running state.
  const running = await toOffscreen({ type: 'get', tabId: msg.tabId });
  if (running) return running;

  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: msg.tabId,
  });
  const state = await toOffscreen({ ...msg, streamId });
  chrome.action.setBadgeText({ tabId: msg.tabId, text: 'CAP' });
  return state;
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.to !== 'sw') return;
  if (msg.type === 'stop') {
    chrome.action.setBadgeText({ tabId: msg.tabId, text: '' });
  }
  handle(msg).then(reply, (e) => reply({ error: e.message || String(e) }));
  return true;
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (await hasOffscreen()) toOffscreen({ type: 'stop', tabId });
});
