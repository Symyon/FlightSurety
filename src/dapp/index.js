import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';
import PanelAdmin from './panelAdmin';

function updateActiveAccountDisplayed(newAccount) {
  const accountAddressElements = DOM.elementsWithId('#active-account');
  accountAddressElements.forEach((node) => (node.textContent = newAccount));
}

function updateActiveAccountRoleDisplayed(nodeId, isOwner, error) {
  DOM.elid(nodeId).textContent = error ? 'N/A' : isOwner ? 'Yes' : 'No';
}

function initAccountSelected(contract) {
  updateActiveAccountDisplayed(contract.getActiveWalletAccount());
  contract.isAppOwner((error, isAppOwner) => {
    updateActiveAccountRoleDisplayed('contract-owner', isAppOwner, error);
  });
  contract.isDataOwner((error, isDataOwner) => {
    updateActiveAccountRoleDisplayed('data-owner', isDataOwner, error);
  });
}

(async () => {
  let contract = new Contract('localhost', () => {
    initAccountSelected(contract);
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', function (accounts) {
        contract.setActiveWalletAccount(accounts[0]);
        initAccountSelected(contract);
      });
    }

    let panelAdmin = new PanelAdmin(contract);
    panelAdmin.initialize();

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
