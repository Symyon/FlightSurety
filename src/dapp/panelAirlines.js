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

  initDatePickers() {
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    let day = now.getDate();
    let future = new Date(year + 3, month, day);
    DOM.elid('origin-time').value = now.toISOString().split('T')[0];
    DOM.elid('origin-time').min = now.toISOString().split('T')[0];
    DOM.elid('origin-time').max = future.toISOString().split('T')[0];

    DOM.elid('destination-time').value = now.toISOString().split('T')[0];
    DOM.elid('destination-time').min = now.toISOString().split('T')[0];
    DOM.elid('destination-time').max = future.toISOString().split('T')[0];
  }

  initialize() {
    this.updateAirlineRegisterStatus();
    if (window.ethereum) {
      const self = this;
      window.ethereum.on('accountsChanged', function (accounts) {
        self.updateAirlineRegisterStatus();
      });
    }

    DOM.elid('submit-airline-register').addEventListener('click', () => {
      const address = DOM.elid('new-airline-address').value;
      const name = DOM.elid('new-airline-name').value;
      this.contract.registerAirline(address, name, (error, result) => {
        if (error) {
          console.log(error);
          return;
        }
      });
    });

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

    this.initDatePickers();
    DOM.elid('origin-time').addEventListener('change', () => {
      const originTime = DOM.elid('origin-time').value;
      DOM.elid('destination-time').min = originTime;
      if (originTime > DOM.elid('destination-time').value) {
        DOM.elid('destination-time').value = originTime;
      }
    });

    DOM.elid('register-flight').addEventListener('click', () => {
      const flight = DOM.elid('flight-number').value;
      const origin = DOM.elid('flight-origin-location').value;
      const destination = DOM.elid('flight-destination-location').value;
      const takeOff = new Date(DOM.elid('flight-origin-time').value).getTime();
      const landing = new Date(DOM.elid('flight-destination-time').value).getTime();

      this.contract.registerFlight(flight, origin, destination, takeOff, landing, (error, result) => {
        if (error) {
          console.log(error);
          return;
        }

        this.contract.getRegisteredFlights((error, result) => {
          if (error) {
            console.log(error);
            return;
          }
          console.log(result);
        });
      });
    });
  }
}
