import React from 'react';

const PriceImpactGraph = () => (
  <div className="graph">
    <div>
      <div style={{display: "inline-block", width: '75%'}}>
        <div className="bar bar-1"/>
        <div className="bar bar-2"/>
        <div className="bar bar-3"/>
      </div>
      <div className="arrow-placeholder">
        <div className="arrow"/>
      </div>
    </div>
    <div>
      <div className="bar bar-4 danger"/>
    </div>
  </div>
);

export default PriceImpactGraph;