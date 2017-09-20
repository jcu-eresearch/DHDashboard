

homesteadApp.controller('mapController', function($scope, tagDataService, $rootScope, $timeout) {

    imgOverlay.prototype = new google.maps.OverlayView();
    var heatmap;

    function imgOverlay(bounds, image, map) {
        this.bounds_ = bounds;
        this.image_ = image;
        this.map_ = map;
        this.div_ = null;
        this.setMap(map);
    }

    imgOverlay.prototype.addToMap= function(map){
        this.setMap(map);
    };

    imgOverlay.prototype.removeFromMap= function(){
        this.setMap(null);
    };

    imgOverlay.prototype.onAdd = function() {

        var div = document.createElement('div');
        div.style.borderStyle = 'none';
        div.style.borderWidth = '0px';
        div.style.position = 'absolute';
        var img = document.createElement('img');
        img.src = this.image_;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.opacity = '0.7';
        img.style.position = 'absolute';
        div.appendChild(img);
        this.div_ = div;
        var panes = this.getPanes();
        panes.overlayLayer.appendChild(div);
    };

    imgOverlay.prototype.draw = function() {
        var overlayProjection = this.getProjection();
        var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
        var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());
        var div = this.div_;
        div.style.left = sw.x + 'px';
        div.style.top = ne.y + 'px';
        div.style.width = (ne.x - sw.x) + 'px';
        div.style.height = (sw.y - ne.y) + 'px';
    };

    imgOverlay.prototype.updateBounds = function(bounds){
        this.bounds_ = bounds;
        this.draw();
    };

    imgOverlay.prototype.onRemove = function() {
        this.div_.parentNode.removeChild(this.div_);
        this.div_ = null;
    };

    $scope.soilOverlay;
    $scope.paddocksOverlay;
    $scope.topologyOverlay;
    $scope.map;
    $scope.heatmapOverlay;

    $scope.soil=false;
    $scope.topology=false;
    $scope.paddocks=false;
    $scope.heatmap=true;

    $scope.$watch('soil', function(newVal, oldVal) {
        if(newVal)
            $scope.soilOverlay.addToMap($scope.map);
        else
            $scope.soilOverlay.removeFromMap();
    });

    $scope.$watch('topology', function(newVal, oldVal) {
        if(newVal)
            $scope.topologyOverlay.addToMap($scope.map);
        else
            $scope.topologyOverlay.removeFromMap();
    });

    $scope.$watch('paddocks', function(newVal, oldVal) {
        if(newVal)
            $scope.map.data.loadGeoJson('data/paddocks.json');
        else
            $scope.map.data.forEach(function (feature) {
                if (feature.getProperty('letter') == 'G')
                    $scope.map.data.remove(feature);
            });
    });

    $scope.$watch('heatmap', function(newVal, oldVal) {
            $scope.heatmapOverlay.setMap( $scope.heatmapOverlay.getMap() ? null : $scope.map);
    });

    $scope.$watch('gradient', function(newVal, oldVal) {
        changeGradient();
    });

    $scope.$watch('radius', function(newVal, oldVal) {
        changeRadius();
    });

    $scope.$watch('opacity', function(newVal, oldVal) {
        changeOpacity();
    });


    function changeGradient() {
        var gradient = [
            'rgba(0, 255, 255, 0)',
            'rgba(0, 255, 255, 1)',
            'rgba(0, 191, 255, 1)',
            'rgba(0, 127, 255, 1)',
            'rgba(0, 63, 255, 1)',
            'rgba(0, 0, 255, 1)',
            'rgba(0, 0, 223, 1)',
            'rgba(0, 0, 191, 1)',
            'rgba(0, 0, 159, 1)',
            'rgba(0, 0, 127, 1)',
            'rgba(63, 0, 91, 1)',
            'rgba(127, 0, 63, 1)',
            'rgba(191, 0, 31, 1)',
            'rgba(255, 0, 0, 1)'
        ]
        $scope.heatmapOverlay.set('gradient',  $scope.heatmapOverlay.get('gradient') ? null : gradient);
    }

    function changeRadius() {
        $scope.heatmapOverlay.set('radius',  $scope.heatmapOverlay.get('radius') ? null : 20);
    }

    function changeOpacity() {
        $scope.heatmapOverlay.set('opacity',  $scope.heatmapOverlay.get('opacity') ? null : 0.2);
    }

    $scope.initMap=function() {

        var map
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -19.66350, lng: 146.85200},
            mapTypeId: 'hybrid',
            zoom:15
        });
        $scope.map=map;

        var neBound = new google.maps.LatLng(-19.65111042090178, 146.87229902673334);
        var swBound = new google.maps.LatLng( -19.676194910665817, 146.8331438674927);
        var bounds = new google.maps.LatLngBounds(swBound, neBound);
        var srcImage = 'data/paddSoil.png';
        $scope.soilOverlay = new imgOverlay(bounds, srcImage, map);
        $scope.soilOverlay.removeFromMap();

        var neBound1 = new google.maps.LatLng(-19.6522016454622, 146.87255651879877);
        var swBound1 = new google.maps.LatLng( -19.6767606432209, 146.83365885162357);
        var bounds1 = new google.maps.LatLngBounds(swBound1, neBound1);
        var srcImage1 = 'data/soilTopo.png';
        $scope.topologyOverlay = new imgOverlay(bounds1, srcImage1, map);
        $scope.topologyOverlay.removeFromMap();

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

        tagDataService.getLocationData(renderMovementData);

        function renderMovementData(movementData){

            heatmap = new google.maps.visualization.HeatmapLayer({
                data: getPoints(),
                map: map
            });

            function getPoints() {
                var points=[];

                if(movementData && movementData.length>0){
                    movementData.forEach(function(point){
                        points.push(new google.maps.LatLng(point.lat, point.long));
                    });
                }

                return points;
            }
            $scope.heatmapOverlay=heatmap;
        }
    }

    $timeout(function(){$scope.initMap();});


});