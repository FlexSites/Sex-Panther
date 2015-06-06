var utils = require('../burgundy-util');

module.exports = function(item){
  item = utils.parseMarkdown('content', item);
  if(Array.isArray(item)) item = item.filter(function(post){
    return post.publishedDate && +new Date(post.publishedDate) < +new Date;
  });
};
