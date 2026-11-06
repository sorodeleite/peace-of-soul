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
    hideInstagramReels: true,
    hideInstagramFeed: true,
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

  function isHome() {
    const p = window.location.pathname;
    return p === '/' || p === '';
  }

  function syncAttributes() {
    if (cleanupIfInvalidated()) return;

    const root = document.documentElement;
    root.setAttribute('data-pos-insta-reels', config.hideInstagramReels ? 'true' : 'false');
    root.setAttribute('data-pos-insta-feed', config.hideInstagramFeed ? 'true' : 'false');

    if (isHome() && config.hideInstagramFeed) {
      root.classList.add('pos-is-insta-home');
      if (document.body) document.body.classList.add('pos-is-insta-home');
    } else {
      root.classList.remove('pos-is-insta-home');
      if (document.body) document.body.classList.remove('pos-is-insta-home');
    }
  }

  function enforceRouteGuard() {
    if (!config.hideInstagramReels) return;
    const path = window.location.pathname;
    if (path.startsWith('/reels') || path.startsWith('/explore')) {
      window.location.replace('/');
    }
  }

  document.addEventListener('click', (e) => {
    if (cleanupIfInvalidated()) return;
    if (!config.hideInstagramReels) return;
    const target = e.target.closest('a[href*="/reels/"], a[href*="/explore/"]');
    if (target) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }, true);

  function removeFeedCard() {
    const card = document.getElementById('pos-insta-feed-card');
    if (card) card.remove();
  }

  function ensureFeedCard() {
    if (cleanupIfInvalidated()) return;
    if (!config.showCozyCards || !config.hideInstagramFeed || !isHome()) {
      removeFeedCard();
      return;
    }

    if (document.getElementById('pos-insta-feed-card')) return;

    const mainElem = document.querySelector('main[role="main"]') || document.querySelector('main');
    if (!mainElem) return;

    let photoUrl = '';
    try {
      const randomPhoto = getRandomItem(PHOTOS);
      photoUrl = chrome.runtime.getURL(`assets/photos/${randomPhoto}`);
    } catch {
      cleanupIfInvalidated();
      return;
    }

    const card = document.createElement('div');
    card.id = 'pos-insta-feed-card';
    card.className = 'pos-insta-cozy-card';

    card.innerHTML = `
      <div class="pos-insta-img-wrap">
        <img class="pos-insta-img" src="${photoUrl}" alt="you are under arrest" />
      </div>
      <h3 class="pos-insta-headline">🚨 NO DOOMSCROLLING 🚨</h3>
      <div class="pos-insta-korean-text">새끼 손가락 건 약속은 안 했지만</div>
      <p class="pos-insta-quote">o tempo que você não perde vendo vídeos aleatórios é tempo pra você viver de verdade</p>
    `;

    mainElem.appendChild(card);
  }

  function enforceFeedBlock() {
    if (cleanupIfInvalidated()) return;
    if (!config.hideInstagramFeed || !isHome()) return;

    const articles = document.querySelectorAll('main article, article');
    articles.forEach((art) => {
      art.style.setProperty('display', 'none', 'important');
      art.style.setProperty('visibility', 'hidden', 'important');
      art.style.setProperty('height', '0px', 'important');
      art.style.setProperty('overflow', 'hidden', 'important');
    });

    const feedContainer = document.querySelector('div[role="feed"]');
    if (feedContainer) {
      feedContainer.style.setProperty('display', 'none', 'important');
    }

    ensureFeedCard();
  }

  function loadSettings() {
    if (!isContextValid()) return;
    try {
      chrome.storage.sync.get(['hideInstagramReels', 'hideInstagramFeed', 'showCozyCards'], (result) => {
        if (!isContextValid()) return;
        if (result.hideInstagramReels !== undefined) config.hideInstagramReels = result.hideInstagramReels;
        if (result.hideInstagramFeed !== undefined) config.hideInstagramFeed = result.hideInstagramFeed;
        if (result.showCozyCards !== undefined) config.showCozyCards = result.showCozyCards;
        syncAttributes();
        enforceRouteGuard();
        enforceFeedBlock();
      });
    } catch {
      cleanupIfInvalidated();
    }
  }

  try {
    if (isContextValid() && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes) => {
        if (cleanupIfInvalidated()) return;
        if (changes.hideInstagramReels) config.hideInstagramReels = changes.hideInstagramReels.newValue;
        if (changes.hideInstagramFeed) config.hideInstagramFeed = changes.hideInstagramFeed.newValue;
        if (changes.showCozyCards) config.showCozyCards = changes.showCozyCards.newValue;
        syncAttributes();
        enforceRouteGuard();
        enforceFeedBlock();
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
      enforceFeedBlock();
    } else if (isHome() && config.hideInstagramFeed) {
      enforceFeedBlock();
    }
  });

  function init() {
    loadSettings();
    syncAttributes();
    enforceRouteGuard();
    enforceFeedBlock();
    if (observer && document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    window.addEventListener('popstate', () => {
      if (cleanupIfInvalidated()) return;
      syncAttributes();
      enforceRouteGuard();
      enforceFeedBlock();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
