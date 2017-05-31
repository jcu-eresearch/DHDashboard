homesteadApp.controller('detailedController', function($scope, tagDataService, detailedTagDataService) {

    $scope.currentNavItem = 'page1';
    $scope.selectedTag;
    $scope.tagGraphs=[];

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
                detailedTagDataService.addTagData(data)
                if (data.alertedTags && data.alertedTags.length > 0) {
                    $scope.$emit('alerts');
                }
            }
        }
    };

    $scope.init();
});