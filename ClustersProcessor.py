import itertools


def process_clusters(clusters, results):

    for cluster in clusters["clusters"]:
        cluster["phrases"] = cluster["phrases"][0]

    clusterPairs = itertools.combinations(clusters["clusters"], 2)

    for clustA, clustB in clusterPairs:
        intersection = set(clustA["documents"]) & set(clustB["documents"])
        if intersection:
            if not clustA.has_key("link"):
                clustA["link"] = {"clusters": [], "weigth": 0}
            clustA["link"]["clusters"].append(clustB["id"])
            clustA["link"]["weigth"] += len(intersection)
    clusters["documents"] = results["documents"]

    return clusters
