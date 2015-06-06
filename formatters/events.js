var moment = require('moment');

module.exports = function(item){
  if(item.showtimes){
    var format = 'MMM. D', str = moment(item.showtimes[0]).format(format);
    if(item.showtimes.length>1){
      str += '-' + moment(item.showtimes[item.length-1]).format(format);
    }
    item.range = str;
  }
  return item;
};
