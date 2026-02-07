;(function (window) {
  "use strict";

  var stage = document.getElementById("verify-card-stack");
  var panel = document.getElementById("verify-search-panel");
  var form = panel ? panel.querySelector(".verify-search-panel__form") : null;
  var input = document.getElementById("verify-search-input");
  var info = document.getElementById("verify-search-info");
  var openTagBtn = document.getElementById("go-verify-tag-btn");
  var openOrderBtn = document.getElementById("go-verify-order-btn");
  var closeBtn = document.getElementById("verify-search-close-btn");

  function setSearchMode(mode) {
    if (!input || !info) {
      return;
    }

    if (mode === "tag") {
      input.placeholder = "Find by tag code...";
      info.textContent = "Hit enter to search tag code or ESC to close";
      return;
    }

    input.placeholder = "Find by order code...";
    info.textContent = "Hit enter to search order code or ESC to close";
  }

  function openSearch(mode) {
    if (!stage || !panel || !input) {
      return;
    }

    setSearchMode(mode);
    stage.classList.add("is-shifted");
    panel.classList.add("is-open");
    input.focus();
  }

  function closeSearch() {
    if (!stage || !panel || !input) {
      return;
    }

    stage.classList.remove("is-shifted");
    panel.classList.remove("is-open");
    input.blur();
    input.value = "";
  }

  function bindEvents() {
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
      });
    }

    document.addEventListener("keyup", function (event) {
      if (event.key === "Escape" || event.keyCode === 27) {
        closeSearch();
      }
    });
  }

  bindEvents();
})(window);
