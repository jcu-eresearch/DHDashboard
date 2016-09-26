
var homesteadApp = angular.module('homesteadApp', ['ngMaterial', 'ngMessages', 'ngRoute','ui.slider']);

homesteadApp.config(function($mdThemingProvider) {


	$mdThemingProvider.definePalette('amazingPaletteName', {
		'50': 'ffebee',
		'100': 'ffcdd2',
		'200': 'ef9a9a',
		'300': 'e57373',
		'400': 'ef5350',
		'500': 'f44336',
		'600': 'e53935',
		'700': 'd32f2f',
		'800': '#1f2532', //dark bluish grey
		'900': 'b71c1c',
		'A100': 'ff8a80',
		'A200': 'ff5252',
		'A400': 'ff1744',
		'A700': 'd50000',
		'contrastDefaultColor': 'light',    // whether, by default, text (contrast)
											// on this palette should be dark or light
		'contrastDarkColors': ['50', '100', //hues which contrast should be 'dark' by default
			'200', '300', '400', 'A100'],
		'contrastLightColors': undefined    // could also specify this if default was 'dark'
	});


	$mdThemingProvider.theme('default')
		.primaryPalette('amazingPaletteName')
		.accentPalette('green')
		.backgroundPalette('grey');
});

homesteadApp.config(function($routeProvider) {
	$routeProvider

	// route for the home page
		.when('/', {
			templateUrl : 'pages/dash.html',
			controller  : 'dashController'
		})

		// route for the about page
		.when('/map', {
			templateUrl : 'pages/map.html',
			controller  : 'mapController'
		})

		// route for the contact page
		.when('/detailed', {
			templateUrl : 'pages/detailed.html',
			controller  : 'detailedController'
		});
});

homesteadApp.controller('AppCtrl', function($scope,  $mdBottomSheet, $mdToast, tagDataService, $rootScope) {

	$scope.currentNavItem='dash';
	$rootScope.$on('$routeChangeSuccess', function(event, current) {
		debugger;
		if(current && current.$$route && current.$$route.originalPath && current.$$route.originalPath.length>1)
			$scope.currentNavItem = current.$$route.originalPath.substring(1);
		else
			$scope.currentNavItem='dash';

	});

	$scope.showLiveData = function() {
		$scope.alert = '';
		$mdBottomSheet.show({
			templateUrl: 'templates/live.templ.html',
			controller: 'LiveDataCtrl',
			clickOutsideToClose: true
		}).then(function (clickedItem) {
			$mdToast.show(
				$mdToast.simple()
					.textContent(clickedItem['name'] + ' clicked!')
					.position('top right')
					.hideDelay(1500)
			);
		});
	};


});


homesteadApp.controller('LiveDataCtrl', function($scope, $mdBottomSheet){});

homesteadApp.factory('tagDataService', tagDataService);

function tagDataService($http) {
	var service = {
		getAllTagData: getAllTagData,
		getTestData: getTestData
	};
	return service;

	function getAllTagData(callback) {
		var uri = "api/weights";

		$http.get(uri)
			.then(getAllTagDataSuccess, getAllTagDataError);

		function getAllTagDataSuccess(resp) {

			if (callback && resp.data) {

				callback(resp.data);
			}
		}

		function getAllTagDataError() {
			callback({success: false, message: 'Unable to fetch tag data'});
		}
	}

	function getTestData(callback) {
		var uri = "api/data";

		$http.get(uri)
			.then(getAllTagDataSuccess, getAllTagDataError);

		function getAllTagDataSuccess(resp) {

			if (callback && resp.data) {

				callback(resp.data);
			}
		}

		function getAllTagDataError() {
			callback({success: false, message: 'Unable to fetch tag data'});
		}
	}
}

homesteadApp.directive('plotly', [
	'$window',
	function($window) {
		return {
			restrict: 'E',
			template: '<div style="width:56vw; height: 500px" ></div>',
			scope: {
				plotlyData: '=',
				plotlyLayout: '=',
				plotlyOptions: '=',
				plotlyAlerts: '=',
				plotlyWidth: '='
			},
			link: function(scope, element) {
				var graph = element[0].children[0];
				var initialized = false;

				function onUpdate() {

					//No data yet, or clearing out old data
					if (!(scope.plotlyData)) {
						if (initialized) {
							Plotly.Plots.purge(graph);
							graph.innerHTML = '';
						}
						return;
					}
					//If this is the first run with data, initialize
					if (!initialized) {
						initialized = true;
						Plotly.plot(graph, scope.plotlyData, scope.plotlyLayout, scope.plotlyOptions);
					}
					graph.layout = scope.plotlyLayout;
					if(scope.plotlyWidth && graph.layout)
						graph.layout.width=scope.plotlyWidth;
					graph.layout.annotations=scope.plotlyAlerts;
					graph.data = scope.plotlyData;
					Plotly.redraw(graph);
					Plotly.Plots.resize(graph);
					graph.on('plotly_click', function(event, data) {
						Plotly.relayout(graph, 'annotations[0]', 'remove');
					});
				}

				onUpdate();

				function onResize() {
					if (!(initialized && scope.plotlyData)) return;
					Plotly.Plots.resize(graph);
				}

				scope.$watchGroup([
					function() {
						return scope.plotlyLayout;
					},
					function() {
						return scope.plotlyData;
					},
					function() {
						return scope.plotlyAlerts;
					}
				], function(newValue, oldValue) {
					if (angular.equals(newValue, oldValue)) return;
					onUpdate();
				}, true);

				scope.$watch('scope.plotlyAlerts', function(newValue, oldValue) {
					if (angular.equals(newValue, oldValue)) return;
					onUpdate();
				});

				scope.$watch(function() {
					return {
						'h': element[0].offsetHeight,
						'w': element[0].offsetWidth
					};
				}, function(newValue, oldValue) {
					if (angular.equals(newValue, oldValue)) return;
					onResize();
				}, true);

				angular.element($window).bind('resize', onResize);

				scope.$on("message", function(e, msg, dataSeries) {
					if (msg === "alertsUpdated")onUpdate();
				});
			}
		};
	}
]);





homesteadApp.directive('stopTouchEvent', function () {
	return {
		restrict: 'A',
		link: function (scope, element) {
			element.on('touchmove', function (evt) {
				evt.stopPropagation();
			});
		}
	};
})