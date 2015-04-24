var Hogan = require('hogan.js')
  , Promise = Promise || require('bluebird')
  , _ = require('lodash')
  , util = require('./burgundy-util');

var flexDataPattern = /<!--\[flex\]>(.*?)<!\[flex\]-->/i
  , options = {
  delimiters: '[[ ]]',
  disableLambda: false
};

module.exports = function(type){
  return function(req,res,next){
    Promise.all([
      util.getPage(req.url, req.hostname),
      util.getTemplate(req.hostname),
      util.getData(type, req.params.id, req.hostname)
    ])
      .then(function(results){
        console.log('RESULTS', results.length);
        if(flexDataPattern.test(results[0].content)){
          var flexData = results[0].content.match(flexDataPattern)[1];
          flexData = JSON.parse(flexData);
          return Promise.all(Object.keys(flexData).map(function(prop){
            return util.getData(prop, flexData[prop], req.hostname)
              .then(function(data){
                _.extend(results[2], data);
                return data;
              });
          }))
            .then(function(){
              return results;
            });
        }
        return results;
      })
      .then(function(results){

        console.log('RESULTS2', results.length);
        var template = results[1];
        var data = results[2];
        var include = includeTemplate.bind(this, results[0]);
        var content = '[[<layout]]';
        content += include('title');
        content += include('description');
        content += include('content');
        content += '[[/layout]]';
        res.send(Hogan.compile(content, options).render(data, template));
      })
      .catch(next);
  };
};

function includeTemplate(page, prop){
  if(page[prop]) return '[[$'+prop+']]' + page[prop] + '[[/'+prop+']]';
  return '';
}
