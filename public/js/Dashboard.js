
var homesteadApp = angular.module('homesteadApp', ['ngMaterial', 'ngMessages', 'ngRoute','ui.slider', 'gridster', 'nvd3']);

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
		})

		.when('/trends', {
			templateUrl : 'pages/trends.html',
			controller  : 'trendsController'
		});
});

homesteadApp.controller('AppCtrl', function($scope,  $mdBottomSheet, $mdToast, tagDataService, $rootScope, $location, $mdDialog) {

	$scope.alerts=false;

    $scope.navItems = {
        selected: null,
        items : [
            {name: "dash", ref:"#/", icon: "fa fa-dashboard", badge: "icon-bg rad-bg-success", text: "Dashboard"},
            {name: "map", ref:"#map",  icon: "fa fa-map-marker", badge: "icon-bg rad-bg-danger", text: "Movement"},
            {name: "detailed", ref:"#detailed",  icon: "fa fa-bar-chart-o", badge: "icon-bg rad-bg-warning", text: "Details" },
			{name: "trends", ref:"#trends",  icon: "fa fa-line-chart", badge: "icon-bg rad-bg-primary", text: "Trends" }
        ],
		returnIndex: function (loc) {
			if(loc=="/") return 0;
			else if(loc=="/map") return 1;
			else if(loc=="/detailed") return 2;
			else if (loc=="/trends") return 3;
        }
    };

    $scope.$on('alerts', function(){
       $scope.alerts=true;
    });

	$scope.currentNavItem='dash';

	$rootScope.$on('$routeChangeSuccess', function(event, current) {
		if(current && current.$$route && current.$$route.originalPath && current.$$route.originalPath.length>1) {

            var currentPath=$location.path();
            $scope.navItems.selected = $scope.navItems.items[$scope.navItems.returnIndex(currentPath)];

        }
		else {
            $scope.navItems.selected = $scope.navItems.items[0];
        }
	});

	$scope.showLiveData = function(){
		$scope.alert = '';
		$mdDialog.show({
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

    $(".rad-toggle-button").on('click', function() {
        $(".rad-logo-container").toggleClass("rad-nav-min");
        $(".rad-sidebar").toggleClass("rad-nav-min");
        $(".rad-body-wrapper").toggleClass("rad-nav-min");
    });

});

homesteadApp.controller('LiveDataCtrl', function($scope, $mdBottomSheet){});

homesteadApp.factory('tagDataService', tagDataService);

function tagDataService($http, $q) {

	var service = {
		getAllTagData: getAllTagData,
		//getTestData: getTestData,
        getLocationData: getLocationData,
        getStaticFile: getStaticFile,
		getHeartBeat: getHeartBeat
	};
	return service;

	function getHeartBeat(callback){

        $http.get('api/status/heartbeat').success(getStaticSuccess,getStaticError);

        function getStaticSuccess(results){

            if(callback){
                callback(results);
            }
        }

        function getStaticError(){
            console.log("Error getting the heartbeat");
        }

	}
    function getStaticFile(callback) {
        $http.get('/dh/weightsData.jsonz').success(getStaticSuccess,getStaticError);
        //$http.get('data/staticFileTest.json').success(getStaticSuccess,getStaticError);

        function getStaticSuccess(results){
            if(callback){
                callback(results);
            }
        }
        function getStaticError(){
        	console.log("Error getting the data");
        }
    }

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
                    if(a && a.config && a.config.url && b && b.config && b.config.url){
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

}


homesteadApp.factory('detailedTagDataService', function() {
    var tagData = null;

    var addTagData = function(newObj) {
        tagData=newObj;
    };

    var getTagData = function(){
        return tagData;
    };

    return {
        addTagData: addTagData,
        getTagData: getTagData
    };

});


homesteadApp.directive('plotly', [
	'$window',
	function($window) {
		return {
			restrict: 'E',
			template: '<div class="dashboard-graphs"  ><div id="loader" ng-if="activated" layout="column" style="height:100%" flex layout-align="center center"><md-progress-circular md-mode="indeterminate"  class="md-accent" ></md-progress-circular></div></div>',
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
            template: '<div class="dashboard-graphs" ><div id="loader" ng-if="activated" layout="column" style="height:100%" flex layout-align="center center"><md-progress-circular md-mode="indeterminate"  class="md-accent" ></md-progress-circular></div></div>',
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
