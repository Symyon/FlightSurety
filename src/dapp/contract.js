import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import FlightSuretyData from "../../build/contracts/FlightSuretyData.json";
import Config from "./config.json";
import Web3 from "web3";

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
        console.error("User denied account access");
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

    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress
    );
    this.flightSuretyData = new this.web3.eth.Contract(
      FlightSuretyData.abi,
      config.dataAddress
    );

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

  isOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods.isOperational().call({ from: self.owner });
  }

  isAppOwner(callback) {
    let self = this;
    self.flightSuretyApp.methods
      .isSenderOwner()
      .call({ from: self.owner }, (error, result) => {
        callback(error, result);
      });
  }

  isDataOwner(callback) {
    let self = this;
    self.flightSuretyData.methods
      .isSenderOwner()
      .call({ from: self.owner }, (error, result) => {
        callback(error, result);
      });
  }

  fetchAirlineInfo(airline, callback) {
    let self = this;
    console.log("we are here contract info", airline);
    console.log("owner is:", self.owner);
    console.log("Testing contract", this.appContractAddress);

    self.flightSuretyData.methods
      .isAuthorized(this.appContractAddress)
      .call({ from: self.owner }, (error, result) => {
        if (error) {
          console.log("isAuthorized error is:", error);
        } else {
          console.log("isAuthorized", result);
        }
      });

    // this.flightSuretyData.methods
    //   .setAuthorization(this.appContractAddress, true)
    //   .send({ from: self.owner }, (error, result) => {
    //     if (error) {
    //       console.log("setAuthorization error is:", error);
    //     } else {
    //       console.log("setAuthorization", result);
    //       self.flightSuretyData.methods
    //         .isAuthorized(this.appContractAddress)
    //         .call({ from: self.owner }, (error, result) => {
    //           if (error) {
    //             console.log("isAuthorized error is:", error);
    //           } else {
    //             console.log("isAuthorized", result);
    //           }
    //         });
    //     }
    //   });

    // this.flightSuretyData.methods
    //   .setAuthorization(self.appContractAddress, true)
    //   .call({ from: self.owner }, (error, result) => {
    //     if (error) {
    //       console.log("setAuthorization error is:", error);
    //     } else {
    //       console.log("setAuthorization", result);

    //     }
    //   });
    // self.flightSuretyApp.methods
    //   .getAirlineInfo(airline)
    //   .call({ from: self.owner }, (error, result) => {
    //     console.log("fetchAirlineInfo", error, result);
    //     // callback(error, payload);
    //   });
  }

  fetchFlightStatus(flight, callback) {
    let self = this;
    let payload = {
      airline: self.airlines[0],
      flight: flight,
      timestamp: Math.floor(Date.now() / 1000),
    };
    self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: self.owner }, (error, result) => {
        callback(error, payload);
      });
  }
}
