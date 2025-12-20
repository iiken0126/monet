document.addEventListener("DOMContentLoaded", function () {
  // DOM要素の取得
  const loadingOverlay = document.getElementById("loadingOverlay");
  const imageFirst = document.getElementById("imageFirst");
  const imageSecond = document.getElementById("imageSecond");
  const loadingText = document.getElementById("loadingText");
  const mainContent = document.getElementById("mainContent");
  const body = document.body;

  // Swiperインスタンスを格納する変数
  let homeBgSwiper = null;
  let captionSwiper = null;

  // 初回アクセスかどうかを判定
  const hasVisited = sessionStorage.getItem("hasVisitedMonet");

  // 初回アクセスでない場合、またはローディング要素がない場合
  if (hasVisited || !loadingText || !loadingOverlay) {
    // ローディングをスキップ
    if (loadingOverlay) {
      loadingOverlay.style.display = "none";
    }
    if (body) {
      body.classList.remove("loading-active");
    }
    if (mainContent) {
      mainContent.style.opacity = "1";
    }
    // 直接Swiperを開始
    initDualSwiper();

    // 初回アクセスフラグを設定（まだ設定されていない場合）
    if (!hasVisited) {
      sessionStorage.setItem("hasVisitedMonet", "true");
    }
    return;
  }

  // === 以下、初回アクセス時のみ実行されるローディングアニメーション ===

  // 初回アクセスフラグを設定
  sessionStorage.setItem("hasVisitedMonet", "true");

  const text = "これを見ずに、モネは語れない。";
  const letters = text
    .split("")
    .map((letter, index) => {
      if (letter === " ") {
        return "<span>&nbsp;</span>";
      }
      return `<span>${letter}</span>`;
    })
    .join("");

  loadingText.innerHTML = letters;

  // JavaScriptで各spanにアニメーションを設定
  const spans = loadingText.querySelectorAll("span");
  spans.forEach((span, index) => {
    const delay = (index + 1) * 0.1;
    span.style.animation = `blur 3s ease-out ${delay}s 1 forwards`;
    span.style.webkitAnimation = `blur 3s ease-out ${delay}s 1 forwards`;
    // アニメーション開始前は透明
    span.style.color = "transparent";
  });

  // 他の要素の存在確認も追加
  if (!imageFirst || !imageSecond || !mainContent) {
    console.error("必要な要素が見つかりません:", {
      imageFirst: !!imageFirst,
      imageSecond: !!imageSecond,
      mainContent: !!mainContent,
    });
    // エラーの場合もSwiperを開始
    initDualSwiper();
    return;
  }

  const tl = gsap.timeline({
    onComplete: () => {
      body.classList.remove("loading-active");
      gsap.set(loadingOverlay, { display: "none" });
      // ローディング完了後にSwiperを開始
      initDualSwiper();
    },
  });

  imageFirst.onload = function () {
    // Y移動を削除し、位置は固定
    gsap.set(imageFirst, { y: 0 });

    tl.to(imageFirst, {
      opacity: 1,
      duration: 0.6,
      ease: "power2.out",
    })
      .to(
        {},
        {
          duration: 2.1, // 元のY移動の時間分の待機
          ease: "none",
        }
      )
      // imageSecondの初期設定（ブラーなしで開始）
      .set(imageSecond, {
        opacity: 0,
        filter: "blur(15px)",
        webkitFilter: "blur(15px)", // Safari用
      })
      // imageSecondを表示しながらブラーを解除
      .to(imageSecond, {
        opacity: 1,
        filter: "blur(0px)",
        webkitFilter: "blur(0px)", // Safari用
        duration: 2.0,
        ease: "power2.inOut",
      })
      // loading-text全体にブラーとopacityをかけて消す（Safari対応）
      .to(
        loadingText,
        {
          filter: "blur(20px)",
          webkitFilter: "blur(20px)", // Safari用プレフィックス
          opacity: 0,
          duration: 1.2,
          ease: "power2.out",
          force3D: true, // GPU加速を強制
          rotationZ: 0.01, // レンダリングの最適化
        },
        "-=1.8" // より早めに開始
      )
      // imageFirstをフェードアウト
      .to(
        imageFirst,
        {
          opacity: 0,
          duration: 1.5,
          ease: "power2.inOut",
        },
        "-=1.5" // imageSecondと同時に
      )
      .to(
        loadingOverlay,
        {
          opacity: 0,
          duration: 0.6,
          ease: "power2.inOut",
        },
        "-=0.4"
      )
      .to(
        mainContent,
        {
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
        },
        "-=0.4"
      );
  };

  if (imageFirst.complete) {
    imageFirst.onload();
  }

  // 2つのスライダーを初期化して連動させる関数
  function initDualSwiper() {
    // 背景画像用スライダー
    if (document.querySelector(".home-bg-swiper")) {
      homeBgSwiper = new Swiper(".home-bg-swiper", {
        effect: "fade",
        fadeEffect: {
          crossFade: true,
        },
        loop: true,
        autoplay: {
          delay: 4000,
          disableOnInteraction: false,
        },
        speed: 2000,
        allowTouchMove: false, // タッチ操作を無効化
      });
    }

    // キャプション用スライダー
    if (document.querySelector(".caption-swiper")) {
      captionSwiper = new Swiper(".caption-swiper", {
        effect: "fade",
        fadeEffect: {
          crossFade: true,
        },
        loop: true,
        speed: 2000,
        allowTouchMove: false,
        pagination: {
          el: ".slider-pagination",
          clickable: true,
        },
      });
    }

    // スライダーの連動設定
    if (homeBgSwiper && captionSwiper) {
      // 背景スライダーの変更をキャプションに反映
      homeBgSwiper.on("slideChange", function () {
        captionSwiper.slideTo(homeBgSwiper.realIndex);
      });

      // 自動再生の同期
      homeBgSwiper.on("autoplayStart", function () {
        captionSwiper.autoplay.start();
      });

      homeBgSwiper.on("autoplayStop", function () {
        captionSwiper.autoplay.stop();
      });

      // コントロールボタンの設定
      const prevBtn = document.querySelector(".slider-prev");
      const nextBtn = document.querySelector(".slider-next");

      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          homeBgSwiper.slidePrev();
          captionSwiper.slidePrev();
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          homeBgSwiper.slideNext();
          captionSwiper.slideNext();
        });
      }

      // ページネーションクリック時の同期
      captionSwiper.on("slideChange", function () {
        if (homeBgSwiper.realIndex !== captionSwiper.realIndex) {
          homeBgSwiper.slideTo(captionSwiper.realIndex);
        }
      });
    }
  }

  // スクロールイベント（スムーススクロール）
  const scrollLink = document.querySelector(".main-visual__scroll a");
  if (scrollLink) {
    scrollLink.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  }
});

// 以下、スクロール処理は変更なし
document.addEventListener("DOMContentLoaded", function () {
  const mainVisual = document.querySelector(".home-bg");

  if (!mainVisual) return;

  let isHidden = false;
  let scrollTimeout;

  function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
      const currentTime = Date.now();
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const pageHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    const windowHeight = window.innerHeight;
    const scrollableHeight = pageHeight - windowHeight;
    const halfwayPoint = scrollableHeight / 2;

    clearTimeout(scrollTimeout);

    if (scrollTop >= halfwayPoint && !isHidden) {
      // display: noneの代わりにvisibilityとopacityを使用
      mainVisual.style.visibility = "hidden";
      mainVisual.style.opacity = "0";
      mainVisual.style.pointerEvents = "none";
      isHidden = true;
    } else if (scrollTop < halfwayPoint && isHidden) {
      mainVisual.style.visibility = "visible";
      mainVisual.style.opacity = "1";
      mainVisual.style.pointerEvents = "auto";
      isHidden = false;
    }

    // スクロール停止後の最終チェック
    scrollTimeout = setTimeout(() => {
      const finalScrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const shouldBeHidden = finalScrollTop >= halfwayPoint;

      if (shouldBeHidden && !isHidden) {
        mainVisual.style.visibility = "hidden";
        mainVisual.style.opacity = "0";
        mainVisual.style.pointerEvents = "none";
        isHidden = true;
      } else if (!shouldBeHidden && isHidden) {
        mainVisual.style.visibility = "visible";
        mainVisual.style.opacity = "1";
        mainVisual.style.pointerEvents = "auto";
        isHidden = false;
      }
    }, 150);
  }

  const throttledScroll = throttle(handleScroll, 100);

  window.addEventListener("scroll", throttledScroll);
  window.addEventListener("resize", throttledScroll);

  // 初期チェック
  handleScroll();
});
