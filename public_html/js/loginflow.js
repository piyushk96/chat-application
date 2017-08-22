/**
 * Created by piyush on 2/7/17.
 */

var app = angular.module('loginFlow', []);

app.controller('loginFlowController', function ($scope, $http, $window, $location) {
    $scope.loginAlert = false;
    $scope.registerAlert = false;
    $scope.pswdResetAlert = false;
    $scope.enterIdAlert = false;
    $scope.photo = {};

    $scope.login = function(){
        $scope.resetAlerts();
        var data = {
            empid : $scope.empid==null ? "" : $scope.empid,
            password : $scope.password==null ? "" : $scope.password
        };
        if(data.empid=="" || data.password=="") {
            alert("Fields can't be left blank.");
            return;
        }
        $http.post('/login', data).then(function success(res) {
            if(res.data.loggedIn){
                sessionStorage.setItem('chatUser', res.data.empid);
                $window.location.href = '/chat';
            }
            else{
                $scope.loginAlert = true;
            }
        }, function error(err) {
            console.error(err);
            alert('Connection Error');
        });
    };

    $scope.signup = function(){
        $scope.resetAlerts();
        var checkFileStatus = $scope.checkFile();
        if(checkFileStatus == 'notImageFile')
            return;

        var data = {
            empid : $scope.empid==null ? "" : $scope.empid,
            name : $scope.username==null ? "" : $scope.username,
            designation : $scope.designation==null ? "" : $scope.designation,
            password : $scope.password==null ? "" : $scope.password,
            email : $scope.email==null ? "" : $scope.email
        };
        if(data.empid=="" || data.password=="" || data.designation=="" || data.name=="" || data.email=="") {
            alert("Fields can't be left blank.");
            return;
        }

        $http.post('/signup/checkUser', {empid : data.empid}).then(function success(res) {
            if(res.data.alreadyRegistered){
                $scope.registerAlert = true;
            }
            else{
                if(checkFileStatus == 'isImage'){
                    var fd = new FormData();
                    fd.append('file', $scope.photo);
                    fd.append('data', JSON.stringify(data));

                    $http.post('/signup/withImage', fd, {
                        withCredentials: true,
                        headers: {'Content-Type': undefined},
                        transformRequest: angular.identity
                    }).then(function success(result) {
                        if(result.data.err){
                            console.error(err);
                            alert('Error uploading files\nError : ' + result.data.result);
                        }
                        else{
                            sessionStorage.setItem('chatUser', result.data.result);
                            $window.location.href = '/chat';
                        }
                    }, function error(err) {
                        console.error(err);
                        alert('Connection Error');
                    });
                }
                else if(checkFileStatus == 'noPhoto'){
                    data.photo = null;
                    $http.post('/signup/withoutImage', data).then(function success(result) {
                        if(result.data.err){
                            console.error(err);
                            alert('Error ' + err.status + ' : ' + err.statusText);
                        }
                        else{
                            sessionStorage.setItem('chatUser', result.data.result);
                            $window.location.href = '/chat';
                        }
                    }, function error(err) {
                        console.error(err);
                        alert('Connection Error');
                    });
                }
            }
        }, function error(err) {
            console.error(err);
            alert('Error ' + err.status + ' : ' + err.statusText);
        });
    };

    $scope.forgotPassword = function () {
        $scope.resetAlerts();
        if($scope.empid==null || $scope.empid=='')
            $scope.enterIdAlert = true;
        else{
            var url = $location.absUrl();
            url = url.substr(0,url.lastIndexOf('/'));
            $http.post('/forgotPassword', {empid: $scope.empid, url: url}).then(function success(res) {
                if(!res.data.exist)
                    alert('Invalid Employee Id');
                else
                    $scope.pswdResetAlert = true;
            }, function error(err) {
                console.error(err);
                alert('Error ' + err.status + ' : ' + err.statusText);
            })
        }
    };

    $scope.resetAlerts = function () {
        $scope.loginAlert = false;
        $scope.registerAlert = false;
        $scope.pswdResetAlert = false;
        $scope.enterIdAlert = false;
    };

    $scope.open = function () {
        angular.element('#photo').click();
    };

    $scope.checkFile = function () {
        $scope.photo = $('#photo')[0].files[0];

        if($scope.photo == null)
            return 'noPhoto';
        else if(! $scope.photo.type.startsWith('image/')) {
            alert('Selected file is not image');
            return 'notImageFile';
        }
        else{
            $('.photoFileName').html($scope.photo.name);
            return 'isImage';
        }
    }
});