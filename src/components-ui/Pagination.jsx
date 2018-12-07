// Libraries
import React from "react";

// UI Components
import { ArrowLeft, ArrowRight, Circle } from "./Icons";

const circularButtonStyle = {
  width: "32px",
  height: "32px",
  padding: "5px",
  marginLeft: "8px"
};

class Pagination extends React.Component {
  constructor(props) {
    super(props);

    this.pageSize = this.props.pageSize || 5;

    this.page = {
      start: 0,
      end: this.pageSize
    };
  }

  next = async () => {
    const {end} = this.page;
    if (end >= this.props.items.length) return;

    const nextPage = end + this.pageSize;

    this.page = {
      start: end,
      end: nextPage
    };

    this.props.onPage(this.props.items.slice(this.page.start, this.page.end));
  };

  previous = () => {
    const {start} = this.page;
    const previousPage = start - this.pageSize;

    if (previousPage < 0) return;

    this.page = {
      start: previousPage,
      end: start
    };

    this.props.onPage(this.props.items.slice(this.page.start, this.page.end));
  };


  render = () => (
    <div className="pagination">
      <span onClick={this.previous} className={this.page.start === 0 ? "disabled" : ""}>
        <Circle hover={true} styles={circularButtonStyle}><ArrowLeft/></Circle>
      </span>
      <span onClick={this.next} className={this.page.end === this.props.items.length ? "disabled" : ""}>
        <Circle hover={true} styles={circularButtonStyle}><ArrowRight/></Circle>
      </span>
    </div>
  )
}

export default Pagination;
