import json
import urllib2
from poster.encode import multipart_encode
from poster.streaminghttp import register_openers
from ResultsProcessor import process_results
from ClustersProcessor import process_clusters
#import time

class DCSClusterizer:
  
  def __init__(self, config): 
    self.__url = config["url"]
    self.__parameters = {
      "dcs.clusters.only" : "true",
      "dcs.output.format" : "JSON"
    }
  
  def clusterize(self, results):
    
    #start = time.clock()
    processed_results = process_results(results, "dcs")
    #end = time.clock()
    #print "Process_results_time:", end-start
    self.__parameters["dcs.c2stream"] = processed_results
    register_openers()
    datagen, headers = multipart_encode(self.__parameters)
    request = urllib2.Request(self.__url, datagen, headers)
    #start = time.clock()
    clusters = json.load(urllib2.urlopen(request))
    #end = time.clock()
    #print "Generate_clusters_time:", end-start
    #start = time.clock()
    processed_clusters = process_clusters(clusters, results)
    #end = time.clock()
    #print "Process_clusters_time:", end-start
    return processed_clusters