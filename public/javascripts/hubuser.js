var hubuser = function HubUser(login, avatar_url, html_url, name, company, blog) {
	this.login = login;
	this.avatar = avatar_url;
	this.github = html_url;
	this.nameOnProfile = name;
	this.company = company;
	this.blog = blog;

	this.print = function() {
		console.log('Name: ' + this.nameOnProfile);
		console.log('GitHub: ' + this.github);
		console.log('Avatar: ' + this.avatar);
		console.log('Company: ' + this.company);
		console.log('Blog: ' + this.blog);
	}
}

module.exports = hubuser;