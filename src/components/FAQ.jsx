import React, { Component } from 'react';
import Accordion from '../ui-components/Accordion';


const fetchFAQ = async function() {
  fetch("/faq.json").then((result)=> {
    return result.json();
  }).then((json) => {
     return this.setState({FAQ:json});
  });
};


class FAQ extends Component {

  constructor(){
    super();
    this.state = {
      FAQ :[]
    };

    fetchFAQ.bind(this)();
  }


  render() {
    return (
      <section className="Content FAQ">
        <main className="Container">
          <h1>Oasis Direct FAQ </h1>
          <div>
            <ul className="List">
              {
                this.state.FAQ.map((pair,index) => {
                  return (
                    <li key={index} className="ListItem">
                      <Accordion
                        headline={pair.question}
                        content={pair.answer}/>
                    </li>
                  )
                })
              }
            </ul>
          </div>
        </main>
      </section>
    )
  }
}

export default FAQ;