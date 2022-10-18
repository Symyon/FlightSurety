import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';
import PanelAdmin from './panelAdmin';
import PanelAirlines from './panelAirlines';
import PanelPassengers from './panelPassengers';
import { getDomValuesWithStyle } from './utils';

function updateActiveAccountDisplayed(newAccount) {
  const accountAddressElements = DOM.elementsWithId('#active-account');
  accountAddressElements.forEach((node) => (node.textContent = newAccount));
}

function updateActiveAccountRoleDisplayed(nodeId, isOwner, error) {
  const { text, color } = getDomValuesWithStyle(isOwner, 'Yes', 'No');
  const element = DOM.elid(nodeId);
  element.textContent = text;
  element.style.color = color;
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

    let panelAirlines = new PanelAirlines(contract);
    panelAirlines.initialize();

    let pannlePassengers = new PanelPassengers(contract);
    pannlePassengers.initialize();

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
