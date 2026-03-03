// 本地媒体目录（优先使用）
// 通过仓库内软链接 local-media 同源访问，避免浏览器拦截 file:// 资源
window.LOCAL_ASSET_BASE_URL = "./local-media";

// 阿里云 OSS 公网地址（本地不可用时自动兜底）
window.ASSET_BASE_URL = "https://lazymice-vault.oss-cn-guangzhou.aliyuncs.com";
