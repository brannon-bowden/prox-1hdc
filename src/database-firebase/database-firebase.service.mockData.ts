export class MockDatabaseFirebaseService {
  getHousekeepingConnectors() {
    return true;
  }
  async handleConnectorError(domainId, connectorId) {
    return { domainId: domainId, connectorId: connectorId };
  }
  async handleConnectorSuccess(domainId, connectorId) {
    return { domainId: domainId, connectorId: connectorId };
  }
  async updateAsset(asset, feature) {
    asset[feature.key] = feature.value;
    return asset;
  }
  async checkandUpdateAssetMap(asset) {
    return { ...asset, Id: Math.random() };
  }
  async getAssetRefAndAssetid(asset) {
    return asset;
  }
  async getAdditionalConnectors(objToSend) {
    return { ...objToSend, Id: Math.random() };
  }
}
