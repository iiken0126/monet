/**
 * =======================================================
 * アプリケーション全体の初期化
 * =======================================================
 */
(function () {
  "use strict";

  // GSAPとScrollTriggerの登録（一度だけ）
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  // グローバルな変数管理用オブジェクト
  const AppState = {
    resizeTimers: {
      menu: null,
      gallery: null,
      scrollTop: null,
      ticket: null,
      global: null,
    },
    scrollStates: {
      position: 0,
      isMenuOpen: false,
    },
  };

  // 375px未満レスポンシブ用
  !(function () {
    const viewport = document.querySelector('meta[name="viewport"]');
    function switchViewport() {
      const value =
        window.outerWidth > 375
          ? "width=device-width,initial-scale=1"
          : "width=360";
      if (viewport.getAttribute("content") !== value) {
        viewport.setAttribute("content", value);
      }
    }
    addEventListener("resize", switchViewport, false);
    switchViewport();
  })();

  /**
   * =======================================================
   * メニュー機能
   * =======================================================
   */
  const MenuModule = (function () {
    // プライベート変数
    let menuButton,
      nav,
      header,
      body,
      html,
      subtitle,
      title,
      date,
      navColumns,
      navInner;
    let scrollPosition = 0;
    let isMenuOpen = false;
    let openTl, closeTl;

    /**
     * 初期状態の設定
     */
    function initializeMenuElements() {
      if (!subtitle || !title || !date) return;

      gsap.set([subtitle, title, date], {
        autoAlpha: 0,
        filter: "blur(10px)",
      });

      navColumns.forEach((column) => {
        gsap.set(column, {
          autoAlpha: 0,
          filter: "blur(10px)",
        });
      });
    }

    /**
     * メニュー開くアニメーションの設定
     */
    function setupOpenAnimation() {
      openTl = gsap.timeline({ paused: true });
      openTl
        .set(nav, {
          visibility: "visible",
          pointerEvents: "auto",
        })
        .fromTo(
          nav,
          { autoAlpha: 0, filter: "blur(10px)" },
          {
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.4,
            ease: "power2.out",
          }
        )
        .to(
          [subtitle, title, date, ...navColumns],
          {
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "power2.out",
          },
          "+=0.1"
        );
    }

    /**
     * メニュー閉じるアニメーションの設定
     */
    function setupCloseAnimation() {
      closeTl = gsap.timeline({ paused: true });
      closeTl
        .to(
          [navColumns, date, title, subtitle],
          {
            autoAlpha: 0,
            filter: "blur(10px)",
            duration: 0.4,
            ease: "power1.out",
          },
          "+=0.1"
        )
        .to(
          nav,
          {
            autoAlpha: 0,
            filter: "blur(10px)",
            duration: 0.4,
            ease: "power1.out",
            onComplete: function () {
              // アニメーション完了後にnavを完全に非表示にする
              gsap.set(nav, {
                visibility: "hidden",
                pointerEvents: "none",
              });
              // 他の要素のスタイルをクリア
              gsap.set([navInner, subtitle, title, date, navColumns], {
                clearProps: "all",
              });
            },
          },
          "-=0.1"
        );
    }

    /**
     * 背景のスクロールを無効化
     */
    function disableBackgroundScroll() {
      // 現在のスクロール位置を保存
      scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

      // htmlとbodyの両方にoverflowを設定（より確実な固定）
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";

      // iOS対策：touchmoveイベントを無効化
      document.addEventListener("touchmove", preventScroll, { passive: false });

      // ホイールスクロールも念のため無効化（モーダル外のスクロールを防ぐ）
      document.addEventListener("wheel", preventScroll, { passive: false });
    }

    /**
     * 背景のスクロールを有効化
     */
    function enableBackgroundScroll() {
      // スタイルをリセット
      html.style.overflow = "";
      body.style.overflow = "";

      // イベントリスナーを削除
      document.removeEventListener("touchmove", preventScroll);
      document.removeEventListener("wheel", preventScroll);

      // スクロール位置を復元（必要に応じて）
      // window.scrollTo(0, scrollPosition);
    }

    /**
     * スクロールイベントを防ぐ
     */
    function preventScroll(e) {
      // ナビゲーション内のスクロールは許可
      if (nav && nav.contains(e.target)) {
        // ナビゲーション内部でスクロール可能な要素がある場合の処理
        const scrollableElement = e.target.closest(".nav__inner");
        if (scrollableElement) {
          const isAtTop = scrollableElement.scrollTop === 0;
          const isAtBottom =
            scrollableElement.scrollHeight - scrollableElement.scrollTop ===
            scrollableElement.clientHeight;

          // 上下端でのバウンススクロールを防ぐ
          if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
            e.preventDefault();
          }
          return;
        }
      }

      // その他のスクロールは全て防ぐ
      e.preventDefault();
    }

    /**
     * メニューを開く
     */
    function openMenu() {
      initializeMenuElements();

      // 背景スクロールを無効化
      disableBackgroundScroll();

      // ヘッダーにクラスを追加
      header.classList.add("header--menu-open");

      // ARIA属性の更新
      menuButton.setAttribute("aria-label", "メニューを閉じる");
      menuButton.setAttribute("aria-expanded", "true");
      nav.setAttribute("aria-hidden", "false");

      openTl.restart();
      isMenuOpen = true;

      // AppStateが存在する場合は更新
      if (typeof AppState !== "undefined" && AppState.scrollStates) {
        AppState.scrollStates.isMenuOpen = true;
      }
    }

    /**
     * メニューを閉じる
     */
    function closeMenu() {
      // 背景スクロールを有効化
      enableBackgroundScroll();

      // ヘッダーのクラスを削除
      header.classList.remove("header--menu-open");

      // ARIA属性の更新
      menuButton.setAttribute("aria-label", "メニューを開く");
      menuButton.setAttribute("aria-expanded", "false");
      nav.setAttribute("aria-hidden", "true");

      closeTl.restart();
      isMenuOpen = false;

      // AppStateが存在する場合は更新
      if (typeof AppState !== "undefined" && AppState.scrollStates) {
        AppState.scrollStates.isMenuOpen = false;
      }
    }

    /**
     * ナビゲーションリンクのクリック処理
     */
    function handleNavLinkClick(e) {
      const link = e.target.closest(".nav__link");
      if (!link || link.classList.contains("nav__link--disabled")) return;

      if (link.getAttribute("href").startsWith("#")) {
        e.preventDefault();
        const targetId = link.getAttribute("href");

        setTimeout(() => {
          closeMenu();
          setTimeout(() => {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
              targetElement.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }, 300);
        }, 200);
      }
    }

    /**
     * イベントリスナーの設定
     */
    function setupEventListeners() {
      menuButton.addEventListener("click", function (e) {
        e.preventDefault();
        isMenuOpen ? closeMenu() : openMenu();
      });

      navColumns.forEach((column) => {
        column.addEventListener("click", handleNavLinkClick);
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && isMenuOpen) {
          closeMenu();
        }
      });

      nav.addEventListener("click", function (e) {
        if (e.target === nav) {
          closeMenu();
        }
      });
    }

    /**
     * 初期化
     */
    function init() {
      menuButton = document.querySelector(".js-menu-button");
      nav = document.querySelector(".js-nav");
      header = document.querySelector(".header");
      body = document.body;
      html = document.documentElement;
      subtitle = document.querySelector(".exhibition__subtitle");
      title = document.querySelector(".exhibition__title");
      date = document.querySelector(".exhibition__date");
      navColumns = document.querySelectorAll(".nav__list-column");
      navInner = document.querySelector(".nav__inner");

      if (!menuButton || !nav) return;

      nav.setAttribute("aria-hidden", "true");
      menuButton.setAttribute("aria-expanded", "false");

      initializeMenuElements();
      setupOpenAnimation();
      setupCloseAnimation();
      setupEventListeners();
    }

    return { init };
  })();
  /**
   * =======================================================
   * ギャラリーアニメーション（GSAP + ScrollTrigger）
   * =======================================================
   */
  const GalleryModule = (function () {
    let artworks, galleryWrapper, galleryContainer;
    let scrollTriggers = [];

    // 設定値
    const CONFIG = {
      // スマホ：停止時間（ビューポート高さの倍数）
      MOBILE_PAUSE_DURATION: 0.5, // 0.5 = 画面高さの50%分のスクロールで停止
      // デスクトップ：停止時間（ビューポート高さの倍数）
      DESKTOP_PAUSE_DURATION: 0.3, // 0.3 = 画面高さの30%分のスクロールで停止
      // デスクトップ：スライドイン速度
      DESKTOP_SLIDE_DURATION: 1, // 0.7 = 画面高さの70%分のスクロールでスライドイン
      // モバイル：スライドイン速度
      MOBILE_SLIDE_DURATION: 1,
      // スクラブの感度（数値が大きいほど滑らか）
      SCRUB_SMOOTHNESS: 1.5,
    };

    const getIsMobile = () => window.innerWidth <= 824;

    // 画面高さに応じてコンテナ幅を調整
    function adjustContainerWidth() {
      const containers = document.querySelectorAll(
        ".artwork .container.artwork__container, .artwork .container"
      );
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const isMobile = getIsMobile();

      // 画像のmax-heightをクリア
      const allImages = document.querySelectorAll(".artwork-image");
      allImages.forEach((img) => {
        img.style.maxHeight = "";
        img.style.removeProperty("max-height");
      });

      // モバイルの場合は調整しない
      if (isMobile) {
        containers.forEach((container) => {
          if (container.closest(".artwork")) {
            container.style.width = "";
            container.style.maxWidth = "";
          }
        });
        return;
      }

      // ========== 設定値を変更 ==========
      const designHeight = 892;
      const minHeight = 500;
      const minScalePercent = 0.45; // 最小値を50%に設定

      containers.forEach((container) => {
        if (!container.closest(".artwork")) {
          return;
        }

        container.style.width = "";
        container.style.maxWidth = "";

        if (viewportHeight >= designHeight) {
          // デザインカンプ以上の高さなら縮小なし
          return;
        } else if (viewportHeight <= minHeight) {
          // 最小高さ以下は50%に固定
          applyContainerScale(container, minScalePercent, viewportWidth);
        } else {
          // ========== より急激な変動を実現する3つの方法 ==========

          const heightRatio =
            (viewportHeight - minHeight) / (designHeight - minHeight);

          // 方法A: 指数カーブ（推奨）- より急激な変化
          // べき乗を使って下の方でより急激に縮小
          const exponentialScale =
            minScalePercent +
            (1 - minScalePercent) * Math.pow(heightRatio, 1.5);

          // 方法B: 二次曲線 - 中間的な変化
          const quadraticScale =
            minScalePercent + (1 - minScalePercent) * Math.pow(heightRatio, 2);

          // 方法C: カスタムカーブ - 特定の高さで急変
          let customScale;
          if (heightRatio > 0.5) {
            // 上半分（696px以上）は緩やかに
            customScale = 0.75 + 0.25 * ((heightRatio - 0.5) * 2);
          } else {
            // 下半分（696px以下）は急激に
            customScale = 0.5 + 0.25 * (heightRatio * 2);
          }

          // 使用する方法を選択（デフォルトは指数カーブ）
          const scalePercent = exponentialScale; // ← ここで方法を選択

          applyContainerScale(container, scalePercent, viewportWidth);
        }
      });
    }

    // 動的に調整可能な設定
    const ScalingConfig = {
      minScale: 0.5, // 最小縮小率
      curveType: "exponential", // 'linear', 'exponential', 'quadratic', 'custom'
      curvePower: 1.5, // 指数カーブの強さ（大きいほど急激）

      // 縮小率を計算する関数
      calculateScale: function (heightRatio) {
        const min = this.minScale;
        const range = 1 - min;

        switch (this.curveType) {
          case "linear":
            return min + range * heightRatio;

          case "exponential":
            return min + range * Math.pow(heightRatio, this.curvePower);

          case "quadratic":
            return min + range * Math.pow(heightRatio, 2);

          case "custom":
            // 2段階の変化率
            if (heightRatio > 0.5) {
              return 0.75 + 0.25 * ((heightRatio - 0.5) * 2);
            } else {
              return min + 0.25 * (heightRatio * 2);
            }

          default:
            return min + range * heightRatio;
        }
      },
    };

    // コンテナのスケールを適用
    function applyContainerScale(container, scale, viewportWidth) {
      if (viewportWidth >= 1600) {
        // 1600px以上：1252pxの固定幅をスケール
        const scaledWidth = 1252 * scale;
        container.style.width = `${scaledWidth}px`;
        container.style.maxWidth = `${scaledWidth}px`;
      } else if (viewportWidth >= 1280) {
        // 1280px以上：78.28125%をスケール
        const scaledPercent = 78.28125 * scale;
        container.style.width = `${scaledPercent}%`;
        container.style.maxWidth = "none";
      } else {
        // 1280px未満：最大幅1002pxをスケール
        const baseWidth = Math.min(viewportWidth - 30, 1002); // 既存のCSS計算
        const scaledMaxWidth = baseWidth * scale;
        container.style.width = `calc(${scale * 100}% - 30px)`;
        container.style.maxWidth = `${scaledMaxWidth}px`;
      }
      const artwork = container.closest(".artwork");
      if (artwork) {
        // scaleに基づいてgapを計算（60px × scale、最小20px）
        const baseGap = 60;
        const minGap = 20;
        const calculatedGap = Math.max(minGap, Math.round(baseGap * scale));

        // CSS変数として設定
        artwork.style.setProperty("--artwork-gap", `${calculatedGap}px`);

        // データ属性も設定（フォールバック用）
        if (scale < 0.6) {
          artwork.dataset.containerSize = "small";
        } else if (scale < 0.8) {
          artwork.dataset.containerSize = "medium";
        } else {
          artwork.dataset.containerSize = "large";
        }
      }
    }

    // アートワークのアスペクト比を維持しながらフィット
    function ensureArtworksFit() {
      const artworks = document.querySelectorAll(".artwork");
      const viewportHeight = window.innerHeight;
      const isMobile = getIsMobile();

      artworks.forEach((artwork, index) => {
        artwork.dataset.index = index; // デバッグ用
        const artworkCards = artwork.querySelectorAll(".artwork-card");
        const artworkInfo = artwork.querySelectorAll(".artwork-info");

        // モバイルの場合は特に調整しない
        if (isMobile) {
          artworkCards.forEach((card) => {
            const img = card.querySelector(".artwork-image");
            if (img) {
              img.style.maxHeight = "";
            }
          });
          return;
        }

        // PC版：デザインカンプ高さ892px基準での調整
        const designHeight = 892;

        // 利用可能な高さを計算（73%の領域）
        let availableHeight = viewportHeight * 0.73;

        // info要素の高さを引く
        let totalInfoHeight = 0;
        artworkInfo.forEach((info) => {
          if (info.offsetHeight) {
            totalInfoHeight += info.offsetHeight + 10; // margin分も考慮
          }
        });

        availableHeight -= totalInfoHeight;

        // 画面がデザインカンプより低い場合のみ制限
        if (viewportHeight < designHeight) {
          artworkCards.forEach((card) => {
            const img = card.querySelector(".artwork-image");
            if (img) {
              // 2枚の画像で利用可能な高さを分割
              const maxImgHeight = availableHeight / 2;
              img.style.maxHeight = `${maxImgHeight}px`;
            }
          });
        } else {
          // デザインカンプ以上の高さなら制限なし
          artworkCards.forEach((card) => {
            const img = card.querySelector(".artwork-image");
            if (img) {
              img.style.maxHeight = "";
            }
          });
        }
      });
    }

    function initializeArtworks() {
      artworks.forEach((artwork, index) => {
        if (index > 0) {
          gsap.set(artwork, { yPercent: 100 });
        }
      });

      // 高さに応じた調整を実行
      adjustContainerWidth();
      ensureArtworksFit();
    }

    function clearScrollTriggers() {
      scrollTriggers.forEach((trigger) => trigger.kill());
      scrollTriggers = [];
    }

    function setupMobileGallery() {
      const viewportHeight = window.innerHeight;
      const artworkHeights = artworks.map((artwork) => {
        const originalTransform = artwork.style.transform;
        artwork.style.transform = "translateY(0)";
        artwork.style.visibility = "visible";
        const height = artwork.scrollHeight || artwork.offsetHeight;
        artwork.style.transform = originalTransform;
        artwork.style.visibility = "";
        return height;
      });

      let totalScrollDistance = 0;
      const scrollSegments = [];

      // 停止に必要なスクロール距離
      const pauseScrollDistance = viewportHeight * CONFIG.MOBILE_PAUSE_DURATION;
      // モバイルでは画面高さ100%分のスクロールでスライドイン（より自然に）
      const slideDistance = viewportHeight; // 1.0に固定

      artworks.forEach((artwork, index) => {
        const artworkHeight = artworkHeights[index];
        // アートワークが画面より高い場合の追加スクロール量
        const extraScrollDistance = Math.max(0, artworkHeight - viewportHeight);

        if (index === 0) {
          // 最初のアートワーク
          let segmentData = {
            index: index,
            startScroll: 0,
            artworkHeight: artworkHeight,
          };

          if (extraScrollDistance > 0) {
            // 最下部までスクロール後、停止
            const scrollToBottomEnd = extraScrollDistance;
            const pauseEnd = scrollToBottomEnd + pauseScrollDistance;

            segmentData.scrollToBottomEnd = scrollToBottomEnd;
            segmentData.pauseEnd = pauseEnd;
            segmentData.endScroll = pauseEnd;
            segmentData.hasScroll = true;

            totalScrollDistance = pauseEnd;
          } else {
            // 画面内に収まる場合は停止のみ
            segmentData.endScroll = pauseScrollDistance;
            segmentData.hasScroll = false;
            totalScrollDistance = pauseScrollDistance;
          }

          scrollSegments.push(segmentData);
        } else {
          // 2番目以降のアートワーク：停止後にスライドイン開始
          const startScroll = totalScrollDistance;
          const slideInEnd = startScroll + slideDistance;

          let segmentData = {
            index: index,
            startScroll: startScroll,
            slideInEnd: slideInEnd,
            artworkHeight: artworkHeight,
          };

          if (extraScrollDistance > 0) {
            // スライドイン後、最下部までスクロールして停止
            const scrollToBottomEnd = slideInEnd + extraScrollDistance;
            const pauseEnd = scrollToBottomEnd + pauseScrollDistance;

            segmentData.scrollToBottomEnd = scrollToBottomEnd;
            segmentData.pauseEnd = pauseEnd;
            segmentData.endScroll = pauseEnd;
            segmentData.hasScroll = true;

            totalScrollDistance = pauseEnd;
          } else {
            // 画面内に収まる場合はスライドイン後に停止
            const pauseEnd = slideInEnd + pauseScrollDistance;

            segmentData.pauseEnd = pauseEnd;
            segmentData.endScroll = pauseEnd;
            segmentData.hasScroll = false;

            totalScrollDistance = pauseEnd;
          }

          scrollSegments.push(segmentData);
        }
      });

      galleryWrapper.style.minHeight = `${
        totalScrollDistance + viewportHeight
      }px`;

      // ピン設定
      const pinTrigger = ScrollTrigger.create({
        trigger: galleryWrapper,
        start: "top top",
        end: () => `+=${totalScrollDistance}`,
        pin: galleryContainer,
        pinSpacing: false,
        anticipatePin: 1,
      });
      scrollTriggers.push(pinTrigger);

      // 各アートワークのアニメーション
      scrollSegments.forEach((segment) => {
        const artwork = artworks[segment.index];

        if (segment.index === 0) {
          // 最初のアートワーク
          if (segment.hasScroll) {
            // 最下部までスクロール
            const scrollToBottomTrigger = ScrollTrigger.create({
              trigger: galleryWrapper,
              start: "top top",
              end: () => `top+=${segment.scrollToBottomEnd} top`,
              scrub: 0.5, // モバイルでは小さい値
              onUpdate: (self) => {
                const scrollAmount =
                  (segment.artworkHeight - viewportHeight) * self.progress;
                gsap.set(artwork, {
                  y: -scrollAmount,
                });
              },
            });
            scrollTriggers.push(scrollToBottomTrigger);

            // 停止期間（pauseEnd - scrollToBottomEnd の間は何もしない）
          }
        } else {
          // スライドインアニメーション - 停止解除後に開始
          // スクラブ値を小さくして、スクロールに対してより直接的な反応に
          const slideInTrigger = ScrollTrigger.create({
            trigger: galleryWrapper,
            start: () => `top+=${segment.startScroll} top`,
            end: () => `top+=${segment.slideInEnd} top`,
            scrub: 0.5, // モバイルでは小さい値で即座に反応
            onUpdate: (self) => {
              // リニアな進行で自然な速度を維持
              gsap.set(artwork, {
                yPercent: 100 - self.progress * 100,
              });
            },
          });
          scrollTriggers.push(slideInTrigger);

          if (segment.hasScroll) {
            // 最下部までスクロール
            const scrollToBottomTrigger = ScrollTrigger.create({
              trigger: galleryWrapper,
              start: () => `top+=${segment.slideInEnd} top`,
              end: () => `top+=${segment.scrollToBottomEnd} top`,
              scrub: 0.5, // モバイルでは小さい値
              onUpdate: (self) => {
                const scrollAmount =
                  (segment.artworkHeight - viewportHeight) * self.progress;
                gsap.set(artwork, {
                  y: -scrollAmount,
                });
              },
            });
            scrollTriggers.push(scrollToBottomTrigger);

            // 停止期間（pauseEnd - scrollToBottomEnd の間は何もしない）
          }
        }
      });
    }

    function setupDesktopGallery() {
      // デスクトップ版：停止時間付きの設定
      const viewportHeight = window.innerHeight;
      const slideDistance = viewportHeight * CONFIG.DESKTOP_SLIDE_DURATION;
      const pauseDistance = viewportHeight * CONFIG.DESKTOP_PAUSE_DURATION;

      // 各アートワークのスクロール距離 = スライドイン + 停止
      const sectionScrollDistance = slideDistance + pauseDistance;

      // 全体の高さ = アートワーク数 × セクション距離 + 初期の停止
      const totalHeight =
        pauseDistance +
        (artworks.length - 1) * sectionScrollDistance +
        viewportHeight;

      galleryWrapper.style.minHeight = `${totalHeight}px`;

      const pinTrigger = ScrollTrigger.create({
        trigger: galleryWrapper,
        start: "top top",
        end: () =>
          `+=${pauseDistance + (artworks.length - 1) * sectionScrollDistance}`,
        pin: galleryContainer,
        pinSpacing: false,
        anticipatePin: 1,
      });
      scrollTriggers.push(pinTrigger);

      artworks.forEach((artwork, index) => {
        if (index === 0) {
          // 最初のアートワークは最初から表示（停止期間のみ）
          return;
        }

        // 各アートワークの開始位置を計算（前のアートワークの停止後）
        const sectionStart =
          pauseDistance + (index - 1) * sectionScrollDistance;
        const slideEnd = sectionStart + slideDistance;
        const nextPauseEnd = slideEnd + pauseDistance;

        // スライドインアニメーション
        const trigger = ScrollTrigger.create({
          trigger: galleryWrapper,
          start: () => `top+=${sectionStart} top`,
          end: () => `top+=${slideEnd} top`,
          scrub: CONFIG.SCRUB_SMOOTHNESS,
          onUpdate: (self) => {
            // リニアな進行で一定速度を維持
            gsap.set(artwork, {
              yPercent: 100 - self.progress * 100,
            });
          },
        });
        scrollTriggers.push(trigger);

        // pauseDistance分は自動的に停止期間となる（slideEnd から nextPauseEnd まで）
      });
    }

    function initializeGallery() {
      clearScrollTriggers();
      gsap.killTweensOf(artworks);
      initializeArtworks();

      if (getIsMobile()) {
        setupMobileGallery();
      } else {
        setupDesktopGallery();
      }

      // すべての画像のmax-heightを削除（初期化後）
      requestAnimationFrame(() => {
        const allImages = document.querySelectorAll(".artwork-image");
        allImages.forEach((img) => {
          img.style.removeProperty("max-height");
        });
      });
    }

    function handleResize() {
      clearTimeout(AppState.resizeTimers.gallery);
      AppState.resizeTimers.gallery = setTimeout(() => {
        // 高さに応じたコンテナ幅調整を実行
        adjustContainerWidth();
        ScrollTrigger.refresh();
        initializeGallery();
      }, 250);
    }

    function init() {
      galleryWrapper = document.querySelector(".gallery-wrapper");
      galleryContainer = document.querySelector(".gallery-container");
      artworks = gsap.utils.toArray(".artwork");

      if (!galleryWrapper || !galleryContainer || artworks.length === 0) {
        return;
      }

      // artwork内の.containerにクラスを追加（識別用）
      const artworkContainers = document.querySelectorAll(
        ".artwork .container"
      );
      artworkContainers.forEach((container) => {
        container.classList.add("artwork__container");
      });

      // artwork内の画像のmax-heightのみを無効化
      const style = document.createElement("style");
      style.textContent = `.artwork .artwork-image { max-height: none !important; }`;
      document.head.appendChild(style);

      const images = document.querySelectorAll(".artwork-image");
      let loadedImages = 0;

      const checkAllImagesLoaded = () => {
        loadedImages++;
        if (loadedImages === images.length) {
          // 画像読み込み完了後、max-heightをクリア
          images.forEach((img) => {
            img.style.maxHeight = "";
            img.style.removeProperty("max-height");
          });
          initializeGallery();
        }
      };

      if (images.length === 0) {
        initializeGallery();
      } else {
        images.forEach((img) => {
          if (img.complete) {
            checkAllImagesLoaded();
          } else {
            img.addEventListener("load", checkAllImagesLoaded);
            img.addEventListener("error", checkAllImagesLoaded);
          }
        });
      }

      // 初期のコンテナ幅調整
      adjustContainerWidth();

      window.addEventListener("resize", handleResize);

      // スクロール位置のリセット（オプション）
      window.scrollTo(0, 0);
    }

    // 外部から設定を変更できるようにする
    function updateConfig(newConfig) {
      Object.assign(CONFIG, newConfig);
      initializeGallery();
    }

    return {
      init,
      updateConfig,
      getConfig: () => CONFIG,
    };
  })();

  /**
   * =======================================================
   * 記事リスト MORE ボタン機能
   * =======================================================
   */
  const ArticleListModule = (function () {
    function setupArticleList(articleList) {
      const articleItems = articleList.querySelectorAll(".article-item");
      const moreButton = articleList.querySelector(".more");
      const moreButtonElement = articleList.querySelector(".js-more-button");
      const articleInner = articleList.querySelector(".article-list__inner");

      if (articleItems.length <= 3) {
        if (moreButton) moreButton.style.display = "none";
      } else {
        if (moreButton) moreButton.classList.add("show");

        const computedStyle = window.getComputedStyle(articleInner);
        const paddingTop = parseFloat(computedStyle.paddingTop) || 40;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 40;

        let initialHeight = 0;
        for (let i = 0; i < Math.min(3, articleItems.length); i++) {
          initialHeight += articleItems[i].offsetHeight;
        }

        const totalHeight = initialHeight + paddingTop + paddingBottom;
        articleInner.style.transformOrigin = "top";
        articleInner.style.height = totalHeight + "px";
      }

      if (moreButtonElement) {
        moreButtonElement.addEventListener("click", function () {
          const isExpanded = articleInner.classList.contains("is-close");

          if (!isExpanded) {
            articleInner.classList.add("is-close");
            moreButtonElement.classList.add("is-close");

            let fullHeight = 0;
            articleItems.forEach(function (item) {
              fullHeight += item.offsetHeight;
            });

            const computedStyle = window.getComputedStyle(articleInner);
            const paddingTop = parseFloat(computedStyle.paddingTop) || 40;
            const paddingBottom = parseFloat(computedStyle.paddingBottom) || 40;
            const expandedHeight = fullHeight + paddingTop + paddingBottom;

            articleInner.style.height = expandedHeight + "px";

            setTimeout(function () {
              articleInner.style.height = "auto";
            }, 400);
          } else {
            const currentHeight = articleInner.scrollHeight;
            articleInner.style.height = currentHeight + "px";

            setTimeout(function () {
              let initialHeight = 0;
              for (let i = 0; i < Math.min(3, articleItems.length); i++) {
                initialHeight += articleItems[i].offsetHeight;
              }

              const computedStyle = window.getComputedStyle(articleInner);
              const paddingTop = parseFloat(computedStyle.paddingTop) || 40;
              const paddingBottom =
                parseFloat(computedStyle.paddingBottom) || 40;
              const collapsedHeight =
                initialHeight + paddingTop + paddingBottom;

              articleInner.style.height = collapsedHeight + "px";
              articleInner.classList.remove("is-close");
              moreButtonElement.classList.remove("is-close");
            }, 10);
          }
        });
      }
    }

    function handleResize() {
      document
        .querySelectorAll(".article-list")
        .forEach(function (articleList) {
          const articleItems = articleList.querySelectorAll(".article-item");
          const articleInner = articleList.querySelector(
            ".article-list__inner"
          );

          if (
            articleItems.length > 3 &&
            !articleInner.classList.contains("is-close")
          ) {
            let initialHeight = 0;
            for (let i = 0; i < Math.min(3, articleItems.length); i++) {
              initialHeight += articleItems[i].offsetHeight;
            }

            const computedStyle = window.getComputedStyle(articleInner);
            const paddingTop = parseFloat(computedStyle.paddingTop) || 40;
            const paddingBottom = parseFloat(computedStyle.paddingBottom) || 40;
            const resizedHeight = initialHeight + paddingTop + paddingBottom;

            articleInner.style.height = resizedHeight + "px";
          }
        });
    }

    function init() {
      document.querySelectorAll(".article-list").forEach(setupArticleList);
      window.addEventListener("resize", handleResize);
    }

    return { init };
  })();

  /**
   * =======================================================
   * チケットボタンモジュール
   * =======================================================
   */
  const TicketButtonModule = (function () {
    let ticketButton;
    const MOBILE_BREAKPOINT = 824;
    const SCROLL_THRESHOLD = 200;

    function handleTicketVisibility() {
      if (!ticketButton) return;

      // 全デバイス・全ページで統一：200px以上スクロールで表示
      if (window.pageYOffset > SCROLL_THRESHOLD) {
        ticketButton.classList.add("show");
      } else {
        ticketButton.classList.remove("show");
      }
    }

    function init() {
      ticketButton = document.querySelector(".ticket");
      if (!ticketButton) return;

      // 初期状態を設定
      handleTicketVisibility();

      // スクロールイベント
      window.addEventListener("scroll", function () {
        handleTicketVisibility();
      });

      // リサイズイベント
      window.addEventListener("resize", function () {
        clearTimeout(AppState.resizeTimers.ticket);
        AppState.resizeTimers.ticket = setTimeout(() => {
          handleTicketVisibility();
        }, 250);
      });
    }

    return { init };
  })();

  /**
   * =======================================================
   * スクロールトップボタンモジュール
   * =======================================================
   */
  const ScrollToTopModule = (function () {
    let scrollToTopButton;
    let pulseTimer;
    const MOBILE_BREAKPOINT = 824;

    function handleScrollToTopVisibility() {
      if (!scrollToTopButton) return;

      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

      if (isMobile) {
        scrollToTopButton.classList.remove("show");
        scrollToTopButton.style.display = "none";
        return;
      }

      scrollToTopButton.style.display = "";

      if (window.pageYOffset > 200) {
        scrollToTopButton.classList.add("show");
      } else {
        scrollToTopButton.classList.remove("show");
      }
    }

    function handlePulseAnimation() {
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      if (isMobile || !scrollToTopButton) return;

      if (window.pageYOffset > 500) {
        clearTimeout(pulseTimer);
        pulseTimer = setTimeout(function () {
          if (scrollToTopButton) {
            scrollToTopButton.classList.add("pulse");
            setTimeout(function () {
              scrollToTopButton.classList.remove("pulse");
            }, 2000);
          }
        }, 3000);
      }
    }

    function scrollToTop() {
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      if (isMobile) return;

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    function init() {
      scrollToTopButton = document.getElementById("scrollToTop");
      if (!scrollToTopButton) return;

      window.addEventListener("scroll", function () {
        handleScrollToTopVisibility();
        handlePulseAnimation();
      });

      window.addEventListener("resize", function () {
        handleScrollToTopVisibility();
      });

      scrollToTopButton.addEventListener("click", scrollToTop);
      handleScrollToTopVisibility();
    }

    return { init };
  })();

  /**
   * =======================================================
   * フッター制御モジュール
   * =======================================================
   */
  /**
   * =======================================================
   * フッター制御モジュール（ドロップダウン連動版）
   * =======================================================
   */
  const FooterControlModule = (function () {
    let footer, ticketButton, scrollToTopButton, dropdown, pageRelated;
    const MOBILE_BREAKPOINT = 824;
    const DROPDOWN_OFFSET_FROM_TICKET = 25; // チケットボタンからの間隔(px)
    const SCROLL_THRESHOLD = 200; // 表示開始スクロール位置

    // ビューポート幅に応じた位置計算（比率ベース）
    function getResponsivePosition() {
      const viewportWidth = window.innerWidth;

      // モバイル
      if (viewportWidth <= MOBILE_BREAKPOINT) {
        return { right: 0, bottom: 0 };
      }

      // 基準値：1280pxでright:50px, bottom:60px
      // 比率：50/1280 = 0.0390625, 60/1280 = 0.046875
      const rightRatio = 0.0390625;
      const bottomRatio = 0.046875;

      // 824px〜1600px：比率で計算
      if (viewportWidth > MOBILE_BREAKPOINT && viewportWidth <= 1600) {
        return {
          right: Math.round(viewportWidth * rightRatio),
          bottom: Math.round(viewportWidth * bottomRatio),
        };
      }

      // 1600px以上：1600px時の値で固定
      return {
        right: Math.round(1600 * rightRatio), // 62.5 → 63
        bottom: Math.round(1600 * bottomRatio), // 75
      };
    }

    function updateButtonPositions() {
      if (!footer) return;

      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      const shouldShow = window.pageYOffset > SCROLL_THRESHOLD;

      // page-relatedがある場合はそちらを基準にする
      let stopElement = footer;
      let stopElementRect = footerRect;
      let stopElementHeight = footer.offsetHeight;

      if (pageRelated) {
        const pageRelatedRect = pageRelated.getBoundingClientRect();
        // page-relatedが画面内に見えているかチェック
        if (pageRelatedRect.top < windowHeight) {
          stopElement = pageRelated;
          stopElementRect = pageRelatedRect;
          stopElementHeight = footer.offsetHeight + pageRelated.offsetHeight;
        }
      }

      const isStopElementVisible = stopElementRect.top < windowHeight;

      // レスポンシブな位置を取得
      const positions = getResponsivePosition();

      // チケットボタンの制御
      if (ticketButton && isStopElementVisible) {
        ticketButton.classList.add("stop-at-footer");
        ticketButton.style.position = "absolute";
        ticketButton.style.top = "auto";
        ticketButton.style.right = `${positions.right}px`;
        ticketButton.style.bottom = `${stopElementHeight + positions.bottom}px`;
      } else if (ticketButton) {
        ticketButton.classList.remove("stop-at-footer");
        ticketButton.style.position = "fixed";
        ticketButton.style.top = "auto";
        ticketButton.style.right = `${positions.right}px`;
        ticketButton.style.bottom = `${positions.bottom}px`;
      }

      // ドロップダウンの制御（スマホのみ）
      if (dropdown && isMobile) {
        // スクロール量に応じて表示/非表示を制御
        if (shouldShow) {
          dropdown.classList.add("show");
        } else {
          dropdown.classList.remove("show");
        }

        // チケットボタンの高さを取得
        const ticketHeight = ticketButton ? ticketButton.offsetHeight : 0;
        const dropdownBottom =
          positions.bottom + ticketHeight + DROPDOWN_OFFSET_FROM_TICKET;

        if (isStopElementVisible) {
          // フッターが見えている場合：absolute配置でフッターの上に固定
          dropdown.classList.add("stop-at-footer");
          dropdown.style.position = "absolute";
          dropdown.style.top = "auto";
          dropdown.style.right = `${positions.right}px`;
          dropdown.style.bottom = `${stopElementHeight + dropdownBottom}px`;
        } else {
          // 通常時：fixed配置でチケットボタンの上に表示
          dropdown.classList.remove("stop-at-footer");
          dropdown.style.position = "fixed";
          dropdown.style.top = "auto";
          dropdown.style.right = `${positions.right}px`;
          dropdown.style.bottom = `${dropdownBottom}px`;
        }

        // z-indexを確保（チケットボタンより上に表示）
        dropdown.style.zIndex = "4";
      } else if (dropdown && !isMobile) {
        // PC時は元のスタイルに戻す
        dropdown.classList.remove("stop-at-footer");
        dropdown.classList.remove("show");
        dropdown.style.position = "";
        dropdown.style.top = "";
        dropdown.style.right = "";
        dropdown.style.bottom = "";
        dropdown.style.left = "";
        dropdown.style.width = "";
        dropdown.style.zIndex = "";
      }

      // トップへ戻るボタンの制御（PCのみ）
      if (scrollToTopButton && !isMobile) {
        if (
          isStopElementVisible &&
          scrollToTopButton.classList.contains("show")
        ) {
          scrollToTopButton.classList.add("stop-at-footer");
          scrollToTopButton.style.position = "absolute";
          scrollToTopButton.style.top = "auto";
          scrollToTopButton.style.right = "0";
          scrollToTopButton.style.bottom = `${stopElementHeight}px`;
        } else {
          scrollToTopButton.classList.remove("stop-at-footer");
          scrollToTopButton.style.position = "fixed";
          scrollToTopButton.style.top = "auto";
          scrollToTopButton.style.right = "0";
          scrollToTopButton.style.bottom = "0";
        }
      } else if (scrollToTopButton && isMobile) {
        scrollToTopButton.style.display = "none";
      }
    }

    function init() {
      footer = document.querySelector("footer");
      ticketButton = document.querySelector(".ticket");
      scrollToTopButton = document.getElementById("scrollToTop");
      dropdown = document.querySelector(".structure__nav-dropdown");
      pageRelated = document.querySelector(".page-related"); // page-related要素を取得

      if (!footer) return;

      window.addEventListener("scroll", updateButtonPositions);
      window.addEventListener("resize", updateButtonPositions);
      updateButtonPositions();
    }

    return { init };
  })();

  /**
   * =======================================================
   * 見出しスクロールフェードモジュール（改善版）
   * =======================================================
   */
  const HeadingAnimationModule = (function () {
    function init() {
      const targets = document.querySelectorAll(".js-heading-text-anim");

      targets.forEach((target) => {
        // 元のHTMLコンテンツを取得
        const originalHTML = target.innerHTML;

        // 処理済みHTMLを構築
        let processedHTML = "";
        let spanIndex = 0;

        // テキストノードとBRタグを保持しながら処理
        const processNode = (node, isFirstNode = false) => {
          if (node.nodeType === Node.TEXT_NODE) {
            // テキストノードの場合
            let text = node.textContent;

            // 最初のノードの場合、先頭の空白を削除
            if (isFirstNode) {
              text = text.trimStart();
            }

            for (let i = 0; i < text.length; i++) {
              const char = text[i];

              // 改行文字はスキップ
              if (char === "\n" || char === "\r") {
                continue;
              }
              // スペースを保持（連続スペースも維持）
              else if (char === " ") {
                processedHTML +=
                  '<span class="char-span" style="white-space: pre;">&nbsp;</span>';
                spanIndex++;
              }
              // タブ文字
              else if (char === "\t") {
                processedHTML +=
                  '<span class="char-span" style="white-space: pre;">&#9;</span>';
                spanIndex++;
              }
              // 通常の文字
              else {
                processedHTML += `<span class="char-span">${escapeHtml(
                  char
                )}</span>`;
                spanIndex++;
              }
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            // 要素ノードの場合
            if (node.tagName.toLowerCase() === "br") {
              // BRタグはそのまま保持
              const classes = node.className
                ? ` class="${node.className}"`
                : "";
              processedHTML += `<br${classes}>`;
            } else {
              // その他の要素の子ノードを再帰的に処理
              node.childNodes.forEach((child, index) =>
                processNode(child, isFirstNode && index === 0)
              );
            }
          }
        };

        // HTMLをエスケープする関数
        function escapeHtml(text) {
          const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
          };
          return text.replace(/[&<>"']/g, (m) => map[m]);
        }

        // 一時的なコンテナを作成して元のHTMLをパース
        const tempContainer = document.createElement("div");
        // HTMLの前後の空白を削除してからパース
        tempContainer.innerHTML = originalHTML.trim();

        // 各子ノードを処理
        tempContainer.childNodes.forEach((node) => processNode(node));

        // 処理済みHTMLを設定
        target.innerHTML = processedHTML;

        // data-start-delay属性から開始遅延を取得（ミリ秒）
        const startDelay = parseFloat(target.dataset.startDelay) || 0;

        // char-spanクラスを持つspan要素のみを選択してアニメーションを設定
        const spans = target.querySelectorAll("span.char-span");

        spans.forEach((span, index) => {
          // 開始遅延 + 文字ごとの遅延
          const delay = startDelay / 1000 + index * 0.05; // 0.1から0.05に変更してより滑らかに

          // アニメーション設定
          span.style.animation = `blur-heading 3s ease-out ${delay}s 1 forwards`;
          span.style.webkitAnimation = `blur-heading 3s ease-out ${delay}s 1 forwards`;
          span.style.opacity = "0";
          span.style.filter = "blur(4px)";
          span.style.display = "inline-block"; // アニメーションのために必要
        });

        // ScrollTriggerで発火
        if (typeof ScrollTrigger !== "undefined") {
          ScrollTrigger.create({
            trigger: target,
            start: "top 80%",
            onEnter: () => {
              target.classList.add("is-visible");
            },
            once: true,
          });
        }
      });
    }

    return { init };
  })();

  // 初期化
  document.addEventListener("DOMContentLoaded", function () {
    HeadingAnimationModule.init();
  });

  /**
   * =======================================================
   * スクロールアニメーションモジュール
   * CSSクラスと連携したフェードイン・アップアニメーション
   * =======================================================
   */
  document.addEventListener("DOMContentLoaded", function () {
    // HeadingAnimationModuleの初期化（span要素の準備）
    HeadingAnimationModule.init();

    // リサイズ処理用のフラグとタイマー
    let resizeTimer;
    let isResizing = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // リサイズ中は処理をスキップ
          if (isResizing) return;

          if (entry.isIntersecting) {
            const element = entry.target;

            // 既にアニメーション済みの要素はスキップ
            if (element.dataset.animated === "true") return;

            // ---------------------------------------
            // .js-fadein の処理
            // ---------------------------------------
            if (element.classList.contains("js-fadein")) {
              element.classList.add("in-fadein");
              element.dataset.animated = "true"; // アニメーション済みフラグ

              // ネストされた .js-fadein 要素にも順番にクラスを付与
              const nestedFadeins = element.querySelectorAll(".js-fadein");
              nestedFadeins.forEach((nested, index) => {
                setTimeout(() => {
                  nested.classList.add("in-fadein");
                  nested.dataset.animated = "true";
                }, index * 200);
              });
            }

            // ---------------------------------------
            // .js-fade-box の処理（Y軸-30px + blur + opacity）
            // ---------------------------------------
            if (element.classList.contains("js-fade-box")) {
              element.classList.add("in-fade-box");
              element.dataset.animated = "true"; // アニメーション済みフラグ
            }

            // ---------------------------------------
            // .js-mainvisual の処理
            // ---------------------------------------
            if (element.classList.contains("js-mainvisual")) {
              element.classList.add("in-mainvisual");
              element.dataset.animated = "true"; // アニメーション済みフラグ
            }

            // ---------------------------------------
            // .js-heading-text-anim の処理
            // ---------------------------------------
            if (element.classList.contains("js-heading-text-anim")) {
              const startDelay = parseInt(element.dataset.startDelay) || 0;

              setTimeout(() => {
                element.classList.add("is-visible");
                element.dataset.animated = "true"; // アニメーション済みフラグ

                const spans = element.querySelectorAll("span[data-char-index]");
                const animationDuration =
                  element.dataset.animationDuration || "3";
                const animationDelayMultiplier =
                  element.dataset.animationDelay || "0.05";

                spans.forEach((span) => {
                  const charIndex = parseInt(span.dataset.charIndex);
                  const delay =
                    charIndex * parseFloat(animationDelayMultiplier);

                  span.style.animation = `blur-black ${animationDuration}s ease-out ${delay}s 1 forwards`;
                  span.style.webkitAnimation = `blur-black ${animationDuration}s ease-out ${delay}s 1 forwards`;
                });
              }, startDelay);
            }

            // 一度アニメーションしたら監視を解除
            observer.unobserve(element);
          }
        });
      },
      {
        rootMargin: "-10% 0px", // マージンを小さくして判定を緩和（-20%から-10%に変更）
        threshold: 0.01, // 閾値を下げて判定を緩和（0.1から0.01に変更）
      }
    );

    // 初期監視設定
    function observeElements() {
      document
        .querySelectorAll(
          ".js-fadein, .js-fade-box, .js-mainvisual, .js-heading-text-anim"
        )
        .forEach((el) => {
          // アニメーション済みでない要素のみ監視
          if (el.dataset.animated !== "true") {
            observer.observe(el);
          }
        });
    }

    // 初期の監視を開始
    observeElements();

    // リサイズ時の処理
    window.addEventListener("resize", function () {
      isResizing = true;

      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        isResizing = false;

        // ---------------------------------------
        // .js-fade-box のチェック
        // ---------------------------------------
        document.querySelectorAll(".js-fade-box").forEach((el) => {
          if (!el.classList.contains("in-fade-box")) {
            // 要素が画面内にあるか確認
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const inViewport =
              rect.top < windowHeight * 0.9 && rect.bottom > windowHeight * 0.1;

            if (inViewport) {
              // 即座にアニメーションを適用
              el.classList.add("in-fade-box");
              el.dataset.animated = "true";
              // 既に監視中の場合は解除
              observer.unobserve(el);
            } else {
              // 画面外なら再監視（まだ監視されていない場合のみ）
              if (el.dataset.animated !== "true") {
                observer.observe(el);
              }
            }
          }
        });

        // ---------------------------------------
        // .js-fadein のチェック
        // ---------------------------------------
        document.querySelectorAll(".js-fadein").forEach((el) => {
          if (!el.classList.contains("in-fadein")) {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const inViewport =
              rect.top < windowHeight * 0.9 && rect.bottom > windowHeight * 0.1;

            if (inViewport) {
              el.classList.add("in-fadein");
              el.dataset.animated = "true";

              // ネストされた要素も処理
              const nestedFadeins = el.querySelectorAll(".js-fadein");
              nestedFadeins.forEach((nested, index) => {
                setTimeout(() => {
                  nested.classList.add("in-fadein");
                  nested.dataset.animated = "true";
                }, index * 200);
              });

              observer.unobserve(el);
            } else {
              if (el.dataset.animated !== "true") {
                observer.observe(el);
              }
            }
          }
        });

        // ---------------------------------------
        // .js-mainvisual のチェック
        // ---------------------------------------
        document.querySelectorAll(".js-mainvisual").forEach((el) => {
          if (!el.classList.contains("in-mainvisual")) {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const inViewport =
              rect.top < windowHeight * 0.9 && rect.bottom > windowHeight * 0.1;

            if (inViewport) {
              el.classList.add("in-mainvisual");
              el.dataset.animated = "true";
              observer.unobserve(el);
            } else {
              if (el.dataset.animated !== "true") {
                observer.observe(el);
              }
            }
          }
        });

        // ---------------------------------------
        // .js-heading-text-anim のチェック
        // ---------------------------------------
        document.querySelectorAll(".js-heading-text-anim").forEach((el) => {
          if (!el.classList.contains("is-visible")) {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const inViewport =
              rect.top < windowHeight * 0.9 && rect.bottom > windowHeight * 0.1;

            if (inViewport) {
              const startDelay = parseInt(el.dataset.startDelay) || 0;

              setTimeout(() => {
                el.classList.add("is-visible");
                el.dataset.animated = "true";

                const spans = el.querySelectorAll("span[data-char-index]");
                const animationDuration = el.dataset.animationDuration || "3";
                const animationDelayMultiplier =
                  el.dataset.animationDelay || "0.05";

                spans.forEach((span) => {
                  const charIndex = parseInt(span.dataset.charIndex);
                  const delay =
                    charIndex * parseFloat(animationDelayMultiplier);

                  span.style.animation = `blur-black ${animationDuration}s ease-out ${delay}s 1 forwards`;
                  span.style.webkitAnimation = `blur-black ${animationDuration}s ease-out ${delay}s 1 forwards`;
                });
              }, startDelay);

              observer.unobserve(el);
            } else {
              if (el.dataset.animated !== "true") {
                observer.observe(el);
              }
            }
          }
        });
      }, 250); // リサイズが落ち着くまで250ms待つ
    });

    // ページロード時にも一度チェック（念のため）
    window.addEventListener("load", function () {
      setTimeout(function () {
        // 画面内にあるのにアニメーションされていない要素をチェック
        document
          .querySelectorAll(
            ".js-fade-box, .js-fadein, .js-mainvisual, .js-heading-text-anim"
          )
          .forEach((el) => {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const inViewport =
              rect.top < windowHeight * 0.9 && rect.bottom > windowHeight * 0.1;

            if (inViewport && !el.dataset.animated) {
              // 対応するクラスを追加
              if (
                el.classList.contains("js-fade-box") &&
                !el.classList.contains("in-fade-box")
              ) {
                el.classList.add("in-fade-box");
                el.dataset.animated = "true";
              }
              if (
                el.classList.contains("js-fadein") &&
                !el.classList.contains("in-fadein")
              ) {
                el.classList.add("in-fadein");
                el.dataset.animated = "true";
              }
              if (
                el.classList.contains("js-mainvisual") &&
                !el.classList.contains("in-mainvisual")
              ) {
                el.classList.add("in-mainvisual");
                el.dataset.animated = "true";
              }
              if (
                el.classList.contains("js-heading-text-anim") &&
                !el.classList.contains("is-visible")
              ) {
                el.classList.add("is-visible");
                el.dataset.animated = "true";
                // テキストアニメーションの処理も追加
                const spans = el.querySelectorAll("span[data-char-index]");
                const animationDuration = el.dataset.animationDuration || "3";
                const animationDelayMultiplier =
                  el.dataset.animationDelay || "0.05";

                spans.forEach((span) => {
                  const charIndex = parseInt(span.dataset.charIndex);
                  const delay =
                    charIndex * parseFloat(animationDelayMultiplier);

                  span.style.animation = `blur-black ${animationDuration}s ease-out ${delay}s 1 forwards`;
                  span.style.webkitAnimation = `blur-black ${animationDuration}s ease-out ${delay}s 1 forwards`;
                });
              }
            }
          });
      }, 100);
    });
  });

  /**
   * 汎用ページ読み込みアニメーション
   */
  (function () {
    window.addEventListener("load", function () {
      initPageLoadAnimation();
    });

    function initPageLoadAnimation() {
      const elements = document.querySelectorAll(".js-page-load");

      elements.forEach((element, index) => {
        // 要素ごとに少しずつ遅延
        const baseDelay = index * 100;

        setTimeout(() => {
          element.classList.add("page-loaded");
        }, baseDelay);
      });
    }
  })();

  /**
   * 汎用ページ読み込みアニメーション
   */
  (function () {
    window.addEventListener("load", function () {
      initPageLoadAnimation();
    });

    function initPageLoadAnimation() {
      const elements = document.querySelectorAll(".js-page-load");

      elements.forEach((element, index) => {
        // 要素ごとに少しずつ遅延
        const baseDelay = index * 100;

        setTimeout(() => {
          element.classList.add("page-loaded");
        }, baseDelay);
      });
    }
  })();

  /**
   * =======================================================
   * グローバルリサイズ処理
   * =======================================================
   */
  const GlobalResizeHandler = (function () {
    let previousWidth = window.innerWidth;

    function handleResize() {
      clearTimeout(AppState.resizeTimers.global);
      AppState.resizeTimers.global = setTimeout(() => {
        const currentWidth = window.innerWidth;
        const wasDesktop = previousWidth > 824;
        const isNowMobile = currentWidth <= 824;

        // デバイスタイプが変わった場合
        if (wasDesktop !== !isNowMobile) {
          // 重要な変更の場合はリロード
          if (Math.abs(previousWidth - currentWidth) > 100) {
            window.location.reload();
          }
        } else {
          // 同じデバイスタイプ内でのリサイズ
          ScrollTrigger.refresh();
        }

        previousWidth = currentWidth;
      }, 250);
    }

    function init() {
      window.addEventListener("resize", handleResize);
    }

    return { init };
  })();

  /**
   * =======================================================
   * アプリケーション初期化
   * =======================================================
   */
  function initializeApp() {
    // 各モジュールの初期化
    MenuModule.init();
    GalleryModule.init();
    ArticleListModule.init();
    ScrollToTopModule.init();
    TicketButtonModule.init(); // 追加
    FooterControlModule.init();
    HeadingAnimationModule.init();
    GlobalResizeHandler.init();
  }

  // DOMContentLoadedで実行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  } else {
    // すでに読み込まれている場合
    initializeApp();
  }
})(); // 即時実行関数の終了

// Notice表示時の位置調整
function adjustLayout() {
  const notice = document.querySelector(".exhibition-notice");
  const header = document.querySelector(".header");
  const main = document.querySelector("main");

  if (notice && header && main) {
    // Noticeが表示されているかチェック
    const isNoticeVisible = window.getComputedStyle(notice).display !== "none";

    if (isNoticeVisible) {
      // Noticeの実際の高さを取得
      const noticeHeight = notice.offsetHeight;

      // HeaderとMainの位置を調整
      header.style.top = noticeHeight + "px";
      main.style.paddingTop = noticeHeight + "px";
    } else {
      // Noticeが非表示の場合はリセット
      header.style.top = "0";
      main.style.paddingTop = "0";
    }
  }
}

// ページ読み込み時に実行
document.addEventListener("DOMContentLoaded", adjustLayout);

// ウィンドウリサイズ時に再計算
window.addEventListener("resize", adjustLayout);

// Noticeの表示/非表示を切り替える関数
function toggleNotice() {
  const notice = document.querySelector(".exhibition-notice");

  if (notice.style.display === "none") {
    // 表示
    notice.style.display = "flex";
  } else {
    // 非表示
    notice.style.display = "none";
  }

  // レイアウトを再調整
  setTimeout(adjustLayout, 10); // displayの変更を待つ
}

// MutationObserverでNoticeの変更を監視（オプション）
const observer = new MutationObserver(adjustLayout);
const noticeElement = document.querySelector(".exhibition-notice");
if (noticeElement) {
  observer.observe(noticeElement, {
    attributes: true,
    attributeFilter: ["style", "class"],
  });
}
