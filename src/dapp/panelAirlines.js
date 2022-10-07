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

  populateAirlineFetchedInfo(values) {
    DOM.elid('fetch-airline-name').textContent = values[0] ? values[0] : 'N/A';
    DOM.elid('fetch-airline-address').textContent = values[1] ? values[1] : 'N/A';
    DOM.elid('fetch-airline-funds').textContent = values[2] ? values[2] : 'N/A';
    DOM.elid('fetch-airline-registered').textContent = values[3] ? values[3] : 'N/A';
    DOM.elid('fetch-airline-funded').textContent = values[4] ? values[4] : 'N/A';
  }

  initialize() {
    this.updateAirlineRegisterStatus();
    if (window.ethereum) {
      const self = this;
      window.ethereum.on('accountsChanged', function (accounts) {
        self.updateAirlineRegisterStatus();
      });
    }

    DOM.elid('fetch-airline').addEventListener('click', () => {
      const address = DOM.elid('fetch-airline-address-input').value;
      this.contract.fetchAirlineInfo(address, (error, result) => {
        if (error) {
          console.log(error);
          return;
        }
        this.populateAirlineFetchedInfo(result);
      });
    });
  }
}
