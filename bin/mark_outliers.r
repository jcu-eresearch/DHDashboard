#!/usr/bin/env Rscript

library(mongolite)
library(tsoutliers)
library(boot)
library(methods)
library(stats)
library(stsm)
library(tseries)
library(utils)

options(nwarnings = 500)

#connect to mongo
weights<-mongo(collection = "weights", db = "digitalhomestead", url = "mongodb://localhost:27017")
#weights<-mongo(collection = "weights", db = "digitalhomestead", url = "mongodb://mongo:27017")

#get the distinct tags for the animals
distinctIds<-weights$distinct("weights.id")

#iterate over all the animals
countValid<-1
countInvalid<-1
for(id in distinctIds){

  print(id)
  if(id=="-1") next;
  #get the tagWeights: working with 125004185879 125004149782 right now
  tagWeights<-weights$aggregate(
    paste0('[ {"$unwind" : "$weights"}, {"$match":  {"weights.id" : ','"',id,'"','} }, {"$project":  { "weight" : "$weights.weight", "id" : "$weights._id",  "flag" : "$weights.qa_flag"  } } ]'))

  countValid<-1;
  countInvalid<-1;
  indexValid<-vector();
  indexInvalid<-vector();
  weightsValid<-vector();
  weightsInvalid<-vector();

  #iterate over the weights
  for(i in 1:length(tagWeights[[1]]) ){
    if(tagWeights[i,2]>650 || tagWeights[i,2]<300){
      indexInvalid[countInvalid]<-i;
      weightsInvalid[countInvalid]<-tagWeights[i,2];
      if(is.na( tagWeights[i,4]) || tagWeights[i,4]!="INVALID")
        weights$update( query=paste0 ('{"_id":"', tagWeights[i,1] ,'", "weights._id": {"$oid":"',tagWeights[i,3],'"}}'),
                        update='{"$set":{"weights.$.qa_flag": "INVALID"}}')
      countInvalid<-countInvalid+1;
    }
    else{
      indexValid[countValid]<-i;
      weightsValid[countValid]<-tagWeights[i,2] ;
      countValid<-countValid+1;
      if( is.na(tagWeights[i,4]) || tagWeights[i,4]!="VALID")
        weights$update( query=paste0 ('{"_id":"', tagWeights[i,1] ,'", "weights._id": {"$oid": "',tagWeights[i,3],'"}}'),
                        update='{"$set":{"weights.$.qa_flag": "VALID"}}')

    }
  }
  
  weightSeries<- logical(0);
  weightOutliers<- logical(0);

  out<-tryCatch({
    if(length(weightsValid)>0)
      weightSeries<-ts(weightsValid);
  },
  error=function(cond){ print(cond); })

  out<-tryCatch({
    if(length(weightSeries)>5)
      weightOutliers<-tso(weightSeries,types= c("TC", "AO"))
  },
  error=function(cond){ print(cond);  })

  #update info about Outliers detected weightOutliers$outliers$type weightOutliers$outliers$ind weightOutliers$outliers$coefhat
  out<-tryCatch({
    if(length(weightOutliers)>0)
      for(j in 1:length(weightOutliers$outliers[[1]]) ){
        
        weights$update( query=paste0 ('{"_id":"', tagWeights[indexValid[weightOutliers$outliers[j,2]],1] ,'", "weights._id": {"$oid": "',tagWeights[indexValid[weightOutliers$outliers[j,2]],3],'"}}'),
                        update=paste0('{"$set":{"weights.$.qa_flag": "OUTLIER",   "weights.$.qa_value": "',weightOutliers$outliers[j,4],'"}}'))
      }
  },
  error=function(cond){ print(cond); })

}
