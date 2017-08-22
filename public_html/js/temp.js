/**
 * Created by piyush on 7/7/17.
 */
var app = angular.module('chatPage', []);
app.controller('chatController', function ($scope) {
    $scope.chatPane=true;
    $scope.introPane=false;

    // $scope.resize = function () {
    //     $('.leftPane').resizable({
    //         handles: 'e',
    //         minWidth: 20,
    //         maxWidth: 400
    //     });
    // }

    $scope.currentUser = {
        id:1,
        empid:"10001",
        name:"test user X",
        designation:"designation",
        photo:"uploads/man.png",
        online:'Y'
    };

    $scope.selectedUser = {
        id:2,
        empid:"10002",
        name:"user2",
        designation:"designation",
        photo:"",
        online:'Y'
    };

    $scope.chatList = [
        {
            id:2,
            empid:"10002",
            name:"user1",
            designation:"designation",
            photo:"uploads/man.png",
            online:'Y'
        },{
            id:3,
            empid:"10003",
            name:"user2",
            designation:"designation",
            photo:"uploads/man.png",
            online:'N'
        },{
            id:4,
            empid:"10004",
            name:"user3",
            designation:"designation",
            photo:"uploads/man.png",
            online:'N'
        },{
            id:5,
            empid:"10005",
            name:"user4",
            designation:"designation",
            photo:"uploads/man.png",
            online:'Y'
        },{
            id:6,
            empid:"10006",
            name:"user1",
            designation:"designation",
            photo:"uploads/man.png",
            online:'Y'
        },{
            id:7,
            empid:"10007",
            name:"user1",
            designation:"designation",
            photo:"uploads/man.png",
            online:'Y'
        },{
            id:8,
            empid:"10008",
            name:"user1",
            designation:"designation",
            photo:"uploads/man.png",
            online:'Y'
        },{
            id:9,
            empid:"10009",
            name:"user1",
            designation:"designation",
            photo:"uploads/man.png",
            online:'Y'
        },{
            id:10,
            empid:"10010",
            name:"user1",
            designation:"designation",
            photo:"uploads/man.png",
            online:'Y'
        },{
            id:11,
            empid:"10011",
            name:"user1",
            designation:"designation",
            photo:"uploads/man.png",
            online:'Y'
        }
    ];
    $scope.newUserList = $scope.chatList;
    $scope.messages = [];
    // $scope.collapsePane = function (el) {
    //     console.log(el)
    // }
});