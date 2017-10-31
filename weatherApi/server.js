const express = require('express'),
  app = express(),
  port = process.env.PORT || 3010;

let routes = require('./api/routes/weatherRoutes'); //importing routes
routes(app); //register the route

app.use(function(req, res) {
  res.status(404).send({url: req.originalUrl + ' Ruta no encontrada'})
});

app.listen(port);
console.log('Weahter RESTful API server started on: ' + port);