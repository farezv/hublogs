var express = require('express');
var router = express.Router();
var request = require('request');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('hubuser', { title: 'Find a GitHub user\'s blog/website' });
});

/* GET Blog results page. */
router.get('/blogs/:blogUrl?', function(req, res) {
	if(req.params.blogUrl) {
		var blogUrl = req.params.blogUrl;
		console.log(blogUrl);
		res.render('blogs', { blogLink: blogUrl });
	} else res.render('blogs', { title: 'Couldn\'t find the blog link :('});
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
		// Parse the JSON to find blog url and clean it up
		if(!error && response.statusCode == 200) {
			var blogUrl = JSON.parse(body).blog;
			blogUrl = urlCleanup(blogUrl)
			blogUrl = encodeURIComponent(blogUrl);
			res.redirect('blogs/' + blogUrl);
		} else {
		// Deal with error case where url can't be found
			console.log(error);
			res.render('error', { title: 'Oops, something went wrong!'});
		}
	});	
});

function urlCleanup(url) {
	if(url.substring(0,5) == 'https') {
		url = url.substring(8);
		console.log(url);
	} else if(url.substring(0,4) == 'http') {
		url = url.substring(7);
		console.log(url);
	}
	if(url.substring(url.length - 1) == '/') {
		url = url.substring(0, url.length - 1);
	}
	return url;
}

module.exports = router;
