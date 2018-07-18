import React from 'react';
import LinksGroup from "./LinksGroup";
import { Logo } from "../components-ui/Icons";
import FAQ from "../misc/faq";

const links = [
  {
    name: "Resources",
    links: [
      {
        label: "Documentation",
        url: "https://developer.makerdao.com/"
      },
      {
        label: "Legal",
        url: "OasisToS.pdf"
      },
      {
        label: "FAQ",
        url: "/#faq"
      }
    ]
  },
  {
    name: "Oasis",
    links: [
      {
        label: "Oasisdex.com",
        url: "https://oasisdex.com/"
      },
    ]
  },
  {
    name: "Maker",
    links: [
      {
        label: "chat",
        url: "https://chat.makerdao.com/"
      },
      {
        label: "Reddit",
        url: "https://www.reddit.com/r/MakerDAO/"
      },
    ]
  },
  {
    name: "Follow us",
    links: [
      {
        label: "Twitter",
        url: "https://twitter.com/oasisdirect"
      },
      {
        label: "Steem",
        url: "https://steemit.com/@oasisdirect"
      },
    ]
  },
];

const LandingPage = (props) => (
  <section className="bg-section">
    <section>
      <header className="Container">
        <div className={`Logo Logo--no-margin`}>
          <a href="/"> <Logo/> </a>
        </div>
      </header>
    </section>
    <section>
      {props.children}
    </section>
    <section>
      <footer className="Container">
        {
          links.map(linkGroup => <LinksGroup name={linkGroup.name} links={linkGroup.links}/>)
        }
      </footer>
    </section>
  </section>
)

export default LandingPage;