

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

    $scope.soil=true;
    $scope.topology=false;
    $scope.paddocks=false;

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

    $scope.initMap=function() {


        var map
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -19.66350, lng: 146.85200},
            mapTypeId: 'hybrid',
            zoom:15
        });
        $scope.map=map;


        //map.data.loadGeoJson('data/paddocks.json');

        var neBound = new google.maps.LatLng(-19.65111042090178, 146.87229902673334);
        var swBound = new google.maps.LatLng( -19.676194910665817, 146.8331438674927);
        var bounds = new google.maps.LatLngBounds(swBound, neBound);
        var srcImage = 'data/paddSoil.png';
        $scope.soilOverlay = new imgOverlay(bounds, srcImage, map);


        var neBound1 = new google.maps.LatLng(-19.6522016454622, 146.87255651879877);
        var swBound1 = new google.maps.LatLng( -19.6767606432209, 146.83365885162357);
        var bounds1 = new google.maps.LatLngBounds(swBound1, neBound1);
        var srcImage1 = 'data/soilTopo.png';
        $scope.topologyOverlay = new imgOverlay(bounds1, srcImage1, map);
        $scope.topologyOverlay.removeFromMap();


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

        }

    }

    $timeout(function(){$scope.initMap();});


    $scope.slider = {
        'options': {
            start: function(event, ui) {
                $log.info('Event: Slider start - set with slider options', event);
            },
            stop: function(event, ui) {
                $log.info('Event: Slider stop - set with slider options', event);
            }
        }
    };
    $scope.demoVals = {
        sliderWeights: [200, 500],
        sliderWeightsChanges: [-5, 5]
    };





});