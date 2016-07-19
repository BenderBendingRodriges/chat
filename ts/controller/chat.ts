/// <reference path='../factory/angular-socketio.ts' />

module App.Controller {
	"use strict"

	export interface IUser{
		id:number,
	}
	export interface IMessage{
		id:number,
		content : string,
    	user : IUser,
    	my : boolean,
    	readed : boolean,
    	type: string,
    	timestamp: number,
    	usersReaded : Array<IUser>
	}
	export class Message implements IMessage{
		public constructor(private data:IMessage, private user:IUser){
			// this.data.readed = false;
			this.data.readed = this.usersReadedIds.indexOf(user.id) > -1;
			// console.log(this.usersReadedIds.indexOf(user.id));
		}
		public get id():number {return this.data.id};
		public get content():string {return this.data.content};
		public get my():boolean {return this.data.user.id == this.user.id;};
		public get type():string {return this.data.type};
		public get timestamp():number {return this.data.timestamp};
		public get usersReaded():Array<IUser> {return this.data.usersReaded};
		public set usersReaded(arr:Array<IUser>) {this.data.usersReaded = arr};
		public get usersReadedIds():Array<number> {return this.data.usersReaded.map(function(u){return u.id;})};
		public get readed():boolean {return this.data.readed};
		public set readed(val:boolean) {

			this.data.readed = val;
		};

	}
	export class ChatCtrl {
		// static $inject: Array<string> = ['$scope,', '$rootScope', 'SocketIo'];
		// 
		private addMessages(messages : Array<IMessage>) : void{
			// this.$scope.messages = [];
			for(var k in messages)
				this.addMessage(messages[k]);


			this.$timeout(function(){
				$('.direct-chat-messages')
					.stop(true,false)
					.animate({
        				scrollTop: $('.direct-chat-messages > div').height()
        			}, 1000);
        		// console.log($('.direct-chat-messages > div').height());
    		},500);
		}
		private addMessage(msg : IMessage) : void{
			if(!this.$scope.user || typeof this.$scope.user == 'undefined')return;
			if(!msg.user || typeof msg.user == 'undefined')return;
			// if(this.$scope.messages.map(function(m){return m.id}).indexOf(msg.id) > -1)return;
			// msg.my = this.$scope.user.id == msg.user.id;
			// msg.readed = this.$scope.active();
			
			var index = this.$scope.messages.map(function(m){return m.id;}).indexOf(msg.id);   
			if(index > -1){
				this.$scope.messages[index] = new Message(msg,this.$scope.user);
			}else{
				this.$scope.messages.push(new Message(msg,this.$scope.user));
			}
		}
		private writingTimeoutHandler = {};
		constructor(
			protected $scope,
			protected $rootScope,
			protected SocketIo: App.Factory.ISocketIo,
			protected $timeout,
			protected $window
		){

			this.writingTimeoutHandler = {};
			var _this = this;
			$scope.focus = true;
			$scope.focusOutside = true;
			$scope.writing = false;
			$scope.user = null;
			$scope.closed = false;
			$scope.messages = [];
			$scope.writers = [];
			$scope.started = false;
			$scope.message = null;
			$scope.room = {};
			SocketIo.on('chat message', function(messages){
				_this.addMessages(messages);				
			});
			$scope.active = function(){
				return ($scope.focus || $scope.focusOutside) && !$scope.closed;
			}
			$scope.$watch(function(){
				return $scope.unreadCount();
			},function(val){
				if(val){
					// document.getElementById('audiotag').currentTime = 0;
					document.getElementById('audiotag').play();
				}
			},true);

			// SocketIo.on('chat message other', function(msg){    
			// 	msg.my = false;

			// 	_this.addMessage(msg);
			// });
			SocketIo.on('chat hello', function(data){    
				$scope.user = data.user;
				$scope.room = data.room;
			});
			SocketIo.on('chat writing', function(writer){    
				// $scope.writing = writing;
				if(!writer.user)return;
				var userId = writer.user.id;
				if(writer.writing){
					if($scope.writers.map(function(w){return w.user.id;}).indexOf(userId) == -1)
						$scope.writers.push(writer);
					clearTimeout(_this.writingTimeoutHandler[userId]);
				}else{
					var index = $scope.writers.map(function(w){return w.user.id;}).indexOf(userId);
					if (index > -1) {
					    $scope.writers.splice(index, 1);
					}
				}
				
				
				if(writer.writing){
					
					_this.writingTimeoutHandler[userId] = setTimeout(function(){ 
						var index = $scope.writers.map(function(w){return w.user.id;}).indexOf(userId);
						
						if (index > -1) {
						    $scope.writers.splice(index, 1);
						}
					}, 3000);
					$('.direct-chat-messages').stop(true,false).animate({
        				scrollTop: $('.direct-chat-messages > div').height() + 32
					}, 1000);
				}
				
			});

			$scope.sendMsg = function(){
				
				if($scope.message){
					SocketIo.emit('chat message',$scope.message,function(){
						console.log("MSG");
					});
				}
				$scope.message = null;
				SocketIo.emit('chat writing',false,function(){});
			}
			$scope.iAmWriting = function(){
				SocketIo.emit('chat writing',$scope.message != null && $scope.message.length > 0,function(){});
			}
			$scope.setAway = function(){
				// if(window == window.top)
					$scope.focus = false;
			}
			$scope.setBack = function(){
				// if(window == window.top)
					$scope.focus = true;
			}
			$scope.toggleClosed = function(){
				$scope.closed = !$scope.closed;
				if(!$scope.closed)
				window.top.postMessage(JSON.stringify({
					'action' : 'height',
					'height':'default'
				}), '*');
				window.top.postMessage(JSON.stringify({
					'action' : 'collapse',
					'collapsed' : !$scope.closed
				}), '*');
			}
			$scope.cancelFrame = function(){
				window.top.postMessage(JSON.stringify({'action':'cancel'}), '*');
			}
			$scope.screen = function(){
				window.top.postMessage(JSON.stringify({'action':'makeScreenshot'}), '*');
			}
			$($window).on("message", function(e){
				var data = JSON.parse(e.originalEvent.data);
				switch(data.action){
					case 'screenshot':
						SocketIo.emit('chat screen',data.image,function(e){});
						break;
					case 'open':
						$scope.focus = true;
						$scope.closed = false;
						break;
					case 'focus':
						$scope.focusOutside = data.focused;
						break;
					case 'start':
						$scope.started = true;
						$scope.closed = !data.open;
						break;
					case 'login':
						$scope.started = true;
						SocketIo.emit('login',data,function(e){});
						break;
				}
            });
            $('.box > *').on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',function(e) {
			    // window.top.postMessage('height ' + $('.box').outerHeight(true), '*');
			    window.top.postMessage(JSON.stringify({
					'action' : 'height',
					'height': $('.box').outerHeight(true)
				}), '*');
			});

			$scope.unreadCount = function(){
				// return $scope.messages.map(function(m){return m.readed ? 0 : 1}).reduce(function(pv, cv) { return pv + cv; }, 0);
				return 0;
				return $scope.messages.filter(function(element, index, array) {
				  return !element.readed;
				}).length;
			}
		}

	}
}