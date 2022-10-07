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

  populateAirlineFetchedInfo(airline) {
    DOM.elid('fetch-airline-name').textContent = airline.name;
    DOM.elid('fetch-airline-address').textContent = airline.address;
    DOM.elid('fetch-airline-funds').textContent = `${airline.funds} ETH`;
    DOM.elid('fetch-airline-registered').textContent = airline.isRegistered;
    DOM.elid('fetch-airline-funded').textContent = airline.isFunded;
  }

  initialize() {
    this.updateAirlineRegisterStatus();
    if (window.ethereum) {
      const self = this;
      window.ethereum.on('accountsChanged', function (accounts) {
        self.updateAirlineRegisterStatus();
      });
    }

    DOM.elid('fund-airline').addEventListener('click', () => {
      const address = DOM.elid('fund-airline-address').value;
      const amount = DOM.elid('fund-airline-amount').value;
      this.contract.fundAirline(address, amount, (error, result) => {
        if (error) {
          console.log(error);
          return;
        }
      });
    });

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
