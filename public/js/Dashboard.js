
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
		debugger;

		var uri = "api/weights/buckets";

		$http.get(uri)
			.then(getBucketsSuccess, getBucketsError);

		function getBucketsSuccess(buckets) {
			debugger;

			if(buckets && buckets.data && buckets.data.length>0){
				buckets.data.forEach(function(bucket){
					var bucketUri = "api/weights/" + bucket;

					$http.get(bucketUri)
						.then(getBucketSuccess, getBucketError);
				});
			}
			//if (callback && resp.data) {
			//	callback(resp.data);
			//}
		}

		function getBucketSuccess(dataSet){
			debugger;
			if(dataSet && dataSet.data && dataSet.data.weights && dataSet.data.weights)
				formatDatePosted(dataSet.data.weights);
		}

		function getBucketError(){
			callback({success: false, message: 'Unable to fetch tag data'});
		}

		function getBucketsError() {
			callback({success: false, message: 'Unable to fetch buckets'});
		}

		/** utility function for grouping data by different fields **/
		function groupBy( array , f ){
			var groups = {};
			array.forEach( function( o ){
				var group = JSON.stringify( f(o) );
				groups[group] = groups[group] || [];
				groups[group].push( o );
			});
			return Object.keys(groups).map( function( group ){
				return groups[group];
			})
		}

		/** add a field called datePosted which is the day that the record was posted **/
		function formatDatePosted(dataSet){
			debugger;
			dataSet.forEach(function (d){
				d.datePosted = d.date.substring(0, d.date.length - 14);
				d.totalWeight = +d["weight"];
			});
		}

		/** group the data by id **/
		function groupById(dataSet){
			var idGroup = groupBy(dataSet, function(item){
				return [item.id];
			});
			return idGroup;
		}

		/** Configure the individual traces for the tags **/
		function configureTagTraces(dataSet){
		}

		/** check and remove the -1 tag **/
		function checkTagId(records, record, index){
			if(record && record[0] && record[0].id=='-1') {
				records.splice(index, 1);
				return true;
			}
			return false;
		}

		/** remove all weights greater than the threshold weight **/
		function removeAboveThreshold (record, thresholdWeight){
			if(record && record.length>0) {
				for (var i = 0; i < record.length; i++) {
					if (record[i] && record[i].total_weight > thresholdWeight) {
						record.splice(i, 1);
						i--;
					}
				}
			}
		}

		/** Initialize the trace for a tag **/
		function initTrace(record, trace, traceCounter, tagDict){
			if(record && record.length>0 && record[0]){
				trace["name"]=record[0].id+' weight';
				if(trace && trace.x && trace.y) {
					trace.x.push(record[0].date_posted);
					trace.y.push(record[0].total_weight);
					traceCounter++;

					tagDict[record[0].date_posted] = record[0].total_weight;
				}
			}
			return traceCounter;
		}

		/** take the average of multiple readings during one day **/
		function averageForDay (record, trace, traceCounter, tagDict){
			for(var i=1; i<record.length; i++){
				var dt=record[i].date_posted, wt=record[i].total_weight;
				//take average of multiple readings during one day
				if(traceCounter>0){
					var dupSum = trace.y[traceCounter - 1], index = i, count = 1;
					if (record[index].date_posted == record[index - 1].date_posted)
						while (record[index] && record[index].date_posted == record[index - 1].date_posted
						&& index < record.length && record[index]) {
							dupSum += record[index].total_weight;
							index++;
							count++;
						}
					if (count > 1) {
						wt = dupSum / count;
						trace.y[traceCounter - 1] = wt;
						tagDict[record[index-1].date_posted] = wt;
						i = index - 1;
						continue;
					}
				}
				trace.x.push(dt);
				trace.y.push(wt);

				traceCounter++;
				tagDict[dt] = wt;
			}
		}

		/** Configure Tag Graphs **/
		function configureTagGraphs(record, traces, trace, layout, dict, tagDict, tagGraphs){
			if(record && record.length>0 && record[0]){
				tagGraphs.push({name:record[0].id, traces: traces, layout: layout});
				dict[record[0].id]={dict: tagDict, trace: trace};
			}
			//set up a preselected tag
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