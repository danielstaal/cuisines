// 
// Date: 23/10/19
// Title: Cuisine similarities
// 

/////////////////////////////////////////////
// Data loading
/////////////////////////////////////////////

d3.json("similarities.json").then(function(matrix) {
d3.json("colors.json").then(function(colors) {
d3.json("flags.json").then(function(country_flags) {


/////////////////////////////////////////////
// Global settings
/////////////////////////////////////////////

// set the dimensions and margins of the graph
var inner_chart_width = 500
    inner_chart_height = 500
    margin = 40

var total_width = 1000
var total_height = 1000

var chord_opacity_mouseout = 0.3
var chord_opacity_hover = 0.1
var flag_opacity_hover = 0.3

// The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
var inner_radius = Math.min(inner_chart_width, inner_chart_height) / 2 - margin
var outer_radius = Math.min(total_width, total_height) / 2 - margin
var inbetween_radius = (inner_radius + outer_radius) / 2

// size of images
var ingredient_width = 40
var ingredient_height = 40
var flag_width = 44
var flag_height = 44


/////////////////////////////////////////////
// Data preprocessing
/////////////////////////////////////////////

var cuisine_names = ['greek', 'southern_us', 'filipino', 'indian', 'jamaican',
       'spanish', 'italian', 'mexican', 'chinese', 'british', 'thai',
       'vietnamese', 'cajun_creole', 'brazilian', 'french', 'japanese',
       'irish', 'korean', 'moroccan', 'russian']

var ingredient_names = ['salt', 'olive oil','onions','water','garlic','sugar','garlic cloves','butter','ground black pepper','all-purpose flour','pepper','vegetable oil','eggs','soy sauce','kosher salt','green onions','tomatoes','large eggs','carrots','unsalted butter','ground cumin','extra-virgin olive oil','black pepper','milk','chili powder','oil','red bell pepper','purple onion','scallions','grated parmesan cheese','sesame oil','corn starch','ginger','baking powder','jalapeno chilies','dried oregano','chopped cilantro fresh','fresh lemon juice','diced tomatoes','fresh parsley','minced garlic','chicken broth','sour cream','cayenne pepper','fresh ginger','brown sugar','cooking spray','shallots','garlic powder','lime']

var flag_positions = []
for(var i=0;i<cuisine_names.length;i++){
  var theta = (1.555*Math.PI + (2*Math.PI/cuisine_names.length)*i) % (2*Math.PI)
  var r = inner_radius + flag_height
  var x = r * Math.cos(theta)
  var y = r * Math.sin(theta)
  flag_positions.push({"x":x, "y":y, "theta":theta})
}

var ingredient_positions = []
for(var i=0;i<ingredient_names.length;i++){
  // calculate angle and radius as end coordinates for the lines
  var theta = (1.562*Math.PI + (2*Math.PI/ingredient_names.length)*i) % (2*Math.PI)
  var r = (outer_radius - ingredient_width/2 - 15)
  var x = r * Math.cos(theta)
  var y = r * Math.sin(theta)
  ingredient_positions.push({"x":x, "y":y, "theta":theta})
}

// create an Object containing country name, img and position
var country_data = cuisine_names.map(function(d,i){
  var x_pos = inner_radius * Math.cos(1.555*Math.PI + (2*Math.PI/cuisine_names.length)*i) - flag_width/2
  var y_pos = inner_radius * Math.sin(1.555*Math.PI + (2*Math.PI/cuisine_names.length)*i) - flag_width/2
  return {"name":d, 
          "img":country_flags[i],
          "x": x_pos,
          "y": y_pos
         }
})

// create an Object containing ingredient name, img_location and coordinates
var ingredient_data = ingredient_names.map(function(d,i){
  var x_pos = outer_radius * Math.cos((2*Math.PI/ingredient_names.length)*i) - ingredient_width/2
  var y_pos = outer_radius * Math.sin((2*Math.PI/ingredient_names.length)*i) - ingredient_width/2
  return {"name":d, 
          "img":country_flags[0],
          "x": x_pos,
          "y": y_pos
         }
})


/////////////////////////////////////////////
// DOM elements
/////////////////////////////////////////////

var svg = d3.select("svg")
  .attr("width", total_width)
  .attr("height", total_height)

  var g_inner_chart = svg
    .append("g")
    .attr("transform", "translate(" + total_width / 2 + "," + total_height / 2 + ")");

    var g_country_flags = g_inner_chart
      .append("g")

    var g_inner_chords = g_inner_chart
      .append("g")
      .attr("transform", "rotate(3)");

  var g_outer_chart = svg
    .append('g')
    .attr("transform", "translate(" + total_width / 2 + "," + total_height / 2 + ")");
    
    var g_ingredients = g_outer_chart
      .append("g")

    var g_lines = g_outer_chart
      .append("g")


/////////////////////////////////////////////
// Global functions
/////////////////////////////////////////////

// onmouseover country flag
function hoverFlag(country_d, country_i){

  // this var keeps track of chords that have obtained a new opacity value
  var connected_countries = []
  
  // hover chords
  g_inner_chords
    .selectAll("path")
    .transition()
    .duration(400)
    .style("opacity", function(d){
      if(d.source.index === country_i){
        connected_countries[d.target.index] = d.source.value
        return 1.0;
      }
      else if(d.target.index === country_i){
        connected_countries[d.source.index] = d.target.value
        return 1.0;
      }
      else{return chord_opacity_hover;}
    })
    
  // hover flags
  g_country_flags
    .selectAll('image')
    .transition()
    .duration(200)
    .style('opacity', function(d,i){
      if(i === country_i){return 1.0;}
      else if(i in connected_countries){return flag_opacity_hover+3*connected_countries[i]}
      else{return flag_opacity_hover} 
    });

  // select the right lines and add them
  var start = (country_i) * ingredient_names.length
  var end = start + ingredient_names.length
  g_lines
    .selectAll("lines")
    .data(line_paths.slice(start, end))
    .enter()
    .append("path")
    // .attr("id", function(d,i){return "line_" + String(i)})
    .transition()
    .duration(800)
    .attr("d", function(d){
      return line(d)
    })
    .attr("stroke-width", 2)
    .attr("stroke", function(d,i){
      return colors[country_i][i%colors[country_i].length]
    })
    .attr("fill", "None")
}

// onmouseout country flag
function mouseOutFlag(){
  // unhover chords
  g_inner_chords
    .selectAll("path")
    .transition()
    .duration(400)
    .style("opacity", chord_opacity_mouseout)

  // unhover action flags
  g_country_flags
    .selectAll('image')
    .transition()
    .duration(200)
    .style('opacity', 1.0)

  g_lines
    .selectAll("path")
    .remove()
}

// return a color for a chord that is in the given flag
function flag_color(flag_index, i){
  return colors[flag_index][i % colors[flag_index].length]
}


/////////////////////////////////////////////
// Country flags
/////////////////////////////////////////////

// add images
g_country_flags
  .selectAll("image")
  .data(country_data)
  .enter()
  .append('svg:image')
  .attr("id", function(d, i){return "flagid_" + d.name})
  .attr("xlink:href", function(d){return "flags/" + d.img})
  .attr("width", flag_width)
  .attr("height", flag_width)
  .attr("x", function(d,i){return d.x})
  .attr("y", function(d,i){return d.y})
  .on("mouseover", hoverFlag)   
  .on("mouseout", mouseOutFlag)


/////////////////////////////////////////////
// Chord diagram
/////////////////////////////////////////////

// give this matrix to d3.chord(): it will calculates all the info we need to draw arc and ribbon
var res = d3.chord()
  .padAngle(0.09) // padding between entities (black arc)
  .sortSubgroups(d3.descending)(matrix)

// Add the links between groups
g_inner_chords
  .datum(res)
  .selectAll("path")
  .data(function(d) {return d; })
  .enter()
  .append("path")
    .attr("d", d3.ribbon()
      .radius(170)
    )
    .style("fill", function(d,i){
      return "url(#" + getGradID(d) + ")"; 
    })
    // .style("stroke", "black")
    .style("opacity", chord_opacity_mouseout)

//Create an SVG text element and append a textPath element
// g_country_flags.selectAll("country_text")
//   .data(data)
//   .enter()
//     .append("text")
//     .append("textPath") //append a textPath to the text element
//     .attr("xlink:href", function(d,i){return "#pathid" + String(i)}) //place the ID of the path here
//     // .style("text-anchor","middle") //place the text halfway on the arc
//     // .attr("startOffset", "19%")
//     .text(function(d){return d.name});

// creating the fill gradient
function getGradID(d){ return "linkGrad-" + d.source.index + "-" + d.target.index; }

var grads = g_inner_chords.append("defs")
  .selectAll("linearGradient")
  .data(res)
  .enter()
  .append("linearGradient")
  .attr("id", getGradID)
  .attr("gradientUnits", "userSpaceOnUse")
  .attr("x1", function(d, i){ return 170 * Math.cos((d.source.endAngle-d.source.startAngle) / 2 + d.source.startAngle - Math.PI/2); })
  .attr("y1", function(d, i){ return 170 * Math.sin((d.source.endAngle-d.source.startAngle) / 2 + d.source.startAngle - Math.PI/2); })
  .attr("x2", function(d,i){ return 170 * Math.cos((d.target.endAngle-d.target.startAngle) / 2 + d.target.startAngle - Math.PI/2); })
  .attr("y2", function(d,i){ return 170 * Math.sin((d.target.endAngle-d.target.startAngle) / 2 + d.target.startAngle - Math.PI/2); })

  // set the starting color (at 0%)

  grads.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", function(d, i){ return flag_color(d.source.index,i)})

    //set the ending color (at 100%)
  grads.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", function(d, i){ return flag_color(d.target.index,i)})


/////////////////////////////////////////////
// Ingredients circle
/////////////////////////////////////////////

// add images
g_ingredients
  .selectAll("image")
  .data(ingredient_data)
  .enter()
  .append('svg:image')
  // .attr("id", function(d, i){return "flagid_" + d.name})
  .attr("xlink:href", function(d){return "flags/" + d.img})
  .attr("width", ingredient_width)
  .attr("height", ingredient_height)
  .attr("x", function(d,i){return d.x})
  .attr("y", function(d,i){return d.y})
  

  // .on("mouseover", function (d, i) {
  //   g_ingredients.select('#pathid' + String(i))
  //   .call(function(){hoverFlag(i)})
  // })   
  // .on("mouseout", function(d,i){
  //   g_ingredients.select('#pathid' + String(i))
  //   .call(function(){mouseOutFlag()})
  // })


/////////////////////////////////////////////
// Ingredients circle
/////////////////////////////////////////////

var line = d3.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .curve(d3.curveBundle.beta(1))

// create an array of paths that each represent the path of a line
var line_paths = []
for(var i=0;i<country_data.length;i++){
  for(var j=0;j<ingredient_data.length;j++){
    // start and end position of a line
    var start = {"x":flag_positions[i].x, "y":flag_positions[i].y}
    var end = {"x":ingredient_positions[j].x, "y":ingredient_positions[j].y}

    // the theta of the start and end position
    var start_theta = flag_positions[i].theta
    var end_theta = ingredient_positions[j].theta
    if(start_theta>end_theta){
      end_theta += 2*Math.PI
    }

    // theta between the start and end
    var difference_theta = Math.abs(end_theta - start_theta)
    // if counterclockwise is a shorter path
    if(end_theta - start_theta > Math.PI){
      difference_theta = Math.abs(2*Math.PI - difference_theta)
    }

    // calculate the amount of anchor points wanted
    var anchor_points = []
    var no_of_anchor_points = Math.max(Math.floor(difference_theta*2.8), 2)
    var theta_stepsize = difference_theta/no_of_anchor_points
    // if counterclockwise is a shorter path
    if(end_theta - start_theta > Math.PI){
      theta_stepsize = -theta_stepsize
    }

    // determine the radius of the anchor point. With the current function,
    // longer lines are more on the inside
    var r = inbetween_radius + difference_theta*(-85/Math.PI) + 70

    anchor_points.push(start)
    // add each anchor point to the array of anchor points
    for(var k = 0;k<no_of_anchor_points;k++){
      var theta = start_theta + k * theta_stepsize
      var x = r*Math.cos(theta)
      var y = r*Math.sin(theta)
      anchor_points.push({"x":x, "y":y})
    }
    anchor_points.push(end)

    // add the path to the array of line paths
    line_paths.push(anchor_points)
  }
}

// console.log(line_paths)


  

/////////////////////////////////////////////
// Anchor points
/////////////////////////////////////////////

// starting points
g_lines
  .selectAll("points")
  .data(line_paths)
  .enter()
  .append('circle')
  .attr("cx", function(d,i){return d[0].x})
  .attr("cy", function(d,i){return d[0].y})
  .attr("r", 3)
  .attr("stroke-width", 2)
  .attr("stroke", function(d,i){
    return colors[Math.floor(i/50)][0]
  })
  .attr("fill", "steelblue");

// end points
g_lines
  .selectAll("points")
  .data(line_paths)
  .enter()
  .append('circle')
  .attr("cx", function(d,i){return d[d.length-1].x})
  .attr("cy", function(d,i){return d[d.length-1].y})
  .attr("r", 3)
  .attr("stroke-width", 2)
  .attr("stroke", "steelblue")
  .attr("fill", "steelblue");


// inbetween circle
// g_lines
//   .append('circle')
//   // .attr("cx", 0)
//   // .attr("cy", 0)
//   .attr("r", inbetween_radius)
//   .attr("stroke-width", 2)
//   .attr("stroke", "steelblue")
//   .attr("fill", "None");

// close all file loads
}); 
});
});





 


/////////////////////////////////////////////
// Unused code
/////////////////////////////////////////////

// PIE CHART FILL

// // Image fills
// g_country_flags
//   .selectAll("defs")
//   .data(country_data)
//   .enter()
//   .append("svg:defs")
//   .append('svg:pattern')
//   .attr("id", function(d){return "imgid" + d.name})
//   // .attr("id", "#ida")
//   .attr("width", 1)
//   .attr("height", 1)
//   .attr("x", 10)
//   .append("svg:image")
//   .attr("xlink:href", function(d){return "flags/" + String(d.img)}) 
//   .attr("width", 40)
//   .attr("height", 40)
//   .attr("x", 16)
//   .attr("y", 20);

// // Compute the position of each group on the pie:
// var pie = d3.pie()
//   .value(function(d){return d.value.size})
// var data_ready = pie(d3.entries(country_data))

// // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
// g_country_flags
//   .selectAll()
//   .data(data_ready)
//   .enter()
//   .append('path')
//   .attr("id", function(d, i){return "pathid" + String(i)})
//   .attr('d', d3.arc()
//     .innerRadius(180)         // This is the size of the donut hole
//     .outerRadius(inner_radius)
//   )
//   .attr('fill', function(d){return "url(#imgid" + d.data.value.name + ")"})
//   .on("mouseover", function (d, i) {
//     g_country_flags.select('#pathid' + String(i))
//     .call(function(){hoverFlag(i)})
//   })   
//   .on("mouseout", function(d,i){
//     g_country_flags.select('#pathid' + String(i))
//     // .attr('fill', function(d){return "url(#imgid" + d.name + ")"})
//     .call(function(){mouseOutFlag()})
//   })