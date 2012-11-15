from threading import Thread
import urllib2
import urllib
import json

class ThreadSearch(Thread):
  
  def __init__(self, url):
    Thread.__init__(self)
    self.url = url
    
  def run(self):
    results_page = urllib2.urlopen(self.url)
    self.results = json.load(results_page)
    
class GoogleSearch():
  
  __url = "https://www.googleapis.com/customsearch/v1/"
  
  def __init__(self, config):

    self.__attributes = {
      "key" : config["key"],
      "cx"  : config["cx"],
    }
  
  def __encoded_url(self):
    encURL = self.__url+'?'+urllib.urlencode(self.__attributes)
    return encURL
  
  def __merged_results(self, results_pages):
    results = dict()
    if results_pages:
      results["query"] = results_pages[0]["queries"]["request"][0]["searchTerms"]
      results["context"] = results_pages[0]["context"]
      results["documents"] = []
      for results_page in results_pages:
        results["documents"].extend(results_page["items"])
    return results
  
  def search(self, query, count=10, raw=False):
    self.__attributes["q"] = query
    start = 1 if count > 0 else 0
    num = count
    results_pages = []
    search_pool = []
    while start < count + 1:
      remain = count - start + 1
      num = 10 if remain > 10 else remain
      self.__attributes["start"] = start
      self.__attributes["num"] = num
      url = self.__encoded_url()
      search_thread = ThreadSearch(url)
      search_pool.append(search_thread)
      search_thread.start()
      start += num
    for search_thread in search_pool:
      search_thread.join()
      results_pages.append(search_thread.results)
    if raw:
      return results_pages
    else:
      return self.__merged_results(results_pages)