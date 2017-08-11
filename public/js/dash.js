homesteadApp.controller('dashController', function($scope, $timeout, $mdDialog, tagDataService, detailedTagDataService) {

    $scope.currentNavItem = 'page1';
    $scope.allTags={};
    var map;

    $scope.initDashMap=function() {

        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -19.665, lng: 146.825},
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

        map.data.loadGeoJson(
            'data/paddocks.json');

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

    $scope.data = [
        {
            key: "Weight Gained",
            y: 40
        },
        {
            key: "Weight Lost ",
            y: 23
        },
        {
            key: "Same Weight",
            y: 25
        }
    ];


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

    $scope.data1 = [
        {
            key: "Total Weight Gained",
            y: 400
        },
        {
            key: "Total Weight Lost",
            y: 200
        }
    ];




    $scope.init=function(){

        $timeout(function(){$scope.initDashMap();});

        var dashData=detailedTagDataService.getTagData();

        if(dashData==null){
            tagDataService.getStaticFile(renderData);
        }
        else {
            $scope.weeklyTrace = dashData.weeklyTrace;
            $scope.allTags = dashData;

            if($scope.allTags.thirdsTraces){
                $scope.allTags.thirdsTraces.forEach(function(d){
                    d.mode="lines";
                });
            }
            if(dashData.alertedTags && dashData.alertedTags.length>0){
                $scope.$emit('alerts');
            }
        }

        function renderData(data){
            if(data) {
                $scope.weeklyTrace = data.weeklyTrace;
                $scope.allTags = data;
                debugger;

                $scope.allTags.thirdsLayout.title=null;
                $scope.allTags.thirdsLayout.margin= {
                    l: 100,
                    r: 50,
                    b: 50,
                    t: 10,
                    pad: 4
                };
                var colors=[
                    "#95D7BB",
                    "#D9DD81",
                    "#79D1CF",
                    "#E67A77"];
                var fillColors=["rgba(149,215,187,0.5 )", "rgba(217,221,129,0.6)", "rgba(121,209,207,0.6)"];
                if($scope.allTags.thirdsTraces){
                    for(var i=0; i<$scope.allTags.thirdsTraces.length; i++){
                        var d=$scope.allTags.thirdsTraces[i];
                        d.mode="lines+markers";
                        d.fillcolor= fillColors[i];
                        d.line.color=colors[i];
                    };
                }
                $scope.allTags.weeklyTrace.traces[0].marker.color= "#95D7BB";
                $scope.allTags.weeklyTrace.traces[0].marker.opacity= "0.5";
                detailedTagDataService.addTagData(data);

                if (data.alertedTags && data.alertedTags.length > 0) {
                    $scope.$emit('alerts');
                }
            }
        }

        $scope.showTagsGained = function(ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            // Modal dialogs should fully cover application
            // to prevent interaction outside of dialog
            $mdDialog.show(
                $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title('Animal Tags that Gained Weight in the Last 24 Hours')
                    .textContent('List of Animal Tags Here')
                    .ariaLabel('Animal Tags')
                    .ok('Ok')
                    .targetEvent(ev)
            );
        };

        $scope.showTagsLost = function(ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            // Modal dialogs should fully cover application
            // to prevent interaction outside of dialog
            $mdDialog.show(
                $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title('Animal Tags that Lost Weight in the Last 24 Hours')
                    .textContent('List of Animal Tags Here')
                    .ariaLabel('Animal Tags')
                    .ok('Ok')
                    .targetEvent(ev)
            );
        };

        $scope.showMeasurements = function(ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            // Modal dialogs should fully cover application
            // to prevent interaction outside of dialog
            $mdDialog.show(
                $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title('Measurements in the Last 24 Hours')
                    .textContent('List of Measurements Here')
                    .ariaLabel('Measurements')
                    .ok('Ok')
                    .targetEvent(ev)
            );
        };

        $scope.showLatestReading = function(ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            // Modal dialogs should fully cover application
            // to prevent interaction outside of dialog
            $mdDialog.show(
                $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title('Latest Reading in the Last 24 Hours')
                    .textContent('Latest Reading Here')
                    .ariaLabel('Latest Reading')
                    .ok('Ok')
                    .targetEvent(ev)
            );
        };

    };
    $scope.init();

});