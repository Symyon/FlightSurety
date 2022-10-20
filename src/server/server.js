import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let gasLimit = 5000000;

const ORACLES_COUNT = 20;

async function oracleRegistration(accounts, requiredFee) {
  console.log('Registered oracles:');
  for (let i = 0; i < accounts.length; i++) {
    await flightSuretyApp.methods.registerOracle().send({ from: accounts[i], gasLimit: gasLimit, value: requiredFee });
    const result = await flightSuretyApp.methods.getOracleInfo(accounts[i]).call({ from: web3.eth.defaultAccount });
    const oracle = { address: accounts[i].slice(-5), reg: result[0], ids: result[1] };
    console.log(oracle);
  }
}

web3.eth
  .getAccounts()
  .then(async (accounts) => {
    web3.eth.defaultAccount = accounts[0];

    if (accounts.length < ORACLES_COUNT) {
      console.log('Not enough accounts to register oracles');
      return;
    }

    await flightSuretyApp.methods
      .REGISTRATION_FEE()
      .call()
      .then((result) => {
        oracleRegistration(accounts.slice(-ORACLES_COUNT), result);
      });
  })
  .catch((e) => {
    console.log('Registration error. ' + e);
  });

flightSuretyApp.events.OracleRequest(
  {
    fromBlock: 0,
  },
  function (error, event) {
    if (error) console.log(error);
    console.log(event);
  }
);

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!',
  });
});

export default app;
