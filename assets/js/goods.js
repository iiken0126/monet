(function () {
  "use strict";

  // ============================================================
  // 設定値（composition/structure.jsと同じ値を使用）
  // ============================================================
  const SP_ADDITIONAL_OFFSET = 40; // スマホ用追加オフセット値
  const PC_FALLBACK_OFFSET = 80; // PC用フォールバック値
  const SP_FALLBACK_OFFSET = 100; // SP用フォールバック基本値

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

    // 動的オフセットを取得（composition/structure.jsと同じロジック）
    function getDynamicOffset() {
      if (isMobile()) {
        return SP_FALLBACK_OFFSET + SP_ADDITIONAL_OFFSET;
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

    let isMenuOpen = false;

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
      const dropdownItems = dropdownMenu.querySelectorAll(
        ".structure__nav-dropdown-item"
      );

      dropdownItems.forEach(function (item) {
        item.addEventListener("click", function (e) {
          e.stopPropagation();

          const value = this.dataset.value;
          const label = this.dataset.label;

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
              const dropdownItems = dropdownMenu.querySelectorAll(
                ".structure__nav-dropdown-item"
              );
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
          }
        }
      });
    });

    // ============================================================
    // Sidebar Active State on Scroll
    // ============================================================
    const sections = document.querySelectorAll(".goods-section[id], .goods-section__header[id]");
    const navItems = document.querySelectorAll(".structure__nav-item");

    if (sections.length && navItems.length) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.id;

              // サイドバーのアクティブ状態を更新
              navItems.forEach((item) => {
                item.classList.remove("structure__nav-item--active");
                if (item.querySelector(`a[href="#${id}"]`)) {
                  item.classList.add("structure__nav-item--active");
                }
              });

              // モバイルドロップダウンも更新
              if (dropdownCurrent && dropdownMenu) {
                const activeItem = dropdownMenu.querySelector(
                  `[data-value="${id}"]`
                );
                if (activeItem) {
                  dropdownCurrent.textContent = activeItem.dataset.label;
                  dropdownMenu
                    .querySelectorAll(".structure__nav-dropdown-item")
                    .forEach((i) => i.classList.remove("is-selected"));
                  activeItem.classList.add("is-selected");
                }
              }
            }
          });
        },
        { rootMargin: "-20% 0px -60% 0px" }
      );

      sections.forEach((section) => observer.observe(section));
    }

    // ============================================================
    // Museum Section での Dropdown 非表示制御
    // ============================================================
    const museumSection = document.querySelector(".museum-section");

    if (museumSection && dropdown) {
      const museumObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // museum-sectionが画面内に入ったらdropdownを非表示
              dropdown.classList.remove("show");
            } else {
              // museum-sectionが画面外に出たらdropdownを表示（スクロール位置が上の場合）
              const rect = museumSection.getBoundingClientRect();
              // museum-sectionより上にスクロールしている場合のみshowを追加
              if (rect.top > window.innerHeight) {
                dropdown.classList.add("show");
              }
            }
          });
        },
        { threshold: 0 }
      );

      museumObserver.observe(museumSection);

      // スクロールイベントで追加制御（より確実な表示制御）
      let scrollTicking = false;
      window.addEventListener(
        "scroll",
        function () {
          if (!scrollTicking) {
            window.requestAnimationFrame(function () {
              const rect = museumSection.getBoundingClientRect();
              const windowHeight = window.innerHeight;

              // museum-sectionが画面内に入っているかチェック
              if (rect.top < windowHeight && rect.bottom > 0) {
                dropdown.classList.remove("show");
              } else if (rect.top >= windowHeight) {
                // museum-sectionより上にいる場合は表示
                dropdown.classList.add("show");
              }
              // museum-sectionより下にスクロールした場合は非表示のまま

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
