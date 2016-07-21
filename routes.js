var ejs = require('ejs');
module.exports = function(app){

    app.get('/login', function(req, res){
        res.render('login', {
            title: 'Express Login'
        });
    });
    app.get('/', function(req, res){
    // console.log(req.headers.host);
        // res.sendFile(__dirname + '/index.html');
        ejs.renderFile(__dirname + '/index.html', {host:req.headers.host}, {}, function(err, str){
            res.send(str);
        });
    });
	app.get('/app.js', function(req, res){
	  res.sendFile(__dirname + '/app.js');
	});
    //other routes..
}