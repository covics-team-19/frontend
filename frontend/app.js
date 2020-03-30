let app = angular.module('covics19', ['ui.router']);

app.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $stateProvider.state({
        name: 'home',
        url: '/home',
        controller: 'HomeController',
        templateUrl: 'home/home.html'
    });

    $urlRouterProvider.otherwise('/home');

}]);