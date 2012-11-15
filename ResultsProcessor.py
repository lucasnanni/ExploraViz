from Normalizer import SemanticNormalizer
import xml.etree.ElementTree as xml

def __DCS_process_results(results):
  
  normalizer = SemanticNormalizer()
    
  xmlDoc = xml.Element("searchresult")
  query = xml.Element("query")
  query.text = results["query"]
  xmlDoc.append(query)
  
  for i,result in enumerate(results["documents"]):
    document = xml.Element("document",{"id":str(i)})
    
    title = xml.Element("title")
    title.text = normalizer.normalize(result["title"])
    #title.text = result["title"]
    document.append(title)
    
    snippet = xml.Element("snippet")
    snippet.text = normalizer.normalize(result["snippet"])
    #snippet.text = result["snippet"]
    document.append(snippet)
    
    url = xml.Element("url")
    url.text = result["link"]
    document.append(url)
    
    xmlDoc.append(document)
  
  return xml.tostring(xmlDoc,encoding="utf-8")

__services = {
  "dcs" : __DCS_process_results
}

def process_results(results, service_name):
  try:
    results = __services[service_name](results)
  except KeyError:
    raise("[Error] Service \"%s\" was not found."%(service_name))
  return results
  