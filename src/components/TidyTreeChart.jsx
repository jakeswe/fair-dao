import { ethers } from 'ethers'
import { useEffect, useState, useRef } from 'react'
import * as d3 from "d3"
import '../assets/radialtree.scss';

function TidyTreeChart({data, width, height}){
    const svgRef = useRef();
    const w = parseInt(width);
    useEffect(() => {

        // Compute the tree height; this approach will allow the height of the
        // SVG to scale according to the breadth (width) of the tree layout.
        const root = d3.hierarchy(data);
        const dx = 10;
        const dy = w / (root.height + 1);
      
        // Create a tree layout.
        const tree = d3.tree().nodeSize([dx, dy]);
      
        // Sort the tree and apply the layout.
        //root.sort((a, b) => d3.ascending(a.data.name, b.data.name));
        tree(root);
      
        // Compute the extent of the tree. Note that x and y are swapped here
        // because in the tree layout, x is the breadth, but when displayed, the
        // tree extends right rather than down.
        let x0 = Infinity;
        let x1 = -x0;
        root.each(d => {
          if (d.x > x1) x1 = d.x;
          if (d.x < x0) x0 = d.x;
        });
      
        // Compute the adjusted height of the tree.
        const height = x1 - x0 + dx * 2;
        
        tree(root);
        const svg = d3.select(svgRef.current)
          .attr("width", w + 100)
          .attr("height", height)
          .attr("viewBox", [-dy / 3, x0 - dx, w, height])
          .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

        svg.selectAll("*").remove();

        // Create links
        const link = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5)
      .selectAll()
        .data(root.links())
        .join("path")
        .attr("class", d => d.target.data.hl === true ? "link highlight" :
          d.target.data.payed === true ? "link payed" : "link")
          .attr("d", d3.linkHorizontal()
              .x(d => d.y)
              .y(d => d.x));
    
    const node = svg.append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
      .selectAll()
      .data(root.descendants())
      .join("g")
        .attr("transform", d => `translate(${d.y},${d.x})`);
  
    node.append("circle")
        .attr("fill", d => d.children ? "#555" : "#999")
        .attr("fill", d => d.data.hl ? "orange" : d.children ? "#555" : "#999")
        .attr("r", 2.5);
  
    node.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.children ? -6 : 6)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.data.name)
        .attr("stroke", "white")
        .attr("fill", d => d.data.current === true ? "orange" : "black")
        .attr("paint-order", "stroke");

    }, [data, width, height])
    return (
    <div className="border-1px">
      <svg ref={svgRef}></svg>
    </div>
    );
}
export default TidyTreeChart;