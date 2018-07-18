import React from 'react';

const LinksGroup = (props) => (
  <div className="LinksWrapper">
    <h1> {props.name} </h1>
    <ul className="Links">{
      props.links.map(link => (
          <li className="Link"><a href={link.url} target="_blank"
                                  rel="noopener noreferrer">{link.label}</a></li>
        )
      )
    }
    </ul>
  </div>
);

export default LinksGroup;