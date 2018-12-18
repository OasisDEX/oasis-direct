import { cypressVisitApp, tid } from "../utils";
import Session from "../pages/Session";
import Proxy from "../pages/Proxy";

context('Proxy', () => {
  beforeEach(() => {
    cypressVisitApp();
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