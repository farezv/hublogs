var express = require('express');
var router = express.Router();
var request = require('request');
var hubuser = require('../public/javascripts/hubuser');

var hubsers;

/* GET home page. */
router.get('/', function(req, res) {
  res.render('main', { title: 'Find a GitHub user\'s blog/website' });
});

/* GET Blog results page. */
router.get('/blogs/:username?', function(req, res) {
	if(hubusers) {
		res.render('blogs', { users: hubusers });
	} else res.render('blogs', { title: 'Couldn\'t find the blog link :('});
});

/* POST to Find Blogs */
router.post('/findblogs', function(req, res) {
	// Build the search url
	var searchUrl = 'https://api.github.com/users/' + req.body.username;
	console.log('searching user: ' + searchUrl);
	// Access the api and retrieve the JSON
	request({
			url: searchUrl,
			headers: {
				'User-Agent': 'request'
			}
		}, function(error, response, body) {
				// Parse JSON to hubuser object instance
				if(!error && response.statusCode == 200) {
					hubusers = [];
					// Single user case
					if(JSON.parse(body).type == 'User') {
						handleUser(body);
						res.redirect('blogs/' + req.body.username);
					} 
					if(JSON.parse(body).type == 'Organization') {
						handleOrganizations(req.body.username, res);
					}
				} else {
				// Deal with error case where url can't be found
					console.log(error);
					res.render('error', { message: 'Oops, something went wrong! The GitHub user or organization name may not exist or you made a typo =('});
				}
			});	
	});

function handleUser(body) {
	var user = new hubuser(JSON.parse(body).avatar_url, 
						   JSON.parse(body).html_url,
						   JSON.parse(body).name,
						   JSON.parse(body).company,
						   JSON.parse(body).blog);
	user.blog = urlCleanup(user.blog);
	hubusers.push(user);
}

function handleOrganizations(name, res) {
	var searchUrl = 'https://api.github.com/orgs/' + name + '/members';
	console.log('searching organization: ' + searchUrl);

	request({
		url: searchUrl,
		headers: {
			'User-Agent': 'request'
		}
	}, function(error, response, body) {
			if(!error && response.statusCode == 200) {
				hubusers = [];
				var members = JSON.parse(body);
				for(var i = 0; i < members.length; i++) {
					// Not stringifying each member json gave you unexpected 
					handleUser(JSON.stringify(members[i]));
				}
				res.redirect('blogs/');
			} else {
				res.render('error', { message: 'Oops, something went wrong! The GitHub user or organization name may not exist or you made a typo =('});
			}
	});
}

function encodeURIComponents(user) {
	user.avatar = encodeURIComponent(user.avatar);
	user.github = encodeURIComponent(user.github);
	user.nameOnProfile = encodeURIComponent(user.nameOnProfile);
	user.company = encodeURIComponent(user.company);
	user.blog = encodeURIComponent(user.blog);
	return user;
}

function urlCleanup(url) {
	if (url) {
		if(url.substring(0,5) == 'https') {
			url = url.substring(8);
		} else if(url.substring(0,4) == 'http') {
			url = url.substring(7);
		}
		if(url.substring(url.length - 1) == '/') {
			url = url.substring(0, url.length - 1);
		}
		return url;
	}
}

module.exports = router;
