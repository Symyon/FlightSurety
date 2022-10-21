import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let gasLimit = 5000000;

const ORACLES_COUNT = 20;

const statusCodes = [
  0, //STATUS_CODE_UNKNOWN
  10, //STATUS_CODE_ON_TIME
  20, //STATUS_CODE_LATE_AIRLINE
  30, //STATUS_CODE_LATE_WEATHER
  40, // STATUS_CODE_LATE_TECHNICAL
  50, //STATUS_CODE_LATE_OTHER
];

async function oracleRegistration(accounts, requiredFee) {
  let oracles = [];
  console.log('Registered oracles:');
  for (let i = 0; i < accounts.length; i++) {
    await flightSuretyApp.methods.registerOracle().send({ from: accounts[i], gasLimit: gasLimit, value: requiredFee });
    const result = await flightSuretyApp.methods.getOracleInfo(accounts[i]).call({ from: web3.eth.defaultAccount });
    const oracle = { address: accounts[i], reg: result[0], ids: result[1] };
    oracles.push(oracle);
    console.log({ ...oracle, address: oracle.address.slice(-5) });
  }

  return oracles;
}

function processOracleRequest(event, oracles) {
  const { index, airline, flightKey, flightName, timestamp } = event.returnValues;

  for (let i = 0; i < oracles.length; i++) {
    const oracle = oracles[i];
    if (oracle.ids.includes(index)) {
      const statusCode = 20;//statusCodes[Math.floor(Math.random() * 5)];

      console.log(
        `Oracle ${oracle.address} is responding with status code ${statusCode}` +
          ` to request ${index} for flight ${flightName} (id: ${flightKey.slice(-5)})` +
          ` at ${new Date(Number(timestamp)).toUTCString()}`
      );
      flightSuretyApp.methods
        .submitOracleResponse(index, airline, flightKey, timestamp, statusCode)
        .send({ from: oracle.address, gasLimit: gasLimit });
    }
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
      .then(async (result) => {
        const oracles = await oracleRegistration(accounts.slice(-ORACLES_COUNT), result);
        try {
          flightSuretyApp.events.OracleRequest({}, (error, event) => processOracleRequest(event, oracles));
        } catch (e) {
          console.log('Request processing error', e);
        }
      });
  })
  .catch((e) => {
    console.log('Registration error. ' + e);
  });

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!',
  });
});

export default app;
