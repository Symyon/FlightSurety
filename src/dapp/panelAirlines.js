import DOM from './dom';
import { getDomValuesWithStyle } from './utils';

export default class PanelAirlines {
  constructor(contract) {
    this.contract = contract;
  }

  updateAirlineRegisterStatus() {
    this.contract.isAirlineRegistered((error, result) => {
      if (error) {
        console.log(error);
        return;
      }
      const element = DOM.elid('status-as-airline');
      const { text, color } = getDomValuesWithStyle(result, 'Registered', 'Unregistered');
      element.textContent = text;
      element.style.color = color;
    });
  }

  initialize() {
    this.updateAirlineRegisterStatus();
    if (window.ethereum) {
      const self = this;
      window.ethereum.on('accountsChanged', function (accounts) {
        self.updateAirlineRegisterStatus();
      });
    }
  }
}
