

homesteadApp.controller('mapController', function($scope, tagDataService, $rootScope, $timeout) {

    $scope.data= {
        location : "Location",
        status : "Stock Status",
        markers : [],
        center : {"lat": -19.665, "lng": 146.855},
        paddocks : "data/paddocks.json",
        includeAnimalMovement : false,
        initialZoom : 14,
        maxZoom : 8
    };

    //setting up the location and map markers
    $scope.configureSettings = function (data){
        if(data) {
            $scope.data = data;
        }
        $timeout(function(){$scope.initMap();});
    };

    tagDataService.getConfigFile($scope.configureSettings);

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
        if(newVal){
            if($scope.soilOverlay)
                $scope.soilOverlay.addToMap($scope.map);
        }
        else {
            if($scope.soilOverlay)
                $scope.soilOverlay.removeFromMap();
        }
    });

    $scope.$watch('topology', function(newVal, oldVal) {
        if(newVal) {
            if($scope.topologyOverlay)
                $scope.topologyOverlay.addToMap($scope.map);
        }
        else {
            if($scope.topologyOverlay)
                $scope.topologyOverlay.removeFromMap();
        }
    });

    $scope.$watch('paddocks', function(newVal, oldVal) {
        if(newVal) {
            if($scope.map && $scope.map.data)
                $scope.map.data.loadGeoJson('data/paddocks.json');
        }
        else {
            if($scope.map && $scope.map.data)
                $scope.map.data.forEach(function (feature) {
                    if (feature.getProperty('letter') == 'G')
                        $scope.map.data.remove(feature);
                });
        }
    });

    $scope.$watch('heatmap', function(newVal, oldVal) {
        if($scope.heatmapOverlay)
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
        ];
        if($scope.heatmapOverlay)
            $scope.heatmapOverlay.set('gradient',  $scope.heatmapOverlay.get('gradient') ? null : gradient);
    }

    function changeRadius() {
        if($scope.heatmapOverlay)
            $scope.heatmapOverlay.set('radius',  $scope.heatmapOverlay.get('radius') ? null : 20);
    }

    function changeOpacity() {
        if($scope.heatmapOverlay)
            $scope.heatmapOverlay.set('opacity',  $scope.heatmapOverlay.get('opacity') ? null : 0.2);
    }

    $scope.createOverlay= function (data) {

        if(data.bounds1 && data.bounds2) {
            var neBound = new google.maps.LatLng(data.bounds1.lat, data.bounds1.lng);
            var swBound = new google.maps.LatLng(data.bounds2.lat, data.bounds2.lng);
            var bounds = new google.maps.LatLngBounds(swBound, neBound);
            var srcImage = data.image;
            return new imgOverlay(bounds, srcImage, map);
        }
    };

    $scope.initMap=function() {
        var stationMarkers= $scope.data.markers;
        var center = $scope.data.center;
        var paddocks = $scope.data.paddocks;
        var movement= $scope.data.includeAnimalMovement;

        var map;
        map = new google.maps.Map(document.getElementById('map'), {
            center: center,
            mapTypeId: 'hybrid',
            zoom: $scope.data.initialZoom
        });
        $scope.map=map;

        if($scope.data.includeSoil) {
            $scope.soilOverlay = $scope.createOverlay({
                bounds1: $scope.data.soilNEBounds,
                bounds2: $scope.data.soilSWBounds,
                image: $scope.data.soilData
            });
            $scope.soilOverlay.removeFromMap();
        }

        if($scope.data.includeSoilTopology) {
            $scope.topologyOverlay = $scope.createOverlay({
                bounds1: $scope.data.soilTopologyNEBounds,
                bounds2: $scope.data.soilTopologySWBounds,
                image: $scope.data.soilTopologyData
            });
            $scope.topologyOverlay.removeFromMap();
        }

        map.data.setStyle({
            strokeColor: '#66bb6a',
            fillColor: '#66bb6a',
            fillOpacity: 0.1,
            strokeWeight: 2
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
                        url: '',
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


        if(movement) {
            tagDataService.getLocationData(renderMovementData);
        }

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
    };




});