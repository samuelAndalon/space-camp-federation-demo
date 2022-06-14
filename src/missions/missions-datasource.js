const MissionsService = require('./missions-service');

module.exports = class MissionsDataSource {

  constructor() {
    this.service = new MissionsService()
  }

  getMission(id, context) {
    return context.dataLoaderRegistry.missionByIdDataLoader.load(id);
  }

  async getMissions(ids, context) {
    return await this.service.getMissions(ids);
  }

  getMissionsByAstronaut(id, context) {
    return context.dataLoaderRegistry.missionByAstronautIdDataLoader.load(id);
  }

}