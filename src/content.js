let timeDisplay = null;
const accessTime = new Date();
let loadTime = null;  // nullで初期化
let displayOptions = {
  showAccessTime: true,
  showLoadTime: true
};

// ページの読み込み時間を計測
function measureLoadTime() {
  try {
    const [entry] = performance.getEntriesByType('navigation');
    if (entry) {
      loadTime = entry.domContentLoadedEventEnd;
      updateTimeDisplay();
    }
  } catch (error) {
    console.error('Error measuring load time:', error);
    timeDisplay.textContent = 'Error measuring load time';
  }
}

// DOMContentLoaded と load の両方で計測を試みる
document.addEventListener('DOMContentLoaded', measureLoadTime);
window.addEventListener('load', measureLoadTime);

function createTimeDisplay() {
  if (timeDisplay) {
    document.body.removeChild(timeDisplay);
  }

  timeDisplay = document.createElement('div');
  timeDisplay.id = 'access-time-display';
  updateTimeDisplay();
  document.body.appendChild(timeDisplay);
}

function formatDate(date) {
  const pad = (num) => String(num).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function updateTimeDisplay() {
  if (!timeDisplay) return;

  const lines = [];

  if (displayOptions.showAccessTime) {
    const timeString = formatDate(accessTime);
    lines.push(`Access: ${timeString}`);
  }

  if (displayOptions.showLoadTime && loadTime !== null) {
    lines.push(`Load Time: ${(loadTime / 1000).toFixed(2)}s`);
  }

  // 両方のオプションがオフの場合は要素を非表示に
  if (!displayOptions.showAccessTime && !displayOptions.showLoadTime) {
    timeDisplay.style.display = 'none';
  } else {
    timeDisplay.style.display = 'block';
    timeDisplay.textContent = lines.join('\n');
  }
}

function updatePosition(position) {
  if (!timeDisplay) return;

  // リセット
  timeDisplay.style.top = 'auto';
  timeDisplay.style.bottom = 'auto';
  timeDisplay.style.left = 'auto';
  timeDisplay.style.right = 'auto';

  // 新しい位置を設定
  switch (position) {
    case 'top-left':
      timeDisplay.style.top = '10px';
      timeDisplay.style.left = '10px';
      break;
    case 'top-right':
      timeDisplay.style.top = '10px';
      timeDisplay.style.right = '10px';
      break;
    case 'bottom-left':
      timeDisplay.style.bottom = '10px';
      timeDisplay.style.left = '10px';
      break;
    case 'bottom-right':
      timeDisplay.style.bottom = '10px';
      timeDisplay.style.right = '10px';
      break;
  }
}

// 保存された設定を読み込んで初期表示
chrome.storage.local.get(['cornerPosition', 'displayOptions'], (result) => {
  if (result.displayOptions) {
    displayOptions = result.displayOptions;
  }

  // デフォルト設定を定義
  const defaultPosition = 'bottom-right';

  createTimeDisplay();

  // cornerPositionが未設定の場合はデフォルト値を使用し、保存する
  if (!result.cornerPosition) {
    chrome.storage.local.set({ cornerPosition: defaultPosition });
    updatePosition(defaultPosition);
  } else {
    updatePosition(result.cornerPosition);
  }
});

// メッセージリスナー
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateDisplay') {
    if (message.position) {
      updatePosition(message.position);
    }
    if (message.options) {
      displayOptions = message.options;
      updateTimeDisplay();
    }
  }
});