var rpwidth = 200,
    width = $(window).width() - rpwidth,
    height = $(window).height();

var force = d3.layout.force()
    .on("tick", tick)
    .charge(-(width+height))
    .gravity(0.1)
    .size([width, height])
    .friction(0.9);

var svg = d3.select("#vis").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "vis");

var colorScale = d3.scale.category20(),
        color = function(c) {return d3.interpolateRgb(colorScale(c),d3.rgb(255,255,255))(0.3);};

// var graph = svg.insert("svg:g")
//      .attr("width", 500)
//      .attr("height", 500);

var visBack = svg.insert("svg:rect")
    .attr("class", "visBack")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "white")
    //.on("click", function(d) { if (d3.event.keyCode === 18) { addNode(d); }})
    //.on("mousedown", addNode);

var linkGroup = svg.append("svg:g")
    .attr('class', 'links');

var nodeGroup = svg.append("svg:g")
    .attr('class', 'nodes');

var node,
    nodes,
    link,
    linkline,
    linkname;

var nodeEnter = svg.append('svg:g').selectAll('g');

// only respond once per keydown
var lastKeyDown = -1;

//mouse events vars
var selected_node = null,
    selected_link = null;
    mousedown_node = null;
    mousedown_link = null;
    mouseup_node = null;

var arrayId;
    
var links, 
    selState = {state: 0, nodes: []},
    state = {"normal": 0, "highlighted": 1, "selected": 2};

//line displayed when dragging new nodes
// var drag_line = vis.append("line")
//     .attr("class", "drag_line")
//     .attr("x1", 0)
//     .attr("y1", 0)
//     .attr("x2", 0)
//     .attr("y2", 0);

d3.select(window)
    .on("keydown", keydown)
    .on("keyup", keyup);

function sourceOf(link) {
    return link.source;
}

function targetOf(link) {
    return link.target;
}

function nodeFactorSize(size) {
    var nodeMaxArea = (width*height)/nodes.length,
        maxFactor = d3.max(nodes.map(function(node){
            return node.documents.length
        })),
        normFactor = size/maxFactor;
    return Math.sqrt(nodeMaxArea*normFactor)/5;
}

//update force layout
function tick() {
    linkline.attr("x1", function(d) { return sourceOf(d).x; })
        .attr("y1", function(d) { return sourceOf(d).y; })
        .attr("x2", function(d) { return targetOf(d).x; })
        .attr("y2", function(d) { return targetOf(d).y; });

    linkname.attr("x", function(d) {
    var x1 = sourceOf(d).x,
        x2 = targetOf(d).x,
        y1 = sourceOf(d).y,
        y2 = targetOf(d).y;
    return Math.abs((x2 - x1)/2) + Math.min(x1, x2); 
    })
    .attr("y", function(d) {
    var x1 = sourceOf(d).x,
        x2 = targetOf(d).x,
        y1 = sourceOf(d).y,
        y2 = targetOf(d).y;
      return Math.abs((y2 - y1)/2) + Math.min(y1, y2);
    });

    node.attr("transform", function(d) {return "translate(" + d.x + " " + d.y + ")";});
};

function buildLinks() {
    nodes.forEach(function(node){
        links.forEach(function(link){
            if (link.source == node.id) {
                link.source = node;
            }
            if (link.target == node.id) {
                link.target = node;
            }
        })
    });
}

function buildNodes() {
    nodes.forEach(function(node){
        node.links = node.links.map(function(nid){
            return nodes.filter(function(node){
                return node.id == nid;
            })[0];
        });
    });  
}

d3.json("static/data.json", function(json) {
    nodes = json.clusters;
    links = json.links;
    buildLinks();
    buildNodes();
    update();
});

function nodesId(node){
    return node.id;
}

function update() {
    var linkEnter;
    
    force
        .nodes(nodes)
        .start();

    arrayId = d3.set(nodes.map(nodesId));
 
    // Updating links
    link = linkGroup.selectAll("g.link")
        .data(links, function(d) {return d.id;});   

    // Entering new links
    var linkEnter = link.enter().append("svg:g")
        .attr("class", "link")
        .on('mousedown', function(d) {
            if(d3.event.ctrlKey) return;

            // select link
            mousedown_link = d;
            if(mousedown_link === selected_link) selected_link = null;
            else selected_link = mousedown_link;
            selected_node = null;

            selectLink(this,selected_link);
        })
        .on("mouseover", linkMouseOver)
        .on("mouseout", linkMouseOut);

    linkEnter.append("svg:line")
        .attr("class", "link")
        .style("fill", function(d) { return d.color })
        .style("stroke", function(d) {return d3.rgb(d.color).darker(1);})
        .attr("x1", function(d) {sourceOf(d).x})
        .attr("y1", function(d) {sourceOf(d).y})
        .attr("x2", function(d) {targetOf(d).x})
        .attr("y2", function(d) {targetOf(d).y})

    linkline = link.selectAll('line.link');
    
    // Exiting old links
    link.exit().remove();

    //Updating link name
    linkname = linkGroup.selectAll("text.linklabel")
        .data(links);   

    // Entering new linknames
    linkname.enter().append("text")
        .attr("x", function(d) {
            var x1 = sourceOf(d).x,
                x2 = targetOf(d).x,
                y1 = sourceOf(d).y,
                y2 = targetOf(d).y;
            return Math.abs((x2-x1)/2) + Math.min(x1, x2); 
        })
        .attr("y", function(d) {
            var x1 = sourceOf(d).x,
                x2 = targetOf(d).x,
                y1 = sourceOf(d).y,
                y2 = targetOf(d).y;
            return Math.abs((y2-y1)/2) + Math.min(y1, y2);
        })
        .text(function(d) { return d.label; })
        .attr("class", "linklabel")
        .attr("text-anchor", "middle");

    // Exiting old linknames
    linkname.exit().remove();

    // Updating nodes
    node = nodeGroup.selectAll("g.node")
        .data(nodes, function(d) {return d.id;});

    // Entering nodes
    nodeEnter = node.enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function(d) {return "translate(" + d.x + " " + d.y + ")";})
        .on("mouseover", nodeMouseOver)
        .on("mouseout", nodeMouseOut)
        //.on("click", nameNodes)
        .on("mousedown", function(d) {
            if (d3.event.ctrlKey) return;

            //select node
            mousedown_node = d;
            if (mousedown_node === selected_node) selected_node = null;
            else selected_node = mousedown_node;
            selected_link = null;
                
            selectNode(this,selected_node);
        })
        .on("mouseup", function(d) {
            if (!mousedown_node) return;

            mouseup_node = d;
            if(mouseup_node === mousedown_node) { resetMouseVars(); return; }

            newLink(mousedown_node, mouseup_node);
        });
        //.call(force.drag);

    // Entering circles to nodes
    nodeEnter.insert("svg:circle")
            .attr("class", "node")
            .attr("r", function(d) {return Math.max(nodeFactorSize(d.documents.length), 30); })
            .style("fill", function(d) {return d.color;})
            .style("stroke", function(d) {return d3.rgb(d.color).darker(1);});

    //Entering labels to nodes
    nodeEnter.insert("text")
        .attr("class", "nodelabel")
        .style("text-anchor", "middle")
        .attr("dy", 3)
        .text(function(d) {return d.id;});

    // Exiting old nodes
    node.exit().remove();
}

//Reset mouse events
function resetMouseVars() {
  mousedown_node = null;
  mouseup_node = null;
  mousedown_link = null;
}

//creating new links while dragging the mouse
function mousemove() {
  if (!mousedown_node) return;

  // update drag line
  drag_line
      .attr("x1", mousedown_node.x)
      .attr("y1", mousedown_node.y)
      .attr("x2", d3.svg.mouse(this)[0])
      .attr("y2", d3.svg.mouse(this)[1]);

}

function linkMouseOver(d,i) {
    return;
}

function linkMouseOut(d,i) {
    if (this.selstate != "selected"){
        this.selstate = "mouseout";
    }

    resetNodes(this,d,i);
}

//Highlight
function nodeMouseOver(d) {
    if (d.selstate != "selected")
        d.selstate = "mouseover";
    highlightNetwork(this,d);
    
}

// Opacity of nodes
function highlightNetwork(g,d) {
    if (d.selstate == "mouseover") {

        d3.select(g).select("circle")
            .classed("nodehover", true);
        
        svg.selectAll("line.link")
            .filter(function(e){
                return e.source != d && e.target != d;
            })
        .classed("alpha25", true);

        svg.selectAll("g.node")
            .filter(function(e){
                return e.links.indexOf(d) == -1 && e != d;
            })
        .classed("alpha25", true);

        svg.selectAll("text")
            .filter(function(e){
                return e.source != d && e.target != d;
            })
        .classed("alpha25", true);

        svg.selectAll(".nodelabel")
            .classed("alpha25", false);
    }
}

//Reset Highlight
function nodeMouseOut(d,i) {
    if (this.selstate != "selected"){
        this.selstate = "mouseout";
    }

    resetNodes(this,d,i);
}

function resetNodes(g,d,i) {
    if (g.selstate == "mouseout") {
        d3.select(g).select("circle")
            .classed("nodehover", false);

        svg.selectAll("line.link")
            .classed("alpha25", false);

        svg.selectAll("g.node")
           .classed("alpha25", false); 

        svg.selectAll("text")
            .classed("alpha25", false);
    }
}

//Changing node names
function nameNodes(g, i) {
    if (!(selState.state == state["selected"])) {
      
        selState.state = state["highlighted"];
          
            var id = g.id,
                j;

            for(j=0; j<nodes.length; j++){
                if (nodes[j].id == id) {
                    nodes[j].id = prompt(nodes[j].id);

                    while ((arrayId.has(nodes[j].id) == true) || (nodes[j].id == null || nodes[j].id == "")) {
                        alert("Please, insert name.");
                        nodes[j].id = prompt(nodes[j].id);
                    }
                }
            }   

        svg.selectAll(".nodelabel")
            .text(function(d) { return d.id; });

        updateNodeLabel();
    }
    update();
}

//Update name of nodes
function updateNodeLabel() {
    d3.selectAll('text.nodelabel')
        .text(function(d) { return d.id; });
}

//Changing link name
function nameLink(g,d) {
  if (!(selState.state == state["selected"])) {
      
      selState.state = state["highlighted"];
      
        var source = g.source.id,
            target = g.target.id;

        //Changing name
        links.forEach(function(d) {
            if (d.source.id == source) {
                if (d.target.id == target) {
                    d.label = prompt(d.label);
                    while (d.label == null || d.label == "") {
                        alert("Please, insert name.");
                        d.label = prompt(d.label);
                    }
                }
            }
        });

    svg.selectAll(".linklabel")
        .text(function(d) { return d.label; });

    updateLinkLabel();
    }
    update();
}

//Update name of link
function updateLinkLabel() {
    d3.selectAll('text.linklabel')//.data(nodes, function(elem){return elem.id;}).enter()
        .text(function(d) { return d.label; });
}

// Remove Node
function removeNode(d) {
    // Remove all related links
    links = links.filter(function(l){
        return l.source != d && l.target != d;
    });

    // Remove node
    nodes.splice(nodes.indexOf(d), 1);

    arrayId.remove(d.id);

    update();
}

//Remove links   
function removeLink(d) {
    links.splice(links.indexOf(d), 1);
    
    update();
}

//Add new nodes
function addNode() {
    if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;

    var newNode;

    newNode = {
            "id": "",
            "documents": [],
            "links": [],
            "color": "#DCDCDC",
            "selectNode": false
            };

    while ((newNode.id == "" || newNode.id == null) || (arrayId.has(newNode.id) == true)) {
        newNode.id = prompt("Please, enter a name for the cluster");
    }

    nodes.push(newNode);

    arrayId.add(newNode.id);

    update();
}

function newLink(k,m) {
    var newLink,
        invert;

    newLink = {
            "id": "",
            "label": "",
            "source": "",
            "target": "",
            "weight": 0,
            "color": "#4169E1",
            "selectLink": false
        };

    newLink.label = "No_Name";
    newLink.source = m;       
    newLink.target = k;
    newLink.id = newLink.source.id + "." + newLink.target.id;
    invert = newLink.target.id + "." + newLink.source.id;
    

    for(i=0; i<links.length; i++) {
        if(newLink.id == links[i].id || invert == links[i].id){
            selected_node = null;
            return;
        }
    }

    m.links.push(k);
    k.links.push(m);

    links.push(newLink);

    selected_node = null;

    update();
}

function selectNode(g,d) {
    if (selected_node) {
        d3.select(g).select("circle")
            .classed("node-selected", true);

        d3.selectAll("line.link")
            .classed("link-selected", false);
    } else {
        d3.select(g).select("circle")
            .classed("node-selected", false);
    }
}

/*function selectNode(g,d) {
    var previousSelection;
    
    if (!d.selectNode) {
        nodes.forEach(function(node){
            if (node.selectNode) previousSelection = node;
        });

        d.selectNode = true;
        d3.select(g).select("circle")
            .classed("node-selected", true);

        if (previousSelection) {
            d3.selectAll("circle")
                .classed("node-selected", false);

            previousSelection.selectNode = false;        
            d.selectNode = false;
            selected_node.d = null;

            newLink(previousSelection, d);
        }

    } else {
        d3.select(g).select("circle")
            .classed("node-selected", false);
    }
}*/

function selectLink(g) {
    if (selected_link) {
        d3.select(g).select("line.link")
            .classed("link-selected", true);

        d3.selectAll("circle")
            .classed("node-selected", false);

    } else {
        d3.select(g).select("line.link")
            .classed("link-selected", false);
    }
}

//Remo
function keydown() {
    //d3.event.preventDefault();

    if(lastKeyDown !== -1) return;
    lastKeyDown = d3.event.keyCode;

    if (d3.event.keyCode === 17) {
        nodeEnter.call(force.drag);
        //svg.classed('ctrl', true);
    }

    if (!selected_node && !selected_link) return;

    if (d3.event.ctrlKey) return;
    switch (d3.event.keyCode) {
        case 46: { //delete
            if (selected_node) {
                removeNode(selected_node);
                selected_node = null;
                d3.selectAll("circle")
                    .classed("node-selected", false); 
            } else if (selected_link) {
                removeLink(selected_link);
                selected_link = null;
                d3.selectAll("line.link")
                    .classed("link-selected", false);
            }
            break;
        }

        //deselect nodes and links
        case 27: {
            if (selected_node) {
                selected_node = null;
                d3.selectAll("circle")
                    .classed("node-selected", false); 
            } else if (selected_link) {
                selected_link = null;
                d3.selectAll("line.link")
                    .classed("link-selected", false);                
            }
            break;
        }
    }
}

function keyup() {
  lastKeyDown = -1;

  // ctrl
  if(d3.event.keyCode === 17) {
    nodeEnter
      .on('mousedown.drag', null)
      .on('touchstart.drag', null);
    svg.classed('ctrl', false);
  }
}

//??
/*function check(g,d){
    for (k=0; k<nodes.length; k++){
        for(i=0; i<links.length; i++){
            if (nodes[k].selectNode == true && nodes[k] != d){
                nodes[k].selectNode = false;
                selectedLink(g,d);
            } else if(links[i].selectLink == true){
                links[i].selectLink = false;
                selectedLink(g,d);
            } else selectedLink(g,d);
        }
    }
}*/