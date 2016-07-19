var App;
(function (App) {
    var Factory;
    (function (Factory) {
        "use strict";
        var vars = {}, hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            // vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        var socket = io('http://localhost:3000/', { query: vars });
        function SocketIoFactory($rootScope) {
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
                    });
                }
            };
        }
        Factory.SocketIoFactory = SocketIoFactory;
    })(Factory = App.Factory || (App.Factory = {}));
})(App || (App = {}));
/// <reference path='../factory/angular-socketio.ts' />
var App;
(function (App) {
    var Controller;
    (function (Controller) {
        "use strict";
        var Message = (function () {
            function Message(data, user) {
                this.data = data;
                this.user = user;
                // this.data.readed = false;
                this.data.readed = this.usersReadedIds.indexOf(user.id) > -1;
                // console.log(this.usersReadedIds.indexOf(user.id));
            }
            Object.defineProperty(Message.prototype, "id", {
                get: function () { return this.data.id; },
                enumerable: true,
                configurable: true
            });
            ;
            Object.defineProperty(Message.prototype, "content", {
                get: function () { return this.data.content; },
                enumerable: true,
                configurable: true
            });
            ;
            Object.defineProperty(Message.prototype, "my", {
                get: function () { return this.data.user.id == this.user.id; },
                enumerable: true,
                configurable: true
            });
            ;
            Object.defineProperty(Message.prototype, "type", {
                get: function () { return this.data.type; },
                enumerable: true,
                configurable: true
            });
            ;
            Object.defineProperty(Message.prototype, "timestamp", {
                get: function () { return this.data.timestamp; },
                enumerable: true,
                configurable: true
            });
            ;
            Object.defineProperty(Message.prototype, "usersReaded", {
                get: function () { return this.data.usersReaded; },
                set: function (arr) { this.data.usersReaded = arr; },
                enumerable: true,
                configurable: true
            });
            ;
            ;
            Object.defineProperty(Message.prototype, "usersReadedIds", {
                get: function () { return this.data.usersReaded.map(function (u) { return u.id; }); },
                enumerable: true,
                configurable: true
            });
            ;
            Object.defineProperty(Message.prototype, "readed", {
                get: function () { return this.data.readed; },
                set: function (val) {
                    this.data.readed = val;
                },
                enumerable: true,
                configurable: true
            });
            ;
            ;
            return Message;
        }());
        Controller.Message = Message;
        var ChatCtrl = (function () {
            function ChatCtrl($scope, $rootScope, SocketIo, $timeout, $window) {
                this.$scope = $scope;
                this.$rootScope = $rootScope;
                this.SocketIo = SocketIo;
                this.$timeout = $timeout;
                this.$window = $window;
                this.writingTimeoutHandler = {};
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
                SocketIo.on('chat message', function (messages) {
                    _this.addMessages(messages);
                });
                $scope.active = function () {
                    return ($scope.focus || $scope.focusOutside) && !$scope.closed;
                };
                $scope.$watch(function () {
                    return $scope.unreadCount();
                }, function (val) {
                    if (val) {
                        // document.getElementById('audiotag').currentTime = 0;
                        document.getElementById('audiotag').play();
                    }
                }, true);
                // SocketIo.on('chat message other', function(msg){    
                // 	msg.my = false;
                // 	_this.addMessage(msg);
                // });
                SocketIo.on('chat hello', function (data) {
                    $scope.user = data.user;
                    $scope.room = data.room;
                });
                SocketIo.on('chat writing', function (writer) {
                    // $scope.writing = writing;
                    if (!writer.user)
                        return;
                    var userId = writer.user.id;
                    if (writer.writing) {
                        if ($scope.writers.map(function (w) { return w.user.id; }).indexOf(userId) == -1)
                            $scope.writers.push(writer);
                        clearTimeout(_this.writingTimeoutHandler[userId]);
                    }
                    else {
                        var index = $scope.writers.map(function (w) { return w.user.id; }).indexOf(userId);
                        if (index > -1) {
                            $scope.writers.splice(index, 1);
                        }
                    }
                    if (writer.writing) {
                        _this.writingTimeoutHandler[userId] = setTimeout(function () {
                            var index = $scope.writers.map(function (w) { return w.user.id; }).indexOf(userId);
                            if (index > -1) {
                                $scope.writers.splice(index, 1);
                            }
                        }, 3000);
                        $('.direct-chat-messages').stop(true, false).animate({
                            scrollTop: $('.direct-chat-messages > div').height() + 32
                        }, 1000);
                    }
                });
                $scope.sendMsg = function () {
                    if ($scope.message) {
                        SocketIo.emit('chat message', $scope.message, function () {
                            console.log("MSG");
                        });
                    }
                    $scope.message = null;
                    SocketIo.emit('chat writing', false, function () { });
                };
                $scope.iAmWriting = function () {
                    SocketIo.emit('chat writing', $scope.message != null && $scope.message.length > 0, function () { });
                };
                $scope.setAway = function () {
                    // if(window == window.top)
                    $scope.focus = false;
                };
                $scope.setBack = function () {
                    // if(window == window.top)
                    $scope.focus = true;
                };
                $scope.toggleClosed = function () {
                    $scope.closed = !$scope.closed;
                    if (!$scope.closed)
                        window.top.postMessage(JSON.stringify({
                            'action': 'height',
                            'height': 'default'
                        }), '*');
                    window.top.postMessage(JSON.stringify({
                        'action': 'collapse',
                        'collapsed': !$scope.closed
                    }), '*');
                };
                $scope.cancelFrame = function () {
                    window.top.postMessage(JSON.stringify({ 'action': 'cancel' }), '*');
                };
                $scope.screen = function () {
                    window.top.postMessage(JSON.stringify({ 'action': 'makeScreenshot' }), '*');
                };
                $($window).on("message", function (e) {
                    var data = JSON.parse(e.originalEvent.data);
                    switch (data.action) {
                        case 'screenshot':
                            SocketIo.emit('chat screen', data.image, function (e) { });
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
                            SocketIo.emit('login', data, function (e) { });
                            break;
                    }
                });
                $('.box > *').on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function (e) {
                    // window.top.postMessage('height ' + $('.box').outerHeight(true), '*');
                    window.top.postMessage(JSON.stringify({
                        'action': 'height',
                        'height': $('.box').outerHeight(true)
                    }), '*');
                });
                $scope.unreadCount = function () {
                    // return $scope.messages.map(function(m){return m.readed ? 0 : 1}).reduce(function(pv, cv) { return pv + cv; }, 0);
                    return 0;
                    return $scope.messages.filter(function (element, index, array) {
                        return !element.readed;
                    }).length;
                };
            }
            // static $inject: Array<string> = ['$scope,', '$rootScope', 'SocketIo'];
            // 
            ChatCtrl.prototype.addMessages = function (messages) {
                // this.$scope.messages = [];
                for (var k in messages)
                    this.addMessage(messages[k]);
                this.$timeout(function () {
                    $('.direct-chat-messages')
                        .stop(true, false)
                        .animate({
                        scrollTop: $('.direct-chat-messages > div').height()
                    }, 1000);
                    // console.log($('.direct-chat-messages > div').height());
                }, 500);
            };
            ChatCtrl.prototype.addMessage = function (msg) {
                if (!this.$scope.user || typeof this.$scope.user == 'undefined')
                    return;
                if (!msg.user || typeof msg.user == 'undefined')
                    return;
                // if(this.$scope.messages.map(function(m){return m.id}).indexOf(msg.id) > -1)return;
                // msg.my = this.$scope.user.id == msg.user.id;
                // msg.readed = this.$scope.active();
                var index = this.$scope.messages.map(function (m) { return m.id; }).indexOf(msg.id);
                if (index > -1) {
                    this.$scope.messages[index] = new Message(msg, this.$scope.user);
                }
                else {
                    this.$scope.messages.push(new Message(msg, this.$scope.user));
                }
            };
            return ChatCtrl;
        }());
        Controller.ChatCtrl = ChatCtrl;
    })(Controller = App.Controller || (App.Controller = {}));
})(App || (App = {}));
/// <reference path='../../node_modules/moment/moment.d.ts' />
Array.prototype.inArray = function (comparer) {
    for (var i = 0; i < this.length; i++) {
        if (comparer(this[i]))
            return true;
    }
    return false;
};
// adds an element to the array if it does not already exist using a comparer 
// function
Array.prototype.pushIfNotExist = function (element, comparer) {
    if (!this.inArray(comparer)) {
        this.push(element);
    }
};
var App;
(function (App) {
    var Directives;
    (function (Directives) {
        "use strict";
        function MessageDirective($interval, $timeout, SocketIo) {
            return {
                templateUrl: "/directives/message.html",
                replace: true,
                scope: {
                    msg: "="
                },
                controller: function ($scope) {
                    $scope.timeState = function () {
                        // console.log('timeState');
                        if ($scope.secconds < 15 * 60)
                            return 1;
                        if (moment().startOf('day').isSame(moment($scope.msg.timestamp).startOf('day')))
                            return 2;
                        return 3;
                    };
                    $scope.secconds = Math.floor((Date.now() - $scope.msg.timestamp) / 1000);
                    $interval(function () {
                        $timeout(function () {
                            $scope.secconds = Math.floor((Date.now() - $scope.msg.timestamp) / 1000);
                            // $scope.$apply();
                        });
                    }, 1000);
                    $scope.$watch(function () { return $scope.msg.readed; }, function (flag) {
                        if (flag /* && $scope.msg.user.id != $scope.$parent.user.id*/) {
                            console.log($scope.$parent.user.id);
                            SocketIo.emit("chat readed", { id: $scope.msg.id, user: $scope.$parent.user }, function () { });
                        }
                    });
                    SocketIo.on("chat readed", function (data) {
                        // console.log(data.id,$scope.msg.id);
                        if (data.id != $scope.msg.id)
                            return;
                        console.log(data.user.id);
                        $scope.msg.usersReaded.pushIfNotExist(data.user, function (e) {
                            return e.id === data.user.id;
                        });
                    });
                    $scope.notReaded = function () {
                        // return false;
                        if ($scope.msg.readed == true)
                            return false;
                        if ($scope.$parent.active()) {
                            $scope.msg.readed = true;
                            return false;
                        }
                        return true;
                    };
                }
            };
        }
        Directives.MessageDirective = MessageDirective;
    })(Directives = App.Directives || (App.Directives = {}));
})(App || (App = {}));
var App;
(function (App) {
    var Directives;
    (function (Directives) {
        "use strict";
        function BnWindowBlurDirective($window, $log) {
            return ({
                link: link,
                restrict: "A"
            });
            // I bind the JavaScript events to the view-model.
            function link(scope, element, attributes) {
                // Hook up blur-handler.
                var win = angular.element($window).on("blur", handleBlur);
                // When the scope is destroyed, we have to make sure to teardown
                // the event binding so we don't get a leak.
                scope.$on("$destroy", handleDestroy);
                // ---
                // PRIVATE METHODS.
                // ---
                // I handle the blur event on the Window.
                function handleBlur(event) {
                    scope.$apply(attributes.bnWindowBlur);
                    $log.warn("Window blurred.");
                }
                // I teardown the directive.
                function handleDestroy() {
                    win.off("blur", handleBlur);
                }
            }
        }
        Directives.BnWindowBlurDirective = BnWindowBlurDirective;
    })(Directives = App.Directives || (App.Directives = {}));
})(App || (App = {}));
var App;
(function (App) {
    var Directives;
    (function (Directives) {
        "use strict";
        function BnWindowFocusDirective($window, $log) {
            return ({
                link: link,
                restrict: "A"
            });
            // I bind the JavaScript events to the view-model.
            function link(scope, element, attributes) {
                // Hook up focus-handler.
                var win = angular.element($window).on("focus", handleFocus);
                // When the scope is destroyed, we have to make sure to teardown
                // the event binding so we don't get a leak.
                scope.$on("$destroy", handleDestroy);
                // ---
                // PRIVATE METHODS.
                // ---
                // I teardown the directive.
                function handleDestroy() {
                    win.off("focus", handleFocus);
                }
                // I handle the focus event on the Window.
                function handleFocus(event) {
                    scope.$apply(attributes.bnWindowFocus);
                    $log.warn("Window focused.");
                }
            }
        }
        Directives.BnWindowFocusDirective = BnWindowFocusDirective;
    })(Directives = App.Directives || (App.Directives = {}));
})(App || (App = {}));
var App;
(function (App) {
    var Directives;
    (function (Directives) {
        "use strict";
        function IncludeReplaceDirective() {
            return {
                require: 'ngInclude',
                restrict: 'A',
                link: function (scope, el, attrs) {
                    // console.log("AAAAAAAAAA");
                    el.replaceWith(el.children());
                }
            };
        }
        Directives.IncludeReplaceDirective = IncludeReplaceDirective;
    })(Directives = App.Directives || (App.Directives = {}));
})(App || (App = {}));
/// <reference path='../../public/app/ts/libs/angularjs/angular.d.ts' />
/// <reference path='factory/angular-socketio.ts' />
/// <reference path='controller/chat.ts' />
/// <reference path='directives/message.ts' />
/// <reference path='directives/bnWindowBlur.ts' />
/// <reference path='directives/bnWindowFocus.ts' />
/// <reference path='directives/includeReplace.ts' />
moment.locale('pl');
var App;
(function (App) {
    'use strict';
    var app = angular.module('chatApplication', ['angularMoment']);
    app.factory('SocketIo', App.Factory.SocketIoFactory);
    app.controller('ChatCtrl', App.Controller.ChatCtrl);
    app.directive('message', App.Directives.MessageDirective);
    app.directive('bnWindowBlur', App.Directives.BnWindowBlurDirective);
    app.directive('bnWindowFocus', App.Directives.BnWindowFocusDirective);
    app.directive('includeReplace', App.Directives.IncludeReplaceDirective);
})(App || (App = {}));
//# sourceMappingURL=app.js.map