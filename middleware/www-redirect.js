/**
 * Redirect all requests with a host beginning with www => non-www version
 */
module.exports = function(){
  var isNotApex = /^.*\..*\..*$/;
  return function(req,res,next){
    if (!isNotApex.test(req.get('Host'))) {
      return res.redirect(301, req.protocol + '://www.' + req.hostname + req.url);
    }
    next();
  };
};
