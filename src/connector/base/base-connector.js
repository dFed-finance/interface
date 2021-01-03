import { EventEmitter } from 'events'
import { ConnectorEvents } from './types'

export class BaseConnector extends EventEmitter {
  supportedChainIds = []

  constructor(supportedChainIds = []) {
    super();
    this.supportedChainIds = supportedChainIds;
  }

  async activate() {}

  async getProvider() {}

  async getChainId() {}

  async getAccount() {}

  async deactivate() {}

  emitUpdate(update) {
    this.emit(ConnectorEvents.Update, update)
  }

  emitError(error) {
    this.emit(ConnectorEvents.Error, error)
  }

  emitDeactivate() {
    this.emit(ConnectorEvents.Deactivate)
  }
}
