// 本地媒体目录（优先使用）
// 仅在本地开发环境启用，避免 GitHub Pages 请求不存在的 local-media 路径
(() => {
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local");
  const isLocalPage = protocol === "file:";
  window.LOCAL_ASSET_BASE_URL = isLocalHost || isLocalPage ? "./local-media" : "";
})();

// 阿里云 OSS 公网地址（本地不可用时自动兜底）
window.ASSET_BASE_URL = "https://lazymice-vault.oss-cn-guangzhou.aliyuncs.com";
