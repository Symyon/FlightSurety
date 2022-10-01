import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

function updateActiveAccountDisplayed(newAccount) {
  const accountAddressElements = DOM.elementsWithId("#active-account");
  accountAddressElements.forEach((node) => (node.textContent = newAccount));
}

function displayAdminPanelInfo(contract) {
  DOM.elid("app-contract-address").textContent = contract.config.appAddress;
  DOM.elid("data-contract-address").textContent = contract.config.dataAddress;
  // let section = DOM.section();
  // section.appendChild(DOM.h2(title));
  // section.appendChild(DOM.h5(description));
  // results.map((result) => {
  //   let row = section.appendChild(DOM.div({ className: "row" }));
  //   row.appendChild(DOM.div({ className: "col-sm-4 field" }, result.label));
  //   row.appendChild(
  //     DOM.div(
  //       { className: "col-sm-8 field-value" },
  //       result.error ? String(result.error) : String(result.value)
  //     )
  //   );
  //   section.appendChild(row);
  // });
  // displayDiv.append(section);
}

(async () => {
  let result = null;

  let contract = new Contract("localhost", () => {
    updateActiveAccountDisplayed(contract.getActiveWalletAccount());
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", function (accounts) {
        const owner = contract.getActiveWalletAccount();
        contract.setActiveWalletAccount(accounts[0]);
        updateActiveAccountDisplayed(contract.getActiveWalletAccount());
      });
    }

    displayAdminPanelInfo(contract);

    // Read transaction
    contract.isOperational((error, result) => {
      // console.log(error, result);
      display("Operational Status", "Check if contract is operational", [
        { label: "Operational Status", error: error, value: result },
      ]);
    });

    // User-submitted transaction
    // DOM.elid("fetch-airline").addEventListener("click", () => {
    //   let airline = DOM.elid("airline-address").value;
    //   // Write transaction
    //   console.log("wearehere");
    //   contract.fetchAirlineInfo(airline, (error, result) => {
    //     console.log("wearehere fetch");
    //     displayAirlineInfo("Oracles", "Trigger oracles", [
    //       {
    //         label: "Fetch Airline Info",
    //         error: error,
    //         value: JSON.stringify(result),
    //       },
    //     ]);
    //   });
    // });

    // User-submitted transaction
    // DOM.elid("submit-oracle").addEventListener("click", () => {
    //   let flight = DOM.elid("flight-number").value;
    //   // Write transaction
    //   contract.fetchFlightStatus(flight, (error, result) => {
    //     display("Oracles", "Trigger oracles", [
    //       {
    //         label: "Fetch Flight Status",
    //         error: error,
    //         value: result.flight + " " + result.timestamp,
    //       },
    //     ]);
    //   });
    // });
  });
})();

function display(title, description, results) {
  // let displayDiv = DOM.elid("display-wrapper");
  // let section = DOM.section();
  // section.appendChild(DOM.h2(title));
  // section.appendChild(DOM.h5(description));
  // results.map((result) => {
  //   let row = section.appendChild(DOM.div({ className: "row" }));
  //   row.appendChild(DOM.div({ className: "col-sm-4 field" }, result.label));
  //   row.appendChild(
  //     DOM.div(
  //       { className: "col-sm-8 field-value" },
  //       result.error ? String(result.error) : String(result.value)
  //     )
  //   );
  //   section.appendChild(row);
  // });
  // displayDiv.append(section);
}

function displayAirlineInfo(title, description, results) {
  // let displayDiv = DOM.elid("display-airline-wrapper");
  // let section = DOM.section();
  // section.appendChild(DOM.h2(title));
  // section.appendChild(DOM.h5(description));
  // results.map((result) => {
  //   let row = section.appendChild(DOM.div({ className: "row" }));
  //   row.appendChild(DOM.div({ className: "col-sm-4 field" }, result.label));
  //   row.appendChild(
  //     DOM.div(
  //       { className: "col-sm-8 field-value" },
  //       result.error ? String(result.error) : String(result.value)
  //     )
  //   );
  //   section.appendChild(row);
  // });
  // displayDiv.append(section);
}
