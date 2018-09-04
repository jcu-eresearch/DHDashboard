homesteadApp.controller('dashController', function($scope, $timeout, $mdDialog, tagDataService, detailedTagDataService) {

    $scope.slides =[];
    $scope.title = "Title";
    $scope.location = "Location";
    $scope.sliderAvatar = "";
    $scope.status = "Stock Status";
    $scope.includeLiveData = true;

    $scope.data= {
        markers : [],
        stationMapping : [],
        center : {"lat": -19.665, "lng": 146.855},
        paddocks : "data/paddocks.json",
        initialZoom : 14,
        maxZoom : 8
    };


    //setting up the location and map markers
    $scope.configureSettings = function (data){
        if(data) {
            $scope.data = data;
            $scope.slides= data.slides;
            $scope.title = data.title;
            $scope.status = data.status;
            $scope.location = data.location;
            $scope.sliderAvatar = data.sliderAvatar;
            $scope.includeLiveData = data.includeLiveData;
        }



    };

    tagDataService.getConfigFile($scope.configureSettings);

    $scope.currentNavItem = 'page1';
    $scope.allTags={};
    var map;


    $scope.initDashMap=function() {

        var stationMarkers = $scope.data.markers;
        var center = $scope.data.center;
        var paddocks = $scope.data.paddocks;

        map = new google.maps.Map(document.getElementById('map'), {
            center: center,
            mapTypeId: 'hybrid',
            zoom: $scope.data.initialZoom,
            scrollwheel:  false
        });

        map.data.setStyle({
            strokeColor: '#66bb6a',
            fillColor: '#66bb6a',
            fillOpacity: 0.1,
            strokeWeight: 3
        });

        map.data.loadGeoJson(paddocks);

        var markers = [];

        if (stationMarkers && stationMarkers.length>0){

            stationMarkers.forEach(function(m){

                var marker1 = new google.maps.Marker({
                    position: m.position,
                    map: map,
                    title: m.title
                });

                var marker11 = new google.maps.Marker({
                    position: m.position,
                    map: map,
                    label: {
                        text: m.title,
                        color: "white"
                    },
                    title: m.title,
                    icon: {
                        labelOrigin: new google.maps.Point(m.labelLeft, m.labelTop),
                        url: 'default_marker.png',
                        size: new google.maps.Size(22, 40),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(11, 40),
                    }
                });

                markers.push(marker1);
                markers.push(marker11);

            })
        }

        var maxZoom = $scope.data.maxZoom;
        map.addListener( 'zoom_changed', function() {
            var zoom = map.getZoom();

            // iterate over markers and call setVisible
            for (var i = 1; i < markers.length; i++) {
                markers[i].setVisible(zoom >= maxZoom);
            }

            if(zoom< maxZoom){
                map.data.setStyle({
                    visible: false
                });
            }
            else{

                map.data.setStyle({
                    strokeColor: '#66bb6a',
                    fillColor: '#66bb6a',
                    fillOpacity: 0.1,
                    strokeWeight: 2,
                    visible: true
                });
            }

        });
    };

    $scope.layout = {
        title: "Daily Individual Weight Trend",
        yaxis: {title: "Weight (KG)"},
        showlegend: false
    };

    var chart = {
        chart: {
            type: 'pieChart',
            showLabels: false,
            height: 400,
            donut: true,
            color : [ '#D9DD81', '#E67A77',  '#95D7BB'],
            x: function(d){return d['key'];},
            y: function(d){return Math.round(d['y']);},
            valueFormat: d3.format('d')
            }
    };



    $scope.data={};

    var chart1 = {
        chart: {
            type: 'pieChart',
            showLabels: false,
            donut: true,
            height: 400,
            color : [  '#D9DD81', '#79D1CF', '#95D7BB'],
            x: function(d){return d['key'];},
            y: function(d){return d['y'];}
        }
    };

    $scope.data1={};



    $scope.init=function(){

        $scope.chart=chart;
        $scope.chart1=chart1;


        nv.utils.windowResize((function(scope){
            return function(){
            if(scope && scope.chart && scope.chart.api) {
                scope.chart.api.update();
                scope.chart1.api.update();
            }
                }
        })($scope));

        $timeout(function(){$scope.initDashMap();});

        function msToTime(duration) {
            var milliseconds = parseInt((duration%1000)/100)
                , seconds = parseInt((duration/1000)%60)
                , minutes = parseInt((duration/(1000*60))%60)
                , hours = parseInt((duration/(1000*60*60))%24);

            hours = (hours < 10) ? "0" + hours : hours;
            minutes = (minutes < 10) ? "0" + minutes : minutes;
            seconds = (seconds < 10) ? "0" + seconds : seconds;

            return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
        }

        $scope.lastHeartbeat = "00:00";
        $scope.lastLocation="None";
        tagDataService.getHeartBeat(setHeartBeat);

        function compare(a,b) {
            if(a && a.last_heartbeat && b && b.last_heartbeat ){

                var ai=parseInt(a.last_heartbeat);
                var bi=parseInt(b.last_heartbeat);
                return ai - bi;
            }
        }

        function setHeartBeat(data){
            if(data && data.length>0) {

                data.sort(compare);
                var last=data[0];
                $scope.lastHeartbeat = msToTime(last.last_heartbeat);
                var loc="";

                for (var i =0; i< $scope.data.stationMapping.length; i++){

                    if(last.tag_id== $scope.data.stationMapping[i].tag ){
                        loc=  $scope.data.stationMapping[i].location;
                    }
                }

                /* if(last.tag_id=="110177")loc="Spring Creek";
                if(last.tag_id=="110171")loc="Double Barrel";
                if(last.tag_id=="110163")loc="Junction";*/

                $scope.lastLocation=loc;
            }
        }

        var dashData=detailedTagDataService.getTagData();

        if(dashData==null){
            tagDataService.getStaticFile(renderData);
        }
        else {
            renderData(dashData);
        }

        function renderData(data){
            if(data) {
                $scope.weeklyTrace = data.weeklyTrace;
                $scope.allTags = data;

                var recordsForToday=data.recordsForToday;

                if(recordsForToday && recordsForToday.length>0) {
                    var gainCounter = 0;
                    var lossCounter = 0;
                    var sameCounter = 0;
                    var total = 0;
                    var totalGained = 0;
                    var totalLost = 0;

                    var gainIds = [];
                    var lossIds = [];
                    var allIds = [];

                    recordsForToday.forEach(function (d) {
                        if (d.change < 0) {
                            lossCounter++;
                            totalLost += d.change;
                            lossIds.push(d.id);
                        }
                        else if (d.change > 0) {
                            gainCounter++;
                            totalGained += d.change;
                            gainIds.push(d.id);
                        }
                        else sameCounter++;
                        total++;
                        allIds.push(d.id);
                    });

                    $scope.gain = gainCounter;
                    $scope.loss = lossCounter;
                    $scope.same = sameCounter;
                    $scope.total = total;
                    $scope.gainIds = gainIds;
                    $scope.lossIds = lossIds;
                    $scope.allIds = allIds;


                    if(recordsForToday[0].date)
                        $scope.lastDate = recordsForToday[0].date.substr(0, 10);
                    else
                        $scope.lastDate = new Date();

                }

                $scope.data = [
                    {
                        key: "Weight Gained",
                        y: gainCounter
                    },
                    {
                        key: "Weight Lost ",
                        y: lossCounter
                    },
                    {
                        key: "Same Weight",
                        y: sameCounter
                    }
                ];

                $scope.data1 = [
                    {
                        key: "Total Weight Gained",
                        y: Math.abs(totalGained)
                    },
                    {
                        key: "Total Weight Lost",
                        y: Math.abs(totalLost)
                    }
                ];

                if($scope.allTags && $scope.allTags.thirdsLayout) {
                    $scope.allTags.thirdsLayout.title = null;
                    $scope.allTags.thirdsLayout.margin = {
                        l: 100,
                        r: 50,
                        b: 50,
                        t: 10,
                        pad: 4
                    };
                    if($scope.allTags.thirdsLayout.legend)
                    $scope.allTags.thirdsLayout.legend.orientation = "v";
                }

                if($scope.weeklyTrace && $scope.weeklyTrace.layout) {
                    $scope.weeklyTrace.layout.title = null;
                    $scope.weeklyTrace.layout.margin = {
                        l: 100,
                        r: 50,
                        b: 50,
                        t: 10,
                        pad: 4
                    };
                }
                detailedTagDataService.addTagData(data);

                if (data.alertedTags && data.alertedTags.length > 0) {
                    $scope.$emit('alerts');
                }
            }

        }

        $scope.showTagsGained = function(ev) {
            $mdDialog.show({
                locals:{tags: $scope.gainIds, date: $scope.lastDate},
                controller: mdDialogCtrl,
                templateUrl: 'templates/dialog.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:true

            })
                .then(function(answer) {

                }, function() {

                });
        };

        $scope.showTagsLost = function(ev) {
            $mdDialog.show({
                locals:{tags: $scope.lossIds, date: $scope.lastDate},
                controller: mdDialogCtrl,
                templateUrl: 'templates/dialog.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:true

            })
                .then(function(answer) {

                }, function() {

                });
        };

        var mdDialogCtrl = function ($scope, tags, date) {
            $scope.tags = tags;
            $scope.date=date;
        }

        $scope.showMeasurements = function(ev) {
            $mdDialog.show({
                locals:{tags: $scope.allIds, date: $scope.lastDate},
                controller: mdDialogCtrl,
                templateUrl: 'templates/dialog.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:true

            })
                .then(function(answer) {

                }, function() {

                });
        };

        $scope.showLatestReading = function(ev) {

            $mdDialog.show(
                $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title('Last Hearbeat')
                    .textContent('This is the Last Hearbeat Location')
                    .ariaLabel('This is the Last Hearbeat Location')
                    .ok('Ok')
                    .targetEvent(ev)
            );
        };


    };
    $scope.init();

});