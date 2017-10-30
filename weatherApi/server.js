const express = require('express'),
  app = express(),
  port = process.env.PORT || 3011;
//   bodyParser = require('body-parser');
//
//
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

let routes = require('./api/routes/weatherRoutes'); //importing routes
routes(app); //register the route

app.use(function(req, res) {
  res.status(404).send({url: req.originalUrl + ' Ruta no encontrada'})
});

app.listen(port);
console.log('todo list RESTful API server started on: ' + port);