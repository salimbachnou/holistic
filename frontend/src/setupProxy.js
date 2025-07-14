const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  console.log('Setting up proxy middleware...');

  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://hamza-aourass.ddns.net:5001',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      pathRewrite: { '^/api': '/api' },
      onError: (err, req, res) => {
        console.log('Proxy Error:', err);
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying request:', req.method, req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('Proxy response:', proxyRes.statusCode, req.url);
      },
    })
  );
};
