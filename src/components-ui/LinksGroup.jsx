// Libraries
import React from "react";

const LinksGroup = props => (
  <div className="LinksWrapper">
    <h1>{props.name}</h1>
    <ul className="Links">
      {
        props.links.map((link, key) => 
          <li key={key} className="Link"><a href={link.url} {...link.options}>{link.label}</a></li>
        )
      }
    </ul>
  </div>
);

export default LinksGroup;
