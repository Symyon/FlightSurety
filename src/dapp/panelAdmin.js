import DOM from './dom';

export default class PanelAdmin {
  constructor(contract) {
    this.contract = contract;
  }

  getOperationalDomValues = (value, positiveValue, negativeValue) => {
    const text = value ? positiveValue : negativeValue;
    const color = value ? 'green' : '#d14343';
    return { text, color };
  };

  updateAppOperationalStatus(isActive) {
    const element = DOM.elid('app-operational-status');
    const { text, color } = this.getOperationalDomValues(isActive, 'Operative', 'Inoperative');
    element.textContent = text;
    element.style.color = color;
    DOM.elid('activate-app-contract').textContent = isActive ? 'Deactivate' : 'Activate';
  }

  updateDataOperationalStatus(isActive) {
    const element = DOM.elid('data-operational-status');
    const { text, color } = this.getOperationalDomValues(isActive, 'Operative', 'Inoperative');
    element.textContent = text;
    element.style.color = color;
    DOM.elid('activate-data-contract').textContent = isActive ? 'Deactivate' : 'Activate';
  }

  updateAppAuthorizationStatus(isActive) {
    const element = DOM.elid('app-authorized-status');
    const { text, color } = this.getOperationalDomValues(isActive, 'Authorized', 'Unauthorized');
    element.textContent = text;
    element.style.color = color;
    DOM.elid('authorize-app-contract').textContent = isActive ? 'Unauthorize' : 'Authorize';
  }

  switchAppContractOperationalStatus() {
    const self = this;
    this.contract.isAppOperational((err, status) => {
      if (err) {
        console.log(err);
        return;
      }
      self.contract.setOperatingStatus(!status, (error, result) => {
        if (error) {
          console.log(error);
          return;
        }
        self.updateAppOperationalStatus(error ? false : result);
      });
    });
  }

  initialize() {
    DOM.elid('app-contract-address').textContent = this.contract.config.appAddress;
    DOM.elid('data-contract-address').textContent = this.contract.config.dataAddress;

    const self = this;
    this.contract.isAppOperational((error, result) => {
      console.log(error, result);
      self.updateAppOperationalStatus(error ? false : result);
    });

    this.contract.isDataOperational((error, result) => self.updateDataOperationalStatus(error ? false : result));

    this.contract.isAppAuthorized((error, result) => self.updateAppAuthorizationStatus(error ? false : result));

    DOM.elid('activate-app-contract').addEventListener('click', () => {
      self.switchAppContractOperationalStatus();
    });
  }
}
