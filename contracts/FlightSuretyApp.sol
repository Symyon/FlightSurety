pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import '../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol';

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
  using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

  /********************************************************************************************/
  /*                                       DATA VARIABLES                                     */
  /********************************************************************************************/

  // Flight status codees
  uint8 private constant STATUS_CODE_UNKNOWN = 0;
  uint8 private constant STATUS_CODE_ON_TIME = 10;
  uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
  uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
  uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
  uint8 private constant STATUS_CODE_LATE_OTHER = 50;

  uint256 private airlineFundsRequirement = 10000000000000000000; // Funds required for a new airline to register in wei
  uint256 private MAX_INSURANCE_AMOUNT = 1 ether;
  address private contractOwner; // Account used to deploy contract
  bool private operational = true; // Blocks all state changes throughout the contract if false
  FlightSuretyData flightSuretyData;
  uint256 private constant MAX_COUNT_NO_MULTISIG_REQ = 4;
  uint16 MULTI_PARTY_SPLIT = 2; // Airlines percentage required to vote for a new airline to be registered (2 = 50%)

  constructor(address dataContract) public {
    contractOwner = msg.sender;
    flightSuretyData = FlightSuretyData(dataContract);
  }

  /********************************************************************************************/
  /*                                       EVENTS                                             */
  /********************************************************************************************/
  event UpdatedOperationalStatus(bool oldState, bool newState);
  event RegisteredNewFlight(string flight, uint256 timestamp);

  /********************************************************************************************/
  /*                                       FUNCTION MODIFIERS                                 */
  /********************************************************************************************/

  modifier requireIsOperational() {
    require(isOperational(), 'Contract is currently not operational');
    _;
  }

  modifier requireContractOwner() {
    require(msg.sender == contractOwner, 'Caller is not contract owner');
    _;
  }

  /********************************************************************************************/
  /*                                       UTILITY FUNCTIONS                                  */
  /********************************************************************************************/

  function isOperational() public view returns (bool) {
    return operational;
  }

  function isSenderOwner() public view returns (bool) {
    return msg.sender == contractOwner;
  }

  function setOperatingStatus(bool mode) external requireContractOwner returns (bool) {
    require(mode != operational, 'Operational status cannot be set to the same value');
    bool oldState = operational;
    operational = mode;
    emit UpdatedOperationalStatus(oldState, operational);
  }

  /********************************************************************************************/
  /*                                     SMART CONTRACT FUNCTIONS                             */
  /********************************************************************************************/

  /**
   * @dev Add an airline to the registration queue
   *
   */
  function registerAirline(address _address, string calldata _name)
    external
    requireIsOperational
    returns (bool success, uint256 votes)
  {
    uint256 registeredCount = flightSuretyData.getRegisteredAirlinesCount();
    uint256 minVotes = registeredCount < MAX_COUNT_NO_MULTISIG_REQ ? 1 : registeredCount / MULTI_PARTY_SPLIT;

    return flightSuretyData.registerAirline(_address, _name, minVotes);
  }

  function unregisterAirline(address _address)
    external
    requireIsOperational
    requireContractOwner
    returns (bool success)
  {
    return flightSuretyData.unregisterAirline(_address);
  }

  function fundAirline(address _address) external payable requireIsOperational {
    flightSuretyData.fundAirline.value(msg.value)(_address, airlineFundsRequirement);
  }

  function isAirlineRegistered(address _address) public view returns (bool) {
    return flightSuretyData.isAirlineRegistered(_address);
  }

  function getAirlineInfo(address _address)
    public
    view
    returns (
      string memory,
      address,
      uint256,
      bool,
      bool
    )
  {
    return flightSuretyData.getAirlineInfo(_address);
  }

  /**
   * @dev Register a future flight for insuring.
   *
   */
  function registerFlight(
    string calldata _name,
    string calldata _origin,
    string calldata _destination,
    uint256 _takeoffTime,
    uint256 _landingTime
  ) external requireIsOperational {
    bytes32 flightKey = getFlightKey(msg.sender, _name, _takeoffTime);
    flightSuretyData.registerFlight(
      flightKey,
      _name,
      STATUS_CODE_UNKNOWN,
      msg.sender,
      _origin,
      _destination,
      _takeoffTime,
      _landingTime
    );
    emit RegisteredNewFlight(_name, now);
  }

  function getRegisteredFlights() external view returns (bytes32[] memory) {
    return flightSuretyData.getRegisteredFlights();
  }

  function getFlightInfo(bytes32 _flightKey)
    public
    view
    returns (
      string memory,
      uint8,
      address,
      string memory,
      string memory,
      uint256,
      uint256
    )
  {
    return flightSuretyData.getFlightInfo(_flightKey);
  }

  /**
   * @dev Called after oracle has updated flight status
   *
   */
  function processFlightStatus(
    address airline,
    bytes32 flightKey,
    uint8 statusCode
  ) internal {
    if (statusCode == STATUS_CODE_LATE_AIRLINE) {
      flightSuretyData.creditInsurees(airline, flightKey);
    }
  }

  // Generate a request for oracles to fetch flight information
  function fetchFlightStatus(
    address airline,
    bytes32 flightKey,
    uint256 timestamp
  ) external {
    uint8 index = getRandomIndex(msg.sender);

    // Generate a unique key for storing the request
    bytes32 key = keccak256(abi.encodePacked(index, airline, flightKey, timestamp));
    oracleResponses[key] = ResponseInfo({ requester: msg.sender, isOpen: true });
    (string memory flightName, , , , , , ) = flightSuretyData.getFlightInfo(flightKey);
    emit OracleRequest(index, airline, flightKey, flightName, timestamp);
  }

  function buyInsurance(bytes32 _flightKey) external payable requireIsOperational {
    require(msg.value > 0, 'Insurance value must be greater than 0');

    (, , uint256 amount, bool isCredited) = getInsuranceInfo(_flightKey);
    require(isCredited == false, 'Insurance is already credited');
    uint256 totalInsurance = amount + msg.value;
    require(totalInsurance <= MAX_INSURANCE_AMOUNT, 'Total insurance amount cannot be greater than 1 ether');
    flightSuretyData.buy.value(msg.value)(_flightKey, msg.sender);
  }

  function getMaximumInsuranceAmount() external view returns (uint256) {
    return MAX_INSURANCE_AMOUNT;
  }

  function getInsuranceInfo(bytes32 _flightKey)
    public
    view
    returns (
      bytes32,
      address,
      uint256,
      bool
    )
  {
    return flightSuretyData.getInsuranceInfo(_flightKey, msg.sender);
  }

  function getPassengerBalance() external view returns (uint256) {
    return flightSuretyData.getPassengerBalance(msg.sender);
  }

  function pay(uint256 _amount) external requireIsOperational {
    flightSuretyData.pay(msg.sender, _amount);
  }

  // region ORACLE MANAGEMENT

  // Incremented to add pseudo-randomness at various points
  uint8 private nonce = 0;

  // Fee to be paid when registering oracle
  uint256 public constant REGISTRATION_FEE = 1 ether;

  // Number of oracles that must respond for valid status
  uint256 private constant MIN_RESPONSES = 3;

  struct Oracle {
    bool isRegistered;
    uint8[3] indexes;
  }

  // Track all registered oracles
  mapping(address => Oracle) private oracles;

  // Model for responses from oracles
  struct ResponseInfo {
    address requester; // Account that requested status
    bool isOpen; // If open, oracle responses are accepted
    mapping(uint8 => address[]) responses; // Mapping key is the status code reported
    // This lets us group responses and identify
    // the response that majority of the oracles
  }

  // Track all oracle responses
  // Key = hash(index, flight, timestamp)
  mapping(bytes32 => ResponseInfo) private oracleResponses;

  // Event fired each time an oracle submits a response
  event FlightStatusInfo(address airline, bytes32 flight, uint256 timestamp, uint8 status);

  event OracleReport(address airline, bytes32 flightKey, uint256 timestamp, uint8 status);

  // Event fired when flight status request is submitted
  // Oracles track this and if they have a matching index
  // they fetch data and submit a response
  event OracleRequest(uint8 index, address airline, bytes32 flightKey, string flightName, uint256 timestamp);

  // Register an oracle with the contract
  function registerOracle() external payable {
    // Require registration fee
    require(msg.value >= REGISTRATION_FEE, 'Registration fee is required');

    uint8[3] memory indexes = generateIndexes(msg.sender);

    oracles[msg.sender] = Oracle({ isRegistered: true, indexes: indexes });
  }

  function getOracleInfo(address account) external view requireContractOwner returns (bool, uint8[3] memory) {
    return (oracles[account].isRegistered, oracles[account].indexes);
  }

  function getMyIndexes() external view returns (uint8[3] memory) {
    require(oracles[msg.sender].isRegistered, 'Not registered as an oracle');

    return oracles[msg.sender].indexes;
  }

  // Called by oracle when a response is available to an outstanding request
  // For the response to be accepted, there must be a pending request that is open
  // and matches one of the three Indexes randomly assigned to the oracle at the
  // time of registration (i.e. uninvited oracles are not welcome)
  function submitOracleResponse(
    uint8 index,
    address airline,
    bytes32 flightKey,
    uint256 timestamp,
    uint8 statusCode
  ) external {
    require(
      (oracles[msg.sender].indexes[0] == index) ||
        (oracles[msg.sender].indexes[1] == index) ||
        (oracles[msg.sender].indexes[2] == index),
      'Index does not match oracle request'
    );

    bytes32 key = keccak256(abi.encodePacked(index, airline, flightKey, timestamp));
    require(oracleResponses[key].isOpen, 'Flight or timestamp do not match oracle request');

    oracleResponses[key].responses[statusCode].push(msg.sender);

    // Information isn't considered verified until at least MIN_RESPONSES
    // oracles respond with the *** same *** information
    emit OracleReport(airline, flightKey, timestamp, statusCode);
    if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {
      emit FlightStatusInfo(airline, flightKey, timestamp, statusCode);

      // Handle flight status as appropriate
      processFlightStatus(airline, flightKey, statusCode);
    }
  }

  function getFlightKey(
    address airline,
    string memory flight,
    uint256 timestamp
  ) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(airline, flight, timestamp));
  }

  // Returns array of three non-duplicating integers from 0-9
  function generateIndexes(address account) internal returns (uint8[3] memory) {
    uint8[3] memory indexes;
    indexes[0] = getRandomIndex(account);

    indexes[1] = indexes[0];
    while (indexes[1] == indexes[0]) {
      indexes[1] = getRandomIndex(account);
    }

    indexes[2] = indexes[1];
    while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
      indexes[2] = getRandomIndex(account);
    }

    return indexes;
  }

  // Returns array of three non-duplicating integers from 0-9
  function getRandomIndex(address account) internal returns (uint8) {
    uint8 maxValue = 10;

    // Pseudo random number...the incrementing nonce adds variation
    uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

    if (nonce > 250) {
      nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
    }

    return random;
  }

  // endregion
}

contract FlightSuretyData {
  struct Airline {
    string name;
    address airlineAddress;
    uint256 funds;
    bool isRegistered;
    bool isFunded;
  }

  function airlines(address _airline) external view returns (Airline memory);

  function getRegisteredAirlinesCount() external view returns (uint256);

  function registerAirline(
    address _address,
    string calldata _name,
    uint256 _minVotes
  ) external returns (bool, uint256);

  function unregisterAirline(address _address) external returns (bool);

  function isAirlineRegistered(address _airline) external view returns (bool);

  function fundAirline(address _address, uint256 _fundingRequired) external payable;

  function getAirlineInfo(address _address)
    external
    view
    returns (
      string memory,
      address,
      uint256,
      bool,
      bool
    );

  function registerFlight(
    bytes32 _flightKey,
    string calldata _name,
    uint8 _statusCode,
    address _airlineAddress,
    string calldata _origin,
    string calldata _destination,
    uint256 _takeoffTime,
    uint256 _landingTime
  ) external returns (bool);

  function getRegisteredFlights() external view returns (bytes32[] memory);

  function getFlightInfo(bytes32 _flightKey)
    external
    view
    returns (
      string memory,
      uint8,
      address,
      string memory,
      string memory,
      uint256,
      uint256
    );

  function buy(bytes32 _flightKey, address _passenger) external payable;

  function getInsuranceInfo(bytes32 _flightKey, address _passenger)
    external
    view
    returns (
      bytes32,
      address,
      uint256,
      bool
    );

  function getPassengerBalance(address _passenger) external view returns (uint256);

  function creditInsurees(address _airline, bytes32 _flightKey) external;

  function pay(address payable _passenger, uint256 _amount) external;
}
