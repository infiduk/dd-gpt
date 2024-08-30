const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: process.env.REACT_APP_CONFLUENCE_URL,
      changeOrigin: true,
      pathRewrite: {
        "^/api": "" // '/api' 경로를 제거하고 실제 경로로 대체
      }
    })
  );
};
