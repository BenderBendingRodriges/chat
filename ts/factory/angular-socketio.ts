module App.Factory {
  // var 
  "use strict"
  var vars = {}, hash;
  var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
  for(var i = 0; i < hashes.length; i++)
  {
      hash = hashes[i].split('=');
      // vars.push(hash[0]);
      vars[hash[0]] = hash[1];
  }
  var socket = io('http://chat-salago-chat.44fs.preview.openshiftapps.com/',{query:vars});
  // var socket = io('http://localhost:3000/',{query:vars});
  

  export interface ISocketIo{
      on(eventName:string,callback): void;
      emit(eventName:string,data:Object,callback): void;
  }
  export function SocketIoFactory($rootScope) :ISocketIo{

      return {
        on: function (eventName, callback) {
          socket.on(eventName, function () {  
            var args = arguments;
            $rootScope.$apply(function () {
              callback.apply(socket, args);
            });
          });
        },
        emit: function (eventName, data, callback) {
          socket.emit(eventName, data, function () {
            var args = arguments;
            $rootScope.$apply(function () {
              if (callback) {
                callback.apply(socket, args);
              }
            });
          })
        }
      };
  }
}
