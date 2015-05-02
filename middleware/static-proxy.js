var httpProxy = require('http-proxy');

module.exports = function(){

  var isFile = /\.[a-z0-9]{2,4}$/;
  var proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    target: process.env.S3_BUCKET || 'http://localcdn.flexsites.io'
  });

  return function(req,res,next){
    if(!isFile.test(req.url)) return next();

    var host = removePrefix(req.hostname);
    req.url = '/'+host+'/public'+req.url;
    proxy.web(req,res,{});
    proxy.on('error', next);
  };

  function removePrefix(url){
    return /^(?:https?:\/\/)?(?:www|local|test)?\.?(.*)$/.exec(url)[1];
  }
};
