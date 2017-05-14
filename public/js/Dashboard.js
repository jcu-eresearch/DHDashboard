
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

function tagDataService($http, $q) {
	var service = {
		getAllTagData: getAllTagData,
		getTestData: getTestData
	};
	return service;

	function getAllTagData(callback) {

		var uri = "api/weights/buckets";

		var tagGraphs=[];
        var selectedTag;
        var allTags={};
        var weeklyTrace;
        var dict={};

		var layout = {
			title: "Daily Individual Weight Trend",
			yaxis: {title: "Weight (KG)"},
			showlegend: false
		};

		$http.get(uri)
			.then(getBucketsSuccess, getBucketsError);

		function getBucketsSuccess(buckets) {

			if(buckets && buckets.data && buckets.data.length>0){

				var fetchBuckets=[];
				buckets.data.forEach(function(bucket){

					

					var bucketUri = "api/weights/" + bucket;

					fetchBuckets.push($http.get(bucketUri));
					//$http.get(bucketUri)
					//	.then(getBucketSuccessConcat, getBucketError);


				});

				$q.all(fetchBuckets).then(getBucketSuccessConcat, getBucketError)


			}

		}

		function getBucketSuccessConcat(dataset){

			var results=[];
			if(dataset && dataset.length>0){

				dataset.forEach(function(d){
					if(d && d.data && d.data.weights)
					results=results.concat(d.data.weights)
				});

				
				if(callback){
					callback(results);
				}
			}
		}


		function configureTrace(color){
			return {
                x:[],
                y:[],
                mode: 'lines+markers',
                line:{
                    color: color,
                    shape: 'spline'
                },
                type: 'scatter'
            }
		}

		function getBucketSuccess(dataSet){
			if(dataSet && dataSet.data && dataSet.data.weights && dataSet.data.weights) {

			    
                formatDatePosted(dataSet.data.weights);

                var idGroup = groupById(dataSet.data.weights);
                var dateGroup = groupByDate(dataSet.data.weights);
                var tagDateGroup=groupByTag(dateGroup);
                var relevantTags={};


                var traceCounter=0;
                var tagDict={};

                for(var j=0; j<idGroup.length; j++) {


                    var d = idGroup[j];
                    if(d && d.length>0 && d[0].id!="-1") {//change from 0 to 1 for multiple weights
                        relevantTags[d[0].id]=true;
                    }
                    // remove the -1 tag
                    if(d[0] && d[0].id=='-1'){
                        removeTag(idGroup, j);
                        j--;
					}
					//Initialize the trace
					var trace=configureTrace('#66bb6a');
					var outlierTrace=configureTrace('#66bb6a');
					
                    if(d[0]){
                        trace["name"]=d[0].id+' weight';
                        trace.x.push(d[0].datePosted);
                        trace.y.push(d[0].weight);
                        traceCounter++;
                        tagDict[d[0].datePosted]=d[0].weight;
                    }
                    averageForDay(d, trace, outlierTrace, traceCounter, tagDict); //previously d and trace1

					var traces=[trace];
					if(d[0]) {
						tagGraphs.push({name:d[0].id, traces: traces, layout: layout});
						dict[d[0].id]={dict: tagDict, trace: trace};
						if(j==0)selectedTag=tagGraphs[j];
					}


                }

                

                sortTagGraphs(tagGraphs);

				if (callback) {

					
					var processedWeights={
						tagGraphs: tagGraphs,
						allTags: allTags,
						weeklyTrace: weeklyTrace,
						selectedTag: selectedTag
					};
					callback(processedWeights);
				}
/*
                var days=[];
                var relevantWeights= prepareHerdGraph(tagDateGroup, relevantTags, days);



                var totalWeights = {
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
						averageMultipleWeightsAndFilter(d);
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

                var thirdsTraces=[[],[],[]];
                binningByWeight(tagDateGroup, 3, thirdsTraces);

                var lowerThird = {
                    x: days,
                    y: thirdsTraces[0],
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
                    y: thirdsTraces[1],
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
                    y: thirdsTraces[2],
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

                var data = [totalWeights, lowerThird, middleThird, upperThird];


                allTags.traces=[totalWeights];
                allTags.layout=layout;

                allTags.thirdsTraces=[lowerThird, middleThird, upperThird];
                allTags.thirdsLayout=thirdsLayout;
                weeks=[];
                prepareWeeklyData(dateGroup, weeks);

                weeklyTrace= prepareWeeklyTrace(weeks, weeklyTrace);
*/

            }
		}


		function prepareHerdGraph(tagDateGroup, relevantTags, days){


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
                                        diff=currTag.dict[currTag.trace.x[z]];
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

            return relevantWeights;
		}

		function getBucketError(){
			callback({success: false, message: 'Unable to fetch tag data'});
		}

		function getBucketsError() {
			callback({success: false, message: 'Unable to fetch buckets'});
		}

		/** sort an array by tag **/
		function sortTagGraphs(tagGraphs){
            tagGraphs.sort(function(a, b){
                var keyA = a.name,
                    keyB = b.name;
                return keyA.localeCompare(keyB);
            });

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
			dataSet.forEach(function (d){
				d.datePosted = d.date.substring(0, d.date.length - 14);// previously date_posted and total_weight

			});
		}

		/** group the data by id **/
		function groupById(dataSet){
			var idGroup = groupBy(dataSet, function(item){
				return [item.id];
			});
			return idGroup;
		}

        function groupByDate(dataSet) {
            var dateGroup = groupBy(dataSet, function (item) {
                return [item.date_posted];
            });
            return dateGroup;
        }

        function groupByTag(dateGroup) {
            var tagDateGroup = [];
            dateGroup.forEach(function (d) {
                tagDateGroup.push(groupBy(d, function (item) {
                    return [item.id];
                }));
            });
            return tagDateGroup;
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

		/** remove a tag from the dataset **/
		function removeTag(group, index){
            var d=group[index];
            group.splice(index, 1);
		}

		/** take the average of multiple readings during one day **/
		function averageForDay (record, trace, outlierTrace, traceCounter, tagDict){
			for(var i=1; i<record.length; i++){

				var dt=record[i].datePosted, wt=record[i].weight, originalWeight=record[i].weight;



				//above or below the threshold weight
				if(record[i].qa_flag=="INVALID"){
                    outlierTrace.x.push(dt);
                    outlierTrace.y.push(originalWeight);
					continue;
				}

				//adjusting for outliers
				else if(record[i].qa_flag=="OUTLIER"){

				    var val =parseInt(record[i].qa_value);

					if(val>0)
						wt=wt+val;
					else
                        wt=wt-val;
				}

				//take average of multiple readings during one day-- only for dash not for the detailed weights
				if(traceCounter>0){
					var dupSum = trace.y[traceCounter - 1], index = i, count = 1;
					if (record[index].datePosted == record[index - 1].datePosted)
						while (record[index] && record[index].datePosted == record[index - 1].datePosted
						&& index < record.length && record[index]) {
							if(record[index].qa_flag=="VALID") {

                                dupSum += record[index].weight;
                                index++;
                                count++;
                            }
                            else if(record[index].qa_flag=="OUTLIER") {

								var adjustedWeight=record[index].weight;

                                //adjusting for outliers
                                if(record[index].qa_value>0)
                                    adjustedWeight=adjustedWeight-record[index].qa_value;
                                else
                                    adjustedWeight=adjustedWeight+record[index].qa_value;

                                dupSum += adjustedWeight;
                                index++;
                                count++;
                            }
							else{

								dupSum += record[index].weight;
								index++;
								count++;
							}
						}
					if (count > 1) {
						wt = dupSum / count;
						trace.y[traceCounter - 1] = wt;
						tagDict[record[index-1].datePosted] = wt;
						i = index - 1;
						continue;
					}
				}
				trace.x.push(dt);
				trace.y.push(wt);

                outlierTrace.x.push(dt);
                outlierTrace.y.push(originalWeight);

				traceCounter++;
				tagDict[dt] = wt;
			}
		}

		function binningByWeight(data, groups, traces){
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

        function averageMultipleWeightsAndFilter(data){
            if(data &&  data.length>0){
                data.forEach(function(e){
                    if(e && e.length>0){
                        var sum=0;
                        var count=0;
                        var average=0;
                        for(var i=0; i<e.length; i++){

                            sum+=e[i].weight;
                            count++;

                        }
                        if(count>0) average=sum/count;
                        else average=-1;
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

        function prepareWeeklyData(days, weeks){
            var millis=1000*60*60*24*7;
            var currentDate=new Date();
            if(days && days.length>0 && weeks) {
                for (var i =days.length-1; i>=0; i--){
                    var currentWeek={};
                    if(currentDate && !isNaN(currentDate.getTime()))
                        currentWeek={
                            start: new Date(currentDate.getTime()-millis),
                            aveWt:0,
                            count: 0,
                            data: [],
                            idGroups: []
                        };
                    var compareDate=null;
                    if(days[i]  && days[i][0])
                        compareDate= new Date(days[i][0].date);
                    while( days[i]  && days[i][0] && compareDate && currentDate && !isNaN(compareDate.getTime()) && !isNaN(currentDate.getTime())
                    && compareDate.getTime()>= (currentDate.getTime()-millis) && i>=0){
                        currentWeek.data=currentWeek.data.concat(days[i]);
                        i--;
                        if(days[i]  && days[i][0])
                            compareDate= new Date(days[i][0].date);
                    }
                    currentWeek.idGroups = groupBy(currentWeek.data, function(item){
                        return [item.id];
                    });
                    var weeklyAve=0; var weeklyCount=0;
                    if(currentWeek.idGroups) {
                        for (var y = 0; y < currentWeek.idGroups.length; y++) {
                            var tag=currentWeek.idGroups[y];
                            if(tag && tag[0] && tag[0].id=='-1'){
                                currentWeek.idGroups.splice(y,1);
                                y--;
                                continue;
                            }
                            var tagAve=0; var tagCount=0;
                            tag.forEach(function (t) {
                                if(t){
                                    tagAve+=t.weight; tagCount++;
                                }
                            });
                            if(tagCount>0)
                                tagAve/=tagCount;

                            if(tagAve>0){
                                weeklyAve+=tagAve;
                                weeklyCount++;
                            }

                        }
                        if(weeklyCount>0)
                            weeklyAve/=weeklyCount;
                    }
                    currentWeek.aveWt=weeklyAve;
                    currentWeek.count=weeklyCount
                    weeks.push(currentWeek);
                    if(currentDate && !isNaN(currentDate.getTime()))
                        currentDate=new Date(currentDate.getTime()-millis);
                    i++;
                    // compare with currentDate
                }
            }
        }

        function prepareWeeklyTrace(weeks, trace){
            var x=[];
            var y=[];
            var z=[];
            var text=[];
            var color=[];
            var opacity=[];

            if(weeks && weeks.length>0){
                for(var i=0; i< weeks.length; i++) {
                    if(weeks[i]) {
                        if(weeks[i].aveWt<=0) continue;
                        var weekStart=weeks[i].start.toISOString();
                        x.push(weeks[i].aveWt);
                        y.push(weekStart.substring(0, (weekStart.length - 14)));
                        z.push(weeks[i].count);
                        text.push('count: ' + weeks[i].count);

                        //rgba(93, 164, 214, 0.5) blue
                        // gba(255, 65, 54, 0.1) red pink
                        if(x.length==1){
                            color.push('rgba(93, 164, 214)');
                            opacity.push(0.5);
                        }
                        else if(x.length>1 && x[x.length-1]<x[x.length-2]){
                            color.push('rgba(255, 65, 54)');
                            opacity.push(0.1);
                        }
                        else{
                            color.push('rgba(93, 164, 214)');
                            opacity.push(0.5);
                        }
                    }
                }
            }
            var bubble = {
                x: y,
                y: x,
                text: text,

                mode: 'markers',
                marker: {
                    size: z
                }
            };
            var bubbleLayout = {
                title: "Weekly Herd Weight Average",
                yaxis: {
                    title: "Weight (KG)"
                }
            };
            trace={
                traces: [bubble],
                layout: bubbleLayout
            };
            return trace;
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