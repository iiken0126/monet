(function () {
  "use strict";

  // ============================================================
  // 設定値（変更する場合はここを修正）
  // ============================================================
  const SP_ADDITIONAL_OFFSET = 40; // スマホ用追加オフセット値
  const PC_FALLBACK_OFFSET = 80; // PC用フォールバック値
  const SP_FALLBACK_OFFSET = 100; // SP用フォールバック基本値

  document.addEventListener("DOMContentLoaded", function () {
    // 必要な要素を取得
    const dropdown = document.querySelector(".structure__nav-dropdown");

    // スマホサイズかどうかの判定
    function isMobile() {
      return window.innerWidth <= 824;
    }

    // gap値のキャッシュ（パフォーマンス最適化）
    let cachedGapValue = null;
    let lastWindowWidth = window.innerWidth;

    // structure__contentのgap値を取得してオフセットとして使用
    function getDynamicOffset(forceRefresh = false) {
      const currentWidth = window.innerWidth;

      // ウィンドウ幅が変わっていない場合はキャッシュを使用
      if (
        !forceRefresh &&
        cachedGapValue !== null &&
        currentWidth === lastWindowWidth
      ) {
        return cachedGapValue;
      }

      lastWindowWidth = currentWidth;

      // structure__content要素を探す
      const structureContent = document.querySelector(".structure__content");

      if (structureContent) {
        const computedStyle = window.getComputedStyle(structureContent);

        // 様々な方法でgap値を取得
        let gapValue =
          computedStyle.gap ||
          computedStyle.columnGap ||
          computedStyle.rowGap ||
          computedStyle.getPropertyValue("gap") ||
          computedStyle.getPropertyValue("column-gap");

        // Flexboxの場合
        if (!gapValue || gapValue === "normal") {
          // CSS Gridの場合も考慮
          gapValue =
            computedStyle.gridGap ||
            computedStyle.gridColumnGap ||
            computedStyle.getPropertyValue("grid-gap") ||
            computedStyle.getPropertyValue("grid-column-gap");
        }

        if (gapValue && gapValue !== "normal" && gapValue !== "0px") {
          // gapが "80px 40px" のような複数値の場合、最初の値（row-gap）を使用
          const gapParts = gapValue.split(" ");
          const primaryGap = gapParts[0];

          // calc()関数が含まれている場合の処理
          if (primaryGap.includes("calc")) {
            // 一時的な要素を作成して実際の値を計算
            const temp = document.createElement("div");
            temp.style.position = "absolute";
            temp.style.visibility = "hidden";
            temp.style.height = primaryGap;
            document.body.appendChild(temp);
            const calculatedValue = parseFloat(
              window.getComputedStyle(temp).height
            );
            document.body.removeChild(temp);

            if (!isNaN(calculatedValue)) {
              // スマホの場合は追加オフセット値を加算
              cachedGapValue = isMobile()
                ? calculatedValue + SP_ADDITIONAL_OFFSET
                : calculatedValue;
              return cachedGapValue;
            }
          }

          // 通常のpx値を数値に変換
          const gapNumeric = parseFloat(primaryGap);

          if (!isNaN(gapNumeric)) {
            // スマホの場合は追加オフセット値を加算
            cachedGapValue = isMobile()
              ? gapNumeric + SP_ADDITIONAL_OFFSET
              : gapNumeric;
            return cachedGapValue;
          }
        }
      }

      // structure__contentが見つからないか、gap値が取得できない場合は
      // CSS変数からフォールバック値を取得
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      let fallbackOffset = computedStyle.getPropertyValue("--scroll-offset");

      if (fallbackOffset) {
        const offsetValue = parseFloat(fallbackOffset);
        // スマホの場合は追加オフセット値を加算
        cachedGapValue = isMobile()
          ? offsetValue + SP_ADDITIONAL_OFFSET
          : offsetValue;
        return cachedGapValue;
      }

      // 最終的なフォールバック値
      cachedGapValue = isMobile()
        ? SP_FALLBACK_OFFSET + SP_ADDITIONAL_OFFSET
        : PC_FALLBACK_OFFSET;

      return cachedGapValue;
    }

    // ResizeObserverでgap値の変更を監視（オプション）
    function observeGapChanges() {
      const structureContent = document.querySelector(".structure__content");
      if (!structureContent || !window.ResizeObserver) return;

      const resizeObserver = new ResizeObserver(() => {
        // gap値を再取得（キャッシュをクリア）
        getDynamicOffset(true);
      });

      resizeObserver.observe(structureContent);
    }

    // 監視を開始
    observeGapChanges();

    // ドロップダウンがある場合のみ処理
    if (dropdown) {
      // ドロップダウンメニューの開閉機能を実装
      const dropdownTrigger = dropdown.querySelector(
        ".structure__nav-dropdown-trigger"
      );
      const dropdownMenu = dropdown.querySelector(
        ".structure__nav-dropdown-menu"
      );
      const dropdownArrow = dropdown.querySelector(
        ".structure__nav-dropdown-arrow"
      );
      const dropdownCurrent = dropdown.querySelector(
        ".structure__nav-dropdown-current"
      );
      const dropdownItems = dropdown.querySelectorAll(
        ".structure__nav-dropdown-item"
      );

      let isMenuOpen = false;

      // メニューの開閉を制御
      function toggleMenu() {
        isMenuOpen = !isMenuOpen;

        if (isMenuOpen) {
          dropdownMenu.classList.add("is-open");
          dropdownArrow.style.transform = "rotate(180deg)";
        } else {
          dropdownMenu.classList.remove("is-open");
          dropdownArrow.style.transform = "rotate(0deg)";
        }
      }

      // メニューを閉じる
      function closeMenu() {
        if (isMenuOpen) {
          isMenuOpen = false;
          dropdownMenu.classList.remove("is-open");
          dropdownArrow.style.transform = "rotate(0deg)";
        }
      }

      // トリガークリックでメニューの開閉
      if (dropdownTrigger && dropdownMenu) {
        dropdownTrigger.addEventListener("click", function (e) {
          e.stopPropagation();
          toggleMenu();
        });
      }

      // 外部クリックでメニューを閉じる
      document.addEventListener("click", function (e) {
        if (!dropdown.contains(e.target)) {
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

      // メニューアイテムのクリック処理
      dropdownItems.forEach(function (item) {
        item.addEventListener("click", function (e) {
          e.stopPropagation();

          // チャプターIDを取得してスクロール
          const chapterId = this.getAttribute("data-value");
          const targetLabel = this.getAttribute("data-label");

          if (chapterId && targetLabel) {
            // 手動選択フラグを立てる
            isManualSelection = true;

            // 既存のタイムアウトをクリア
            if (manualSelectionTimeout) {
              clearTimeout(manualSelectionTimeout);
            }

            // 現在の章番号と目標の章番号を取得
            const currentText = dropdownCurrent.textContent;
            const currentNum = parseInt(
              currentText.replace("第", "").replace("章", "")
            );
            const targetNum = parseInt(
              targetLabel.replace("第", "").replace("章", "")
            );

            // 章番号のアニメーション表示
            if (
              !isNaN(currentNum) &&
              !isNaN(targetNum) &&
              currentNum !== targetNum
            ) {
              const direction = currentNum < targetNum ? 1 : -1;
              const steps = Math.abs(targetNum - currentNum);
              const duration = Math.min(steps * 100, 2000); // 最大2秒
              const interval = duration / steps;

              let currentStep = 0;
              const animationInterval = setInterval(function () {
                currentStep++;
                const displayNum = currentNum + direction * currentStep;

                if (dropdownCurrent) {
                  dropdownCurrent.textContent = `第${displayNum}章`;
                }

                if (currentStep >= steps) {
                  clearInterval(animationInterval);

                  // 選択状態を更新
                  dropdownItems.forEach(function (el) {
                    el.classList.remove("is-selected");
                  });
                  item.classList.add("is-selected");

                  // アニメーション完了フラグを設定
                  dropdownCurrent.setAttribute("data-animating", "false");
                }
              }, interval);

              // アニメーション開始フラグを設定
              if (dropdownCurrent) {
                dropdownCurrent.setAttribute("data-animating", "true");
              }
            } else {
              // 番号以外の場合は即座に更新
              if (dropdownCurrent) {
                dropdownCurrent.textContent = targetLabel;
                dropdownCurrent.setAttribute("data-animating", "false");
              }

              // 選択状態を更新
              dropdownItems.forEach(function (el) {
                el.classList.remove("is-selected");
              });
              item.classList.add("is-selected");
            }

            const targetChapter = document.getElementById(chapterId);
            if (targetChapter) {
              // アニメーション要素の補正を考慮したオフセット付きスクロール
              const rect = targetChapter.getBoundingClientRect();
              const computedStyle = window.getComputedStyle(targetChapter);
              const transform = computedStyle.transform;

              let offsetCorrection = 0;
              // transformのtranslateYを検出して補正
              if (transform && transform !== "none") {
                const matrix = new DOMMatrix(transform);
                offsetCorrection = matrix.m42; // translateYの値
              }

              // 動的オフセットを取得して適用
              const dynamicOffset = getDynamicOffset();
              const targetPosition =
                rect.top +
                window.pageYOffset -
                dynamicOffset -
                offsetCorrection;

              window.scrollTo({
                top: targetPosition,
                behavior: "smooth",
              });

              // PC版のナビゲーションとも連動（存在する場合）
              const pcNavItems = document.querySelectorAll(
                ".structure__nav-item"
              );
              pcNavItems.forEach(function (navItem) {
                navItem.classList.remove("structure__nav-item--active");
              });

              const activeNavLink = document.querySelector(
                `.structure__nav-link[href="#${chapterId}"]`
              );
              if (activeNavLink) {
                activeNavLink.parentElement.classList.add(
                  "structure__nav-item--active"
                );
              }

              // スクロール完了後に自動更新を再開（時間を延長）
              manualSelectionTimeout = setTimeout(function () {
                isManualSelection = false;
                // 手動選択解除時にすぐに現在位置を確認
                updateCurrentChapter();
              }, 1500); // スクロールアニメーション完了まで待つ
            }
          }

          // メニューを閉じる
          closeMenu();
        });
      });
    }

    // 現在のチャプターを監視して自動更新
    let isManualSelection = false; // 手動選択フラグ
    let manualSelectionTimeout = null;

    function updateCurrentChapter() {
      // 手動選択中は自動更新をスキップ
      if (isManualSelection) return;

      const chapters = document.querySelectorAll(".structure__chapter");
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;

      chapters.forEach(function (chapter) {
        const rect = chapter.getBoundingClientRect();
        const chapterTop = rect.top + scrollTop;
        const chapterBottom = chapterTop + chapter.offsetHeight;
        const viewportMiddle = scrollTop + windowHeight / 3;

        // ビューポートの上部1/3にチャプターが入っている場合
        if (chapterTop <= viewportMiddle && chapterBottom > viewportMiddle) {
          const chapterId = chapter.getAttribute("id");

          // スマホ版：ドロップダウンの表示を更新
          if (isMobile() && dropdown) {
            const dropdownCurrent = dropdown.querySelector(
              ".structure__nav-dropdown-current"
            );
            const dropdownItems = dropdown.querySelectorAll(
              ".structure__nav-dropdown-item"
            );

            // アニメーション中は更新をスキップ
            if (
              dropdownCurrent &&
              dropdownCurrent.getAttribute("data-animating") === "true"
            ) {
              return;
            }

            dropdownItems.forEach(function (item) {
              if (item.getAttribute("data-value") === chapterId) {
                if (!item.classList.contains("is-selected")) {
                  // 選択状態を更新
                  dropdownItems.forEach(function (el) {
                    el.classList.remove("is-selected");
                  });
                  item.classList.add("is-selected");

                  // 表示テキストを更新
                  const label = item.getAttribute("data-label");
                  if (dropdownCurrent && label) {
                    dropdownCurrent.textContent = label;
                  }
                }
              }
            });
          }

          // PC版：ナビゲーションのアクティブ状態を更新
          if (!isMobile()) {
            const pcNavItems = document.querySelectorAll(
              ".structure__nav-item"
            );
            const targetNavLink = document.querySelector(
              `.structure__nav-link[href="#${chapterId}"]`
            );

            if (targetNavLink) {
              const targetNavItem = targetNavLink.parentElement;

              // 現在のアクティブ状態と異なる場合のみ更新
              if (
                !targetNavItem.classList.contains("structure__nav-item--active")
              ) {
                // すべてのアクティブ状態をクリア
                pcNavItems.forEach(function (navItem) {
                  navItem.classList.remove("structure__nav-item--active");
                });

                // 新しいアクティブ状態を設定
                targetNavItem.classList.add("structure__nav-item--active");
              }
            }
          }
        }
      });
    }

    // PC版ナビゲーションリンクのクリック処理（オフセット追加）
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
            // 現在のアクティブな章を取得
            const currentActive = document.querySelector(
              ".structure__nav-item--active"
            );
            const currentIndex = currentActive
              ? Array.from(pcNavLinks).indexOf(
                  currentActive.querySelector(".structure__nav-link")
                ) + 1
              : 1;
            const targetIndex = Array.from(pcNavLinks).indexOf(this) + 1;

            // すべてのアクティブ状態をクリア
            const pcNavItems = document.querySelectorAll(
              ".structure__nav-item"
            );
            pcNavItems.forEach(function (navItem) {
              navItem.classList.remove("structure__nav-item--active");
            });

            // クリックされた章をアクティブに設定
            this.parentElement.classList.add("structure__nav-item--active");

            // SP側のドロップダウンも同期（存在する場合）
            if (isMobile() && dropdown) {
              const dropdownCurrent = dropdown.querySelector(
                ".structure__nav-dropdown-current"
              );
              const dropdownItems = dropdown.querySelectorAll(
                ".structure__nav-dropdown-item"
              );

              // アニメーションで章番号を表示
              if (currentIndex !== targetIndex && dropdownCurrent) {
                const direction = currentIndex < targetIndex ? 1 : -1;
                const steps = Math.abs(targetIndex - currentIndex);
                const duration = Math.min(steps * 100, 2000);
                const interval = duration / steps;

                let currentStep = 0;
                const animationInterval = setInterval(function () {
                  currentStep++;
                  const chapterNum = currentIndex + direction * currentStep;
                  dropdownCurrent.textContent = `第${chapterNum}章`;

                  if (currentStep >= steps) {
                    clearInterval(animationInterval);

                    // SP側の選択状態も更新
                    dropdownItems.forEach(function (item) {
                      item.classList.remove("is-selected");
                      if (item.getAttribute("data-value") === targetId) {
                        item.classList.add("is-selected");
                      }
                    });
                  }
                }, interval);
              } else if (dropdownItems) {
                // SP側の選択状態を更新
                dropdownItems.forEach(function (item) {
                  item.classList.remove("is-selected");
                  if (item.getAttribute("data-value") === targetId) {
                    item.classList.add("is-selected");
                  }
                });
              }
            }

            // アニメーション要素の補正を考慮したオフセット付きスクロール
            const rect = targetElement.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(targetElement);
            const transform = computedStyle.transform;

            let offsetCorrection = 0;
            // transformのtranslateYを検出して補正
            if (transform && transform !== "none") {
              const matrix = new DOMMatrix(transform);
              offsetCorrection = matrix.m42; // translateYの値
            }

            // 動的オフセットを取得して適用
            const dynamicOffset = getDynamicOffset();
            const targetPosition =
              rect.top + window.pageYOffset - dynamicOffset - offsetCorrection;

            window.scrollTo({
              top: targetPosition,
              behavior: "smooth",
            });

            // スクロール完了後に自動更新を再開（時間を延長）
            manualSelectionTimeout = setTimeout(function () {
              isManualSelection = false;
              // 手動選択解除時にすぐに現在位置を確認
              updateCurrentChapter();
            }, 1500); // スクロールアニメーション完了まで待つ
          }
        }
      });
    });

    // スクロール時に現在のチャプターを更新（PC/SP両対応）
    let updateTicking = false;
    function requestUpdateTick() {
      if (!updateTicking) {
        window.requestAnimationFrame(function () {
          updateCurrentChapter();
          updateTicking = false;
        });
        updateTicking = true;
      }
    }

    window.addEventListener("scroll", requestUpdateTick, { passive: true });

    // デバイスタイプが変わった時にメニューを閉じる
    let previousIsMobile = isMobile();
    let resizeTimer;

    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        const currentIsMobile = isMobile();

        // PC⇔SPの切り替わりを検出
        if (previousIsMobile !== currentIsMobile) {
          // デバイスタイプが変わった場合、メニューを閉じる
          if (!currentIsMobile && dropdown) {
            const dropdownMenu = dropdown.querySelector(
              ".structure__nav-dropdown-menu"
            );
            const dropdownArrow = dropdown.querySelector(
              ".structure__nav-dropdown-arrow"
            );

            if (dropdownMenu) {
              dropdownMenu.classList.remove("is-open");
            }
            if (dropdownArrow) {
              dropdownArrow.style.transform = "rotate(0deg)";
            }
          }
          // gap値のキャッシュをクリア
          getDynamicOffset(true);
          previousIsMobile = currentIsMobile;
        }
      }, 250);
    });

    // 初期表示時に現在の章を設定
    updateCurrentChapter();
  });
})();
