// ページごとの背景色設定
const pageColors = {
  1: "#6C9692", // 見どころ
  2: "#BF4C4C", // 展覧会概要
  3: "#8172A8", // 展覧会構成
  4: "#B672A7", // チケット
  5: "#4B74A3", // 無料音声ガイド
  6: "#668C9F", // 関連プログラム
  7: "#5EA8BF", // スペシャル
  8: "#4B74A3", // 無料音声ガイド
  default: "#f5f5f5", // デフォルト
};

function setHeroBackground() {
  const hero = document.querySelector(".page-hero");
  const artworkImage = document.querySelector(".page-hero__artwork-image");

  if (!hero || !artworkImage) {
    return;
  }

  // 現在のページ番号を取得
  const currentPage = hero.dataset.page || "1";

  // ページに応じた背景色を設定
  const bgColor = pageColors[currentPage] || pageColors.default;
  hero.style.setProperty("--hero-bg-color", bgColor);

  // ビューポート幅を取得
  const viewportWidth = window.innerWidth;
  const isMobile = viewportWidth <= 824;

  // 要素の位置とサイズを取得
  const heroRect = hero.getBoundingClientRect();
  const artworkRect = artworkImage.getBoundingClientRect();

  let backgroundHeight;

  if (isMobile) {
    // スマホの場合：アートワーク画像の中央位置まで
    const artworkCenter =
      artworkRect.top - heroRect.top + artworkRect.height / 2;
    backgroundHeight = artworkCenter;

    // 最小高さを設定（画面の30%以上）
    const minHeight = window.innerHeight * 0.3;
    backgroundHeight = Math.max(backgroundHeight, minHeight);
  } else {
    // PCの場合：アートワーク画像の下から80pxの位置まで
    const artworkBottom = artworkRect.bottom - heroRect.top;
    backgroundHeight = artworkBottom - 80;
  }

  // 高さが負の値にならないようにする
  backgroundHeight = Math.max(backgroundHeight, 100);

  // CSSカスタムプロパティで高さを設定
  hero.style.setProperty("--hero-bg-height", `${backgroundHeight}px`);
}

// DOMContentLoadedで初期設定
document.addEventListener("DOMContentLoaded", () => {
  setHeroBackground();

  // すべての画像の読み込み完了を待つ
  const images = document.querySelectorAll(".page-hero__artwork-image");
  let loadedCount = 0;

  images.forEach((img) => {
    if (img.complete) {
      loadedCount++;
      if (loadedCount === images.length) {
        // すべての画像が読み込み済みの場合、再計算
        setTimeout(setHeroBackground, 100);
      }
    } else {
      img.addEventListener("load", () => {
        loadedCount++;
        if (loadedCount === images.length) {
          // すべての画像が読み込まれたら再計算
          setHeroBackground();
        }
      });
    }
  });
});

// ウィンドウリサイズ時に再計算（デバウンス付き）
// 変数名を変更してscript.jsとの競合を回避
let subpageResizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(subpageResizeTimer);
  subpageResizeTimer = setTimeout(setHeroBackground, 100);
});

// ページ表示時にも実行（キャッシュからの復帰対応）
window.addEventListener("pageshow", () => {
  setTimeout(setHeroBackground, 100);
});

// Intersection Observerで画像の表示を監視（オプション）
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setTimeout(setHeroBackground, 100);
      }
    });
  });

  document.querySelectorAll(".page-hero__artwork-image").forEach((img) => {
    observer.observe(img);
  });
}
