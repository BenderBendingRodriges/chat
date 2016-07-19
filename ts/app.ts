/// <reference path='../../public/app/ts/libs/angularjs/angular.d.ts' />
/// <reference path='factory/angular-socketio.ts' />
/// <reference path='controller/chat.ts' />
/// <reference path='directives/message.ts' />
/// <reference path='directives/bnWindowBlur.ts' />
/// <reference path='directives/bnWindowFocus.ts' />
/// <reference path='directives/includeReplace.ts' />

moment.locale('pl'); 
module App {
    'use strict';
    var app = angular.module('chatApplication', ['angularMoment']);

    app.factory('SocketIo',App.Factory.SocketIoFactory);
    app.controller('ChatCtrl', App.Controller.ChatCtrl);
    app.directive('message', App.Directives.MessageDirective);
    app.directive('bnWindowBlur', App.Directives.BnWindowBlurDirective);
    app.directive('bnWindowFocus', App.Directives.BnWindowFocusDirective);
    app.directive('includeReplace', App.Directives.IncludeReplaceDirective);
}