var hubuser = function HubUser(avatar_url, html_url, name, company, blog) {
	this.avatar = avatar_url;
	this.github = html_url;
	this.nameOnProfile = name;
	this.company = company;
	this.blog = blog; 
}

module.exports = hubuser;