from Clusterizer import DCSClusterizer
from Search import GoogleSearch

google_config = {
    "key" : "AIzaSyAmJGYRRWtrAkhRKoskydB0HQv2OX7Ghh4",
    "cx"  : "008215189440181716950:ummtfwdm4uo"
  }

dcs_config = {
  "url" : "http://localhost:8080/dcs/rest/"
}


def run_test():
  search_engine = GoogleSearch(google_config)
  results = search_engine.search("who was Thomas Baker?", 100)
  clusterizer = DCSClusterizer(dcs_config)
  clusters = clusterizer.clusterize(results)

if __name__ == '__main__':
  run_test()
  
  
