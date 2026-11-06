chrome.runtime.onInstalled.addListener(() => {
  const defaults = {
    hideTwitterTimeline: true,
    hideTwitterTrends: true,
    hideInstagramReels: true,
    hideInstagramFeed: true,
    showCozyCards: true
  };

  chrome.storage.sync.get(Object.keys(defaults), (data) => {
    const toSet = {};
    for (const key in defaults) {
      if (data[key] === undefined) {
        toSet[key] = defaults[key];
      }
    }
    if (Object.keys(toSet).length > 0) {
      chrome.storage.sync.set(toSet);
    }
  });
});
