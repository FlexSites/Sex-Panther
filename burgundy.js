var http = require('http');
var Hogan = require('hogan.js');
var Promise = Promise || require('bluebird');
var api = 'http://localapi.flexhub.io';
var url = require('url');
var requestCB = require('request');

var _ = require('lodash')
  , path = require('path')
  , fs = require('fs')
  , glob = require('glob')
  , async = require('async');

var templates = {};
var options = {
  delimiters: '[[ ]]',
  disableLambda: false
};

var flexDataPattern = /<!--\[flex\]>(.*?)<!\[flex\]-->/i;

module.exports = function(type){
  return function(req,res,next){
    Promise.all([
      getPageInfo(req.url, req.hostname),
      getPartials(req.hostname),
      getData(type, req.params.id, req.hostname)
    ])
      .then(function(results){

        if(flexDataPattern.test(results[0].content)){
          var flexData = results[0].content.match(flexDataPattern)[1];
          flexData = JSON.parse(flexData);
          return Promise.all(Object.keys(flexData).map(function(prop){
            return getData(prop, flexData[prop], req.hostname)
              .then(function(data){
                _.extend(results[2], data);
                return data;
              });
          }))
            .then(function(flexData){
              return results;
            });
        }
        return results;
      })
      .then(function(results){
        var template = results[1];
        var data = results[2];
        var content = '[[<layout]][[$content]]' + (results[0].content || '') + '[[/content]][[/layout]]';
        res.send(Hogan.compile(content, options).render(data, template));
      });
  };
};

function getPageInfo(path, host, cb){
  return callAPI('/pages?filter[where][url]='+path, host)
    .then(function(page){
      if(!page.templateUrl) return page;
      return callS3(page.templateUrl)
        .then(function(body){
          page.content = body;
          delete page.templateUrl;
          return page;
        });
    });
}

function getPartials(host){
  return callAPI('/template', host)
    .then(function(locations){
      return getPartial(host, locations.template)
        .then(function(tmpl){
          return {layout: tmpl};
        });
    });
}

function getPartial(key, path){
  if(templates[key]) return templates[key];
  return templates[key] = callS3(path)
    .then(function(file){
      return Hogan.compile(file, options);
    });
}

function getData(type, id, host){
  if(!type) return Promise.resolve({});
  return callAPI('/'+type+(id?'/'+id:''), host)
    .then(function(data){
      var obj = {};
      obj[type] = data;
      return obj;
    });
}

function callS3(path){
  return request({url: path});
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

function getConfig(config, pages) {

  config.env = env === 'prod'?'':env;
  config.siteId = config.id;
  config.styles = formatResource(config.styles, config);
  config.scripts = formatResource(config.scripts, config);

  // PAGES
  if (!Array.isArray(pages)) {
    pages = [];
  }
  pages.forEach(function(page, i) {
    pages[i] = _.pick(page, ['templateUrl', 'url', 'title', 'description']);
  });
  config.routes = JSON.stringify(pages);
  config.routesArray = pages;

  return config;
}

function formatResource(src, config) {
  if (_.isString(src)) {
    src = src.replace(/<<env>>/gi, config.env);
    src = src.replace(/<<baseHost>>/gi, config.host);
  } else if (_.isArray(src)) {
    _.each(src, function(resource, index) {
      src[index] = formatResource(resource, config);
    });
  }
  return src;
}

