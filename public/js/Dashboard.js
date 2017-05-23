
var homesteadApp = angular.module('homesteadApp', ['ngMaterial', 'ngMessages', 'ngRoute','ui.slider']);

homesteadApp.config(function($mdThemingProvider) {


	$mdThemingProvider.definePalette('amazingPaletteName', {
		'50': '#ffebee',
		'100': '#ffcdd2',
		'200': '#ef9a9a',
		'300': '#e57373',
		'400': '#66bb6a',
		'500': '#66bb6a',
		'600': '#66bb6a',
		'700': '#66bb6a',
		'800': '#1f2532', //dark bluish grey
		'900': '#66bb6a',
		'A100': '#66bb6a',
		'A200': '#66bb6a',
		'A400': '#66bb6a',
		'A700': '#66bb6a',
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

	$scope.alerts=false;

    $scope.$on('alerts', function (event, data) {
       $scope.alerts=true;
    });

	$scope.currentNavItem='dash';
	$rootScope.$on('$routeChangeSuccess', function(event, current) {
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

function tagDataService($http, $q) {
	var service = {
		getAllTagData: getAllTagData,
		getTestData: getTestData,
        getLocationData: getLocationData
	};
	return service;

	function getAllTagData(callback) {

		var uri = "api/weights/buckets";

		$http.get(uri)
			.then(getBucketsSuccess, getBucketsError);

		function getBucketsSuccess(buckets) {
			if(buckets && buckets.data && buckets.data.length>0){
				var fetchBuckets=[];
				buckets.data.forEach(function(bucket){
					var bucketUri = "api/weights/" + bucket;
					fetchBuckets.push($http.get(bucketUri));
				});

				$q.all(fetchBuckets).then(getBucketSuccessConcat, getBucketError)
			}

		}

		function getBucketSuccessConcat(dataset){

			var results=[];

			if(dataset && dataset.length>0){

                function compare(a,b) {
                    if(a && a.config && a.config.url && b && b.config && b.config.url) {
                        var keyA = a.config.url,
                            keyB = b.config.url;
                        return keyA.localeCompare(keyB);
                    }
                }

                dataset.sort(compare);



				dataset.forEach(function(d){
					if(d && d.data && d.data.weights)
					results=results.concat(d.data.weights)
				});

				
				if(callback){
					callback(results);
				}
			}
		}



		function getBucketError(){
			callback({success: false, message: 'Unable to fetch tag data'});
		}

		function getBucketsError() {
			callback({success: false, message: 'Unable to fetch buckets'});
		}



	}

	function getLocationData(callback){

        var uri = "api/locations";


        var fetchLocations=[];

        $http.get(uri)
            .then(getLocationsSuccess, getLocationsError);

        function getLocationsSuccess(dataset){

            if(dataset && dataset.data.length>0){
                dataset.data.forEach(function(d){

                        var locationUri = "api/locations/data/" + d;
                        fetchLocations.push($http.get(locationUri));

                });

                $q.all(fetchLocations).then(getLocationDataSuccess, getLocationDataError)

            }

            function getLocationDataSuccess(data){

                var movementData=[];

                if(data && data.length>0){
                    data.forEach(function(animal){
                        if(animal && animal.data && animal.data.length>0){
                            animal.data.forEach(function(track){
                                if(track && track.locations && track.locations.length>0){
                                    track.locations.forEach(function(point){
                                        if(point && point.lat && point.long){
                                            movementData.push(point);
                                        }
                                    })
                                }

                            })
                        }
                    });
                }


                if(callback){
                    callback(movementData);
                }
            }

            function getLocationDataError(){
                console.log("Error in getting location data");
            }


        }

        function getLocationsError(){
            console.log("Error in getting Locations")
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
			template: '<div style="width:56vw; height: 500px" ><div id="loader" ng-if="activated" layout="column" style="height:100%" flex layout-align="center center"><md-progress-circular md-mode="indeterminate"  class="md-accent" ></md-progress-circular></div></div>',
			scope: {
				plotlyData: '=',
				plotlyLayout: '=',
				plotlyOptions: '=',
				plotlyAlerts: '=',
				plotlyWidth: '='
			},
			link: function(scope, element) {

				scope.activated=true;
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
					scope.activated=false;
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



homesteadApp.directive('plotlyDetailed', [
    '$window',
    function($window) {
        return {
            restrict: 'E',
            template: '<div style="width:95vw; height: 70vh" ><div id="loader" ng-if="activated" layout="column" style="height:100%" flex layout-align="center center"><md-progress-circular md-mode="indeterminate"  class="md-accent" ></md-progress-circular></div></div>',
            scope: {
                plotlyData: '=',
                plotlyLayout: '=',
                plotlyOptions: '=',
                plotlyAlerts: '=',
                plotlyWidth: '='
            },
            link: function(scope, element) {

                scope.activated=true;
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
                    scope.activated=false;
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