import { tid } from "../utils";

class Session {
  settings = () => {
    cy.get(tid('check-session-details')).click();
  };

  advancedSettings = () => {
    cy.get(tid('check-trade-details'), {timeout: 2000}).click();
  }

  goBack = () => {
    cy.get(tid('go-back')).click();
  }
}

export default new Session();