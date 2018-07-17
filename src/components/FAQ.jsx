import React, { Component } from "react";

import Accordion from "../ui-components/Accordion";

import FAQ_DATA from "../misc/faq";

class FAQ extends Component {
  render() {
    return (
      <section className="Content FAQ">
        <main className="Container">
          <h1>Oasis Direct FAQ </h1>
          <div>
            <ul className="List">
              {
                FAQ_DATA.map((pair, key) =>
                  <li key={key} className="ListItem">
                    <Accordion headline={pair.question} content={pair.answer} />
                  </li>
                )
              }
            </ul>
          </div>
        </main>
      </section>
    )
  }
}

export default FAQ;
