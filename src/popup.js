// デフォルト設定の定義
const DEFAULT_SETTINGS = {
  cornerPosition: 'bottom-right',
  displayOptions: {
    showAccessTime: true,
    showLoadTime: true
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.position-btn');
  const accessTimeCheckbox = document.getElementById('show-access-time');
  const loadTimeCheckbox = document.getElementById('show-load-time');

  // 保存された設定を読み込む
  chrome.storage.local.get(['cornerPosition', 'displayOptions'], (result) => {
    const settings = {
      cornerPosition: result.cornerPosition || DEFAULT_SETTINGS.cornerPosition,
      displayOptions: {
        ...DEFAULT_SETTINGS.displayOptions,
        ...result.displayOptions
      }
    };

    accessTimeCheckbox.checked = settings.displayOptions.showAccessTime;
    loadTimeCheckbox.checked = settings.displayOptions.showLoadTime;
    if (settings.cornerPosition) {
      // 保存された位置のボタンをアクティブにする
      const activeButton = document.querySelector(`[data-position="${settings.cornerPosition}"]`);
      if (activeButton) {
        activeButton.classList.add('active');
      }
    }
  });

  // 位置ボタンのイベントリスナー
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      // 全てのボタンからactiveクラスを削除
      buttons.forEach(btn => btn.classList.remove('active'));
      // クリックされたボタンにactiveクラスを追加
      button.classList.add('active');

      const position = button.dataset.position;
      chrome.storage.local.set({ cornerPosition: position });

      // 現在のタブに位置を通知
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'updateDisplay',
          position: position,
          options: {
            showAccessTime: accessTimeCheckbox.checked,
            showLoadTime: loadTimeCheckbox.checked
          }
        });
      });
    });
  });

  // チェックボックスのイベントリスナー
  function updateDisplayOptions() {
    const options = {
      showAccessTime: accessTimeCheckbox.checked,
      showLoadTime: loadTimeCheckbox.checked
    };
    chrome.storage.local.set({ displayOptions: options });

    // タブの存在確認を追加
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].id) {
        try {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'updateDisplay',
            options: options
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.log('Message sending failed:', chrome.runtime.lastError.message);
              // エラー時の再試行やフォールバック処理をここに追加できます
            }
          });
        } catch (e) {
          console.log('Error sending message:', e);
        }
      }
    });
  }

  accessTimeCheckbox.addEventListener('change', updateDisplayOptions);
  loadTimeCheckbox.addEventListener('change', updateDisplayOptions);
});