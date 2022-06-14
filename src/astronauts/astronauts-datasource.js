const AstronautsService = require('./astronauts-service');
const DataLoader = require('dataloader');

module.exports = class AstronautsDataSource {

  constructor() {
    this.service = new AstronautsService();
  }

  getDataLoaders() {
    return {
      astronautByIdDataLoader: new DataLoader(ids => this.service.getAstronauts(ids))
    }
  }

  getAstronaut(id, context) {
    return context.dataLoaderRegistry.astronautByIdDataLoader.load(id)
  }

  async getAstronauts(ids, context) {
    return await this.service.getAstronauts(ids);
  }
}