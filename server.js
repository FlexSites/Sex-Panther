var express = require('express');
var API = require('./burgundy');
var app = express();

// app.use(require('./middleware/site-injector'));

app.get('/events/:id?', API('events'));
app.get('/pages/:id?', API('pages'));
app.get('/sites/:id?', API('sites'));
app.get('/venues/:id?', API('venues'));
app.get('/posts/:id?', API('posts'));

app.use(require('./middleware/static-proxy')());

app.get('/*', API());

var server = app.listen(8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});
