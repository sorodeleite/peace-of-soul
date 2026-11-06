(function () {
  const PHOTOS = [
    'youre-under-arrest.jpg',
    'youre-under-arrest1.jpg',
    'youre-under-arrest2.jpg',
    'youre-under-arrest3.png',
    'youre-under-arrest4.png',
    'youre-under-arrest5.png'
  ];

  let config = {
    hideTwitterTimeline: true,
    hideTwitterTrends: true,
    showCozyCards: true
  };

  let observer = null;

  function isContextValid() {
    try {
      return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id);
    } catch {
      return false;
    }
  }

  function cleanupIfInvalidated() {
    if (!isContextValid()) {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      return true;
    }
    return false;
  }

  function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function isHomeRoute() {
    const p = window.location.pathname;
    return p === '/' || p === '/home';
  }

  function syncAttributes() {
    if (cleanupIfInvalidated()) return;

    const root = document.documentElement;
    root.setAttribute('data-pos-twitter-timeline', config.hideTwitterTimeline ? 'true' : 'false');
    root.setAttribute('data-pos-twitter-trends', config.hideTwitterTrends ? 'true' : 'false');

    if (isHomeRoute() && config.hideTwitterTimeline) {
      root.classList.add('pos-is-home');
      if (document.body) document.body.classList.add('pos-is-home');
    } else {
      root.classList.remove('pos-is-home');
      if (document.body) document.body.classList.remove('pos-is-home');
    }
  }

  function enforceRouteGuard() {
    const path = window.location.pathname;
    if (config.hideTwitterTrends && (path.startsWith('/explore') || path.startsWith('/i/grok'))) {
      window.location.replace('/home');
    }
  }

  document.addEventListener('click', (e) => {
    if (cleanupIfInvalidated()) return;
    if (!config.hideTwitterTrends) return;
    const blockedTarget = e.target.closest(
      'a[data-testid="AppTabBar_Explore_Link"], a[href*="/explore"], a[href*="/i/grok"], [data-testid="trend"], [aria-label*="Timeline: Trending"]'
    );
    if (blockedTarget) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }, true);

  function removeCozyCard() {
    const existing = document.getElementById('pos-twitter-card');
    if (existing) existing.remove();
  }

  function ensureCozyCard() {
    if (cleanupIfInvalidated()) return;
    if (!config.showCozyCards || !config.hideTwitterTimeline || !isHomeRoute()) {
      removeCozyCard();
      return;
    }

    if (document.getElementById('pos-twitter-card')) return;

    const primaryCol = document.querySelector('div[data-testid="primaryColumn"]');
    if (!primaryCol) return;

    let photoUrl = '';
    try {
      const randomPhoto = getRandomItem(PHOTOS);
      photoUrl = chrome.runtime.getURL(`assets/photos/${randomPhoto}`);
    } catch {
      cleanupIfInvalidated();
      return;
    }

    const card = document.createElement('div');
    card.id = 'pos-twitter-card';
    card.className = 'pos-cozy-card pos-keep-visible';

    card.innerHTML = `
      <div class="pos-card-img-wrap">
        <img class="pos-card-img" src="${photoUrl}" alt="you are under arrest" />
      </div>
      <h3 class="pos-headline">🚨 NO DOOMSCROLLING 🚨</h3>
      <div class="pos-korean-text">새끼 손가락 건 약속은 안 했지만</div>
      <p class="pos-quote">o tempo que você não perde vendo vídeos aleatórios é tempo pra você viver de verdade</p>
    `;

    const composerBox = primaryCol.querySelector('div:has([data-testid="tweetTextarea_0"])') || primaryCol.querySelector('section');
    if (composerBox && composerBox.parentElement) {
      composerBox.parentElement.insertBefore(card, composerBox.nextSibling);
    } else {
      primaryCol.appendChild(card);
    }
  }

  function enforceTimelineBlock() {
    if (cleanupIfInvalidated()) return;
    if (!config.hideTwitterTimeline || !isHomeRoute()) return;

    const primaryCol = document.querySelector('div[data-testid="primaryColumn"]');
    if (!primaryCol) return;

    const cells = primaryCol.querySelectorAll('div[data-testid="cellInnerDiv"]');
    cells.forEach((cell) => {
      const hasComposer = cell.querySelector('[data-testid="tweetTextarea_0"]') || cell.querySelector('[data-testid="tweetButtonInline"]');
      if (!hasComposer && !cell.classList.contains('pos-keep-visible')) {
        cell.style.setProperty('display', 'none', 'important');
        cell.style.setProperty('visibility', 'hidden', 'important');
        cell.style.setProperty('height', '0px', 'important');
        cell.style.setProperty('overflow', 'hidden', 'important');
      }
    });

    ensureCozyCard();
  }

  function loadSettings() {
    if (!isContextValid()) return;
    try {
      chrome.storage.sync.get(['hideTwitterTimeline', 'hideTwitterTrends', 'showCozyCards'], (result) => {
        if (!isContextValid()) return;
        if (result.hideTwitterTimeline !== undefined) config.hideTwitterTimeline = result.hideTwitterTimeline;
        if (result.hideTwitterTrends !== undefined) config.hideTwitterTrends = result.hideTwitterTrends;
        if (result.showCozyCards !== undefined) config.showCozyCards = result.showCozyCards;
        syncAttributes();
        enforceRouteGuard();
        enforceTimelineBlock();
      });
    } catch {
      cleanupIfInvalidated();
    }
  }

  try {
    if (isContextValid() && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes) => {
        if (cleanupIfInvalidated()) return;
        if (changes.hideTwitterTimeline) config.hideTwitterTimeline = changes.hideTwitterTimeline.newValue;
        if (changes.hideTwitterTrends) config.hideTwitterTrends = changes.hideTwitterTrends.newValue;
        if (changes.showCozyCards) config.showCozyCards = changes.showCozyCards.newValue;
        syncAttributes();
        enforceRouteGuard();
        enforceTimelineBlock();
      });
    }
  } catch {
    cleanupIfInvalidated();
  }

  syncAttributes();
  enforceRouteGuard();

  let lastUrl = window.location.href;
  observer = new MutationObserver(() => {
    if (cleanupIfInvalidated()) return;
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      syncAttributes();
      enforceRouteGuard();
      enforceTimelineBlock();
    } else if (isHomeRoute() && config.hideTwitterTimeline) {
      enforceTimelineBlock();
    }
  });

  function init() {
    loadSettings();
    syncAttributes();
    enforceRouteGuard();
    enforceTimelineBlock();
    if (observer && document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    window.addEventListener('popstate', () => {
      if (cleanupIfInvalidated()) return;
      syncAttributes();
      enforceRouteGuard();
      enforceTimelineBlock();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
