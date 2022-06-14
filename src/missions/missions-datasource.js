const MissionsService = require('./missions-service');
const DataLoader = require('dataloader');

module.exports = class MissionsDataSource {

  constructor() {
    this.service = new MissionsService()
  }

  getDataLoaders() {
    return {
      missionByIdDataLoader: new DataLoader(ids => this.service.getMissions(ids)),
      missionByAstronautIdDataLoader: new DataLoader(ids => this.service.getMissionsByAstronauts(ids))
    }
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