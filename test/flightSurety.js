var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {
  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.setAuthorization(config.flightSuretyApp.address, true);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {
    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, 'Incorrect initial operating status value');
  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
    // Ensure that access is denied for non-Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false, {
        from: config.testAddresses[2],
      });
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, true, 'Access not restricted to Contract Owner');
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
    // Ensure that access is allowed for Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false);
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, false, 'Access not restricted to Contract Owner');

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true);
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
    await config.flightSuretyData.setOperatingStatus(false);

    let reverted = false;
    try {
      await config.flightSurety.registerFlight('Test Flight');
    } catch (e) {
      reverted = true;
    }
    assert.equal(reverted, true, 'Access not blocked for requireIsOperational');

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true);
  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    // ARRANGE
    const newAirline = accounts[2];

    // ACT
    try {
      await config.flightSuretyApp.registerAirline(newAirline, 'Airline-2', {
        from: config.firstAirline,
      });
    } catch (e) {}
    let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline);

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");
  });

  it('(airline) cannot register an Airline using registerAirline() if caller is not a registered airline', async () => {
    // ARRANGE
    const newAirline = accounts[2];

    // ACT
    try {
      await config.flightSuretyApp.fundAirline({ from: config.owner, value: web3.utils.toWei('10', 'ether') });
      await config.flightSuretyApp.registerAirline(newAirline, 'Airline 2', {
        from: config.firstAirline,
      });
    } catch (e) {}
    let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline);

    // ASSERT
    assert.equal(result, false, 'Only existing airline may register a new airline');
  });

  it('(airline) can register a new airline using registerAirline() if caller is a funded airline and it is the only one ', async () => {
    // ARRANGE
    const newAirline = accounts[2];

    // ACT
    try {
      await config.flightSuretyApp.fundAirline(config.firstAirline, {
        from: config.owner,
        value: web3.utils.toWei('10', 'ether'),
      });
      await config.flightSuretyApp.registerAirline(newAirline, 'Airline 2', {
        from: config.firstAirline,
      });
    } catch (e) {}
    let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline);

    // ASSERT
    assert.equal(
      result,
      true,
      'Registered and funded airline should able to register a new airline by itslef if it is the only one'
    );

    await config.flightSuretyApp.unregisterAirline(newAirline, { from: config.owner });
  });

  it('(airline) registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {
    // ARRANGE
    const newAirlines = [config.firstAirline, accounts[2], accounts[3], accounts[4], accounts[5]];

    // ACT
    const fundAirline = async (airline) => {
      await config.flightSuretyApp.fundAirline(airline, {
        from: config.owner,
        value: web3.utils.toWei('10', 'ether'),
      });
    };

    const registerAirline = async (airline, name, from) => {
      await config.flightSuretyApp.registerAirline(airline, name, { from });
    };

    try {
      await fundAirline(config.firstAirline);

      for (let i = 1; i < newAirlines.length - 1; i++) {
        await registerAirline(newAirlines[i], `Airline ${i}`, newAirlines[i - 1]);
        await fundAirline(newAirlines[i]);
      }

      for (let i = 0; i < newAirlines.length - 1; i++) {
        await registerAirline(newAirlines[newAirlines.length - 1], `Airline ${newAirlines.length}`, newAirlines[i]);
      }
    } catch (e) {}
    let result = await config.flightSuretyData.isAirlineRegistered.call(newAirlines[newAirlines.length - 1]);

    // ASSERT
    assert.equal(result, true, 'Fifth airline was not registered');
  });

  it('can authorize another app contract', async () => {
    let authorized = await config.flightSuretyData.isAuthorized.call(config.testAddresses[1]);
    assert.equal(authorized, false, 'Contract is already authorized');

    await config.flightSuretyData.setAuthorization(config.testAddresses[1], true);
    authorized = await config.flightSuretyData.isAuthorized.call(config.testAddresses[1]);
    assert.equal(authorized, true, 'Contract is not authorized');
  });
});
