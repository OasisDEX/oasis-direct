// Libraries
import React from "react";

// Components
import LandingPage from "./LandingPage";

// UI Components
import Accordion from "../components-ui/Accordion";

// Content
import FAQ_DATA from "../misc/faq";

class FAQ extends React.Component {
  componentDidUpdate = prevProps => {
    console.log(this.props.location)
    if (this.props.location.pathname !== prevProps.location.pathname) {
      window.scrollTo(0, 0);
    }
  }

  render() {
    return (
      <LandingPage>
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
      </LandingPage>
    )
  }
}

export default FAQ;
