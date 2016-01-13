var express = require('express'),
	_ = require('lodash'),
    points = require('./test_data/points.json'),
    points2 = require('./test_data/points2.json');
    
var app = express();

app.get('/points', function(req, res) {
	res.json(points);
});

app.get('/points/bounds', function(req, res) {
	res.json(_.filter(points.features, function(point) {
		return point.geometry.coordinates[0] > req.query.swLng &&
			point.geometry.coordinates[1] > req.query.swLat &&
			point.geometry.coordinates[0] < req.query.neLng &&
			point.geometry.coordinates[1] < req.query.neLat;
	}))
});

app.get('/points2', function(req, res) {
	res.json(points2);
});

app.get('/points2/bounds', function(req, res) {
	res.json(_.filter(points2.features, function(point) {
		return point.geometry.coordinates[0] > req.query.swLng &&
			point.geometry.coordinates[1] > req.query.swLat &&
			point.geometry.coordinates[0] < req.query.neLng &&
			point.geometry.coordinates[1] < req.query.neLat;
	}))
});

app.listen(9003, function() {
	console.log('Listening...');
});