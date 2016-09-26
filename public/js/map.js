

homesteadApp.controller('mapController', function($scope, tagDataService, $rootScope, $timeout) {


    $scope.initMap=function() {
        var map
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -19.66574, lng: 146.8462},
            mapTypeId: 'hybrid',
            zoom:15
        });

        map.data.loadGeoJson('data/paddocks.json');

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