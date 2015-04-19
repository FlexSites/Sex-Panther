var Hogan = require('hogan.js')
  , Promise = Promise || require('bluebird')
  , requestCB = require('request');

var api = 'http://localapi.flexhub.io'
  , isDynamic = /^\/(events|entertainers|venues|posts)\/*([a-f0-9]{24}\/*)*$/
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
      return request({url: page.templateUrl})
        .then(function(body){
          page.content = body;
          delete page.templateUrl;
          return page;
        });
    });
}

function getTemplate(host){
  if(templates[host]) return templates[host];
  var promise = callAPI('/template', host)
    .then(function(locations){
      return request({url: locations.template})
        .then(function(file){
          return {layout: Hogan.compile(file, options)};
        });
    });
  if(process.env.NODE_ENV === 'prod'){
    templates[host] = promise;
  }
  return promise;
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
      if(err) return reject(err);
      resolve(body);
    });
  });
}
