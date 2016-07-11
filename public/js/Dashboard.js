
var homesteadApp = angular.module('homesteadApp', ['ngMaterial', 'ngMessages']);

homesteadApp.controller('AppCtrl', function($scope,  tagDataService) {

	$scope.tagList=[];
	$scope.selectedTag;
	$scope.allTags={};

	$scope.layout = {
		height: 250,
		title: "Tag Weight and Change in Weight",
		yaxis: {title: "Weight (KG)"},
		showlegend: false
	};

	$scope.init=function(){

		tagDataService.getAllTagData(render);
		function render(apiData) {

			mapboxgl.accessToken = 'pk.eyJ1Ijoic2FpcmFrIiwiYSI6ImNpcWFkeHZvZjAxcGNmbmtremEwNmV5ajkifQ.cOseeBhCXFdDPp06el09yQ';
			var map = new mapboxgl.Map({
				container: 'map', // container id
				style: 'mapbox://styles/mapbox/streets-v9', //stylesheet location
				center: [146.864, -19.66882], // starting position
				zoom: 8 // starting zoom
			});

			map.on('style.load', function() {
				map.addSource("markers", {
					"type": "geojson",
					"data": {
						"type": "FeatureCollection",
						"features": [{
							"type": "Feature",
							"geometry": {
								"type": "Point",
								"coordinates": [146.835306, -19.657496]
							},
							"properties": {
								"title": "Digital Homestead",
								"marker-symbol": "marker-15"
							}
						},
							{
								"type": "Feature",
								"geometry": {
									"type": "Point",
									"coordinates": [146.864, -19.66882]
								},
								"properties": {
									"title": "Spring Creek",
									"marker-symbol": "marker-15"
								}
							},
							{
								"type": "Feature",
								"geometry": {
									"type": "Point",
									"coordinates": [146.8462,  -19.66574]
								},
								"properties": {
									"title": "Double Barrel",
									"marker-symbol": "marker-15"
								}
							},
							{
								"type": "Feature",
								"geometry": {
									"type": "Point",
									"coordinates": [146.8642,  -19.66872]
								},
								"properties": {
									"title": "Junction",
									"marker-symbol": "marker-15"
								}
							}
						]
					}
				});

				map.addLayer({
					"id": "markers",
					"type": "symbol",
					"source": "markers",
					"layout": {
						"icon-image": "{marker-symbol}",
						"text-field": "{title}",
						"text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
						"text-offset": [0, 0.6],
						"text-anchor": "top"
					},
					"paint": {

					}
				});
			});

			map.addControl(new mapboxgl.Navigation());

			var layerList = document.getElementById('menu');
			var inputs = layerList.getElementsByTagName('input');

			function switchLayer(layer) {
				var layerId = layer.target.id;
				map.setStyle('mapbox://styles/mapbox/' + layerId + '-v9');
			}

			for (var i = 0; i < inputs.length; i++) {
				inputs[i].onclick = switchLayer;
			}

			//Start Transformations
			var dataSet = apiData;

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

			for(var j=0; j<idGroup.length; j++){
				var d=idGroup[j];
				var trace1={
					x:[],
					y:[],
					mode: 'lines'
				};
				var trace2={
					x:[],
					y:[],
					mode: 'lines'
				};
				if(d[0]){
					trace1["name"]=d[0].id+' weight';
					trace1.x.push(d[0].date_posted);
					trace1.y.push(d[0].total_weight);
					trace2["name"]=d[0].id+' change';
					trace2.x.push(d[0].date_posted);
					trace2.y.push(0);
				}
				for(var i=1; i<d.length; i++){
					var dt=d[i].date_posted, wt=d[i].total_weight,
						df=d[i].total_weight-d[i-1].total_weight;

					//duplicate readings
					var dupSum=trace1.y[i-1], index=i, count=1;
					if(d[index].date_posted== d[index-1].date_posted)
						while(d[index] && d[index].date_posted== d[index-1].date_posted && index<d.length && d[index]){
							dupSum+=d[index].total_weight;
							index++; count++;
						}
					if(count>1){
						wt=dupSum/count;
						df=wt-d[i-1].total_weight;
						trace1.y[i-1]=wt;
						trace2.y[i-1]=df;
						i=index-1;
						continue;
					}

					trace1.x.push(dt);
					trace1.y.push(wt);
					trace2.x.push(dt);
					trace2.y.push(df);
				}
				var traces=[trace1, trace2];

				if(d[0]) {
					$scope.tagGraphs.push({name:d[0].id, traces: traces, layout: $scope.layout});
					if(j==0)$scope.selectedTag=$scope.tagGraphs[j];
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
			tagDateGroup.forEach(function(d) {
				if(d[0][0])
					days.push(d[0][0].date_posted);
				var sumWeight=0;
				var count=0;
				d.forEach(function(e) {
					if(e[0]) {

						var aveTagWeight=0;
						var readingCount=0;

						//take the average of duplicates
						e.forEach( function(f){
							aveTagWeight+=f.total_weight;
							readingCount++;
						});
						if(readingCount>1)
							aveTagWeight=aveTagWeight/readingCount;

						sumWeight += aveTagWeight;
						count++;
					}
				});
				if(count>0)
					sumWeight=sumWeight/count;
				weights.push(sumWeight);
			});

			diffs.push(0);
			for(var i=1; i<weights.length; i++){
				diffs.push(weights[i]-weights[i-1]);
			}

			var total_weights = {
				x: days,
				y: weights,
				mode: 'lines',
				name: "Ave Wt"
			};

			var difference = {
				x: days,
				y: diffs,
				mode: 'lines',
				name: "Wt Change"
			};

			var layout = {
				height: 250,
				title: "Average Herd Weight and Change in Weight",
				yaxis: {title: "Weight (KG)"},
				showlegend: false
			};

			var data = [ total_weights, difference ];

			$scope.allTags.traces=data;
			$scope.allTags.layout=layout;

		};
	}

	$scope.init();
});

homesteadApp.factory('tagDataService', tagDataService);

function tagDataService($http) {
	var service = {
		getAllTagData: getAllTagData
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
}

homesteadApp.directive('plotly', [
	'$window',
	function($window) {
		return {
			restrict: 'E',
			template: '<div style="width:40vw" ></div>',
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
