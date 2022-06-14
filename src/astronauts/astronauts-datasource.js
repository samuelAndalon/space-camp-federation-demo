const AstronautsService = require('./astronauts-service');

module.exports = class AstronautsDataSource {

  constructor() {
    this.service = new AstronautsService();
  }

  getAstronaut(id, context) {
    return context.dataLoaderRegistry.astronautByIdDataLoader.load(id)
  }

  async getAstronauts(ids, context) {
    return await this.service.getAstronauts(ids);
  }
}