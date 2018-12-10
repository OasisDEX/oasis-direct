import { cypressVisitApp, tid } from '../utils';
import Proxy from "../pages/Proxy";
import Session from "../pages/Session";
import Allowance from "../pages/Allowance";

describe('Allowance', () => {

  beforeEach(() => {
    cypressVisitApp();
    Session.settings();
    Proxy.create();
    Allowance.open();
  });

  it('should be disabled', () => {
    const allowance = new Allowance('DAI');

    allowance.shouldBe(Allowance.DISABLED);
  });

  it('should enabled for the first time', () => {
    const allowance = new Allowance('MKR');

    allowance.enable();
    allowance.shouldBe(Allowance.ENABLED);
  });

  it('should be already enabled', () => {
    const allowance = new Allowance('MKR');

    allowance.enable();

    Allowance.close();
    Session.goBack();
    Session.settings();

    Allowance.open();
    allowance.shouldBe(Allowance.ENABLED);
  });

  it('should be disabled after being enabled', () => {
    const allowance = new Allowance('DAI');

    allowance.enable();
    allowance.shouldBe(Allowance.ENABLED);

    allowance.disable();
    allowance.shouldBe(Allowance.DISABLED);
  });
});