module.exports = function(app){

    app.get('/login', function(req, res){
        res.render('login', {
            title: 'Express Login'
        });
    });
    app.get('/', function(req, res){
	  res.sendFile(__dirname + '/index.html');

	  // cookieString = req.headers.cookie;
	});
	app.get('/app.js', function(req, res){
	  res.sendFile(__dirname + '/app.js');
	});
    //other routes..
}