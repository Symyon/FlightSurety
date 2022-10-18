import DOM from './dom';
import { getDomValuesWithStyle } from './utils';

export default class PanelPassengers {
  constructor(contract) {
    this.contract = contract;
    this.flights = [];
  }

  onChangedFlight() {
    const flight = this.flights.find((f) => f.key === DOM.elid('flights').value);
    if (!flight) return;

    DOM.elid('insurance-airline').textContent = flight.airline;
    DOM.elid('insurance-origin').textContent = flight.origin;
    DOM.elid('insurance-destination').textContent = flight.destination;
    DOM.elid('insurance-takeoff').textContent = new Date(Number(flight.takeoffTime)).toUTCString();
    DOM.elid('insurance-landing').textContent = new Date(Number(flight.takeoffTime)).toUTCString();
  }

  populateFlightInfo() {
    const flightSelect = DOM.elid('flights');
    flightSelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.text = '-- Please select a flight --';
    flightSelect.appendChild(defaultOption);
    this.flights.forEach((flight) => {
      const option = document.createElement('option');
      option.value = flight.key;
      option.text = flight.name;
      flightSelect.appendChild(option);
    });
  }

  getRegisteredFlights() {
    this.contract.getRegisteredFlights((error, result) => {
      if (error) {
        console.log(error);
        return;
      }
      this.flights = [];
      console.log(result);
      for (let i = 0; i < result.length; i++) {
        this.contract.getFlightInfo(result[i], (err, res) => {
          if (err) {
            console.log('error', err);
            return;
          }

          const flight = {
            key: result[i],
            name: res[0],
            statusCode: res[1],
            airline: res[2],
            origin: res[3],
            destination: res[4],
            takeoffTime: res[5],
            landingTime: res[6],
          };
          this.flights.push(flight);

          if (this.flights.length === result.length) {
            this.populateFlightInfo();
          }
        });
      }
    });
  }

  addListenerToFlightRegistration() {
    const self = this;
    this.contract.addListenerToFlightRegistration((error, data) => {
      if (error) {
        console.log(error);
        return;
      }
      self.getRegisteredFlights();
    });
  }

  updatePassengerAccountInfo() {}

  initialize() {
    const self = this;
    this.updatePassengerAccountInfo();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', function (accounts) {
        self.updatePassengerAccountInfo();
      });
    }

    this.getRegisteredFlights();
    this.addListenerToFlightRegistration();
    DOM.elid('flights').addEventListener('change', () => self.onChangedFlight());
  }
}
