homesteadApp.controller('dashController', function($scope, $timeout, tagDataService, detailedTagDataService) {

    $scope.currentNavItem = 'page1';
    $scope.allTags={};
    var map;

    $scope.initDashMap=function() {

        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -19.66574, lng: 146.8462},
            mapTypeId: 'hybrid',
            zoom:12
        });

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