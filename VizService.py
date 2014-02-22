import json
from Clusterizer import DCSClusterizer
from Search import GoogleSearch

from flask import Flask, request, render_template

app = Flask(__name__)

__google_config = {
    "key": "AIzaSyDTsqu8lI9AOWNWxTh5nqjsi7G127MTPss",
    "cx": "008215189440181716950:ummtfwdm4uo"
}

__dcs_config = {
    "url": "http://localhost:8080/dcs/rest/"
}


@app.route("/")
def index():
    params = {
        "mode": "main"
    }
    return render_template("visual.html", params=params)


@app.route("/default")
def default():
    params = {
        "mode": "vis",
        "data": open("data.json").read()
    }
    return render_template("visual.html", params=params)


@app.route("/vis")
def vis():
    query = count = request.args.get("query", None)
    if query:
        count = int(request.args.get("count", "10"))
        search_engine = GoogleSearch(__google_config)
        results = search_engine.search(query, count)
        clusterizer = DCSClusterizer(__dcs_config)
        clusters = clusterizer.clusterize(results)
        str_clusters = json.dumps(clusters)

        json.dump(clusters, open("data.json", "wb"))

        params = {
            "mode": "vis",
            "data": str_clusters
        }
        return render_template("visual.html", params=params)
    return redirect(url_for('index'))

if __name__ == "__main__":
    app.run(debug=True)
