var httpProxy = require('http-proxy');

module.exports = function(){

  var isFile = /\.[a-z0-9]{2,4}$/;
  var proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    target: 'http://localcdn.flexsites.io'
  });

  return function(req,res,next){
    if(!isFile.test(req.url)) return next();
    req.headers.origin = 'http://'+req.hostname;
    proxy.web(req,res,{});
    proxy.on('error', next);
  };
};
