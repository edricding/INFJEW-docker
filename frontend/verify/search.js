;(function (window) {
  "use strict";

  var stage = document.getElementById("verify-card-stack");
  var panel = document.getElementById("verify-search-panel");
  var form = panel ? panel.querySelector(".verify-search-panel__form") : null;
  var inputTag = document.getElementById("verify-search-input-tag");
  var inputOrder = document.getElementById("verify-search-input-order");
  var infoTag = document.getElementById("verify-search-info-tag");
  var infoOrder = document.getElementById("verify-search-info-order");
  var infoTagGroup = panel ? panel.querySelectorAll(".verify-info-tag") : [];
  var infoOrderGroup = panel ? panel.querySelectorAll(".verify-info-order") : [];
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
    displayLength: 11,
  };

  var ORDER_INPUT_CONFIG = {
    prefix: "INF-ORDER-",
    prefixSeed: "INFORDER",
    slots: "A999999",
    splitIndex: 0,
    displayLength: 17,
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

  function formatTemplateCode(raw, config) {
    var safeRaw = String(raw || "").slice(0, config.slots.length);

    if (!config.splitIndex) {
      return config.prefix + safeRaw.padEnd(config.slots.length, "_");
    }

    var firstLength = config.splitIndex;
    var secondLength = config.slots.length - firstLength;
    var firstPart = safeRaw.slice(0, firstLength).padEnd(firstLength, "_");
    var secondPart = safeRaw.slice(firstLength).padEnd(secondLength, "_");

    return config.prefix + firstPart + "-" + secondPart;
  }

  function getCursorFromRawLength(rawLength, config) {
    var safeRawLength = Math.max(
      0,
      Math.min(rawLength, config.slots.length)
    );

    if (!config.splitIndex) {
      return config.prefix.length + safeRawLength;
    }

    if (safeRawLength <= config.splitIndex) {
      return config.prefix.length + safeRawLength;
    }

    return config.prefix.length + config.splitIndex + 1 + (safeRawLength - config.splitIndex);
  }

  function moveCursorTo(inputElement, position) {
    if (
      !inputElement ||
      typeof inputElement.setSelectionRange !== "function"
    ) {
      return;
    }

    try {
      inputElement.setSelectionRange(position, position);
    } catch (error) {
      // Ignore unsupported selection APIs.
    }
  }

  function getCodeController(inputElement) {
    if (!inputElement) {
      return null;
    }
    return inputElement.__verifyCodeController || null;
  }

  function getInputRawLength(inputElement, config) {
    var controller = getCodeController(inputElement);
    if (controller && typeof controller.getRaw === "function") {
      return controller.getRaw().length;
    }
    return extractRawCode(inputElement ? inputElement.value : "", config).length;
  }

  function getInputCode(inputElement, config) {
    var controller = getCodeController(inputElement);
    if (controller && typeof controller.getCode === "function") {
      return controller.getCode();
    }

    var raw = extractRawCode(inputElement ? inputElement.value : "", config);
    if (raw.length !== config.slots.length) {
      return "";
    }

    return formatCode(raw, config);
  }

  function resetCodeInput(inputElement) {
    var controller = getCodeController(inputElement);
    if (controller && typeof controller.reset === "function") {
      controller.reset();
      return;
    }

    if (inputElement) {
      inputElement.value = "";
    }
  }

  function bindStrictCodeInput(inputElement, config) {
    if (!inputElement) {
      return null;
    }

    var isComposing = false;
    var raw = extractRawCode(inputElement.value, config);

    function render() {
      inputElement.value = formatTemplateCode(raw, config);
      inputElement.classList.toggle("text-muted-2", raw.length === 0);
      moveCursorTo(inputElement, getCursorFromRawLength(raw.length, config));
    }

    function appendFromText(text) {
      var cleanedText = sanitizeAlphaNumericUpper(text);

      if (
        config.prefixSeed &&
        cleanedText.indexOf(config.prefixSeed) === 0
      ) {
        cleanedText = cleanedText.slice(config.prefixSeed.length);
      }

      for (var i = 0; i < cleanedText.length; i += 1) {
        if (raw.length >= config.slots.length) {
          break;
        }

        var character = cleanedText.charAt(i);
        var expectedSlot = config.slots.charAt(raw.length);
        if (!matchesSlot(character, expectedSlot)) {
          break;
        }

        raw += character;
      }
    }

    function removeLastCharacter() {
      if (raw.length > 0) {
        raw = raw.slice(0, -1);
      }
    }

    function syncRawFromInputValue() {
      var nextRaw = extractRawCode(inputElement.value, config);
      if (nextRaw !== raw) {
        raw = nextRaw;
      }
    }

    inputElement.setAttribute("maxlength", String(config.displayLength));

    inputElement.addEventListener("focus", function () {
      window.setTimeout(function () {
        moveCursorTo(inputElement, getCursorFromRawLength(raw.length, config));
      }, 0);
    });

    inputElement.addEventListener("click", function () {
      moveCursorTo(inputElement, getCursorFromRawLength(raw.length, config));
    });

    inputElement.addEventListener("keydown", function (event) {
      if (!event) {
        return;
      }

      if (
        event.key === "Backspace" ||
        event.key === "Delete"
      ) {
        event.preventDefault();
        removeLastCharacter();
        render();
        return;
      }

      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "Home" ||
        event.key === "End"
      ) {
        event.preventDefault();
        moveCursorTo(inputElement, getCursorFromRawLength(raw.length, config));
      }
    });

    inputElement.addEventListener("beforeinput", function (event) {
      if (!event) {
        return;
      }

      var inputType = event.inputType || "";
      if (inputType.indexOf("delete") === 0) {
        event.preventDefault();
        removeLastCharacter();
        render();
        return;
      }

      if (event.isComposing || isComposing) {
        return;
      }

      if (inputType === "insertFromPaste") {
        event.preventDefault();
        return;
      }

      if (typeof event.data === "string" && event.data.length > 0) {
        event.preventDefault();
        appendFromText(event.data);
        render();
        return;
      }

      if (inputType) {
        event.preventDefault();
        render();
      }
    });

    inputElement.addEventListener("paste", function (event) {
      if (!event) {
        return;
      }

      event.preventDefault();
      var clipboardText = "";
      if (event.clipboardData && typeof event.clipboardData.getData === "function") {
        clipboardText = event.clipboardData.getData("text");
      } else if (
        window.clipboardData &&
        typeof window.clipboardData.getData === "function"
      ) {
        clipboardText = window.clipboardData.getData("Text");
      }
      appendFromText(clipboardText);
      render();
    });

    inputElement.addEventListener("compositionstart", function () {
      isComposing = true;
    });

    inputElement.addEventListener("compositionend", function (event) {
      isComposing = false;
      appendFromText(event && event.data ? event.data : "");
      render();
    });

    inputElement.addEventListener("input", function () {
      if (isComposing) {
        return;
      }

      syncRawFromInputValue();
      render();
    });

    var controller = {
      reset: function () {
        raw = "";
        render();
      },
      getRaw: function () {
        return raw;
      },
      getCode: function () {
        if (raw.length !== config.slots.length) {
          return "";
        }
        return formatCode(raw, config);
      },
    };

    inputElement.__verifyCodeController = controller;
    render();
    return controller;
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

  function toggleVisibleGroup(elements, isVisible) {
    if (!elements || !elements.length) {
      return;
    }

    for (var i = 0; i < elements.length; i += 1) {
      toggleVisible(elements[i], isVisible);
    }
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
    toggleVisibleGroup(infoTagGroup, isTagMode);
    toggleVisible(inputOrder, !isTagMode);
    toggleVisibleGroup(infoOrderGroup, !isTagMode);

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
      resetCodeInput(inputTag);
    }
    if (inputOrder) {
      inputOrder.blur();
      resetCodeInput(inputOrder);
    }
  }

  function searchByTagCode() {
    if (!inputTag) {
      return;
    }

    if (isTagSearching) {
      return;
    }

    var tagCode = getInputCode(inputTag, TAG_INPUT_CONFIG);
    var tagRawLength = getInputRawLength(inputTag, TAG_INPUT_CONFIG);

    if (!tagCode) {
      if (tagRawLength === 0) {
        setInfoMessage("Please enter a tag code.", true);
      } else {
        setInfoMessage("Invalid format. Use " + TAG_CODE_FORMAT + ".", true);
      }
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

    var orderCode = getInputCode(inputOrder, ORDER_INPUT_CONFIG);
    var orderRawLength = getInputRawLength(inputOrder, ORDER_INPUT_CONFIG);

    if (!orderCode) {
      if (orderRawLength === 0) {
        setInfoMessage("Please enter an order code.", true);
      } else {
        setInfoMessage("Invalid format. Use " + ORDER_CODE_FORMAT + ".", true);
      }
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
