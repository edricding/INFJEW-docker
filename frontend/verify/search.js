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

    var tagCode = inputTag.value.trim();
    if (tagCode === "") {
      setInfoMessage("Please enter a tag code.", true);
      return;
    }

    setInfoMessage("Searching...", false);

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
      });
  }

  function handleSearchSubmit() {
    if (currentMode === "tag") {
      searchByTagCode();
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

    inputElement.addEventListener("search", function (event) {
      event.preventDefault();
      handleSearchSubmit();
    });
  }

  function bindEvents() {
    setSearchMode("tag");

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

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key !== "Enter" && event.keyCode !== 13) {
          return;
        }
        if (!panel || !panel.classList.contains("is-open")) {
          return;
        }

        var active = document.activeElement;
        if (active !== inputTag && active !== inputOrder) {
          return;
        }

        event.preventDefault();
        handleSearchSubmit();
      },
      true
    );
  }

  bindEvents();
})(window);
