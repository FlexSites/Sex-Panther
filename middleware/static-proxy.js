var httpProxy = require('http-proxy');

module.exports = function(){

  var isFile = /\.[a-z0-9]{2,4}$/;
  var proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    target: 'http://localcdn.flexsites.io'
  });

  return function(req,res,next){
    if(!isFile.test(req.url)) return next();
    var host = req.hostname;
    if(process.env.NODE_ENV !== 'prod'){
      host = removePrefix(host);
    }
    req.url = '/'+host+'/public'+req.url;
    proxy.web(req,res,{});
    proxy.on('error', next);
  };

  function removePrefix(url){
    if(/^(local|test)/.test(url)){
      url = /^(?:local|test)\.?(.*)$/.exec(url)[1];
    }
    return url;
  }
};
