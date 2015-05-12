var express = require('express');
var API = require('./burgundy');
var util = require('./burgundy-util');
var app = express();

// app.use(require('./middleware/site-injector'));

app.get('/events/:id?', API('events'));
app.get('/pages/:id?', API('pages'));
app.get('/sites/:id?', API('sites'));
app.get('/venues/:id?', API('venues'));
app.get('/posts/:id?', API('posts'));

app.get('/sex-panther', function(req,res,next){
  util.clearTemplate(req.hostname);
  res.send({message: 'Template for site ' + req.hostname + ' cleared successfully'});
});
app.use(require('./middleware/static-proxy')());
app.use(require('./middleware/www-redirect')());

app.get('/*', API());

app.use(function(err, req, res, next){
  console.error(err);
  res.send(err);
});

var server = app.listen(process.env.PORT || 8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});
