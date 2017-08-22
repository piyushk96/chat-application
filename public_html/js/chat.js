/**
 * Created by piyush on 2/7/17.
 */
var app = angular.module('chatPage', []);

app.factory('socket', function ($rootScope) {
    var socket = io.connect();
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
        },
        disconnect: function () {
            socket.disconnect();
        }
    };
});

app.directive('fileUpload', function () {
    return {
        restrict : 'A',
        link : function ($scope, elements, attributes) {
            
        }
    }
});

app.filter('highlight', function ($sce) {
    return function (text, phrase) {
        if(phrase)
            text = text.replace(new RegExp('('+phrase+')', 'gi'), '<span class="matchedText">$1</span>')
        return $sce.trustAsHtml(text);
    }
});

app.controller('chatController', function ($scope, $http, $timeout, $window, socket) {
    $scope.currentUser = {};
    $scope.selectedUser = {};
    $scope.chatList = [];
    $scope.allContactsList = [];
    $scope.sendList = [];
    $scope.messages = [];
    $scope.uploadMedia = [];
    $scope.selectedMedia = {};
    $scope.showContactList = false;
    $scope.broadcast = false;
    $scope.broadcastHeader = "";
    $scope.chatMessagePane = false;
    

    //TODO : add dates in chats
    //TODO : add first letter in contacts

    $scope.getCurrentUserInfo = function () {
        var uid = sessionStorage.getItem('chatUser');
        $http.post('/chat/get_user_info', {empid : uid}).then(function success(response) {
            $scope.currentUser = response.data;

            if (Notification.permission !== "denied") {             //request permission for notification
                Notification.requestPermission();
            }

            socket.emit('connectedNewUser', response.data);        ////sending current user data and getting chatlist
        }, function error(err){
            console.error(err);
            alert('Error ' + err.status + ' : ' + err.statusText);
        });
    };

    $scope.getCurrentUserInfo();

    $scope.selectUser = function (user) {
        $scope.chatMessagePane = true;
        $scope.showContactList = false;
        $scope.broadcast = false;

        if($scope.selectedUser==null || $scope.selectedUser.empid != user.empid){
            $scope.selectedUser = user;
            $scope.messages = [];

            var empIndex = $('#recentemp_' + user.empid).index();
            if(empIndex != -1){
                var currentTime = Math.floor(new Date());                   // user present in chatList (selected from contactList)
                var data = {                                                // user have talked earlier
                    u1: $scope.currentUser.empid,
                    u2: $scope.selectedUser.empid,
                    startTime : currentTime
                };

                $http.post('/chat/getMessages', data).then(function success(res){
                    $scope.messages = res.data;
                    $scope.scrollDown();

                    var lastMsg = $scope.messages[$scope.messages.length-1];
                    if(lastMsg.to_id == $scope.currentUser.empid && lastMsg.msgstatus != 'Y'){        //if last message is 'received msg' and status is not read

                        $scope.chatList[empIndex].unreads = 0;              //badge update

                        var data = {
                            from_id : $scope.selectedUser.empid,
                            to_id : $scope.currentUser.empid,
                        };
                        socket.emit('updateMsgStatus', data);
                    }
                }, function error(err) {
                    console.error(err);
                    alert('Error ' + err.status + ' : ' + err.statusText);
                });
            }
        }
    };

    $scope.selectBroadcastList = function (user) {
        if(! $('#check_' + user.empid).attr('checked')) {
            $scope.sendList.push({
                empid : user.empid,
                name : user.name
            });
            user.checked = true;

        }
        else{
            user.checked = false;
            for(var i=0; i<$scope.sendList.length; i++){
                if($scope.sendList[i].empid == user.empid){
                    $scope.sendList.splice(i,1);
                    break;
                }
            }
        }
        console.log($scope.sendList);
    };

    $scope.ok = function () {
        if($scope.sendList.length){
            $('#broadcastListPopup').modal('hide');
            $scope.chatMessagePane = true;
            $scope.broadcast = true;
            $scope.messages = [];
            $scope.selectedUser = {};
            var str = "";
            for(var i=0; i<$scope.sendList.length; i++){
                str += $scope.sendList[i].name + ",";
            }
            $scope.broadcastHeader = str.slice(0, -1);
        }
        else{
            alert('No User Selected');
        }
    };

    $scope.sendMessage = function (to_id) {
        var msg = $('#messageInputBox')[0].innerText;
        if(msg != "" && msg != null){
            $('#messageInputBox').html("");
            var newMsg = {
                msgtext : msg,
                from_id : $scope.currentUser.empid,
                to_id : to_id,
                sendtime : Math.floor(new Date),
                msgstatus : 'W',
                sendList : $scope.sendList
            };
            $http.post('/chat/addMessage', newMsg).then(function success(res){
                var result = res.data;
                if(! $scope.broadcast){
                    $scope.searchAndBringUserToTop($scope.selectedUser.empid, function() {
                        $scope.messages.push(res.data);
                        $scope.scrollDown();
                        socket.emit('sendMessage', result);
                    });
                }
                else{
                    $scope.messages.push(result[0]);
                    $scope.scrollDown();
                    for(i=0; i<result.length; i++){
                        $scope.searchAndBringUserToTop(result[i].to_id, function (){});
                        socket.emit('sendMessage', result[i]);
                    }
                }
            }, function error(err) {
                console.error(err);
                alert('Error ' + err.status + ' : ' + err.statusText);
            });
        }
    };

    $scope.fetchAllContacts = function () {
        if(! $scope.allContactsList.length){
            $http.post('/chat/getContactList', {empid : $scope.currentUser.empid}).then(function success(response) {
                $scope.allContactsList = response.data;
            }, function error(err){
                console.error(err);
                alert('Error ' + err.status + ' : ' + err.statusText);
            });
        }
    };

    $scope.triggerUploadInput = function (more) {
        if(!more){
            $scope.uploadMedia = [];
            $scope.selectedMedia = {};
        }
        angular.element('#uploadInput').click();
    };
    
    $scope.openPreview = function (files) {
        $('#mediaPreviewPopup').modal('show');

        for(var i=0; i<files.length; i++){
            if(files[i].name.length > 50){
                alert('File name is too long.');
                continue;
            }
            $scope.uploadMedia.push({
                id : i,
                caption : "",
                file : files[i]
            });
            if(files[i].type.startsWith('image/')) {
                $scope.uploadMedia[$scope.uploadMedia.length - 1].type = 'img';
                $scope.uploadMedia[$scope.uploadMedia.length - 1].url = $window.URL.createObjectURL(files[i]);
            }
            else if(files[i].type.startsWith('video/')) {
                $scope.uploadMedia[$scope.uploadMedia.length - 1].type = 'vid';
                $scope.uploadMedia[$scope.uploadMedia.length - 1].url = $window.URL.createObjectURL(files[i]);
            }
            else {
                $scope.uploadMedia[$scope.uploadMedia.length - 1].type = 'docs';
                $scope.uploadMedia[$scope.uploadMedia.length - 1].url = '/assets/docs.svg';
            }
        }
        $scope.selectedMedia = $scope.uploadMedia[0];
        $scope.$apply();
    };

    $scope.selectMedia = function (data) {
        $scope.selectedMedia = data;
    };

    $scope.upload = function () {
        $('#mediaPreviewPopup').modal('hide');
        console.log($scope.uploadMedia);

        var fd = new FormData();

        var newMsg = [];
        for(var i=0; i<$scope.uploadMedia.length; i++) {
            fd.append('file', $scope.uploadMedia[i].file);

            newMsg.push({
                msgtext : $scope.uploadMedia[i].caption,
                from_id : $scope.currentUser.empid,
                to_id : $scope.selectedUser.empid,
                sendtime : Math.floor(new Date),
                msgstatus : 'W',
                type : $scope.uploadMedia[i].type,
                sendList : $scope.sendList
            });
        }
        fd.append('newMsg', JSON.stringify(newMsg));

        $http.post('/chat/upload', fd, {
            withCredentials: true,
            headers: {'Content-Type': undefined},
            transformRequest: angular.identity
        }).then(function success(res) {
            if(res.data.err)
                alert('Error uploading files\nError : ' + res.data.result);
            else{
                var result = res.data.result;
                if(! $scope.broadcast){
                    $scope.searchAndBringUserToTop($scope.selectedUser.empid, function() {
                        for(var i=0; i<result.length; i++) {
                            $scope.messages.push(result[i]);
                            $scope.scrollDown();
                            socket.emit('sendMessage', result[i]);
                        }
                    });
                }
                else{
                    $scope.messages = $scope.messages.concat(result[0]);
                    $scope.scrollDown();
                    for(var i=0; i<result.length; i++){
                        $scope.searchAndBringUserToTop(result[i][0].to_id, function (){});
                        for(var j=0; j<result[i].length; j++)
                            socket.emit('sendMessage', result[i][j]);
                    }
                }
            }
        }, function error(err) {
            console.error(err);
            alert('Error ' + err.status + ' : ' + err.statusText);
        });
    };




    $scope.searchAndBringUserToTop = function(empid, cb){
        var found = false;
        var i;
        for(i=0; i<$scope.chatList.length; i++){
            if($scope.chatList[i].empid == empid) {
                found = true;
                break;
            }
        }
        if(!found){                                            //user not in chatlist (first msg)
            $http.post('/chat/get_user_info', {empid : empid}).then(function success(response) {        //get person info
                response.data.unreads = 0;
                $scope.chatList.unshift(response.data);
                cb();
            }, function error(err){
                console.error(err);
                alert('Error ' + err.status + ' : ' + err.statusText);
            });
        }
        else {
            var emp = $scope.chatList.splice(i,1);
            $scope.chatList.unshift(emp[0]);
            cb();
        }
    };

    $scope.enterEvent = function (event) {
        if(event.keyCode == '13'){
            if(!event.shiftKey) {
                event.preventDefault();
                $timeout(function () {
                    angular.element('#sendMessage').click();
                }, 100);
            }
        }
    };

    $scope.getMsgTime = function(timestamp){
        var d = new Date(parseInt(timestamp));
        var hours = d.getHours();
        var minutes = d.getMinutes();
        var ampm = (hours >= 12) ? 'PM' : 'AM';
        hours = hours % 12;
        hours = (hours) ? hours : 12;                            // the hour '0' should be '12'
        minutes = (minutes < 10) ? '0'+minutes : minutes;
        var timeStr = hours + ':' + minutes + ' ' + ampm;
        return timeStr;
    };

    $scope.scrollDown = function () {
        setTimeout(function () {
            $('.messageContainer').scrollTop($('.messageContainer ul').height());
        }, 100);
    };
    
    $scope.logout = function(){
        $http.post('/chat/logout', {empid : $scope.currentUser.empid}).then(function success(res){
            if(res.data.status == 'success'){
                socket.disconnect();
                sessionStorage.setItem('chatUser', '');
                window.location.href = '/';
            }
        }, function error(err) {
            console.error(err);
            alert('Error ' + err.status + ' : ' + err.statusText);
        });
    };

    ///////////////////////////////////////////////////         socket on Events           ///////////////////////////////////////////////////

    socket.on('chatlist', function (chatlist) {
        $scope.currentUser.online = true;
        $scope.chatList = chatlist;

        var data = {
            to_id : $scope.currentUser.empid,
            from_id : [],
            receivetime : Math.floor(new Date())
        };
        for(var i=0; i<$scope.chatList.length; i++){
            if($scope.chatList[i].unreads != 0){
                data.from_id.push($scope.chatList[i].empid);
            }
            else
                break;          // breaks at first empty badge
        }
        if(data.from_id.length)
            socket.emit('msgDeliveryToNewOnlineUser', data);
    });

    socket.on('msgDelivered', function (data) {
        if(data.from_id.indexOf($scope.currentUser.empid) != -1) {

            if (data.to_id == $scope.selectedUser.empid) {
                for (var i = $scope.messages.length-1; i >= 0; i--) {
                    if ($scope.messages[i].msgstatus == 'W')
                        $scope.messages[i].msgstatus = 'N';
                    else
                        break;
                }
            }
        }
    });

    socket.on('updateOnlineStatus', function(data){                  //  set user as online of offline
        var i = $('#recentemp_' + data.empid).index();
        if(i != -1)
            $scope.chatList[i].online = data.onlinestatus;
        i = $('#emp_' + data.empid).index();
        if(i != -1)
            $scope.allContactsList[i].online = data.onlinestatus;
    });

    socket.on('receiveMessage', function (msg) {                        // msg received
        msg.receivetime = Math.floor(new Date);

        if($scope.selectedUser.empid == msg.from_id){                    // msg received and read by user
            msg.msgstatus = 'Y';
            $scope.searchAndBringUserToTop($scope.selectedUser.empid, function(){
                $scope.messages.push(msg);
                $scope.scrollDown();
            });
        }
        else{                                                            // msg only received not read
            msg.msgstatus = 'N';
            $scope.searchAndBringUserToTop(msg.from_id, function () {
                ++($scope.chatList[0].unreads);                             //badge update
            });
        }

        //Desktop Notifications

        new Notification("You Have New Messages", {
            icon : 'assets/chat.png'
        });

        socket.emit('updateMsgStatus', msg);
    });

    socket.on('msgStatusUpdated', function (data) {
        if(data.to_id == $scope.selectedUser.empid) {
            if(data.receivetime == null) {                              /// data doesn't contain receivetime
                for(var i=$scope.messages.length-1; i>=0; i--){         /// (msg is read by receiver)
                    if($scope.messages[i].msgstatus != 'Y'){
                        $scope.messages[i].msgstatus = 'Y';
                    }
                    else
                        break;
                }
            }
            else{                                                      /// Message is Received By The Receiver
                for(var i=$scope.messages.length-1; i>=0; i--){
                    if($scope.messages[i].id == data.id){
                        $scope.messages[i] = data;
                        break;
                    }
                }
            }
        }
    });
});

