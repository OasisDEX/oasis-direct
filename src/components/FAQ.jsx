import React, { Component } from 'react';
import Accordion from '../components-ui/Accordion';
import FAQ_DATA from '../misc/faq';
import LandingPage from "./LandingPage";

class FAQ extends Component {
  render() {
    return (
      <LandingPage>
        <section className="Content FAQ">
          <main className="Container">
            <h1>Oasis Direct FAQ </h1>
            <div>
              <ul className="List">
                {
                  FAQ_DATA.map(pair => {
                    return (
                      <li className="ListItem">
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
      </LandingPage>
    )
  }
}

export default FAQ;