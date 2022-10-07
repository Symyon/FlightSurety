pragma solidity ^0.5.16;

import '../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol';

contract FlightSuretyData {
  using SafeMath for uint256;

  /********************************************************************************************/
  /*                                       DATA VARIABLES                                     */
  /********************************************************************************************/

  address private contractOwner; // Account used to deploy contract
  bool private operational = true; // Blocks all state changes throughout the contract if false
  mapping(address => bool) private authorizedCallers;
  struct Airline {
    string name;
    address airlineAddress;
    uint256 funds;
    bool isRegistered;
    bool isFunded;
  }
  mapping(address => Airline) public airlines;
  uint256 private registeredAirlinesCounter = 0;

  mapping(address => bool) private multiCalls;
  address[] private multiCallsAddresses;

  /********************************************************************************************/
  /*                                       EVENT DEFINITIONS                                  */
  /********************************************************************************************/

  /**
   * @dev Constructor
   *      The deploying account becomes contractOwner
   */
  constructor(address firstAirline) public {
    contractOwner = msg.sender;
    airlines[firstAirline] = Airline({
      name: 'Default Airline',
      airlineAddress: firstAirline,
      funds: 0,
      isRegistered: true,
      isFunded: false
    });
    registeredAirlinesCounter = 1;
  }

  /********************************************************************************************/
  /*                                       EVENTS                                             */
  /********************************************************************************************/
  event UpdatedOperationalStatus(bool oldState, bool newState);
  event UpdatedAppAuthorizationStatus(address appAddress, bool oldState, bool newState);

  /********************************************************************************************/
  /*                                       FUNCTION MODIFIERS                                 */
  /********************************************************************************************/

  // Modifiers help avoid duplication of code. They are typically used to validate something
  // before a function is allowed to be executed.

  /**
   * @dev Modifier that requires the "operational" boolean variable to be "true"
   *      This is used on all state changing functions to pause the contract in
   *      the event there is an issue that needs to be fixed
   */
  modifier requireIsOperational() {
    require(isOperational(), 'Contract is currently not operational');
    _; // All modifiers require an "_" which indicates where the function body will be added
  }

  /**
   * @dev Modifier that requires the "ContractOwner" account to be the function caller
   */
  modifier requireContractOwner() {
    require(msg.sender == contractOwner, 'Caller is not contract owner');
    _;
  }

  modifier requiredAuthorized() {
    require(authorizedCallers[msg.sender] == true, 'Caller is not authorized');
    _;
  }

  modifier requireRegisteredAndFunded() {
    require(airlines[tx.origin].isRegistered, 'Cannot execute operation if calling airline is not registered');
    require(airlines[tx.origin].isFunded, 'Airline contract does not have enough funds to operate the contract');
    _;
  }

  /********************************************************************************************/
  /*                                       UTILITY FUNCTIONS                                  */
  /********************************************************************************************/

  /**
   * @dev Get operating status of contract
   *
   * @return A bool that is the current operating status
   */
  function isOperational() public view returns (bool) {
    return operational;
  }

  function isSenderOwner() public view returns (bool) {
    return msg.sender == contractOwner;
  }

  /**
   * @dev Sets contract operations on/off
   *
   * When operational mode is disabled, all write transactions except for this one will fail
   */
  function setOperatingStatus(bool mode) external requireContractOwner {
    require(mode != operational, 'Operational status cannot be set to the same value');
    bool oldState = operational;
    operational = mode;
    emit UpdatedOperationalStatus(oldState, operational);
  }

  function setAuthorization(address _address, bool _authorized) external requireContractOwner {
    bool oldState = authorizedCallers[_address];
    authorizedCallers[_address] = _authorized;
    emit UpdatedAppAuthorizationStatus(_address, oldState, authorizedCallers[_address]);
  }

  function isAuthorized(address _address) external view returns (bool) {
    return authorizedCallers[_address];
  }

  /********************************************************************************************/
  /*                                     SMART CONTRACT FUNCTIONS                             */
  /********************************************************************************************/

  /**
   * @dev Add an airline to the registration queue
   *      Can only be called from FlightSuretyApp contract
   *
   */
  function registerAirline(
    address _address,
    string calldata _name,
    uint256 _minVotes
  ) external requiredAuthorized requireRegisteredAndFunded requireIsOperational {
    require(airlines[_address].isRegistered == false, 'Airline is already registered');

    bool isDuplicate = multiCalls[_address];
    require(!isDuplicate, 'This Airline has already voted to register');

    if (multiCallsAddresses.length > _minVotes - 1) {
      airlines[_address] = Airline({
        name: _name,
        airlineAddress: _address,
        funds: 0,
        isRegistered: true,
        isFunded: false
      });
      registeredAirlinesCounter = registeredAirlinesCounter.add(1);

      for (uint256 i = 0; i < multiCallsAddresses.length; i++) {
        delete multiCalls[multiCallsAddresses[i]];
      }
      multiCallsAddresses = new address[](0);
    } else {
      multiCalls[_address] = true;
      multiCallsAddresses.push(_address);
    }
  }

  function getRegisteredAirlinesCount() external view returns (uint256) {
    return registeredAirlinesCounter;
  }

  function isAirlineRegistered(address _address) external view returns (bool) {
    return airlines[_address].isRegistered;
  }

  function fundAirline(address _address, uint256 fundingRequired)
    external
    payable
    requiredAuthorized
    requireIsOperational
  {
    require(airlines[_address].isRegistered == true, 'Airline is not registered');

    airlines[_address].funds += msg.value;
    airlines[_address].isFunded = airlines[_address].funds >= fundingRequired;
  }

  function getAirlineInfo(address _address)
    external
    view
    returns (
      string memory,
      address,
      uint256,
      bool,
      bool
    )
  {
    return (
      airlines[_address].name,
      airlines[_address].airlineAddress,
      airlines[_address].funds,
      airlines[_address].isRegistered,
      airlines[_address].isFunded
    );
  }

  /**
   * @dev Buy insurance for a flight
   *
   */
  function buy() external payable {}

  /**
   *  @dev Credits payouts to insurees
   */
  function creditInsurees() external pure {}

  /**
   *  @dev Transfers eligible payout funds to insuree
   *
   */
  function pay() external pure {}

  /**
   * @dev Initial funding for the insurance. Unless there are too many delayed flights
   *      resulting in insurance payouts, the contract should be self-sustaining
   *
   */
  function fund() public payable {}

  function getFlightKey(
    address airline,
    string memory flight,
    uint256 timestamp
  ) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(airline, flight, timestamp));
  }

  /**
   * @dev Fallback function for funding smart contract.
   *
   */
  function() external payable {
    fund();
  }
}
