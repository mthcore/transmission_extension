import {observer} from "mobx-react";
import {autorun} from "mobx";
import React from "react";
import RootStoreCtx from "../tools/RootStoreCtx";

// Simple linear scale function (replaces d3.scaleLinear)
function createScale() {
  let domain = [0, 1];
  let range = [0, 1];

  const scale = (value) => {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    if (d1 === d0) return r0;
    return r0 + (value - d0) * (r1 - r0) / (d1 - d0);
  };

  scale.domain = (d) => { domain = d; return scale; };
  scale.range = (r) => { range = r; return scale; };

  return scale;
}

// Generate SVG path from data points (replaces d3.line with curveBasis)
function generatePath(data, xScale, yScale, valueKey) {
  if (!data || data.length === 0) return '';
  if (data.length === 1) {
    const x = xScale(data[0].time);
    const y = yScale(data[0][valueKey]);
    return `M${x},${y}`;
  }

  // Simple smooth curve using quadratic bezier
  let path = `M${xScale(data[0].time)},${yScale(data[0][valueKey])}`;

  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    const x0 = xScale(prev.time);
    const y0 = yScale(prev[valueKey]);
    const x1 = xScale(curr.time);
    const y1 = yScale(curr[valueKey]);

    // Control point at midpoint for smooth curve
    const cpX = (x0 + x1) / 2;
    path += ` Q${cpX},${y0} ${x1},${y1}`;
  }

  return path;
}

@observer
class Graph extends React.PureComponent {
  static contextType = RootStoreCtx;

  /**@return {RootStore}*/
  get rootStore() {
    return this.context;
  }

  graphAutorun = null;
  svgEl = null;
  uploadPath = null;
  downloadPath = null;

  initGraph() {
    if (this.graphAutorun) return;
    if (!this.refChart.current) return;
    if (!this.rootStore.client) return;

    const ctr = this.refChart.current;
    const speedRoll = this.rootStore.client.speedRoll;

    // Create SVG element
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgEl = svgEl;

    // Create upload path (green)
    const uploadPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    uploadPath.setAttribute('fill', 'none');
    uploadPath.setAttribute('stroke', '#41B541');
    uploadPath.setAttribute('stroke-width', '1.5');
    uploadPath.setAttribute('stroke-linejoin', 'round');
    uploadPath.setAttribute('stroke-linecap', 'round');
    uploadPath.style.transition = 'd 0.5s ease-out';
    this.uploadPath = uploadPath;

    // Create download path (grey)
    const downloadPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    downloadPath.setAttribute('fill', 'none');
    downloadPath.setAttribute('stroke', '#6b7280');
    downloadPath.setAttribute('stroke-width', '1.5');
    downloadPath.setAttribute('stroke-linejoin', 'round');
    downloadPath.setAttribute('stroke-linecap', 'round');
    downloadPath.style.transition = 'd 0.5s ease-out';
    this.downloadPath = downloadPath;

    svgEl.appendChild(uploadPath);
    svgEl.appendChild(downloadPath);

    const xScale = createScale();
    const yScale = createScale();

    let width = null;
    const height = 30;
    let minTime = speedRoll.minTime;

    this.graphAutorun = autorun(() => {
      if (!this.refChart.current) return;

      const newWidth = ctr.clientWidth;
      if (newWidth > 0 && newWidth !== width) {
        width = newWidth;
        svgEl.setAttribute('width', width);
        svgEl.setAttribute('height', height);
        svgEl.setAttribute('viewBox', `0,0,${width},${height}`);
        yScale.range([height, 0]);
        xScale.range([0, width]);
      }

      if (width === null || width === 0) return;

      yScale.domain([speedRoll.minSpeed, speedRoll.maxSpeed || 1]);
      xScale.domain([speedRoll.minTime, speedRoll.maxTime]);

      if (minTime < Date.now() - 5 * 60 * 1000) {
        minTime = speedRoll.minTime;
      }

      const data = speedRoll.getDataFromTime(minTime);

      const uploadD = generatePath(data, xScale, yScale, 'upload');
      const downloadD = generatePath(data, xScale, yScale, 'download');

      this.uploadPath.setAttribute('d', uploadD);
      this.downloadPath.setAttribute('d', downloadD);
    });

    ctr.appendChild(svgEl);
  }

  componentDidMount() {
    this.initGraph();
  }

  componentDidUpdate() {
    this.initGraph();
  }

  componentWillUnmount() {
    if (this.graphAutorun) {
      this.graphAutorun();
      this.graphAutorun = null;
    }
    if (this.svgEl && this.svgEl.parentNode) {
      this.svgEl.parentNode.removeChild(this.svgEl);
    }
  }

  refChart = React.createRef();

  render() {
    return (
      <div ref={this.refChart} style={{width: '100%', height: '30px'}}/>
    );
  }
}

export default Graph;
