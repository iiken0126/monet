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
  // Mobile Dropdown（カテゴリ選択）
  // ============================================================
  const dropdownTrigger = document.getElementById("dropdownTrigger");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const dropdownCurrent = document.querySelector(
    ".structure__nav-dropdown-current"
  );

  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener("click", function () {
      dropdownMenu.classList.toggle("is-open");
      dropdownTrigger.classList.toggle("is-open");
    });

    const dropdownItems = dropdownMenu.querySelectorAll(
      ".structure__nav-dropdown-item"
    );
    dropdownItems.forEach(function (item) {
      item.addEventListener("click", function () {
        const value = this.dataset.value;
        const label = this.dataset.label;

        dropdownCurrent.textContent = label;

        dropdownItems.forEach((i) => i.classList.remove("is-selected"));
        this.classList.add("is-selected");

        dropdownMenu.classList.remove("is-open");
        dropdownTrigger.classList.remove("is-open");

        const target = document.getElementById(value);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    // 外部クリックで閉じる
    document.addEventListener("click", function (e) {
      if (
        !dropdownTrigger.contains(e.target) &&
        !dropdownMenu.contains(e.target)
      ) {
        dropdownMenu.classList.remove("is-open");
        dropdownTrigger.classList.remove("is-open");
      }
    });
  }

  // ============================================================
  // Sidebar Active State on Scroll
  // ============================================================
  const sections = document.querySelectorAll(".goods-section[id]");
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
            if (dropdownCurrent) {
              const activeItem = dropdownMenu?.querySelector(
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
});
