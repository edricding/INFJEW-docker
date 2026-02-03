// 登录按钮事件监听
const loginSubmitBtn = document.getElementById("login-submit-btn");

function handleLogin() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!username || !password) {
    console.log("请输入用户名和密�?);
    return;
  }

  fetch("/api/AuthLogin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // 👈 允许携带 cookie
    body: JSON.stringify({ username: username, password: password }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Response data:", data);
      if (data.success) {
        console.log("Login successful");
        window.location.href = "https://dashboard.infjew.com";
      } else {
        console.log("Error:", data.message);
        document.getElementById("login-username").value = "";
        document.getElementById("login-password").value = "";
      }
    })
    .catch((err) => {
      console.error("Login error:", err);
    });
}

if (loginSubmitBtn) {
  // 点击按钮触发
  loginSubmitBtn.addEventListener("click", handleLogin);

  // 按下回车也触发（监听输入框）
  const usernameInput = document.getElementById("login-username");
  const passwordInput = document.getElementById("login-password");

  [usernameInput, passwordInput].forEach((input) => {
    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.keyCode === 13) {
          handleLogin();
        }
      });
    }
  });
}

// 登出按钮事件监听
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", function () {
    fetch("/api/AuthLogout", {
      method: "POST", // 使用 POST 方法
      headers: {
        "Content-Type": "application/json", // 设置请求头，指定内容格式�?JSON
      },
      credentials: "include", // 👈 允许携带 cookie
    })
      .then((response) => response.json()) // 解析 JSON 响应
      .then((data) => {
        if (data.success) {
          console.log("Logout successful");
          window.location.href = "/login";
          // 这里可以清除前端的用户状态，例如删除存储�?token 或清空用户信�?
        } else {
          console.log("Error:", data.message);
        }
      })
      .catch((err) => {
        console.error("Login error:", err);
      });
  });
}
