homesteadApp.controller('detailedController', function($scope, tagDataService, detailedTagDataService) {

    $scope.data= {
        location : "Location"
    };

    //setting up the location and map markers
    $scope.configureSettings = function (data){
        if(data) {
            $scope.data.location = data.location;
        }
    };

    tagDataService.getConfigFile($scope.configureSettings);

    $scope.currentNavItem = 'page1';
    $scope.selectedTag;
    $scope.tagGraphs=[];

    //for the range slider
    $scope.min = 0;
    $scope.max = 200000;
    $scope.lower = 0;
    $scope.upper = 50000;

    $scope.layoutDetailed = {
        yaxis: {title: "Weight (KG)"},
        showlegend: true,
        legend: {"orientation": "h"}
    };

    $scope.init=function(){

        var detailedData=detailedTagDataService.getTagData();

        if(detailedData==null){
            tagDataService.getStaticFile(renderData);
        }

        else {
            $scope.tagGraphs = detailedData.tagGraphs;
            if ($scope.tagGraphs && $scope.tagGraphs.length > 0)
                $scope.selectedTag = $scope.tagGraphs[0];
        }

        function renderData(data){
            if(data) {
                $scope.tagGraphs = data.tagGraphs;
                if ($scope.tagGraphs && $scope.tagGraphs.length > 0)
                    $scope.selectedTag = $scope.tagGraphs[0];
                detailedTagDataService.addTagData(data);
                if (data.alertedTags && data.alertedTags.length > 0) {
                    $scope.$emit('alerts');
                }
            }
        }
    };

    $scope.init();
});