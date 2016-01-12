var express = require('express'),
	_ = require('lodash'),
    stations = require('./test_data/stations.json');
    
var app = express();

app.get('/stations', function(req, res) {
	res.json(stations);
});

app.get('/stations/bounds', function(req, res) {
	res.json(_.filter(stations.features, function(station) {
		return station.geometry.coordinates[0][0] > req.query.swLng &&
			station.geometry.coordinates[0][1] > req.query.swLat &&
			station.geometry.coordinates[0][0] < req.query.neLng &&
			station.geometry.coordinates[0][0] < req.query.neLat;
	}))
})

app.listen(9003, function() {
	console.log('Listening...');
});