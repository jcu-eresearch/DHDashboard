
var homesteadApp = angular.module('homesteadApp', ['ngMaterial', 'ngMessages']);

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



homesteadApp.controller('AppCtrl', function($scope,  $mdBottomSheet, $mdToast, tagDataService) {

	$scope.currentNavItem = 'page1';
	$scope.tagList=[];
	$scope.selectedTag;
	$scope.tagGraphs=[];
	$scope.allTags={};

	var thresholdWeight=500;

	$scope.initMap=function() {
		var map
		map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: -19.66574, lng: 146.8462},
			mapTypeId: 'hybrid',
			zoom:9
		});

		//map.data.loadGeoJson('data/paddocks.json');

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

	$scope.layout = {
		title: "Daily Individual Weight Trend",
		yaxis: {title: "Weight (KG)"},
		showlegend: false
	};


	$scope.init=function(){

		tagDataService.getAllTagData(render);

		function render(apiData) {

			$scope.initMap();

			var dataSet = apiData;

			if(!dataSet){
				console.log("No data available");
				return;
			}

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

			var dict={};

			//Individual Graphs
			for(var j=0; j<idGroup.length; j++){
				var d=idGroup[j];


				if(d[0] && d[0].id=='-1') {
					idGroup.splice(j, 1);
					j--;
					continue;

				}

				var trace1Counter=0;
				var trace1={
					x:[],
					y:[],
					mode: 'lines+markers',
					line:{
						color: '#66bb6a',
						shape: 'spline'
					},
					type: 'scatter'
				};
				var tagDict={};
				//remove all weights greater than the threshold weight

				for(var a=0; a<d.length; a++){
					if(d[a] && d[a].total_weight>thresholdWeight  ){
						d.splice(a,1);
						a--;
					}
				}
				if(d[0]){
					trace1["name"]=d[0].id+' weight';
					trace1.x.push(d[0].date_posted);
					trace1.y.push(d[0].total_weight);
					trace1Counter++;
					tagDict[d[0].date_posted]=d[0].total_weight;
				}
				for(var i=1; i<d.length; i++){
					var dt=d[i].date_posted, wt=d[i].total_weight;
					//take average of multiple readings during one day
					if(trace1Counter>0){
						var dupSum = trace1.y[trace1Counter - 1], index = i, count = 1;
						if (d[index].date_posted == d[index - 1].date_posted)
							while (d[index] && d[index].date_posted == d[index - 1].date_posted
								&& index < d.length && d[index]) {
								dupSum += d[index].total_weight;
								index++;
								count++;
							}
						if (count > 1) {
							wt = dupSum / count;
							trace1.y[trace1Counter - 1] = wt;
							tagDict[d[index-1].date_posted] = wt;
							i = index - 1;
							continue;
						}
					}
					trace1.x.push(dt);
					trace1.y.push(wt);

					trace1Counter++;
					tagDict[dt] = wt;
				}
				//check the threshold again
				if(trace1.y && trace1.x) {
					for (var a = 0; a < trace1.y.length; a++) {
						if (trace1.y[a] > thresholdWeight) {
							trace1.y.splice(a, 1);
							trace1.x.splice(a, 1);
						}
					}
				}
				var traces=[trace1];
				if(d[0]) {
					$scope.tagGraphs.push({name:d[0].id, traces: traces, layout: $scope.layout});
					dict[d[0].id]={dict: tagDict, trace: trace1};
					if(j==0)$scope.selectedTag=$scope.tagGraphs[j];
				}
			}

			//sorting the tags
			$scope.tagGraphs.sort(function(a, b){
				var keyA = a.name,
					keyB = b.name;
				return keyA.localeCompare(keyB);
			});

			//Tags with 2 weights
			var relevantTags={};
			for(var j=0; j<idGroup.length; j++){
				var d=idGroup[j];
				if(d && d.length>0 && d[0].id!="-1") {//change from 0 to 1 for multiple weights
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
			var relevantWeights=[];
			var tagDetails=[];
			var herdTrendDays={relevant: {}};

			
			//Herd Graph
			tagDateGroup.forEach(function(d) {
				if(d[0][0]) {
					days.push(d[0][0].date_posted);
					herdTrendDays.relevant[d[0][0].date_posted]=false;
				}
				else return;

				var sumWeightTrend=0;
				var countTrend=0;
				var tagNamesForDay={};

				if(d[0][0].date_posted)
					tagNamesForDay[d[0][0].date_posted]=[];

				d.forEach(function(e) {//e is the tag

					if(e[0]) {
						if(relevantTags[e[0].id]){

							var currTag=dict[e[0].id];
							var diff;
							//var last;
							if(currTag.trace.x)
							for(var z=0; z<currTag.trace.x.length; z++){
								if(currTag.trace.x[z]==e[0].date_posted /*&& z>0*/ ){

									//last=currTag.dict[currTag.trace.x[z]];//change to z-1
									diff=currTag.dict[currTag.trace.x[z]];

									/*var oneDay = 24*60*60*1000;
									var firstDate = new Date(currTag.trace.x[z]);
									var secondDate = new Date(currTag.trace.x[z-1]);
									var diffDays =
										Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
									diff=diff-last;
									if(diffDays>1)
										diff=diff/diffDays;
									*/

									sumWeightTrend+=diff;
									herdTrendDays.relevant[d[0][0].date_posted]=true;
									tagNamesForDay[d[0][0].date_posted].push({
										date: d[0][0].date_posted,
										tag: e[0].id,
										change: diff
									});
									countTrend++;
								}
							}
						}
					}
				});

				if(countTrend>0) {
					sumWeightTrend = sumWeightTrend/countTrend;
					tagDetails.push(tagNamesForDay);
					relevantWeights.push(sumWeightTrend);
				}
				if(!herdTrendDays.relevant[d[0][0].date_posted]){
					if(days[days.length-1] && days[days.length-1]==d[0][0].date_posted)
						days.splice(days.length-1, 1);
				}
			});

			var total_weights = {
				x: days,
				y: relevantWeights,
				mode: 'lines+markers',
				name: "Ave Wt",
				line:{
					color: '#66bb6a',
					shape: 'spline'
				},
				type: 'scatter'
			};

			var layout = {
				title: "Daily Herd Weight Trend",
				yaxis: {title: "Weight (KG)"},
				showlegend: false
			};

			tagDateGroup.forEach(function(d){
				if(d[0] && d[0][0]){

					$scope.averageMultipleWeightsAndFilter(d);
				}
			});

			tagDateGroup.forEach(function(d){
				if(d[0] && d[0][0]){

					d.sort(function(a, b){
						var keyA = a[0].weight,
							keyB = b[0].weight;
						if(keyA < keyB) return -1;
						if(keyA > keyB) return 1;
						return 0;
					});
				}
			});

			$scope.thirdsTraces=[[],[],[]];
			$scope.binningByWeight(tagDateGroup, 3, $scope.thirdsTraces);

			var lowerThird = {
				x: days,
				y: $scope.thirdsTraces[0],
				mode: 'lines+markers',
				name: "Ave: Lower 1/3",
				line:{
					color: 'rgba(255, 65, 54, 0.2)',
					shape: 'spline'
				},
				fill: "tonexty",
				fillcolor: "rgba(255, 65, 54, 0.1)",
				type: 'scatter'
			};

			var middleThird = {
				x: days,
				y: $scope.thirdsTraces[1],
				mode: 'lines+markers',
				name: "Ave: Middle 1/3",
				line:{
					color: 'rgba(44, 160, 101, 0.5)',
					shape: 'spline'
				},
				fill: "tonexty",
				fillcolor: "rgba(44, 160, 101, 0.4)",
				type: 'scatter'
			};

			var upperThird = {
				x: days,
				y: $scope.thirdsTraces[2],
				mode: 'lines+markers',
				name: "Ave: Upper 1/3",
				fill: "tonexty",
				fillcolor: "rgba(93, 164, 214, 0.3)",
				line:{
					color: 'rgba(93, 164, 214, 0.5)',
					shape: 'spline'
				},
				type: 'scatter'
			};

			var thirdsLayout = {
				title: "Daily Herd Weight Average: Thirds",
				yaxis: {
					title: "Weight (KG)",
					range: [300, 500]
				},
				showlegend: true,
				legend: {"orientation": "h"}
			};

			var data = [total_weights, lowerThird, middleThird, upperThird];

			$scope.allTags.traces=[total_weights];
			$scope.allTags.layout=layout;

			$scope.allTags.thirdsTraces=[lowerThird, middleThird, upperThird];
			$scope.allTags.thirdsLayout=thirdsLayout;



		};

	};



	$scope.init();

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

	$scope.binningByWeight= function(data, groups, traces){
		data.forEach(function(d){
			if(d[0] && d[0][0] && d.length>0){

				var bin=Math.floor(d.length/groups);

				if(traces && traces.length>2) {

					var index0=traces[0].length;
					var index1=traces[1].length;
					var index2=traces[2].length;

					var count0=0;
					var count1=0;
					var count2=0;

					for (var i = 0; i < d.length; i++) {
						if (i == 0) {traces[0].push(d[i][0].weight); count0++;}
						else if (i < bin) {traces[0][index0] += d[i][0].weight; count0++;}
						else if (i == bin ) {traces[1].push(d[i][0].weight); count1++;}
						else if (i < 2 * bin) {traces[1][index1] += d[i][0].weight; count1++;}
						else if (i == 2 * bin || bin==0) {traces[2].push(d[i][0].weight); count2++;}
						else if (i < d.length) {traces[2][index2] += d[i][0].weight; count2++;}
					}

					if(traces[0][index0] && count0>0) traces[0][index0]/=count0; else traces[0][index0]=NaN;
					if(traces[1][index1] && count1>0) traces[1][index1]/=count1; else traces[1][index1]=NaN;
					if(traces[2][index2] && count2>0) traces[2][index2]/=count2; else traces[2][index2]=NaN;
				}
			}
		});
	}

	$scope.averageMultipleWeightsAndFilter= function(data){


		if(data &&  data.length>0){
			data.forEach(function(e){
				if(e && e.length>0){

					var sum=0;
					var count=0;
					var average=0;
					for(var i=0; i<e.length; i++){
						if(e[i].weight<=thresholdWeight){
							sum+=e[i].weight;
							count++;
						}
					}

					if(count>0){
						average=sum/count;
					}
					else{
						//no data for this tag so remove this tag
						average=-1;
					}

					e[0].weight=average; //total_weight is still the old one?
					e.splice(1, e.length-1);
				}
			});

			for(var j=0; j< data.length; j++){
				if(data[j] && data[j].length && data[j].length>0){
					if(data[j][0].weight==-1 || data[j][0].id=='-1'){
						data.splice(j,1);
						j--;
					}
				}
			}

		}
	}

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
			template: '<div style="width:56vw; height: 70vh" ></div>',
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