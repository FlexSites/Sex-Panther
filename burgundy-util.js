var Hogan = require('hogan.js')
  , Promise = Promise || require('bluebird')
  , querystring = require('querystring')
  , marked = require('marked')
  , requestAsync = Promise.promisify(require('request'));

var prefix = process.env.NODE_ENV || 'local';
if(prefix === 'prod') prefix = '';

var api = process.env.BURGUNDY || 'http://localapi.flexsites.io'
  , bucket = process.env.S3_BUCKET || 'http://localcdn.flexsites.io'
  , includeMedia = ['event', 'entertainer', 'venue', 'post', 'page']
  , isDynamic = /^\/(events|entertainers|venues|posts|media)\/*([a-f0-9]{24}\/*)*$/
  , templates = {}
  , options = {
  delimiters: '[[ ]]',
  disableLambda: false
};

module.exports = {
  getPage: getPage,
  getTemplate: getTemplate,
  clearTemplate: clearTemplate,
  getData: getData,
  getSiteFile: getSiteFile,
};

function getPage(path, host){
  var apiPath = isDynamic.test(path)?'dynamic-pages':'pages';
  path = path.replace(/[a-f0-9]{24}/,':id');
  return callAPI('/'+apiPath, host, {
    'filter[include]':'media',
    'filter[where][url]': path
  })
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

function getData(type, id, host){
  var isList = !id;
  if(!type) return Promise.resolve({});

  var filters = {};
  if(~includeMedia.indexOf(type)) filters['filter[include]'] = 'media';

  return callAPI('/'+type+(id?'/'+id:''), host, filters)
    .then(function(data){

      if(type === 'posts') {
        data = parseMarkdown('content', data);
        if(Array.isArray(data)) data = data.filter(function(post){
          return post.publishedDate && +new Date(post.publishedDate) < +new Date;
        });
      }
      else if(type === 'entertainers') data = parseMarkdown('description', data);

      var obj = {}, name = type.split('/').pop().split('?')[0];
      if(!isList) name = name.replace(/s$/,'').replace(/ia$/,'ium');
      obj[name] = data;
      return obj;
    });
}

function parseMarkdown(field, data){
  if(Array.isArray(data)) return data.map(parseMarkdown.bind(this, field));
  if(!data) return {};
  data[field] = marked(data[field]);
  return data;
}

function callAPI(path, host, filters){
  var headers = {};
  if(filters) path += '?' + querystring.stringify(filters);
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
