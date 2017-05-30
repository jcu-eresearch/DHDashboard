

homesteadApp.controller('detailedController', function($scope, tagDataService, detailedTagDataService) {

    $scope.currentNavItem = 'page1';
    $scope.tagList=[];
    $scope.selectedTag;
    $scope.tagGraphs=[];
    $scope.allTags={};
    $scope.fullWidth="100";
    $scope.alerts=false;
    $scope.today=new Date();
    $scope.yesterday= new Date($scope.today-1000*60*60*24)
    $scope.today=$scope.today.toISOString().substring(0,10);
    $scope.yesterday=$scope.yesterday.toISOString().substring(0,10);
    $scope.alertedTags=[];

    $scope.layout = {
        title: "Daily Individual Weight Trend",
        yaxis: {title: "Weight (KG)"},
        showlegend: false
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
            $scope.tagGraphs=data.tagGraphs;
            if($scope.tagGraphs && $scope.tagGraphs.length>0)
                $scope.selectedTag=$scope.tagGraphs[0];
            detailedTagDataService.addTagData(data)
        }




    };

    $scope.init();

});