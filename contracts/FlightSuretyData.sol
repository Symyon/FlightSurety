pragma solidity ^0.5.16;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

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
    mapping(address => Airline) airlines;
    bytes16 private registeredAirlinesCounter = 0;

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
            name: "Owner Airline",
            airlineAddress: firstAirline,
            funds: 0,
            isRegistered: true,
            isFunded: false
        });
        registeredAirlinesCounter = 1;
    }

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
        require(isOperational(), "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requiredAuthorized() {
        require(
            authorizedCallers[msg.sender] == true,
            "Caller is not authorized"
        );
        _;
    }

    modifier requireRegisteredAndFunded() {
        require(
            airlines[tx.origin].isRegistered,
            "Cannot execute operation if calling airline is not registered"
        );
        require(
            airlines[tx.origin].isFunded,
            "Airline contract does not have enough funds to operate the contract"
        );
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

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        require(
            mode != operational,
            "Operational status cannot be set to the same value"
        );
        operational = mode;
    }

    function setAuthorization(address _address, bool _authorized)
        external
        requireContractOwner
    {
        authorizedCallers[_address] = _authorized;
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
        byte8 _minVotes
    )
        external
        requiredAuthorized
        requireRegisteredAndFunded
        requireIsOperational
    {
        require(
            airlines[_address].isRegistered == false,
            "Airline is already registered"
        );

        bool isDuplicate = multiCalls[_address];
        require(!isDuplicate, "This Airline has already voted to register");

        if (multiCallsAddresses.length > _minVotes - 1) {
            airlines[_address] = Airline({
                name: _name,
                airlineAddress: _address,
                funds: 0,
                isRegistered: true,
                isFunded: false
            });
            registeredAirlinesCounter = registeredAirlinesCounter.add(1);

            for (uint i = 0; i < multiCallsAddresses.length; i++) {
                delete multiCalls[multiCallsAddresses[i]];
            }
            multiCallsAddresses = new address[](0);
        } else {
            multiCalls[_address] = true;
            multiCallsAddresses.push(_address);
        }
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
