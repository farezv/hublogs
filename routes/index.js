var express = require('express');
var router = express.Router();
var request = require('request');
var hubuser = require('../public/javascripts/hubuser');

var typoMessage = 'Oops, something went wrong! The GitHub user or organization name may not exist or you made a typo =(';
var hubsers;
var singleUserOrOrg;

/* GET home page. */
router.get('/', function(req, res) {
  res.render('main', { title: 'Like to read developer blogs but don\'t know where to start?' });
});

/* GET Blog results page. */
router.get('/blogs/:username?', function(req, res) {
	if(hubusers) {
		// printPropertyInList(hubusers, "blog");
		// printPropertyInList(hubusers, "nameOnProfile");
		res.render('blogs', { users: hubusers });
	} else res.render('blogs', { title: 'Couldn\'t find the blog link :('});
});

/* POST to Find Blogs */
router.post('/findblogs', function(req, res) {
	// Build the search url
	var searchUrl = 'https://api.github.com/users/' + req.body.username;
	console.log('searching user: ' + searchUrl);
	// Access the api and retrieve JSON for single user
	request({
			url: searchUrl,
			headers: {
				'User-Agent': 'farezv-hublogs'
			}
		}, function(error, response, body) {
				if(!error && response.statusCode == 200) {
					// Parse JSON to hubuser object instance
					hubusers = [];
					// Single user case
					if(JSON.parse(body).type == 'User') {
						var user = jsonToHubuser(body);
						hubusers.push(user);
						res.redirect('blogs/' + req.body.username);
					} 
					if(JSON.parse(body).type == 'Organization') {
						var user = jsonToHubuser(body);
						singleUserOrOrg = user;
						handleOrganizations(req.body.username, res);
					}
				} else {
					console.log(error);
					res.render('error', { message: typoMessage });
				}
			});	
	});

function apiRequest(searchUrl, res) {
	request({
			url: searchUrl,
			headers: {
				'User-Agent': 'farezv-hublogs'
			}
		}, function(error, response, body) {
				if(!error && response.statusCode == 200) {
					var user = jsonToHubuser(body);
					hubusers.push(user);
				} else {
					console.log(error);
					res.render('error', { message: typoMessage });
				}
			});
}

function jsonToHubuser(body) {
	var user = new hubuser(JSON.parse(body).login,
						   JSON.parse(body).avatar_url, 
						   JSON.parse(body).html_url,
						   JSON.parse(body).name,
						   JSON.parse(body).company,
						   JSON.parse(body).blog);
	user.blog = urlCleanup(user.blog);
	return user;
}

function handleOrganizations(name, res) {
	var searchUrl = 'https://api.github.com/orgs/' + name + '/members';
	console.log('searching organization: ' + searchUrl);

	request({
		url: searchUrl,
		headers: {
			'User-Agent': 'farezv-hublogs'
		}
	}, function(error, response, body) {
			if(!error && response.statusCode == 200) {
				hubusers = [];
				var members = JSON.parse(body);
				for(var i = 0; i < members.length; i++) {
					console.log(members[i].url);
					apiRequest(members[i].url, res);
					// Not stringifying each member json gave you unexpected 
					// handleUser(JSON.stringify(members[i]));
				}
				console.log(hubusers.length);
				hubusersFilled(name, res, members.length);
			} else {
				res.render('error', { message: typoMessage });
			}
	});
}

function hubusersFilled(name, res, num) {
	console.log('members: ' + num);
	// while(hubusers.length != num) {}
	res.redirect('blogs/' + name);
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

function printPropertyInList(list, propName) {
	for(var i = 0; i < list.length; i++) {
		console.log(list[i].propName);
	}
}

module.exports = router;
