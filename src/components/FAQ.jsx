// Libraries
import React from "react";

// UI Components
import Accordion from "../components-ui/Accordion";

// Content
import FAQ_DATA from "../misc/faq";

class FAQ extends React.Component {
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
