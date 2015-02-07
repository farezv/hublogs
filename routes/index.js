var express = require('express');
var router = express.Router();
var request = require('request');
var hubuser = require('../public/javascripts/hubuser');
var redis = require('redis');
var redisClient;

var typoMessage = 'Oops, something went wrong! The GitHub user or organization name may not exist or you made a typo =(';
var hubusers;
var singleUserOrOrg;

/* GET home page. */
router.get('/', function(req, res) {
    if (process.env.REDISCLOUD_URL) {
        var redisURL = require('url').parse(process.env.REDISCLOUD_URL);
        redisClient = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
        redisClient.auth(redisURL.auth.split(":")[1]);
    } else {
        redisClient = redis.createClient();
        redisClient.on('error', function (err) {
            console.log('Error ' + err);
        });
    }
  res.render('main', { title: 'Like to read developer blogs but don\'t know where to start?' });
});

/* GET Blog results page. */
router.get('/blogs/:username?', function(req, res) {
	if(hubusers) {
		res.render('blogs', { users: hubusers });
	} else res.render('blogs', { title: 'Couldn\'t find the blog link :('});
});

/* POST to Find Blogs */
router.post('/findblogs', function(req, res) {
  hubusers = [];

    // Check cache first
    redisClient.get(req.body.username, function(err, reply) {
        console.log('Redis says: ' + reply);

        if(err) console.log('Error around line 38: ' + err);

        if(reply == null) {
            // Build the search url
            var searchUrl = 'https://api.github.com/users/' + req.body.username;
            console.log('searching user: ' + searchUrl);
            // Access the api and retrieve JSON for single user
            request({
                    url: searchUrl,
                    headers: {
                        'User-Agent': 'farezv-hublogs'
                    }
            },  function(error, response, body) {
                    parseApiResponse(error, response, body, req.body.username, res);
                });
        } else {
            parseCacheReply(reply, req.body.username, res);
        }
    });
});

/* Handles response from redis cache */
function parseCacheReply(reply, username, res) {
    if(JSON.parse(reply).type == 'User') {
        var user = jsonToHubuser(reply);
        hubusers.push(user);
        res.redirect('blogs/' + username);
    } else {
        handleOrganizations(username, res);
    }
}

/* Handles api call result for initial search */
function parseApiResponse(error, response, body, username, res) {
        if(!error && response.statusCode == 200) {
            // Single user case
            if(JSON.parse(body).type == 'User') {
                redisClient.set(username, body, redis.print);
                var user = jsonToHubuser(body);
                hubusers.push(user);
                res.redirect('blogs/' + username);
            }
            if(JSON.parse(body).type == 'Organization') {
                redisClient.set(username, body, redis.print);
                var user = jsonToHubuser(body);
                singleUserOrOrg = user;
                handleOrganizations(username, res);
            }
        } else {
            console.log('Error around line 80: ' + error);
            res.render('error', { message: typoMessage });
        }
 }

/* Makes an api request for a single user  */
function apiRequest(searchUrl, res) {
    console.log('searching user: ' + searchUrl);

    request({
			url: searchUrl,
			headers: {
				'User-Agent': 'farezv-hublogs'
			}
		}, function(error, response, body) {
				if(!error && response.statusCode == 200) {
					var user = jsonToHubuser(body);
                    redisClient.set(user.login, body, redis.print);
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
                console.log('Length of members array is ' + members.length);
				for(var i = 0; i < members.length; i++) {
                    console.log('Member: ' + members[i].login);
                    getHubuserData(members[i], res);
                }
                res.redirect('blogs/' + name);
            } else {
				res.render('error', { message: typoMessage });
			}
	});
}

function getHubuserData(member, res) {
    // Check cache first
    redisClient.get(member.login, function(err, reply) {
        console.log('Redis says: ' + reply);
        if (reply == null) {
            apiRequest(member.url, res);
        } else {
            var user = jsonToHubuser(reply);
            hubusers.push(user);
        }
    });
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
