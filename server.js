var express = require('express');
var API = require('./burgundy');
var s3 = require('./s3');
var request = require('request');
var httpProxy = require('http-proxy');
var app = express();

// app.use(require('./middleware/site-injector'));

app.get('/events/:id?', API('events'));
app.get('/pages/:id?', API('pages'));
app.get('/sites/:id?', API('sites'));
app.get('/venues/:id?', API('venues'));

app.use(require('./middleware/static-proxy')());

app.get('/*', API());

// app.use(function(req,res,next){
//   API.pages('?filter[where][siteId]='+req.site.id+'&filter[where][url]='+req.url)
//     .then(function(page){
//       page = page[0];
//       console.log('PAGE****', page);
//       return s3('/'+req.site.abbr+'/public'+page._templateUrl)
//         .then(function(file){
//           page.content = file.toString();
//           return page;
//         });
//     })
//     .then(res.send.bind(res));
// });
//



var server = app.listen(8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});
