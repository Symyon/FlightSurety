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
  });
})();
