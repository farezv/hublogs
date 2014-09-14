var express = require('express');
var router = express.Router();
var request = require('request');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('hubuser', { title: 'Find a GitHub user\'s blog' });
});

/* GET Blog results page. */
router.get('/blogs', function(req, res) {
	res.render('blogs', { title: 'Here\'s the blog link!'})
});

/* POST to Find Blogs */
router.post('/findblogs', function(req, res) {
	// Build the search url
	var searchUrl = 'https://api.github.com/users/' + req.body.username;
	console.log('searchUrl: ' + searchUrl);
	// Access the api and retrieve the JSON
	request({
			url: searchUrl,
			headers: {
				'User-Agent': 'request'
			}
		}, function(error, response, body) {
	// Parse the JSON to find blog url
		if(!error && response.statusCode == 200) {
			console.log(JSON.parse(body));
			res.location('blogs');
			res.redirect('blogs');
		} else {
			// Deal with error case where url can't be found
			console.log(error);
			res.render('error', { title: 'Oops, something went wrong!'});
		}
	});	
	// Present the url


});

module.exports = router;
