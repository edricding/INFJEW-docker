window.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded");
  GetBanner();
  GetCountingDown();
  GetPreciousList();

  document.body.addEventListener("click", function (event) {
    // 检查点击的元素是否是 .jump-to-new
    if (event.target.closest(".jump-to-new")) {
      const clickedElement = event.target.closest(".jump-to-new");

      // 判断是否有 "sold-out-active" 类
      if (!clickedElement.classList.contains("sold-out-active")) {
        // 获取 data-jump 属性的值
        const jumpUrl = clickedElement.dataset.jump;

        // 如果 url 存在，则打开新页面
        if (jumpUrl) {
          window.open(jumpUrl, "_blank");
        }
      }
    }
  });
});

function GetBanner() {
  fetch("https://www.infjew.com/api/public/banners")
    .then((res) => res.json())
    .then((data) => {
      if (!data.success || !Array.isArray(data.data)) {
        console.error("获取 banner 失败:", data.message);
        return;
      }
      console.log("data", data);
      const carousel = $(".hero-area-slider");
      console.log("$carousel", carousel);

      // ✅ 1. 销毁旧的 owlCarousel（如果已经初始化）
      if (carousel.hasClass("owl-loaded")) {
        carousel.trigger("destroy.owl.carousel");
        carousel.html(""); // 清空 DOM
        carousel.removeClass("owl-loaded owl-hidden"); // 干净移除 class
      }

      // ✅ 2. 动态添加每一个 slide
      data.data.forEach((banner) => {
        const slideHtml = `
        <div class="single-slide-item">
          <div class="row d-flex align-items-center">
            <div class="col-xl-5 col-lg-5 col-md-6 col-12">
              <div class="hero-area-inner">
                <div class="section-title">
                  <p class="mb-20">${banner.subtitle}</p>
                  <h1>${banner.title1}</h1>
                  <h1>${banner.title2}</h1>
                </div>
                <a href="${banner.url}" class="main-btn mt-40" target="_blank">Shop Now</a>
              </div>
            </div>
            <div class="col-xl-7 col-lg-7 col-md-6 col-12">
              <div class="hero-area-right">
                <div class="hero-area-img">
                  <img src="${banner.picurl}" alt="Banner Image" />
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
        carousel.append(slideHtml);
      });

      // ✅ 3. 重新初始化 Owl Carousel
      carousel.owlCarousel({
        items: 1,
        loop: true,
        autoplay: true,
        autoplayTimeout: 5000,
        nav: false,
        dots: false,
        responsiveClass: true,
      });
    })
    .catch((err) => {
      console.error("请求 banner 出错:", err);
    });
}

function GetCountingDown() {
  fetch("https://www.infjew.com/api/public/countingdown")
    .then((res) => res.json())
    .then((data) => {
      if (!data.success || !data.data || data.data.length === 0) {
        console.error("无倒计时数据可展示");
        return;
      }

      const item = data.data[0]; // 取第一个商品

      const container = document.getElementById("countingdownContainer");
      if (!container) return;

      // 更新标题和折扣信息
      container.querySelector(
        "h4"
      ).innerHTML = `Precious Sale <span>${item.percentage} Off</span>`;
      container.querySelector("h2").textContent = item.title;

      // 更新评分
      const ratingEl = container.querySelector(".item-rating");
      ratingEl.innerHTML = "";
      for (let i = 0; i < 5; i++) {
        const star = document.createElement("i");
        star.className = "las la-star" + (i < item.rating ? "" : " inactive");
        ratingEl.appendChild(star);
      }

      // 更新价格
      const priceEl = container.querySelector(".item-price p");
      priceEl.innerHTML = `$${item.discount} <span>$${item.price}</span>`;

      // 更新按钮链接
      const goBtn = document.getElementById("go-for-it-btn");
      if (goBtn) {
        goBtn.href = item.url;
      }

      // 更新图片
      const imgEl = document.querySelector(".countdown-img img");
      if (imgEl) {
        imgEl.src = item.picurl;
      }

      // 初始化倒计时
      const ddl = new Date(item.ddl);
      //   simplyCountdown(".simply-countdown-one", {
      //     year: ddl.getFullYear(),
      //     month: ddl.getMonth() + 1,
      //     day: ddl.getDate(),
      //     hours: ddl.getHours(),
      //     minutes: ddl.getMinutes(),
      //     seconds: ddl.getSeconds(),
      //     enableUtc: false,
      //   });

      simplyCountdown(".simply-countdown-one", {
        year: ddl.getFullYear(),
        month: ddl.getMonth() + 1,
        day: ddl.getDate(),
      });
    })
    .catch((err) => {
      console.error("获取倒计时数据失败:", err);
    });
}

function GetPreciousList() {
  fetch("https://www.infjew.com/api/public/preciouslist")
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        renderProducts(data.data);
      } else {
        console.error("数据获取失败");
      }
    })
    .catch((error) => {
      console.error("请求失败:", error);
    });
}

function ensureNewArrivalRenderRoot() {
  const newArrivalSection = document.querySelector(".top-sell-prod-area");
  if (!newArrivalSection) {
    console.error("New Arrival section not found");
    return null;
  }

  const mountPoint =
    newArrivalSection.querySelector(".container .row > .col-xl-12.text-center") ||
    newArrivalSection.querySelector(".container") ||
    newArrivalSection;

  let tabContainer = newArrivalSection.querySelector("#newArrivalTabContainer");
  if (!tabContainer) {
    let nav = newArrivalSection.querySelector("nav");
    if (!nav) {
      nav = document.createElement("nav");
      mountPoint.appendChild(nav);
    }

    tabContainer = document.createElement("div");
    tabContainer.id = "newArrivalTabContainer";
    tabContainer.classList.add(
      "nav",
      "nav-pills",
      "product-list",
      "justify-content-center"
    );
    tabContainer.setAttribute("role", "tablist");
    nav.appendChild(tabContainer);
  }

  let tabContent = newArrivalSection.querySelector("#nav-tabContent");
  if (!tabContent) {
    tabContent = document.createElement("div");
    tabContent.id = "nav-tabContent";
    tabContent.classList.add("tab-content");
    mountPoint.appendChild(tabContent);
  }

  return { tabContainer, tabContent };
}

function renderProducts(products) {
  if (!Array.isArray(products)) {
    console.error("Invalid products payload:", products);
    return;
  }

  const renderRoot = ensureNewArrivalRenderRoot();
  if (!renderRoot) {
    return;
  }

  const { tabContainer, tabContent } = renderRoot;

  // 清空现有内容
  tabContainer.innerHTML = "";
  tabContent.innerHTML = "";

  // 动态分类：根据 tag 分类产品
  const categorizedProducts = categorizeProductsByTag(products);

  // 创建 All 分类
  const allTabButton = document.createElement("button");
  allTabButton.classList.add("nav-link", "active");
  allTabButton.id = "all-products-tab";
  allTabButton.setAttribute("data-bs-toggle", "tab");
  allTabButton.setAttribute("data-bs-target", "#all-products");
  allTabButton.setAttribute("type", "button");
  allTabButton.setAttribute("role", "tab");
  allTabButton.setAttribute("aria-controls", "all-products");
  allTabButton.setAttribute("aria-selected", "true");
  allTabButton.innerText = "All";
  tabContainer.appendChild(allTabButton);

  const allTabPane = document.createElement("div");
  allTabPane.classList.add("tab-pane", "fade", "show", "active");
  allTabPane.id = "all-products";
  allTabPane.setAttribute("role", "tabpanel");
  allTabPane.setAttribute("aria-labelledby", "all-products-tab");
  const allRow = document.createElement("div");
  allRow.classList.add("row");
  products.forEach((product) => {
    const productCard = createProductCard(product);
    allRow.appendChild(productCard);
  });
  allTabPane.appendChild(allRow);
  tabContent.appendChild(allTabPane);

  // 创建其他分类 Tabs
  for (const [tag, productsInCategory] of Object.entries(categorizedProducts)) {
    const tabButton = document.createElement("button");
    tabButton.classList.add("nav-link");
    tabButton.id = `${tag}-tab`;
    tabButton.setAttribute("data-bs-toggle", "tab");
    tabButton.setAttribute("data-bs-target", `#${tag}`);
    tabButton.setAttribute("type", "button");
    tabButton.setAttribute("role", "tab");
    tabButton.setAttribute("aria-controls", tag);
    tabButton.setAttribute("aria-selected", "false");
    tabButton.innerText = tag.charAt(0).toUpperCase() + tag.slice(1);
    tabContainer.appendChild(tabButton);

    const tabPane = document.createElement("div");
    tabPane.classList.add("tab-pane", "fade");
    tabPane.id = tag;
    tabPane.setAttribute("role", "tabpanel");
    tabPane.setAttribute("aria-labelledby", `${tag}-tab`);
    const row = document.createElement("div");
    row.classList.add("row");
    productsInCategory.forEach((product) => {
      const productCard = createProductCard(product);
      row.appendChild(productCard);
    });
    tabPane.appendChild(row);
    tabContent.appendChild(tabPane);
  }
}

// 根据 tag 分类产品
function categorizeProductsByTag(products) {
  const categorized = {};

  products.forEach((product) => {
    if (!categorized[product.tag]) {
      categorized[product.tag] = [];
    }
    categorized[product.tag].push(product);
  });

  return categorized;
}

function normalizeRatingValue(rawRating) {
  const numericRating = Number(rawRating);
  if (!Number.isFinite(numericRating)) {
    return 0;
  }

  const clampedRating = Math.min(5, Math.max(0, numericRating));
  return Math.round(clampedRating * 2) / 2;
}

function createProductCard(product) {
  const col = document.createElement("div");
  col.classList.add("col-xl-3", "col-lg-4", "col-md-6", "col-12");

  const card = document.createElement("div");
  card.classList.add("top-product-wrapper", "jump-to-new");
  card.dataset.jump = product.url;

  // 判断是否为 "Sold out" 状态
  const isSoldOut = product.status === 0;
  if (isSoldOut) {
    card.classList.add("sold-out-active");
  }

  const inner = document.createElement("div");
  inner.classList.add(
    "top-product-inner",
    "d-flex",
    "justify-content-center",
    "align-items-center"
  );

  // 如果是售罄，添加售罄标签
  if (isSoldOut) {
    const soldOut = document.createElement("div");
    soldOut.classList.add("sold-out-inner");
    soldOut.innerHTML = "<span>Sold out</span>";
    inner.appendChild(soldOut);
  }

  const imageWrapper = document.createElement("div");
  imageWrapper.classList.add("top-prod-thumb");
  const image = document.createElement("img");
  image.src = product.picurl;
  image.alt = product.title;
  imageWrapper.appendChild(image);

  // 如果 status 为 2，添加折扣标签
  if (product.status === 2 && product.discount < product.price) {
    const discountPercentage = Math.floor(
      ((product.price - product.discount) / product.price) * 100
    );
    const discountTag = document.createElement("span");
    discountTag.classList.add("new");
    discountTag.innerHTML = `-${discountPercentage}%`;
    const flags = document.createElement("span");
    flags.classList.add("flags");
    flags.appendChild(discountTag);
    imageWrapper.appendChild(flags);
  }

  inner.appendChild(imageWrapper);
  card.appendChild(inner);

  const content = document.createElement("div");
  content.classList.add("top-prod-content");

  const title = document.createElement("h5");
  title.classList.add("top-product-title");
  title.innerHTML = product.title;
  content.appendChild(title);

  const rating = document.createElement("div");
  rating.classList.add("product-rating");

  const normalizedRating = normalizeRatingValue(product.rating);
  for (let i = 0; i < 5; i++) {
    const star = document.createElement("i");
    const remaining = normalizedRating - i;

    if (remaining >= 1) {
      star.classList.add("las", "la-star");
    } else if (remaining >= 0.5) {
      star.classList.add("las", "la-star-half-alt");
    } else {
      star.classList.add("lar", "la-star");
    }

    rating.appendChild(star);
  }

  content.appendChild(rating);

  const price = document.createElement("div");
  price.classList.add("product-price");
  const priceText = document.createElement("p");
  if (product.discount < product.price) {
    const originalPrice = document.createElement("span");
    originalPrice.innerHTML = `$${product.price.toFixed(2)}`;
    originalPrice.classList.add("original-price");
    priceText.innerHTML = `$${product.discount.toFixed(2)} `;
    priceText.appendChild(originalPrice);
  } else {
    priceText.innerHTML = `$${product.discount.toFixed(2)}`;
  }
  price.appendChild(priceText);
  content.appendChild(price);

  card.appendChild(content);
  col.appendChild(card);

  return col;
}
