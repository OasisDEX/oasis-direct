// Libraries
import React from "react";
import {Link} from "react-router-dom";

// UI Components
import LinksGroup from "../components-ui/LinksGroup";
import {Logo} from "../components-ui/Icons";

const links = [
  {
    name: "Resources",
    links: [
      {
        label: "Documentation",
        url: "https://developer.makerdao.com/",
        options: {
          target: "_blank",
          rel: "noopener noreferrer"
        }
      },
      {
        label: "Legal",
        url: "OasisToS.pdf",
        options: {}
      },
      {
        label: "FAQ",
        url: "/faq",
        internal: true
      }
    ]
  },
  {
    name: "Oasis",
    links: [
      {
        label: "Oasisdex.com",
        url: "https://oasisdex.com/",
        options: {
          target: "_blank",
          rel: "noopener noreferrer"
        }
      },
    ]
  },
  {
    name: "Maker",
    links: [
      {
        label: "chat",
        url: "https://chat.makerdao.com/",
        options: {
          target: "_blank",
          rel: "noopener noreferrer"
        }
      },
      {
        label: "Reddit",
        url: "https://www.reddit.com/r/MakerDAO/",
        options: {
          target: "_blank",
          rel: "noopener noreferrer"
        }
      },
    ]
  },
  {
    name: "Follow us",
    links: [
      {
        label: "Twitter",
        url: "https://twitter.com/oasisdirect",
        options: {
          target: "_blank",
          rel: "noopener noreferrer"
        }
      },
      {
        label: "Steem",
        url: "https://steemit.com/@oasisdirect",
        options: {
          target: "_blank",
          rel: "noopener noreferrer"
        }
      },
    ]
  },
];

const LandingPage = props => (
  <section className="bg-section">
    <section>
      <header className="Container">
        <div className="Logo Logo--no-margin">
          <Link to="/"><Logo/></Link>
        </div>
      </header>
    </section>
    <section>
      {props.children}
    </section>
    <section>
      <footer className="Container">
        {links.map((linkGroup, key) => <LinksGroup key={key} name={linkGroup.name} links={linkGroup.links}/>)}
      </footer>
    </section>
  </section>
)

export default LandingPage;
