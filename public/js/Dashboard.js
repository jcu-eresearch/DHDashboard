
var homesteadApp = angular.module('homesteadApp', ['ngMaterial', 'ngMessages']);

homesteadApp.controller('AppCtrl', function($scope,  $mdBottomSheet, $mdToast, tagDataService) {

	$scope.tagList=[];
	$scope.selectedTag;
	$scope.allTags={};

	var thresholdWeight=500;

	$scope.layout = {

		title: "Individual Trend",
		yaxis: {title: "Weight (KG)"},
		showlegend: false
	};


	$scope.init=function(){

		tagDataService.getAllTagData(render);


		function render(apiData) {

			//Start Transformations
			var dataSet = apiData;


			if(!dataSet){
				console.log("No data available");
				return;
			}

			var map;
			function initMap() {
				map = new google.maps.Map(document.getElementById('map'), {
					center: {lat: -19.66574, lng: 146.8462},
					mapTypeId: 'hybrid',
					zoom:15
				});

				map.data.loadGeoJson('data/paddocks.json');

				var marker1 = new google.maps.Marker({
					position: {lat: -19.66882, lng: 146.864},
					map: map,
					title: "Spring Creek"
				});
				var marker2 = new google.maps.Marker({
					position: {lat: -19.657496, lng: 146.835306},
					map: map,
					title: "Digital Homestead"
				});
				var marker3 = new google.maps.Marker({
					position: {lat: -19.66574, lng: 146.8462},
					map: map,
					title: "Double Barrel"
				});
				var marker4 = new google.maps.Marker({
					position: {lat: -19.66872, lng: 146.8642},
					map: map,
					text: "Junction"
				});
			}
			initMap();

			dataSet.forEach(function(d) {
				d.date_posted  = d.date.substring(0, d.date.length - 14);
				d.total_weight = +d["weight"];
			});

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

			var idGroup = groupBy(dataSet, function(item){
				return [item.id];
			});

			$scope.tagGraphs=[];
			var dict={};

			for(var j=0; j<idGroup.length; j++){
				var d=idGroup[j];
				var trace1Counter=0;
				var trace1={
					x:[],
					y:[],
					mode: 'lines+markers',
					line:{
						color: '#66bb6a'
					}
				};
				var trace2={
					x:[],
					y:[],
					mode: 'lines'
				};
				var tagDict={};

				//remove all weights greater than the threshold weight
				for(var a=0; a<d.length; a++){
					if(d[a].total_weight>thresholdWeight){
						d.splice(a,1);
					}
				}

				if(d[0]){
					trace1["name"]=d[0].id+' weight';
					trace1.x.push(d[0].date_posted);
					trace1.y.push(d[0].total_weight);
					trace1Counter++;
					trace2["name"]=d[0].id+' change';
					trace2.x.push(d[0].date_posted);
					trace2.y.push(0);
					tagDict[d[0].date_posted]=d[0].total_weight;
				}
				for(var i=1; i<d.length; i++){
					var dt=d[i].date_posted, wt=d[i].total_weight,
						df=d[i].total_weight-d[i-1].total_weight;

					//duplicate readings
					if(trace1Counter>0) {
						var dupSum = trace1.y[trace1Counter - 1], index = i, count = 1;
						if (d[index].date_posted == d[index - 1].date_posted)
							while (d[index] && d[index].date_posted == d[index - 1].date_posted && index < d.length && d[index]) {
								dupSum += d[index].total_weight;
								index++;
								count++;
							}
						if (count > 1) {
							wt = dupSum / count;
							df = wt - d[i - 1].total_weight;
							trace1.y[trace1Counter - 1] = wt;
							tagDict[d[index-1].date_posted] = wt;
							trace2.y[i - 1] = df;
							i = index - 1;
							continue;
						}
					}


						trace1.x.push(dt);
						trace1.y.push(wt);
						trace1Counter++;
						trace2.x.push(dt);
						trace2.y.push(df);
						tagDict[dt] = wt;

				}

				if(trace1.y && trace1.x)
					for(var a=0; a<trace1.y.length; a++){
						if(trace1.y[a]>thresholdWeight){
							trace1.y.splice(a,1);
							trace1.x.splice(a,1);
						}
					}

				var traces=[trace1 /*, trace2*/];

				if(d[0]) {
					$scope.tagGraphs.push({name:d[0].id, traces: traces, layout: $scope.layout});
					dict[d[0].id]={dict: tagDict, trace: trace1};
					if(j==0)$scope.selectedTag=$scope.tagGraphs[j];
				}

			}

			//New Code The Tags with 2 weights
			var relevantTags={};
			for(var j=0; j<idGroup.length; j++){
				var d=idGroup[j];

				if(d && d.length>1 && d[0].id!="-1") {
					//these are the ones with multiple
					relevantTags[d[0].id]=true;
				}
			}

			var dateGroup = groupBy(dataSet, function(item){
				return [item.date_posted];
			});

			var tagDateGroup=[];
			dateGroup.forEach(function(d) {
				tagDateGroup.push(groupBy(d, function(item){
					return [item.id];
				}));
			});


			var days=[];
			var weights=[];
			var diffs=[];

			// New Code
			var relevantWeights=[];
			var tagDetails=[];
			var herdTrendDays={relevant: {}};


			tagDateGroup.forEach(function(d) {

				if(d[0][0]) {
					days.push(d[0][0].date_posted);
					herdTrendDays.relevant[d[0][0].date_posted]=false;
				}
				else
					return;

				var sumWeight=0;
				var count=0;

				//New Code
				var sumWeightTrend=0;
				var countTrend=0;

				var tagNamesForDay={};

				if(d[0][0].date_posted)
					tagNamesForDay[d[0][0].date_posted]=[];

				d.forEach(function(e) {//e is the tag
					if(e[0]) {

						var aveTagWeight=0;
						var readingCount=0;

						//take the average of duplicates
						e.forEach( function(f){ //when e has more than one reading that day
							aveTagWeight+=f.total_weight;
							readingCount++;
						});
						if(readingCount>1)
							aveTagWeight=aveTagWeight/readingCount;

						sumWeight += aveTagWeight;
						count++;

						//New Code
						if(relevantTags[e[0].id]){
							//(today -lastday)/number of days


							var currTag=dict[e[0].id];
							var diff=aveTagWeight;
							var days=1;

							var last;
							if(currTag.trace.x)
							for(var z=0; z<currTag.trace.x.length; z++){
								if(currTag.trace.x[z]==e[0].date_posted && z>0 ){


									last=currTag.dict[currTag.trace.x[z-1]];
									diff=currTag.dict[currTag.trace.x[z]];

									var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
									var firstDate = new Date(currTag.trace.x[z]);
									var secondDate = new Date(currTag.trace.x[z-1]);

									var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));

									diff=diff-last;
									if(diffDays>1)
										diff=diff/diffDays;

									sumWeightTrend+=diff;
									herdTrendDays.relevant[d[0][0].date_posted]=true;
									tagNamesForDay[d[0][0].date_posted].push({date: d[0][0].date_posted,
										tag: e[0].id, change: diff});
									countTrend++;
								}

							}

						}
					}
				});
				if(count>0)
					sumWeight=sumWeight/count;
				weights.push(sumWeight);

				if(countTrend>0) {
					sumWeightTrend = sumWeightTrend / countTrend;
					tagDetails.push(tagNamesForDay);
					relevantWeights.push(sumWeightTrend);
				}
				if(!herdTrendDays.relevant[d[0][0].date_posted]){
					if(days[days.length-1] && days[days.length-1]==d[0][0].date_posted)
						days.splice(days.length-1, 1);
				}
			});

			diffs.push(0);
			for(var i=1; i<weights.length; i++){
				diffs.push(weights[i]-weights[i-1]);
			}

			var total_weights = {
				x: days,
				//changed
				y: relevantWeights,
				mode: 'lines+markers',
				name: "Ave Wt",
				line:{
					color: '#66bb6a'
				}
			};

			var difference = {
				x: days,
				y: diffs,
				mode: 'lines',
				name: "Wt Change"
			};

			var layout = {
				
				title: "Herd Trend",
				yaxis: {title: "Weight (KG)"},
				showlegend: false
			};

			var data = [ total_weights/*, difference*/ ];

			$scope.allTags.traces=data;
			$scope.allTags.layout=layout;

		};

	};

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

	$scope.init();
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
			template: '<div style="width:38vw; height: 40vh" ></div>',
			scope: {
				plotlyData: '=',
				plotlyLayout: '=',
				plotlyOptions: '=',
				plotlyAlerts: '='
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