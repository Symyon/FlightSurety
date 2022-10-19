import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
  constructor(network, callback) {
    this.config = Config[network];
    this.initialize(this.config, callback);
    this.owner = null;
    this.airlines = [];
    this.passengers = [];
    this.appContractAddress = this.config.appAddress;
    this.dataContractAddress = this.config.dataAddress;
    this.getActiveWalletAccount.bind(this);
    this.setActiveWalletAccount.bind(this);
    this.gasLimit = 5000000;
  }

  getActiveWalletAccount() {
    let self = this;
    self.web3.eth.getAccounts((error, accts) => {
      self.owner = accts[0];
    });
    return self.owner;
  }

  setActiveWalletAccount(acct) {
    this.owner = acct;
  }

  async initialize(config, callback) {
    if (window.ethereum) {
      this.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error('User denied account access');
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      this.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      this.web3Provider = new Web3.providers.HttpProvider(config.url);
    }
    this.web3 = new Web3(this.web3Provider);

    this.getActiveWalletAccount();

    this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
    this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

    this.web3.eth.getAccounts((error, accts) => {
      let counter = 1;

      while (this.airlines.length < 5) {
        this.airlines.push(accts[counter++]);
      }

      while (this.passengers.length < 5) {
        this.passengers.push(accts[counter++]);
      }

      callback();
    });
  }

  isDataOwner(callback) {
    let self = this;
    self.flightSuretyData.methods.isSenderOwner().call({ from: self.owner }, (error, result) => {
      callback(error, result);
    });
  }

  isDataOperational(callback) {
    let self = this;
    self.flightSuretyData.methods.isOperational().call({ from: self.owner }, (error, result) => {
      callback(error, result);
    });
  }

  setDataOperatingStatus(status, callback) {
    let self = this;
    self.flightSuretyData.methods
      .setOperatingStatus(status)
      .send({ from: self.owner, gasLimit: this.gasLimit }, (error, result) => {
        callback(error, result);
      });
  }

  addListenerToDataStatusChange(callback) {
    this.flightSuretyData.events.UpdatedOperationalStatus({}, callback);
  }

  isAppAuthorized(callback) {
    let self = this;
    self.flightSuretyData.methods.isAuthorized(self.appContractAddress).call({ from: self.owner }, (error, result) => {
      callback(error, result);
    });
  }

  setAppAuthorizationStatus(status, callback) {
    let self = this;
    self.flightSuretyData.methods
      .setAuthorization(self.appContractAddress, status)
      .send({ from: self.owner, gasLimit: this.gasLimit }, (error, result) => {
        callback(error, result);
      });
  }

  addListenerToAppAuthorizationChange(callback) {
    this.flightSuretyData.events.UpdatedAppAuthorizationStatus({}, callback);
  }

  isAppOwner(callback) {
    let self = this;
    self.flightSuretyApp.methods.isSenderOwner().call({ from: self.owner }, (error, result) => {
      callback(error, result);
    });
  }

  isAppOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods.isOperational().call({ from: self.owner }, (error, result) => {
      callback(error, result);
    });
  }

  addListenerToAppStatusChange(callback) {
    this.flightSuretyApp.events.UpdatedOperationalStatus({}, callback);
  }

  setAppOperatingStatus(status, callback) {
    let self = this;
    self.flightSuretyApp.methods
      .setOperatingStatus(status)
      .send({ from: self.owner, gasLimit: this.gasLimit }, (error, result) => {
        callback(error, result);
      });
  }

  isAirlineRegistered(callback) {
    let self = this;
    self.flightSuretyApp.methods.isAirlineRegistered(self.owner).call({ from: self.owner }, (error, result) => {
      callback(error, result);
    });
  }

  registerAirline(address, name, callback) {
    let self = this;
    self.flightSuretyApp.methods
      .registerAirline(address, name)
      .send({ from: self.owner, gasLimit: this.gasLimit }, (error, result) => {
        callback(error, result);
      });
  }

  fundAirline(address, value, callback) {
    let self = this;
    self.flightSuretyApp.methods
      .fundAirline(address)
      .send(
        { from: self.owner, value: this.web3.utils.toWei(value, 'ether'), gasLimit: this.gasLimit },
        (error, result) => {
          callback(error, result);
        }
      );
  }

  fetchAirlineInfo(address, callback) {
    let self = this;
    self.flightSuretyApp.methods.getAirlineInfo(address).call({ from: self.owner }, (error, result) => {
      const airline = {
        name: result[0] ? result[0] : 'N/A',
        address: result[1] ? result[1] : 'N/A',
        funds: result[2] ? this.web3.utils.fromWei(result[2], 'ether') : 'N/A',
        isRegistered: result[3],
        isFunded: result[4],
      };
      callback(error, airline);
    });
  }

  fetchFlightStatus(flight, airline, callback) {
    let self = this;
    let payload = {
      airline: airline,
      flight: flight,
      timestamp: Math.floor(Date.now() / 1000),
    };
    self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: self.owner, gasLimit: this.gasLimit }, (error, result) => {
        callback(error, payload);
      });
  }

  registerFlight(number, origin, destination, takeOff, landing, callback) {
    let self = this;
    self.flightSuretyApp.methods
      .registerFlight(number, origin, destination, takeOff, landing)
      .send({ from: self.owner, gasLimit: this.gasLimit }, (error, result) => {
        callback(error, { number, origin, destination, takeOff, landing });
      });
  }

  addListenerToFlightRegistration(callback) {
    this.flightSuretyApp.events.RegisteredNewFlight({}, callback);
  }

  getRegisteredFlights(callback) {
    let self = this;
    self.flightSuretyApp.methods.getRegisteredFlights().call({ from: self.owner }, (error, result) => {
      callback(error, result);
    });
  }

  getFlightInfo(flightKey, callback) {
    let self = this;
    self.flightSuretyApp.methods.getFlightInfo(flightKey).call({ from: self.owner }, (error, result) => {
      const flight = {
        name: result[0] ? result[0] : 'N/A',
        statusCode: result[1] ? result[1] : 'N/A',
        airline: result[2] ? result[2] : 'N/A',
        origin: result[3] ? result[3] : 'N/A',
        destination: result[4] ? result[4] : 'N/A',
        takeoffTime: result[5] ? result[5] : 'N/A',
        landingTime: result[6] ? result[6] : 'N/A',
      };
      callback(error, flight);
    });
  }

  buyInsurance(flightKey, value, callback) {
    let self = this;
    self.flightSuretyApp.methods
      .buyInsurance(flightKey)
      .send(
        { from: self.owner, value: this.web3.utils.toWei(value, 'ether'), gasLimit: this.gasLimit },
        (error, result) => {
          callback(error, result);
        }
      );
  }

  getInsuranceInfo(flightKey, callback) {
    let self = this;
    self.flightSuretyApp.methods.getInsuranceInfo(flightKey).call({ from: self.owner }, (error, result) => {
      const insurance = {
        flightKey: result[0] ? result[0] : 'N/A',
        passenger: result[1] ? result[1] : 'N/A',
        amount: result[2] ? this.web3.utils.fromWei(result[2], 'ether') : 'N/A',
        isCredited: result[3],
      };
      callback(error, insurance);
    });
  }

  getMaximumInsuranceAmount(callback) {
    let self = this;
    self.flightSuretyApp.methods.getMaximumInsuranceAmount().call({ from: self.owner }, (error, result) => {
      callback(error, this.web3.utils.fromWei(result, 'ether'));
    });
  }

  getPassengerBalance(callback) {
    let self = this;
    self.flightSuretyApp.methods.getPassengerBalance().call({ from: self.owner }, (error, result) => {
      callback(error, this.web3.utils.fromWei(result, 'ether'));
    });
  }
}
