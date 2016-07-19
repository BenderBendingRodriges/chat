var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
var io = require('socket.io')(server);
var path = require('path');
var co = require("./cookie.js");
var cookieString = null;
var querystring = require('querystring');
require('./routes')(app);

Array.prototype.inArray = function(comparer) { 
    for(var i=0; i < this.length; i++) { 
        if(comparer(this[i])) return true; 
    }
    return false; 
}; 

// adds an element to the array if it does not already exist using a comparer 
// function
Array.prototype.pushIfNotExist = function(element, comparer) { 
    if (!this.inArray(comparer)) {
        this.push(element);
    }
}; 


app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '/chat-template')));
app.use(express.static(path.join(__dirname, '/node_modules')));
app.use(express.static(path.join(__dirname, '/js')));


var clients = {};
var admins = [];
// var messages = [];
var rooms = {};

var cookies;
var getRooms = function(client,callback){
  // console.log(cookies);
    var req = http.request({
      host: 'salago.local',
      port: 80,
      path: '/rest/chat.rooms',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
        'Cookie': client.cookies,
        'Accept': '/',
        'Connection': 'keep-alive'
      }
    }, function(res) {
      var body = '';
      res.on('data', function (chunk) {
        body += chunk;
      });
      res.on('end',function(){
        var _rooms = JSON.parse(body);     
        for(var i=0; i < _rooms.length; i++) { 
            // console.log(typeof rooms[_rooms[i].id]);
            if(typeof rooms[_rooms[i].id] != 'undefined')
            {
              // console.log("FOUND",_rooms[i].id);
              _rooms[i] = rooms[_rooms[i].id];
            }
        }
        client.roomsWatching = _rooms;
        callback(client.roomsWatching);
      })
      
    });
    req.end();
}
io.on('connection', function(socket){
  clients[socket.id] = {
      user : {},
      socket : socket
  };
  socket.on('login admin',function(cookieString,fn){
     clients[socket.id].cookies = cookieString;
     var options = {
      host: 'salago.local',
      port: 80,
      path: '/rest/me',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
        'Cookie': cookieString,
        'Accept': '/',
        'Connection': 'keep-alive'
      }
    };

    var req = http.request(options, function(res) {
      var userData = '';
      res.on('data', function (chunk) {
        userData += chunk;
      });
      res.on('end',function(){
        var jsonData = JSON.parse(userData);
        clients[socket.id].user = jsonData;
        getRooms(clients[socket.id],function(result){
          // console.log(result);
            fn(result);
        });
        
        // fn(Object.keys(rooms).map(function (key) {return rooms[key]}));
      })
      
    });
    req.end();
  });
  socket.on('login',function(data){
     cookies = data.cookies;
     var post_data = JSON.stringify(data.options);
     var options = {
      host: 'salago.local',
      port: 80,
      path: '/rest/chat.room',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
        'Cookie': data.cookies,
        'Accept': '/',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(post_data)
      }
    };

    var req = http.request(options, function(res) {
      var userData = '';
      res.on('data', function (chunk) {
        userData += chunk;
      });
      res.on('end',function(){
        var jsonData = JSON.parse(userData);
        var room = jsonData.room;
        clients[socket.id].user = jsonData.user;
        socket.emit('chat hello', {user : clients[socket.id].user, room : room},function(){

        });
        socket.emit('chat message', room.messages);
        


        if(typeof rooms[room.id] == 'undefined'){
            rooms[room.id] = room;  
            rooms[room.id].users = [];
            if(!rooms[room.id].client)
            rooms[room.id].client =  clients[socket.id].user;
        }
        // console.log('ROOM',room.id,clients[socket.id].user.id)
        // rooms[room.id].users.pushIfNotExist( clients[socket.id].user,function(e) {return e.id === clients[socket.id].user.id;});
        socket.join(room.id);
        console.log(room.id);
        clients[socket.id].room = rooms[room.id];
        // socket.emit('chat rooms', 5);
        // var array = Object.keys(rooms).map(function (key) {return rooms[key]});
      })
      
    });
   
    req.write(post_data);
    req.end();
  });
  var notifyAdmins = function(){
      // console.log(clients);
      for (var socketId in clients) {
          io.sockets.connected[socketId].emit('chat admin rooms', clients[socketId].roomsWatching);
      }
  }
  var newMessage = function(content,type){
      var msg = {
          id : clients[socket.id].room.messages.length+1,
          content : content,
          user : clients[socket.id].user,
          timestamp : Date.now(),
          type: type,
          readed:true,
          usersReaded : []
      }
      clients[socket.id].room.lastMessage = msg.timestamp;
      clients[socket.id].room.messages.push(msg);
      
      // io.emit('chat message', clients[socket.id].room.messages);
      var post_data = JSON.stringify({
          room : clients[socket.id].room.id,
          user : clients[socket.id].user.id,
          content : content,
          type: type
      });
      var req = http.request({
          host: 'salago.local',
          port: 80,
          path: '/rest/chat',
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(post_data)
          }
      }, function(res) {
          var responseBody = '';
          res.on('data', function (chunk) {
              responseBody += chunk;          
          });
          res.on('end',function(){
              var dBmsg = JSON.parse(responseBody);
              msg.id = dBmsg.id;
              // console.log(clients[socket.id].room.id);
              // io.to(clients[socket.id].room.id).emit('chat message', clients[socket.id].room.messages);
              io.to(clients[socket.id].room.id).emit('chat message', [msg]);
              notifyAdmins();
              //io.emit('chat admin rooms', Object.keys(rooms).map(function (key) {return rooms[key]}));
          })
      
      });
      req.write(post_data);
      req.end();
  }
 
  socket.on('disconnect', function(){
    delete clients[socket.id];
  });
  socket.on('chat message', function(msg,fn){
    newMessage(msg,'text');
    return "TEST";
  });
  socket.on('chat screen', function(msg){newMessage(msg,'screen');});
  socket.on('chat readed', function(data){
      var index = clients[socket.id].room.messages.map(function(m){return m.id;}).indexOf(data.id);      
      if(index > -1){ 
        // console.log();        
        clients[socket.id].room.messages[index].usersReaded.pushIfNotExist(data.user,function(e) {return e.id === data.user.id});
        socket.broadcast.emit('chat readed', data);     
        io.to(clients[socket.id].room.id).emit('chat message', [clients[socket.id].room.messages[index]]);     
      }
  });

});

server.listen(8080, function(){
  console.log('listening on *:3000');
});