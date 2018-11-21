import { visitWithWeb3, tid } from "../utils";
import Session from "../pages/Session";
import Proxy from "../pages/Proxy";

context('Proxy', () => {
  beforeEach(() => {
    visitWithWeb3();
    cy.get(tid('wallets-continue')).contains('Continue').click();
    Session.settings();
  });

  it('should be created manually', () => {
    expect(Proxy.status).to.be.inactive();

    Proxy.create();

    expect(Proxy.status).to.be.active();
  });

  it('should display if proxy already exists', () => {
    expect(Proxy.status).to.be.inactive();

    Proxy.create();

    expect(Proxy.status).to.be.active();

    Session.goBack();

    Session.settings(); // going back

    expect(Proxy.status).to.be.active();
  });
});