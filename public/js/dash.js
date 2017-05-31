homesteadApp.controller('dashController', function($scope, $timeout, tagDataService, detailedTagDataService) {

    $scope.currentNavItem = 'page1';
    $scope.allTags={};
    var map;

    $scope.initDashMap=function() {

        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -19.66574, lng: 146.8462},
            mapTypeId: 'hybrid',
            zoom:14
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

    $scope.init=function(){

        $timeout(function(){$scope.initDashMap();});

        var dashData=detailedTagDataService.getTagData();

        if(dashData==null){
            tagDataService.getStaticFile(renderData);
        }
        else {
            $scope.weeklyTrace = dashData.weeklyTrace;
            $scope.allTags = dashData;
            if(dashData.alertedTags && dashData.alertedTags.length>0){
                $scope.$emit('alerts');
            }
        }

        function renderData(data){
            if(data) {
                $scope.weeklyTrace = data.weeklyTrace;
                $scope.allTags = data;
                detailedTagDataService.addTagData(data)
                if (data.alertedTags && data.alertedTags.length > 0) {
                    $scope.$emit('alerts');
                }
            }
        }
    };
    $scope.init();

});