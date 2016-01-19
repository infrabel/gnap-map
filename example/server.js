var express = require('express'),
	_ = require('lodash'),
    points = require('./test_data/points.json'),
    points2 = require('./test_data/points2.json');
    
var app = express();

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.get('/points', function(req, res) {
	res.json(points);
});

app.get('/points/bounds', function(req, res) {
	res.json(convertArrayOfFeaturesToFeatureCollection(_.filter(points.features, function(point) {
		return point.geometry.coordinates[0] > req.query.swLng &&
			point.geometry.coordinates[1] > req.query.swLat &&
			point.geometry.coordinates[0] < req.query.neLng &&
			point.geometry.coordinates[1] < req.query.neLat;
	})));
});

app.get('/points2', function(req, res) {
	res.json(points2);
});

app.get('/points2/bounds', function(req, res) {
	res.json(convertArrayOfFeaturesToFeatureCollection(_.filter(points2.features, function(point) {
		return point.geometry.coordinates[0] > req.query.swLng &&
			point.geometry.coordinates[1] > req.query.swLat &&
			point.geometry.coordinates[0] < req.query.neLng &&
			point.geometry.coordinates[1] < req.query.neLat;
	})));
});

app.get('/random/bounds', function(req, res) {
	var points = _.range(20).map((x, i) => generatePointFeature(
		_.random(Number(req.query.swLat), Number(req.query.neLat), true),
		_.random(Number(req.query.swLng), Number(req.query.neLng), true),
		'random',
		"random_" + i
	));
	
	res.json(convertArrayOfFeaturesToFeatureCollection(points));
});

app.listen(9003, function() {
	console.log('Listening...');
});

function convertArrayOfFeaturesToFeatureCollection(arrayOfFeatures) {
	return {
		"type": "FeatureCollection",
		"features": arrayOfFeatures,
	};
}

function generatePointFeature(lat, lng, type, id, label) {
	return {
		"id": id, 
		"type": "Feature",
		"properties": { 
			"label": label,
			"type": type
		},"geometry": {
			"type": "Point",
			"coordinates": [lng,lat]
		}
	};
}