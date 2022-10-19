import DOM from './dom';
import { getDomValuesWithStyle } from './utils';

export default class PanelPassengers {
  constructor(contract) {
    this.contract = contract;
    this.flights = [];
  }

  fetchInsuredAmount(flightKey) {
    this.contract.getInsuranceInfo(flightKey, (error, result) => {
      if (error) {
        console.log(error);
        return;
      }
      console.log(result);
      DOM.elid('insured-eth').textContent = `${result.amount} ETH insured,`;
    });
  }

  onChangedFlight() {
    const selectedFlight = DOM.elid('flights').value;
    const flight = this.flights.find((f) => f.key === selectedFlight);
    if (!flight) {
      DOM.elid('insurance-airline-name').textContent = '...';
      DOM.elid('insurance-airline').textContent = '...';
      DOM.elid('insurance-origin').textContent = '...';
      DOM.elid('insurance-destination').textContent = '...';
      DOM.elid('insurance-takeoff').textContent = '...';
      DOM.elid('insurance-landing').textContent = '...';
      DOM.elid('insured-eth').textContent = '';
      return;
    }

    DOM.elid('insurance-airline').textContent = flight.airline;
    DOM.elid('insurance-origin').textContent = flight.origin;
    DOM.elid('insurance-destination').textContent = flight.destination;
    DOM.elid('insurance-takeoff').textContent = new Date(Number(flight.takeoffTime)).toUTCString();
    DOM.elid('insurance-landing').textContent = new Date(Number(flight.takeoffTime)).toUTCString();
    this.contract.fetchAirlineInfo(flight.airline, (error, result) => {
      if (error) {
        console.log(error);
        return;
      }
      DOM.elid('insurance-airline-name').textContent = result.name;
    });
    this.fetchInsuredAmount(selectedFlight);
  }

  populateFlightInfo() {
    const flightSatusSelect = DOM.elid('status-flights');
    flightSatusSelect.innerHTML = '';
    const flightSelect = DOM.elid('flights');
    flightSelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.text = '-- Please select a flight --';
    flightSelect.appendChild(defaultOption);
    flightSatusSelect.appendChild(defaultOption.cloneNode(true));

    this.flights.forEach((flight) => {
      const option = document.createElement('option');
      option.value = flight.key;
      option.text = flight.name;
      flightSelect.appendChild(option);
      flightSatusSelect.appendChild(option.cloneNode(true));
    });
  }

  getRegisteredFlights() {
    this.contract.getRegisteredFlights((error, result) => {
      if (error) {
        console.log(error);
        return;
      }
      this.flights = [];
      for (let i = 0; i < result.length; i++) {
        this.contract.getFlightInfo(result[i], (err, res) => {
          if (err) {
            console.log('error', err);
            return;
          }

          const flight = { key: result[i], ...res };
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

  updatePassengerBallance() {
    this.contract.getPassengerBalance((error, result) => {
      if (error) {
        console.log(error);
        return;
      }
      DOM.elid('passenger-balance').textContent = `${result} ETH`;
    });
  }

  display(title, description, results) {
    let displayDiv = DOM.elid('display-wrapper');
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
      let row = section.appendChild(DOM.div({ className: 'row' }));
      row.appendChild(DOM.div({ className: 'col-sm-4 field' }, result.label));
      row.appendChild(
        DOM.div({ className: 'col-sm-8 field-value' }, result.error ? String(result.error) : String(result.value))
      );
      section.appendChild(row);
    });
    displayDiv.append(section);
  }

  initialize() {
    const self = this;
    this.updatePassengerBallance();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', function (accounts) {
        self.updatePassengerBallance();
      });
    }

    this.getRegisteredFlights();
    this.addListenerToFlightRegistration();
    DOM.elid('flights').addEventListener('change', () => self.onChangedFlight());
    this.contract.getMaximumInsuranceAmount((error, result) => {
      if (error) {
        console.log(error);
        return;
      }
      DOM.elid('max-eth').textContent = `${result} ETH max allowed`;
    });

    DOM.elid('buy-insurance').addEventListener('click', () => {
      const flight = DOM.elid('flights').value;
      const amount = DOM.elid('insurance-amount').value;
      if (!flight || !amount) {
        return;
      }
      this.contract.buyInsurance(flight, amount, (error, result) => {
        if (error) {
          console.log(error);
          return;
        }
        self.fetchInsuredAmount(flight);
      });
    });

    DOM.elid('submit-oracle').addEventListener('click', () => {
      const flight = DOM.elid('status-flights').value;
      this.contract.getFlightInfo(flight, (err, res) => {
        if (err) {
          console.log('error', err);
          return;
        }

        const airline = res.airline;
        self.contract.fetchFlightStatus(flight, airline, (error, result) => {
          self.display('Oracles', 'Trigger oracles', [
            {
              label: 'Fetch Flight Status',
              error: error,
              value: result.flight + ' ' + result.timestamp,
            },
          ]);
        });
      });
    });
  }
}
