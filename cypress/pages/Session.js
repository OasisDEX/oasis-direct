import { tid } from "../utils";

class Session {
  settings = () => {
    cy.get(tid('check-session-details')).click();
  }

  goBack = () => {
    cy.get(tid('go-back')).click();
  }
}

export default new Session();