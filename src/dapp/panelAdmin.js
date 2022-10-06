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

  updateDataOperationalStatus(isActive) {
    const element = DOM.elid('data-operational-status');
    const { text, color } = this.getOperationalDomValues(isActive, 'Operative', 'Inoperative');
    element.textContent = text;
    element.style.color = color;
    DOM.elid('activate-data-contract').textContent = isActive ? 'Deactivate' : 'Activate';
  }

  switchDataContractOperationalStatus() {
    const self = this;
    this.contract.isDataOperational((err, status) => {
      if (err) {
        console.log(err);
        return;
      }
      self.contract.setDataOperatingStatus(!status, (error, result) => {
        if (error) {
          console.log(error);
          return;
        }
      });
    });
  }

  addDataContractStatusListener() {
    const self = this;
    this.contract.addListenerToDataStatusChange((error, data) => {
      if (error) {
        console.log(error);
        return;
      }
      self.updateDataOperationalStatus(data.returnValues[1]);
    });
  }

  updateAppOperationalStatus(isActive) {
    const element = DOM.elid('app-operational-status');
    const { text, color } = this.getOperationalDomValues(isActive, 'Operative', 'Inoperative');
    element.textContent = text;
    element.style.color = color;
    DOM.elid('activate-app-contract').textContent = isActive ? 'Deactivate' : 'Activate';
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
      self.contract.setAppOperatingStatus(!status, (error, result) => {
        if (error) {
          console.log(error);
          return;
        }
      });
    });
  }

  addAppContractStatusListener() {
    const self = this;
    this.contract.addListenerToAppStatusChange((error, data) => {
      if (error) {
        console.log(error);
        return;
      }
      self.updateAppOperationalStatus(data.returnValues[1]);
    });
  }

  initialize() {
    DOM.elid('app-contract-address').textContent = this.contract.config.appAddress;
    DOM.elid('data-contract-address').textContent = this.contract.config.dataAddress;

    const self = this;
    this.contract.isAppOperational((error, result) => {
      self.updateAppOperationalStatus(error ? false : result);
    });
    this.addAppContractStatusListener();

    this.contract.isDataOperational((error, result) => self.updateDataOperationalStatus(error ? false : result));
    this.addDataContractStatusListener();
    this.contract.isAppAuthorized((error, result) => self.updateAppAuthorizationStatus(error ? false : result));

    DOM.elid('activate-app-contract').addEventListener('click', () => {
      self.switchAppContractOperationalStatus();
    });

    DOM.elid('activate-data-contract').addEventListener('click', () => {
      self.switchDataContractOperationalStatus();
    });
  }
}
