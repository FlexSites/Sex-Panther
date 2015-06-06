var Hogan = require('hogan.js')
  , Promise = Promise || require('bluebird')
  , marked = require('marked')
  , glob = require('glob')
  , path = require('path')
  , requestAsync = Promise.promisify(require('request'));

var prefix = process.env.NODE_ENV || 'local';
if(prefix === 'prod') prefix = '';

var api = process.env.BURGUNDY || 'http://localapi.flexsites.io'
  , bucket = process.env.S3_BUCKET || 'http://localcdn.flexsites.io'
  , isDynamic = /^\/(events|entertainers|venues|posts|media)\/*([a-f0-9]{24}\/*)*/
  , templates = {}
  , filterMap = require('./filters.json')
  , options = {
  delimiters: '[[ ]]',
  disableLambda: false
};

var formatters = glob.sync(path.join(__dirname, 'formatters/**')).reduce(function(prev, curr){
  var name = curr.split('/').pop(), idx = name.indexOf('.');
  if(!~idx) return prev;
  prev[name.substr(0, idx)] = require(curr);
  return prev;
}, {});

module.exports = {
  getPage: getPage,
  getTemplate: getTemplate,
  clearTemplate: clearTemplate,
  getData: getData,
  getSiteFile: getSiteFile,
  parseMarkdown: parseMarkdown,
};

function getPage(path, host){
  var apiPath = isDynamic.test(path)?'dynamic-pages':'pages';

  path = path.replace(/[a-f0-9]{24}.*/,':id');
  return callAPI('/'+apiPath, host, [
    'filter[include]=media',
    'filter[where][url]=' + path
  ])
    .then(function(page){
      if(!page.templateUrl) return page;
      return getSiteFile(page.templateUrl, host)
        .then(function(body){

          // Parse Markdown
          if(page.format === 'MarkDown') body = marked(body);

          page.content = body;
          delete page.templateUrl;
          page.path = path.substr(1,path.length-1);
          return page;
        });
    });
}

function clearTemplate(host){
  delete templates[host];
}

function getTemplate(host){
  if(templates[host]) return templates[host];
  var promise = getSiteFile('/index.html', host)
    .then(function(file){
      return {layout: Hogan.compile(file, options)};
    });
  if(process.env.NODE_ENV === 'prod'){
    templates[host] = promise;
  }
  return promise;
}

function getSiteFile(path, host){
  return request({url: bucket + '/' + removePrefix(host) + '/public' + path});
}

function removePrefix(url){
  return /^(?:https?:\/\/)?(?:www|local|test)?\.?(.*)$/.exec(url)[1];
}

function formatter(type, data){
  var fn = formatters[type];
  if(!fn) return data;
  if(Array.isArray(data)) return data.map(fn);
  return fn(data);
}

function getData(type, id, host){
  var isList = !id;
  if(!type) return Promise.resolve({});

  var filters = filterMap[type] || [];

  return callAPI('/'+type+(id?'/'+id:''), host, filters)
    .then(function(data){
      var obj = {}, name = type.split('/').pop().split('?')[0];
      if(!isList) name = name.replace(/s$/,'').replace(/ia$/,'ium');
      obj[name] = formatter(type, data);
      return obj;
    });
}

function parseMarkdown(field, data){
  if(!data) return {};
  data[field] = marked(data[field]);
  return data;
}

function callAPI(path, host, filters){
  var headers = {};
  if(filters) path += '?' + filters.join('&');
  if(host) headers.origin = 'http://'+host;
  return request({
    url: api+path,
    headers: headers
  }).then(function(body){
    if(!body) return;
    var val = JSON.parse(body);
    if(Array.isArray(val) && val.length === 1){
      return val[0];
    }
    return val;
  });
}

function request(opts){
  return requestAsync(opts)
    .spread(function(res, body){
      if(res.statusCode === 404) return '';
      if(res.statusCode > 399){
        var err = new Error();
        err.status = res.statusCode;
        throw err;
      }
      return body;
    });
}
