import { ethers } from 'ethers'
import { useEffect, useState, useRef } from 'react'
import * as d3 from "d3"
import '../assets/radialtree.scss';

function RadialTreeChart({data, width, height}){
    const svgRef = useRef();
    useEffect(() => {
        const radius = Math.min(width, height) / 2;
        const tree = d3.tree().size([2 * Math.PI, radius - 100]);
        
        const root = d3.hierarchy(data);
        tree(root);
        const svg = d3.select(svgRef.current);

        svg.selectAll("*").remove();

        svg.attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height]);

        // Create links
        svg.append("g")
          .selectAll("path")
          .data(root.links())
          .join("path")
          .attr("fill", "none")
          .attr("stroke", "#555")
          .attr("stroke-width", 1.5)
          .attr("class", d => d.target.data.hl === true ? "link highlight" :
             d.target.data.payed === true ? "link payed" : "link")
          .attr("d", d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y));
        // Create nodes
          
        svg.append("g")
          .selectAll("circle")
          .data(root.descendants())
          .join("circle")
          .attr("transform", d => `
            rotate(${d.x * 180 / Math.PI - 90}) 
            translate(${d.y},0)
          `)
          .attr("fill", d => d.data.hl ? "orange" : d.children ? "#555" : "#999")
          .attr("r", 4);
          
        // Add labels
        svg.append("g")
          .selectAll("text")
          .data(root.descendants())
          .join("text")
          .attr("transform", d => `
            rotate(${d.x * 180 / Math.PI - 90}) 
            translate(${d.y},0) 
            rotate(${d.x >= Math.PI ? 180 : 0})
          `)
          .attr("dy", "0.31em")
          .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
          .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
          .text(d => d.data.name)
          .attr("fill", d => d.data.current === true ? "orange" : "black")
          .attr("font-family", "sans-serif")
          .attr("font-size", 10)
          .clone(true).lower()
          .attr("stroke", "white");

    }, [data, width, height])
    return (
    <div className="border-1px">
      <svg ref={svgRef}></svg>
    </div>
    );
}
export default RadialTreeChart;