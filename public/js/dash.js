homesteadApp.controller('dashController', function($scope, $timeout, $mdDialog, tagDataService, detailedTagDataService) {

    $scope.currentNavItem = 'page1';
    $scope.allTags={};
    var map;

    var options = {
        hash_bookmark: false,
        timenav_height: 5,
        timenav_height_min: 5,
        track_events: [],
        base_class: 'none',
        timenav_height_percentage: 1,
        timenav_mobile_height_percentage: 1,
        slide_padding_lr: 60,
        layout: "portrait"
    };

    var timeline_json = {

        "events": [
            {
                "media": {
                    "url": "https://www.youtube.com/watch?v=pNj4wbWoUWw",
                    "caption": "The Digital Homestead",
                    "credit": ""
                },
                "start_date": {
                    "month": "6",
                    "day": "1",
                    "year": "2016"
                },
                "text": {
                    "text": "<p>The Digital Homestead project evaluates how modern Information and Communication"+
                    " Technologies (ICT) such as wireless sensor networks (WSN’s), data analytics "+
                    "and rural connectivity can support greater profitability for the Northern beef industry. </p>"
                }
            },
            {
                "media": {
                    "url": "images/11.jpg",
                    "caption": "Cattle Drawn to Water.",
                    "credit": ""
                },
                "start_date": {
                    "month": "6",
                    "day": "1",
                    "year": "2016"
                },
                "text": {
                    "text": "<p>Cattle are drawn to areas with water.</p>"
                }
            },
            {
                "media": {
                    "url": "images/10.jpg",
                    "caption": "Weight Data Recorded.",
                    "credit": ""
                },
                "start_date": {
                    "month": "6",
                    "day": "1",
                    "year": "2016"
                },
                "text": {
                    "text": "<p>Weight data is captured by the Walk Over Weigher.</p>"
                }
            },
            {
                "media": {
                    "url": "images/12.jpg",
                    "caption": "Data Transmitted.",
                    "credit": ""
                },
                "start_date": {
                    "month": "6",
                    "day": "1",
                    "year": "2016"
                },
                "text": {
                    "text": "<p>Data is transmitted hourly through Taggle and 3G.</p>"
                }
            },
            {
                "media": {
                    "url": "images/9.jpg",
                    "caption": "Analysis Presented.",
                    "credit": ""
                },
                "start_date": {
                    "month": "6",
                    "day": "1",
                    "year": "2016"
                },
                "text": {
                    "text": "<p>Analysis and Ranking of Cattle is presented through the dashboard.</p>"
                }
            },

            {
                "media": {
                    "url": "https://www.youtube.com/watch?v=6U1cVwN2nwc",
                    "caption": "The Digital Homestead",
                    "credit": ""
                },
                "start_date": {
                    "month": "6",
                    "day": "1",
                    "year": "2016"
                },
                "text": {

                    "text": "<p>The Digital Homestead technology demonstration at the Spyglass Open Day on October "+
                    "9 2015 provided a chance for producers, members of the community and students"+
                    " to explore what the future of technology and farming might look like. </p>"
                }
            }]
    }

    $timeout(function(){
        var timeline = new TL.Timeline('dash-timeline', timeline_json, options);
        $('.tl-headline-date').remove();
        $('.tl-timenav').remove();
        $('.tl-menubar').remove();
        $('.tl-slidenav-description').remove();
    });

    $scope.initDashMap=function() {

        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -19.665, lng: 146.855},
            mapTypeId: 'hybrid',
            zoom:14,
            scrollwheel:  false
        });

        map.data.setStyle({
            strokeColor: '#66bb6a',
            fillColor: '#66bb6a',
            fillOpacity: 0.1,
            strokeWeight: 2
        });

        map.data.loadGeoJson('data/paddocks.json');



        var marker1 = new google.maps.Marker({
            position: {lat: -19.66882, lng: 146.864},
            map: map,
            title: "Spring Creek"
        });

        var marker11 = new google.maps.Marker({
            position: {lat: -19.66882, lng: 146.864},
            map: map,
            label: {
                text: "Spring Creek",
                color: "white"
            },
            title: "Spring Creek",
            icon: {
                labelOrigin: new google.maps.Point(11, 50),
                url: 'default_marker.png',
                size: new google.maps.Size(22, 40),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(11, 40),
            }
        });

        var marker2 = new google.maps.Marker({
            position: {lat: -19.657496, lng: 146.835306},
            map: map,
            title: "Digital Homestead"
        });

        var marker22 = new google.maps.Marker({
            position: {lat: -19.657496, lng: 146.835306},
            map: map,
            label: {
                text:  "Digital Homestead",
                color: "white"
            },
            title: "Digital Homestead",
            icon: {
                labelOrigin: new google.maps.Point(11, 50),
                url: 'default_marker.png',
                size: new google.maps.Size(22, 40),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(11, 40),
            }
        });

        var marker3 = new google.maps.Marker({
            position: {lat: -19.66574, lng: 146.8462},
            map: map,
            title: "Double Barrel"
        });

        var marker33 = new google.maps.Marker({
            position: {lat: -19.66574, lng: 146.8462},
            map: map,
            label: {
                text:  "Double Barrel",
                color: "white"
            },
            title: "Double Barrel",
            icon: {
                labelOrigin: new google.maps.Point(11, 50),
                url: 'default_marker.png',
                size: new google.maps.Size(22, 40),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(11, 40),
            }
        });

        var marker4 = new google.maps.Marker({
            position: {lat: -19.66872, lng: 146.8642},
            map: map,
            text: "Junction"
        });

        var marker44 = new google.maps.Marker({
            position: {lat: -19.66872, lng: 146.8642},
            map: map,
            label: {
                text:  "Junction",
                color: "white"
            },
            title: "Junction",
            icon: {
                labelOrigin: new google.maps.Point(50, 20),
                url: 'default_marker.png',
                size: new google.maps.Size(22, 40),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(11, 40),
            }
        });

        var markers=[marker1, marker11, marker3, marker33, marker4, marker44];

        map.addListener( 'zoom_changed', function() {
            var zoom = map.getZoom();

            // iterate over markers and call setVisible
            for (var i = 0; i < markers.length; i++) {
                markers[i].setVisible(zoom >= 12);
            }

            if(zoom<12){
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

    $scope.chart = {
        chart: {
            type: 'pieChart',
            showLabels: false,
            donut: true,
            color : [ '#D9DD81', '#E67A77',  '#95D7BB'],
            x: function(d){return d['key'];},
            y: function(d){return d['y'];}
        }
    };

    $scope.data={};

    $scope.chart1 = {
        chart: {
            type: 'pieChart',
            showLabels: false,
            donut: true,
            color : [  '#D9DD81', '#79D1CF', '#95D7BB'],
            x: function(d){return d['key'];},
            y: function(d){return d['y'];}
        }
    };

    $scope.data1={};


    $scope.init=function(){

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
                if(last.tag_id=="110177")loc="Spring Creek";
                if(last.tag_id=="110171")loc="Double Barrel";
                if(last.tag_id=="110163")loc="Junction";

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

                $scope.allTags.thirdsLayout.title=null;
                $scope.allTags.thirdsLayout.margin= {
                    l: 100,
                    r: 50,
                    b: 50,
                    t: 10,
                    pad: 4
                };


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