const PHOTOS = [
  'youre-under-arrest.jpg',
  'youre-under-arrest1.jpg',
  'youre-under-arrest2.jpg',
  'youre-under-arrest3.png',
  'youre-under-arrest4.png',
  'youre-under-arrest5.png'
];

const KEYS = [
  'hideTwitterTimeline',
  'hideTwitterTrends',
  'hideInstagramReels',
  'hideInstagramFeed',
  'showCozyCards'
];

document.addEventListener('DOMContentLoaded', () => {
  const randomPhoto = PHOTOS[Math.floor(Math.random() * PHOTOS.length)];
  const previewImg = document.getElementById('popup-preview-img');
  if (previewImg) previewImg.src = `../assets/photos/${randomPhoto}`;

  chrome.storage.sync.get(KEYS, (data) => {
    KEYS.forEach((key) => {
      const checkbox = document.getElementById(key);
      if (checkbox) {
        checkbox.checked = data[key] !== undefined ? Boolean(data[key]) : true;
        
        checkbox.addEventListener('change', () => {
          chrome.storage.sync.set({ [key]: checkbox.checked }, () => {
            updatePill();
          });
        });
      }
    });

    updatePill();
  });

  function updatePill() {
    const pill = document.getElementById('status-pill');
    if (!pill) return;

    const allChecked = KEYS.every((k) => {
      const el = document.getElementById(k);
      return el ? el.checked : true;
    });

    if (allChecked) {
      pill.innerText = 'bloqueio ativo';
      pill.style.background = '#ede4f5';
      pill.style.color = '#7d5099';
    } else {
      pill.innerText = 'parcial';
      pill.style.background = '#f2edf7';
      pill.style.color = '#9688a2';
    }
  }
});
