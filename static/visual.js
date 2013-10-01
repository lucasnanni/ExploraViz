Array.prototype.has = function(elm) {
	var i = this.length;
	while (i--) {
		if (this[i] == elm) {return true;}
	}
	return false;
}

Array.prototype.max = function(mx) {
	mx = mx ? mx : function (x) {return x};
	var max = mx(this[0]);
	var len = this.length;
	for (var i = 1; i < len; i++) {
		if (mx(this[i]) > max) {
			max = this[i];
		}
	}
	return max;
}

var resWidth = [76,600],
		visWidth = $(document).width()-650,
		visHeight = $(document).height()-86;
		
var	panelSwitch = 0,
		rw = resWidth[panelSwitch];

$("#switch").mouseover(function(){
	$(".reswrap").css({"border-left":"solid 4px #e0e0e0"})});
$("#switch").mouseout(function(){
	$(".reswrap").css({"border-left":"solid 1px #e0e0e0"})});

function visWide() {
	var visMargin = (window.innerWidth - visWidth - rw)/2;
	$("#vis").css({"margin-left" : visMargin});
	$(".reswrap").css({"height" : (window.innerHeight-54)+'px'});
	$("#switch").css({"top":(window.innerHeight/2-42)+"px"});
}

visWide();

$(window).resize(visWide);
$(".reswrap").css({"width":resWidth[panelSwitch]+"px"});
$("#vis").css({"width":visWidth+"px"});

$(function() {
		$('#res').slimScroll({
			width: '100%',
			height: '100%',
			alwaysVisible: false,
			railVisible: true
		});
});

$("#switch").click(function(e){
	
	if (!panelSwitch) {
		panelSwitch = 1;
		var rw = resWidth[panelSwitch];
		d3.select(".reswrap")
			.transition()
				.style("width",rw+'px');
		
		var visMargin = (window.innerWidth - visWidth - rw)/2;
		d3.select("#vis")
			.transition()
				.style("margin-left",visMargin+'px');
	}
	else {
		panelSwitch = 0;
		var rw = resWidth[panelSwitch];
		d3.select(".reswrap")
			.transition()
				.style("width",rw+'px');
		var visMargin = (window.innerWidth - visWidth - rw)/2;
		d3.select("#vis")
			.transition()
				.style("margin-left",visMargin+'px');
	}
});

var circles,
		node,
		nodes,
		link,
		links,
		texts;
		
var clusters = gdata.clusters,
		documents = gdata.documents;

var state = {"normal":0,"highlighted":1,"selected":2}
var selState = {state:0,nodes:[]};

var force = d3.layout.force()
		.on("tick", tick)
		.charge(-(visWidth+visHeight))
		.gravity(0.1)
		.size([visWidth, visHeight])
		.friction(0.9);

var vis = d3.select("#vis")
	.attr("class", "vis")
	.style("top",(window.innerHeight-visHeight)/2);

var svg = vis.append("svg:svg")
	.attr("width", visWidth)
	.attr("height", visHeight)
	.attr("class", "vis");

var visBack = svg.insert("svg:rect")
	.attr("width", visWidth)
	.attr("height", visHeight)
	.style("fill", "white")
	.on("click",resetSelection);

var graph = svg.insert("svg:g")
	.attr("width", visWidth)
	.attr("height", visHeight);

var colorScale = d3.scale.category20(),
		color = function(c) {
			return d3.interpolateRgb(colorScale(c),d3.rgb(255,255,255))(0.3);};

var allResults = {
	documents : d3.range(documents.length),
	phrases : "All Results"
};

update();

function update() {
	nodes = gdata.clusters;
	links = [];
	
	nodes.forEach(function(source) {
		if (source.link) {
			source.link.clusters.forEach(function(targetId){
				links.push({source : source, target : nodes[targetId]})
				})
		}
	});
	
	// Restart the force layout.
	force
			.nodes(nodes)
			.start();

	// Update the links…
	link = graph.selectAll("line.link")
			.data(links, function(d) { return d.target.id; });

	// Enter any new links.
	link.enter().insert("svg:line", ".node")
			.attr("class", "link")
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; })
			.style("stroke-width", function(d) {
				return Math.min(Math.max(1.5,1*d.source.link.clusters.length),4);})
			.on("click", selectLink)
			.on("mouseover", selectLink);

	// Exit any old links.
	link.exit().remove();

	node = graph.selectAll("g.node")
		.data(nodes, function(d) { return d.id; });
	
	var nodeEnter = node.enter().append("svg:g")
		.attr("class", "node")
		.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")"; })
		.on("mouseover", hlightNodes)
		.on("mouseout", resetNodes)
		.on("click", selectNode)
		.call(force.drag);

	// Recalculate clusters weigth
	var maxscore = d3.max(nodes,function(d){return d.score;});
	
	// Enter any new nodes.
	nodeEnter.append("svg:circle")
		.attr("r", function(d) {
			return Math.max(12,80*(d.score/maxscore));})
		.style("fill", function (d){return color(d.id);})
		.style("stroke", function (d){return d3.rgb(color(d.id)).darker(1);})
		.style("stroke-width","2.5px");
	
	nodeEnter.insert("text")
		.attr("text-anchor","middle")
		.attr("dy","2pt")
		.text(function(d) { return d.phrases;});
	
	circles = nodeEnter.select("circle");
	labels = nodeEnter.select("text");
	
	showResults(allResults);
}

function showResults(d) {
	console.log("showing results");
	hideResults();
	var nodeDocs = []
	d.documents.forEach(function(id){nodeDocs.push(documents[id])});
	var res = d3.select("div.res").selectAll("div")
		.data(nodeDocs);
	result = res.enter().insert("div")
		.attr("class","result")
		.style("opacity", 0);
	result.insert("div")
		.attr("class","result-thumb");
	var resultText = result.insert("div")
		.attr("class","result-text")
	resultText.insert("h3")
		.insert("a")
			.attr("href",function(d){return d.link;})
			.attr("target","_blank")
			.html(function(d){return d.htmlTitle;});
	resultText.insert("p")
		.attr("class","url")
		.html(function(d){return d.htmlFormattedUrl;});
	resultText.insert("p")
		.html(function(d){return d.htmlSnippet;})
	res.transition()
		.style("opacity", 1);
	d3.select("#results-title")
		.text(d.phrases);
}

function getResults(d) {
	var nodeDocs = []
	d.documents.forEach(function(id){nodeDocs.push(documents[id])});
	return nodeDocs;
}

function hideResults() {
	d3.select("div.res").selectAll("div").remove();
}

function resetNodes() {
	if (!(selState.state == state["selected"])){
		graph.selectAll("line.link")
			.transition()
				.style("opacity", 0.2);
		graph.selectAll("g.node")
			.transition().style("opacity", 1);
		graph.selectAll("g.node")
			.select("circle").
			transition().style("stroke-width","2.5px");
	}
}

function hlightNodes(g, i) {
	if (!(selState.state == state["selected"])) {
		
		selState.state = state["highlighted"];
		var overNodes = [g.id];
		
		graph.selectAll("g.node").filter(function(d){ return d.id == i})
			.select("circle")
				.transition()
					.style("stroke-width","4px");
		
		links.forEach(function(link){
			if (link.source.id == g.id) {
				overNodes.push(link.target.id);
			} else if (link.target.id == g.id) {
				overNodes.push(link.source.id);
			}
		});
		
		selState.nodes = overNodes;
		graph.selectAll("line.link")
			.filter(function(d){
				return d.source.id == g.id || d.target.id == g.id;
			})
			.transition()
				.style("opacity", 1);
		
		graph.selectAll("g.node").filter(function(d){
			return !overNodes.has(d.id);})
			.transition().style("opacity", 0.05);
			
		graph.selectAll("line.link")
			.filter(function(d){
				return d.source.id != g.id && d.target.id != g.id;
			})
			.transition()
				.style("opacity", 0.05);
	}
}

function resetSelection() {
		selState.state = state["normal"];
		d3.select(".edit-cluster").remove();
		resetNodes();
		showResults(allResults);
}

function selectNode(g,i) {
	if (selState.state == state["highlighted"]) {
		d3.select("#options-bar")
				.append("a")
				.attr("href","#")
				.attr("class","btn edit-cluster")
				.text("EDIT NODE");
		selState.state = state["selected"];
	}
	if (selState.state == state["selected"]) {
		if (selState.nodes.has(i)) {
			graph.selectAll("g.node").filter(function(d){
				return selState.nodes.has(d.id);
			})
			.select("circle").transition()
				.style("stroke-width","2px");
			
			graph.selectAll("g.node").filter(function(d){
				return d.id == i;
			})
			.select("circle").transition()
				.style("stroke-width","4px");
			
			d3.select(".edit-cluster")
				.attr("href","#");
			showResults(g);
		} else {
			resetSelection();
		}
	}
}

function selectLink(g,i) {
	if (selState.state == state["selected"]) {
		/*handler*/
	}
}

function tick() {
	link.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
	node.attr("transform", function(d) {
		return "translate(" + d.x + "," + d.y + ")"; });
}