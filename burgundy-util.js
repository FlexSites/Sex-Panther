var Hogan = require('hogan.js')
  , Promise = Promise || require('bluebird')
  , requestCB = require('request');

var api = 'http://localapi.flexhub.io'
  , bucket = process.env.S3_BUCKET || 'http://localcdn.flexsites.io'
  , isDynamic = /^\/(events|entertainers|venues|posts|media)\/*([a-f0-9]{24}\/*)*$/
  , templates = {}
  , options = {
  delimiters: '[[ ]]',
  disableLambda: false
};

module.exports = {
  getPage: getPage,
  getTemplate: getTemplate,
  getData: getData,
};

function getPage(path, host){
  var apiPath = isDynamic.test(path)?'dynamic-pages':'pages';
  path = path.replace(/[a-f0-9]{24}/,':id');
  return callAPI('/'+apiPath+'?filter[where][url]='+path, host)
    .then(function(page){
      if(!page.templateUrl) return page;
      return request({url: getSiteFile(page.templateUrl, host)})
        .then(function(body){
          page.content = body;
          delete page.templateUrl;
          return page;
        });
    });
}

function getTemplate(host){
  if(templates[host]) return templates[host];
  var promise = request({url: getSiteFile('/index.html', host)})
    .then(function(file){
      return {layout: Hogan.compile(file, options)};
    });
  if(process.env.NODE_ENV === 'prod'){
    templates[host] = promise;
  }
  return promise;
}

function getSiteFile(path, host){
  return bucket + '/' + removePrefix(host) + '/public' + path;
}

function removePrefix(url){
  if(/(local|test)/.test(url)){
    url = /^(?:https?:\/\/)?(?:local|test)\.?(.*)$/.exec(url)[1];
  }
  return url;
}

function getData(type, id, host){
  var isList = !id;
  if(!type) return Promise.resolve({});
  return callAPI('/'+type+(id?'/'+id:''), host)
    .then(function(data){
      var obj = {}, name = type.split('/').pop();
      if(!isList) name = name.replace(/s$/,'').replace(/ia$/,'ium');
      obj[name] = data;
      return obj;
    });
}

function callAPI(path, host){
  return request({
    url: api+path,
    headers: {
      origin: 'http://'+host
    }
  }).then(function(body){
    var val = JSON.parse(body);
    if(Array.isArray(val) && val.length === 1){
      return val[0];
    }
    return val;
  });
}

function request(opts){
  return new Promise(function(resolve, reject){
    requestCB(opts, function(err, res, body){
      if(res.statusCode === 404)return resolve('');
      if(res.statusCode > 399){
        err = new Error();
        err.status = res.statusCode;
        return reject(err);
      }
      if(err) return reject(err);
      resolve(body);
    });
  });
}
