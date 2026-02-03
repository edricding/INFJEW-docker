// 登录状态检查模�?
window.addEventListener("DOMContentLoaded", function () {
  fetch("/api/session/status", {
    method: "GET",
    credentials: "include", // 关键：带�?Cookie
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.loggedIn) {
        // 未登录，跳转回登录页
        window.location.href = "/login";
      } else {
        console.log("�?已登录用�?", data.username);
      }
    })
    .catch((err) => {
      console.error("�?Session 检查失�?", err);
      // 如果请求失败也跳转（比如服务挂了�?
      window.location.href = "/login";
    });
});
