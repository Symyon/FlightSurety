# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

Project is using truffle version 5.5.19 and solidity 0.5.16.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder

## Project/App Flow

### Admin Panel
1. By default Data and App contracts are deployed in operational state, however App contract is not authorized to interact witn Data contract, that can be done by the owner of the Data smart contract (trought the Admin Panel of the app). The panel will tell you if the active account in MetaMask is or is not the owner.
2. Both smart contracts have buttons on the panel to set the operational status  of each of them

### Airline Panel
1. When deployed, Data smart contract registers first airline as the second account from the list of accounts and is not the owner of the smart contract. In order to register a new airline, the registerer has to be a registered and funded airline already so please change the account in MetaMask. The Airlines panel will infrom you if the active account is a registered airline.
2. Airlines panel has a utility that allows reading airline information for any address provided, it is handy to understand what state is the airline (registered or not, funded or not etc). It also allowing funding of an airline, funds can be sent by any address (active MetaMask account) and is a requirement before attempting to register a new airline. Airline funds might fall under treshold if an insurance has been paid, in that case airline need to get more funding before it can be considered funded again. (10 ETH min)  
3.  Flights are not hardcoded and needs to be registered by a registered and funded airline into the Data smart contract. After registering any flight, the drop down  selector  for flights will be populated with the new values. If there are any issues with that, a refresh of the page should bring latest flights registered.

### Passenger Panel
1. Flights can be selected from the drop down list to reveal detailed information about it and it also works asthe selected flight to buy insurance for.
2. Insurance can be bought multiple times by the same passanger and will add up to the total amount insured. Total insured amount will not be allowed to exceed the limit of 1 ETH.
3. Another drop down list of the same flights will select the flight to check the status of. That will also trigger insurance payout if the satus of the flight is 'delayed' - 20. Payout is credited to every passenger that bought the insurance for this flight and wasn't credited for the this flight before.
4. This panel will also present the available insurance payout.
5. Withdrawing of the insurance payout can be done in any amount that will not exceed the available payout amount.

*Every operation is done from the active account in MetaMask. Each panel will show what is the active account and any related information related to it.


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)