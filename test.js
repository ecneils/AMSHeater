document.addEventListener("DOMContentLoaded", function() {
  // 弹框提示，确认JS加载成功
  alert("自定义JS加载成功！");

  // 在页面顶部插入一行自定义文字
  const banner = document.createElement("div");
  banner.style.cssText = "background:#4caf50;color:white;padding:10px;text-align:center;font-weight:bold;";
  banner.innerText = "✅ 自定义仪表盘注入测试成功";
  document.body.prepend(banner);
});