/// <reference path='../../node_modules/moment/moment.d.ts' />
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
module App.Directives {
    "use strict"
    export function MessageDirective($interval,$timeout,SocketIo: App.Factory.ISocketIo,): ng.IDirective {
        return {
            templateUrl:"/directives/message.html",

            replace: true,
            scope: {
                msg : "="
            },
            controller : function($scope){
                $scope.timeState = function(){
                    // console.log('timeState');
                    if($scope.secconds < 15 * 60)return 1;
                    if(moment().startOf('day').isSame(moment($scope.msg.timestamp).startOf('day')))return 2;
                    return 3;
                }
                $scope.secconds = Math.floor((Date.now() - $scope.msg.timestamp)/1000);
                $interval(function(){
                    $timeout(function() {
                    $scope.secconds = Math.floor((Date.now() - $scope.msg.timestamp)/1000);
                    // $scope.$apply();
                    });
                }, 1000);

                $scope.$watch(function(){return $scope.msg.readed;},function(flag){
                    if(flag/* && $scope.msg.user.id != $scope.$parent.user.id*/){
                        console.log($scope.$parent.user.id);
                        SocketIo.emit("chat readed",{id:$scope.msg.id,user:$scope.$parent.user},function(){});
                    }

                });
                SocketIo.on("chat readed",function(data){
                    // console.log(data.id,$scope.msg.id);
                    if(data.id != $scope.msg.id)return;
                    console.log(data.user.id);
                    $scope.msg.usersReaded.pushIfNotExist(data.user,function(e) { 
                        return e.id === data.user.id
                    });

                });

                $scope.notReaded = function(){
                    // return false;
                    if($scope.msg.readed == true)return false;

                    if($scope.$parent.active()){
                        $scope.msg.readed = true;
                        return false;
                    }
                    return true;
                }
            }            
        };
    }
}
