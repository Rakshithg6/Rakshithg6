const fs = require('fs');
const { select } = require('d3-selection');
const { scaleLinear } = require('d3-scale');
const { line, area } = require('d3-shape');
const { JSDOM } = require('jsdom');

const width = 800;
const height = 200;
const margin = { top: 20, right: 20, bottom: 30, left: 40 };

const username = process.env.GITHUB_REPOSITORY_OWNER; // Your GitHub username
const token = process.env.GITHUB_TOKEN;

async function fetchContributions() {
  const response = await fetch(`https://api.github.com/users/${username}/events`, {
    headers: {
      Authorization: `token ${token}`,
    },
  });
  const events = await response.json();
  // Simplified: Aggregate contributions by day (real implementation would need more parsing)
  const contributions = Array(30).fill().map((_, i) => ({
    day: i + 1,
    count: Math.floor(Math.random() * 5), // Replace with actual contribution count
  }));
  return contributions;
}

function createSVG(contributions) {
  const svg = select(new JSDOM('<!DOCTYPE html><body></body>').window.document.body)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('background', '#1A1A2E');

  const x = scaleLinear()
    .domain([0, contributions.length - 1])
    .range([margin.left, width - margin.right]);

  const y = scaleLinear()
    .domain([0, 5])
    .range([height - margin.bottom, margin.top]);

  const lineGenerator = line()
    .x((d, i) => x(i))
    .y(d => y(d.count));

  const areaGenerator = area()
    .x((d, i) => x(i))
    .y0(height - margin.bottom)
    .y1(d => y(d.count))
    .curve(d3.curveBasis);

  svg.append('g')
    .attr('class', 'grid')
    .attr('stroke', '#666666')
    .attr('stroke-opacity', 0.3)
    .selectAll('line')
    .data(y.ticks(5))
    .enter().append('line')
    .attr('x1', margin.left)
    .attr('x2', width - margin.right)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d));

  svg.append('path')
    .datum(contributions)
    .attr('fill', '#FF00FF')
    .attr('fill-opacity', 0.5)
    .attr('d', areaGenerator);

  svg.append('path')
    .datum(contributions)
    .attr('fill', 'none')
    .attr('stroke', '#FFFFFF')
    .attr('stroke-width', 2)
    .attr('d', lineGenerator);

  // Gradient at bottom
  const gradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%');
  gradient.append('stop').attr('offset', '0%').attr('style', 'stop-color:#00FFFF;');
  gradient.append('stop').attr('offset', '25%').attr('style', 'stop-color:#00FF00;');
  gradient.append('stop').attr('offset', '50%').attr('style', 'stop-color:#FFFF00;');
  gradient.append('stop').attr('offset', '75%').attr('style', 'stop-color:#FF0000;');
  gradient.append('stop').attr('offset', '100%').attr('style', 'stop-color:#FF00FF;');

  svg.append('rect')
    .attr('x', margin.left)
    .attr('y', height - margin.bottom + 5)
    .attr('width', width - margin.left - margin.right)
    .attr('height', 20)
    .attr('fill', 'url(#gradient)');

  // Axes (simplified)
  svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .selectAll('text')
    .data(contributions.map(d => d.day))
    .enter().append('text')
    .attr('x', (d, i) => x(i))
    .attr('y', 10)
    .attr('text-anchor', 'middle')
    .text(d => d);

  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .selectAll('text')
    .data([0, 1, 2, 3, 4, 5])
    .enter().append('text')
    .attr('x', -5)
    .attr('y', d => y(d))
    .attr('text-anchor', 'end')
    .text(d => d);

  const svgString = new XMLSerializer().serializeToString(svg.node());
  fs.writeFileSync('output/heatmap.svg', svgString);
}

(async () => {
  const contributions = await fetchContributions();
  createSVG(contributions);
})();
