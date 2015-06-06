var util = require('../burgundy-util');

module.exports = function(item){
  return  util.parseMarkdown('description', item);
};
