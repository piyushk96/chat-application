/**
 * Created by piyush on 25/7/17.
 */
var app = angular.module('passwordReset', []);

app.controller('passwordResetController', function ($scope, $http, $location) {
    $scope.notMatchAlert = false;
    $scope.resetSuccessAlert = false;

    $scope.reset = function () {
        $scope.notMatchAlert = false;
        $scope.resetSuccessAlert = false;

        if($scope.password == "" || $scope.confirmPassword=="") {
            alert("Fields can't be left blank");
        }
        else if($scope.password != $scope.confirmPassword){
            $scope.notMatchAlert = true;
        }
        else{
            var url = window.location.href.split('/');
            var empid = url[url.length-2];
            $http.post('/passwordreset', {empid:empid, password:$scope.password}).then(function success(res) {
                if(res.data.success)
                    $scope.resetSuccessAlert = true;
            }, function error(err) {
                console.error(err);
                alert('Error ' + err.status + ' : ' + err.statusText);
            });
        }
    }
});