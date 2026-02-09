;(function (window) {
  "use strict";

  var stage = document.getElementById("verify-card-stack");
  var panel = document.getElementById("verify-search-panel");
  var form = panel ? panel.querySelector(".verify-search-panel__form") : null;
  var inputTag = document.getElementById("verify-search-input-tag");
  var inputOrder = document.getElementById("verify-search-input-order");
  var infoTag = document.getElementById("verify-search-info-tag");
  var infoOrder = document.getElementById("verify-search-info-order");
  var openTagBtn = document.getElementById("go-verify-tag-btn");
  var openOrderBtn = document.getElementById("go-verify-order-btn");
  var closeBtn = document.getElementById("verify-search-close-btn");
  var root = document.documentElement;
  var body = document.body;
  var currentMode = "tag";
  var isTagSearching = false;

  var TAG_CODE_PATTERN = /^INF-[A-Z]\d{2}-[A-Z]\d{2}$/;
  var ORDER_CODE_PATTERN = /^INF-ORDER-[A-Z]\d{6}$/;
  var TAG_CODE_FORMAT = "INF-A00-A00";
  var ORDER_CODE_FORMAT = "INF-ORDER-A000000";

  var TAG_INPUT_CONFIG = {
    prefix: "INF-",
    prefixSeed: "INF",
    slots: "A99A99",
    splitIndex: 3,
    maxDisplayLength: 11,
  };

  var ORDER_INPUT_CONFIG = {
    prefix: "INF-ORDER-",
    prefixSeed: "INFORDER",
    slots: "A999999",
    splitIndex: 0,
    maxDisplayLength: 17,
  };

  function sanitizeAlphaNumericUpper(value) {
    return String(value || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }

  function matchesSlot(character, slotType) {
    if (slotType === "A") {
      return /^[A-Z]$/.test(character);
    }
    if (slotType === "9") {
      return /^\d$/.test(character);
    }
    return false;
  }

  function extractRawCode(value, config) {
    var cleanedValue = sanitizeAlphaNumericUpper(value);

    if (
      config.prefixSeed &&
      cleanedValue.indexOf(config.prefixSeed) === 0
    ) {
      cleanedValue = cleanedValue.slice(config.prefixSeed.length);
    }

    var raw = "";
    for (var i = 0; i < cleanedValue.length; i += 1) {
      if (raw.length >= config.slots.length) {
        break;
      }

      var character = cleanedValue.charAt(i);
      var expectedSlot = config.slots.charAt(raw.length);

      if (matchesSlot(character, expectedSlot)) {
        raw += character;
      } else {
        break;
      }
    }

    return raw;
  }

  function formatCode(raw, config) {
    if (!raw) {
      return "";
    }

    if (!config.splitIndex || raw.length <= config.splitIndex) {
      return config.prefix + raw;
    }

    return (
      config.prefix +
      raw.slice(0, config.splitIndex) +
      "-" +
      raw.slice(config.splitIndex)
    );
  }

  function normalizeCodeValue(value, config) {
    var raw = extractRawCode(value, config);
    return {
      raw: raw,
      display: formatCode(raw, config),
    };
  }

  function moveCursorToEnd(inputElement) {
    if (
      !inputElement ||
      typeof inputElement.setSelectionRange !== "function"
    ) {
      return;
    }

    var cursor = inputElement.value.length;
    try {
      inputElement.setSelectionRange(cursor, cursor);
    } catch (error) {
      // Ignore unsupported selection APIs.
    }
  }

  function bindStrictCodeInput(inputElement, config) {
    if (!inputElement) {
      return;
    }

    var isComposing = false;

    function syncInputValue() {
      var normalized = normalizeCodeValue(inputElement.value, config);
      if (inputElement.value !== normalized.display) {
        inputElement.value = normalized.display;
      }
      moveCursorToEnd(inputElement);
    }

    inputElement.setAttribute("maxlength", String(config.maxDisplayLength));

    inputElement.addEventListener("focus", function () {
      window.setTimeout(function () {
        moveCursorToEnd(inputElement);
      }, 0);
    });

    inputElement.addEventListener("click", function () {
      moveCursorToEnd(inputElement);
    });

    inputElement.addEventListener("compositionstart", function () {
      isComposing = true;
    });

    inputElement.addEventListener("compositionend", function () {
      isComposing = false;
      syncInputValue();
    });

    inputElement.addEventListener("beforeinput", function (event) {
      if (isComposing || !event) {
        return;
      }

      if (event.inputType && event.inputType.indexOf("delete") === 0) {
        return;
      }

      if (typeof event.data !== "string" || event.data.length !== 1) {
        return;
      }

      var nextCharacter = sanitizeAlphaNumericUpper(event.data);
      if (nextCharacter.length !== 1) {
        event.preventDefault();
        return;
      }

      var currentRawLength = normalizeCodeValue(
        inputElement.value,
        config
      ).raw.length;
      var expectedSlot = config.slots.charAt(currentRawLength);

      if (!expectedSlot || !matchesSlot(nextCharacter, expectedSlot)) {
        event.preventDefault();
      }
    });

    inputElement.addEventListener("input", function () {
      if (isComposing) {
        return;
      }
      syncInputValue();
    });

    syncInputValue();
  }

  function setScrollLock(isLocked) {
    if (!root || !body) {
      return;
    }

    root.classList.toggle("verify-scroll-locked", isLocked);
    body.classList.toggle("verify-scroll-locked", isLocked);
  }

  function toggleVisible(element, isVisible) {
    if (!element) {
      return;
    }

    element.classList.toggle("d-none", !isVisible);
  }

  function getDefaultInfo(mode) {
    if (mode === "tag") {
      return "Hit enter to search tag code or ESC to close";
    }
    return "Hit enter to search order code or ESC to close";
  }

  function getActiveInfo() {
    return currentMode === "tag" ? infoTag : infoOrder;
  }

  function setInfoMessage(message, isError) {
    var infoElement = getActiveInfo();
    if (!infoElement) {
      return;
    }

    infoElement.textContent = message;
    infoElement.classList.toggle("text-danger", !!isError);
  }

  function setSearchMode(mode) {
    currentMode = mode === "order" ? "order" : "tag";
    var isTagMode = currentMode === "tag";

    toggleVisible(inputTag, isTagMode);
    toggleVisible(infoTag, isTagMode);
    toggleVisible(inputOrder, !isTagMode);
    toggleVisible(infoOrder, !isTagMode);

    if (infoTag) {
      infoTag.classList.remove("text-danger");
      infoTag.textContent = getDefaultInfo("tag");
    }
    if (infoOrder) {
      infoOrder.classList.remove("text-danger");
      infoOrder.textContent = getDefaultInfo("order");
    }
  }

  function getActiveInput() {
    return currentMode === "tag" ? inputTag : inputOrder;
  }

  function openSearch(mode) {
    if (!stage || !panel) {
      return;
    }

    setSearchMode(mode);
    stage.classList.add("is-shifted");
    panel.classList.add("is-open");
    setScrollLock(true);

    var activeInput = getActiveInput();
    if (activeInput) {
      activeInput.focus();
    }
  }

  function closeSearch() {
    if (!stage || !panel) {
      return;
    }

    stage.classList.remove("is-shifted");
    panel.classList.remove("is-open");
    setScrollLock(false);

    if (inputTag) {
      inputTag.blur();
      inputTag.value = "";
    }
    if (inputOrder) {
      inputOrder.blur();
      inputOrder.value = "";
    }
  }

  function searchByTagCode() {
    if (!inputTag) {
      return;
    }

    if (isTagSearching) {
      return;
    }

    var tagCode = inputTag.value.trim();
    if (tagCode === "") {
      setInfoMessage("Please enter a tag code.", true);
      return;
    }

    if (!TAG_CODE_PATTERN.test(tagCode)) {
      setInfoMessage("Invalid format. Use " + TAG_CODE_FORMAT + ".", true);
      return;
    }

    setInfoMessage("Searching...", false);
    isTagSearching = true;

    fetch("/api/public/verify/tag?precious_code=" + encodeURIComponent(tagCode), {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
      .then(function (response) {
        return response.json().then(function (result) {
          if (!response.ok || !result || !result.success) {
            var message = (result && result.message) || "Search failed";
            throw new Error(message);
          }
          return result.data;
        });
      })
      .then(function (data) {
        console.log("verify tag search result:", data);
        closeSearch();
      })
      .catch(function (error) {
        console.error("verify tag search failed:", error);
        setInfoMessage(error.message || "Search failed", true);
      })
      .finally(function () {
        isTagSearching = false;
      });
  }

  function validateOrderCode() {
    if (!inputOrder) {
      return false;
    }

    var orderCode = inputOrder.value.trim();
    if (orderCode === "") {
      setInfoMessage("Please enter an order code.", true);
      return false;
    }

    if (!ORDER_CODE_PATTERN.test(orderCode)) {
      setInfoMessage("Invalid format. Use " + ORDER_CODE_FORMAT + ".", true);
      return false;
    }

    return true;
  }

  function handleSearchSubmit() {
    if (currentMode === "tag") {
      searchByTagCode();
      return;
    }

    if (!validateOrderCode()) {
      return;
    }

    setInfoMessage("Order search is not ready yet.", true);
  }

  function bindEnterSearch(inputElement) {
    if (!inputElement) {
      return;
    }

    inputElement.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.keyCode === 13) {
        event.preventDefault();
        handleSearchSubmit();
      }
    });
  }

  function bindEvents() {
    setSearchMode("tag");
    bindStrictCodeInput(inputTag, TAG_INPUT_CONFIG);
    bindStrictCodeInput(inputOrder, ORDER_INPUT_CONFIG);

    if (openTagBtn) {
      openTagBtn.addEventListener("click", function () {
        openSearch("tag");
      });
    }

    if (openOrderBtn) {
      openOrderBtn.addEventListener("click", function () {
        openSearch("order");
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", closeSearch);
    }

    if (panel && form) {
      panel.addEventListener("click", function (event) {
        if (!form.contains(event.target)) {
          closeSearch();
        }
      });
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        handleSearchSubmit();
      });
    }

    bindEnterSearch(inputTag);
    bindEnterSearch(inputOrder);

    document.addEventListener("keyup", function (event) {
      if (event.key === "Escape" || event.keyCode === 27) {
        closeSearch();
      }
    });
  }

  bindEvents();
})(window);
