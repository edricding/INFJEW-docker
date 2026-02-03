(function () {
  var loginSubmitBtn = document.getElementById("login-submit-btn");

  function handleLogin() {
    var usernameEl = document.getElementById("login-username");
    var passwordEl = document.getElementById("login-password");
    var username = (usernameEl && usernameEl.value ? usernameEl.value : "").trim();
    var password = (passwordEl && passwordEl.value ? passwordEl.value : "").trim();

    if (!username || !password) {
      return;
    }

    fetch("/api/AuthLogin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ username: username, password: password }),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data && data.success) {
          window.location.href = "https://dashboard.infjew.com";
          return;
        }
        if (usernameEl) usernameEl.value = "";
        if (passwordEl) passwordEl.value = "";
      })
      .catch(function () {});
  }

  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener("click", handleLogin);

    var usernameInput = document.getElementById("login-username");
    var passwordInput = document.getElementById("login-password");

    [usernameInput, passwordInput].forEach(function (input) {
      if (input) {
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.keyCode === 13) {
            handleLogin();
          }
        });
      }
    });
  }

  var logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      fetch("/api/AuthLogout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          if (data && data.success) {
            window.location.href = "/login";
          }
        })
        .catch(function () {});
    });
  }
})();