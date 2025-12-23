(function () {
  "use strict";

  // ============================================================
  // 設定値
  // ============================================================
  const PC_FALLBACK_OFFSET = 80; // PC用フォールバック値
  const SP_FALLBACK_OFFSET = 50; // SP用フォールバック値

  document.addEventListener("DOMContentLoaded", function () {
    // ============================================================
    // Goods Accordion（詳細情報の開閉）
    // ============================================================
    const accordionTriggers = document.querySelectorAll(
      ".goods-accordion__trigger"
    );

    accordionTriggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        const accordion = this.closest(".goods-accordion");
        accordion.classList.toggle("is-open");
      });
    });

    // ============================================================
    // Goods Swiper（商品画像スライダー）
    // ============================================================
    const goodsSwipers = document.querySelectorAll(".goods-swiper");

    goodsSwipers.forEach(function (swiperElement) {
      const slides = swiperElement.querySelectorAll(".swiper-slide");

      // スライドが2枚以上の場合のみSwiperを有効化
      if (slides.length > 1) {
        new Swiper(swiperElement, {
          loop: true,
          speed: 600,
          effect: "fade",
          fadeEffect: {
            crossFade: true,
          },
          pagination: {
            el: swiperElement.querySelector(".swiper-pagination"),
            clickable: true,
          },
        });
      } else {
        // スライドが1枚の場合はpaginationを非表示
        const pagination = swiperElement.querySelector(".swiper-pagination");
        if (pagination) {
          pagination.style.display = "none";
        }
      }
    });

    // ============================================================
    // ユーティリティ関数
    // ============================================================

    // スマホサイズかどうかの判定
    function isMobile() {
      return window.innerWidth <= 824;
    }

    // 動的オフセットを取得
    function getDynamicOffset() {
      if (isMobile()) {
        return SP_FALLBACK_OFFSET;
      }
      return PC_FALLBACK_OFFSET;
    }

    // ============================================================
    // Mobile Dropdown（カテゴリ選択）
    // ============================================================
    const dropdown = document.querySelector(".structure__nav-dropdown");
    const dropdownTrigger = document.getElementById("dropdownTrigger");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const dropdownCurrent = document.querySelector(
      ".structure__nav-dropdown-current"
    );
    const dropdownArrow = document.querySelector(
      ".structure__nav-dropdown-arrow"
    );
    const dropdownItems = dropdownMenu
      ? dropdownMenu.querySelectorAll(".structure__nav-dropdown-item")
      : [];

    let isMenuOpen = false;
    let isManualSelection = false; // 手動選択フラグ
    let manualSelectionTimeout = null;

    // メニューの開閉を制御
    function toggleMenu() {
      isMenuOpen = !isMenuOpen;

      if (isMenuOpen) {
        dropdownMenu.classList.add("is-open");
        dropdownTrigger.classList.add("is-open");
        if (dropdownArrow) {
          dropdownArrow.style.transform = "rotate(180deg)";
        }
      } else {
        dropdownMenu.classList.remove("is-open");
        dropdownTrigger.classList.remove("is-open");
        if (dropdownArrow) {
          dropdownArrow.style.transform = "rotate(0deg)";
        }
      }
    }

    // メニューを閉じる
    function closeMenu() {
      if (isMenuOpen) {
        isMenuOpen = false;
        dropdownMenu.classList.remove("is-open");
        dropdownTrigger.classList.remove("is-open");
        if (dropdownArrow) {
          dropdownArrow.style.transform = "rotate(0deg)";
        }
      }
    }

    if (dropdownTrigger && dropdownMenu) {
      // トリガークリックでメニューの開閉
      dropdownTrigger.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleMenu();
      });

      // 外部クリックで閉じる
      document.addEventListener("click", function (e) {
        if (dropdown && !dropdown.contains(e.target)) {
          closeMenu();
        }
      });

      // スクロール時にメニューを閉じる
      window.addEventListener(
        "scroll",
        function () {
          closeMenu();
        },
        { passive: true }
      );

      // ドロップダウンアイテムのクリック処理
      dropdownItems.forEach(function (item) {
        item.addEventListener("click", function (e) {
          e.stopPropagation();

          const value = this.dataset.value;
          const label = this.dataset.label;

          // 手動選択フラグを立てる
          isManualSelection = true;

          // 既存のタイムアウトをクリア
          if (manualSelectionTimeout) {
            clearTimeout(manualSelectionTimeout);
          }

          // 表示テキストを更新
          if (dropdownCurrent) {
            dropdownCurrent.textContent = label;
          }

          // 選択状態を更新
          dropdownItems.forEach((i) => i.classList.remove("is-selected"));
          this.classList.add("is-selected");

          // メニューを閉じる
          closeMenu();

          // オフセット付きスクロール
          const target = document.getElementById(value);
          if (target) {
            const rect = target.getBoundingClientRect();
            const dynamicOffset = getDynamicOffset();
            const targetPosition =
              rect.top + window.pageYOffset - dynamicOffset;

            window.scrollTo({
              top: targetPosition,
              behavior: "smooth",
            });

            // PC版のナビゲーションとも連動
            const pcNavItems = document.querySelectorAll(".structure__nav-item");
            pcNavItems.forEach(function (navItem) {
              navItem.classList.remove("structure__nav-item--active");
            });

            const activeNavLink = document.querySelector(
              `.structure__nav-link[href="#${value}"]`
            );
            if (activeNavLink) {
              activeNavLink.parentElement.classList.add(
                "structure__nav-item--active"
              );
            }

            // スクロール完了後に自動更新を再開
            manualSelectionTimeout = setTimeout(function () {
              isManualSelection = false;
              updateCurrentSection();
            }, 1500);
          }
        });
      });
    }

    // ============================================================
    // PC版ナビゲーションリンクのクリック処理（オフセット追加）
    // ============================================================
    const pcNavLinks = document.querySelectorAll(".structure__nav-link");
    pcNavLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();

        // 手動選択フラグを立てる
        isManualSelection = true;

        // 既存のタイムアウトをクリア
        if (manualSelectionTimeout) {
          clearTimeout(manualSelectionTimeout);
        }

        const href = this.getAttribute("href");
        if (href && href.startsWith("#")) {
          const targetId = href.substring(1);
          const targetElement = document.getElementById(targetId);

          if (targetElement) {
            // すべてのアクティブ状態をクリア
            const pcNavItems = document.querySelectorAll(".structure__nav-item");
            pcNavItems.forEach(function (navItem) {
              navItem.classList.remove("structure__nav-item--active");
            });

            // クリックされた項目をアクティブに設定
            this.parentElement.classList.add("structure__nav-item--active");

            // SP側のドロップダウンも同期
            if (dropdownCurrent && dropdownMenu) {
              dropdownItems.forEach(function (item) {
                item.classList.remove("is-selected");
                if (item.getAttribute("data-value") === targetId) {
                  item.classList.add("is-selected");
                  dropdownCurrent.textContent = item.getAttribute("data-label");
                }
              });
            }

            // オフセット付きスクロール
            const rect = targetElement.getBoundingClientRect();
            const dynamicOffset = getDynamicOffset();
            const targetPosition =
              rect.top + window.pageYOffset - dynamicOffset;

            window.scrollTo({
              top: targetPosition,
              behavior: "smooth",
            });

            // スクロール完了後に自動更新を再開
            manualSelectionTimeout = setTimeout(function () {
              isManualSelection = false;
              updateCurrentSection();
            }, 1500);
          }
        }
      });
    });

    // ============================================================
    // 現在のセクションを監視して自動更新（structure.jsと同様のロジック）
    // ============================================================
    const sections = document.querySelectorAll(".goods-section__header[id]");
    const navItems = document.querySelectorAll(".structure__nav-item");

    function updateCurrentSection() {
      // 手動選択中は自動更新をスキップ
      if (isManualSelection) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const viewportMiddle = scrollTop + windowHeight / 3;

      let currentSection = null;

      sections.forEach(function (section) {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top + scrollTop;
        const sectionBottom = sectionTop + section.offsetHeight;

        // ビューポートの上部1/3にセクションが入っている場合
        if (sectionTop <= viewportMiddle && sectionBottom > scrollTop) {
          currentSection = section;
        }
      });

      if (currentSection) {
        const sectionId = currentSection.getAttribute("id");

        // PC版：ナビゲーションのアクティブ状態を更新
        const targetNavLink = document.querySelector(
          `.structure__nav-link[href="#${sectionId}"]`
        );

        if (targetNavLink) {
          const targetNavItem = targetNavLink.parentElement;

          // 現在のアクティブ状態と異なる場合のみ更新
          if (!targetNavItem.classList.contains("structure__nav-item--active")) {
            navItems.forEach(function (navItem) {
              navItem.classList.remove("structure__nav-item--active");
            });
            targetNavItem.classList.add("structure__nav-item--active");
          }
        }

        // SP版：ドロップダウンの表示を更新
        if (dropdownCurrent && dropdownMenu) {
          const activeItem = dropdownMenu.querySelector(
            `[data-value="${sectionId}"]`
          );
          if (activeItem) {
            const currentLabel = dropdownCurrent.textContent;
            const newLabel = activeItem.dataset.label;

            // 表示が異なる場合のみ更新
            if (currentLabel !== newLabel) {
              dropdownCurrent.textContent = newLabel;
              dropdownItems.forEach(function (item) {
                item.classList.remove("is-selected");
              });
              activeItem.classList.add("is-selected");
            }
          }
        }
      }
    }

    // スクロール時に現在のセクションを更新
    let updateTicking = false;
    function requestUpdateTick() {
      if (!updateTicking) {
        window.requestAnimationFrame(function () {
          updateCurrentSection();
          updateTicking = false;
        });
        updateTicking = true;
      }
    }

    window.addEventListener("scroll", requestUpdateTick, { passive: true });

    // 初期表示時に現在のセクションを設定
    updateCurrentSection();

    // ============================================================
    // Museum Section での Dropdown 非表示制御
    // showクラスの追加はscript.jsのFooterControlModuleが担当
    // ここではmuseum-section内に入った時の非表示のみを制御
    // ============================================================
    const museumSection = document.querySelector(".museum-section");

    if (museumSection && dropdown) {
      // museum-sectionが画面内にあるかどうかを追跡
      let isInMuseumSection = false;

      const museumObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isInMuseumSection = entry.isIntersecting;
            if (entry.isIntersecting) {
              // museum-sectionが画面内に入ったらdropdownを非表示
              dropdown.classList.remove("show");
              dropdown.classList.add("hide-in-museum");
            } else {
              // museum-sectionから出たらフラグを解除（showの追加はFooterControlModuleに任せる）
              dropdown.classList.remove("hide-in-museum");
            }
          });
        },
        { threshold: 0 }
      );

      museumObserver.observe(museumSection);

      // スクロールイベントでmuseum-section内の場合は常にshowを削除
      // （FooterControlModuleがshowを追加しても上書きする）
      let scrollTicking = false;
      window.addEventListener(
        "scroll",
        function () {
          if (!scrollTicking && isInMuseumSection) {
            window.requestAnimationFrame(function () {
              dropdown.classList.remove("show");
              scrollTicking = false;
            });
            scrollTicking = true;
          }
        },
        { passive: true }
      );
    }

    // ============================================================
    // デバイスタイプ変更時の処理
    // ============================================================
    let previousIsMobile = isMobile();
    let resizeTimer;

    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        const currentIsMobile = isMobile();

        // PC⇔SPの切り替わりを検出
        if (previousIsMobile !== currentIsMobile) {
          // デバイスタイプが変わった場合、メニューを閉じる
          if (dropdownMenu) {
            dropdownMenu.classList.remove("is-open");
          }
          if (dropdownTrigger) {
            dropdownTrigger.classList.remove("is-open");
          }
          if (dropdownArrow) {
            dropdownArrow.style.transform = "rotate(0deg)";
          }
          isMenuOpen = false;
          previousIsMobile = currentIsMobile;
        }
      }, 250);
    });
  });
})();
