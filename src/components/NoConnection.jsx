import React from 'react';
import '../styles/NoConnection.css'


const NoConnection = () => {
  return (
    <div className="frame">
      <div className="connectionless">
        <div className="heading">
          <h2>Not Connected to Ethereum</h2>
        </div>
        <section className="content">
          <div className="heading">
            <h3>Available clients</h3>
          </div>
          <div className="list">
            <ul>
              <li>
                <div>
                  <img type="svg" width="42" height="42" src="/assets/od_metamask.svg" alt="Metamask" />
                </div>
                <div>
                  <h4 className="heading"> Metamask </h4>
                  <span> Browser Extension</span>
                </div>
                <div>
                  <a href="https://metamask.io">INSTALL</a>
                </div>
              </li>
              <li>
                <div>
                  <img type="svg" width="42" height="42" src="/assets/od_mist.svg" alt="Mist"/>
                </div>
                <div>
                  <h4 className="heading"> Mist </h4>
                  <span> Ethereum Client</span>
                </div>
                <div>
                  <a href="https://github.com/ethereum/mist">INSTALL</a>
                </div>
              </li>
              <li>
                <div>
                  <img type="svg" width="42" height="42" src="/assets/od_parity.svg" alt="Parity"/>
                </div>
                <div>
                  <h4 className="heading"> Parity </h4>
                  <span>Ethereum client + Browser Extension</span>
                </div>
                <div>
                  <a href="https://parity.io/">INSTALL</a>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

export default NoConnection;
