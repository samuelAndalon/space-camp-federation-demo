const fetch = require("node-fetch");
const DataLoader = require("dataloader");

const apiUrl = "http://localhost:3000";

module.exports = class MissionsService {

  async getMissions(ids) {
    //console.log(`Request getMissions: ${ids}`);
    const query = ids.map(id => `id=${id}`).join('&');
    const response = await fetch(`${apiUrl}/missions${query ? '?'+ query : ''}`);
    const body = await response.json();
    return body;
  }

  async getMission(id) {
    //console.log(`Request getMission: ${id}`);
    const response = await fetch(`${apiUrl}/missions/${id}`);
    const body = await response.json();
    return body;
  }

  async getMissionsByAstronautId(id) {
    //console.log(`Request getMissionsByAstronautId: ${id}`);
    const response = await fetch(`${apiUrl}/missions`);
    const missions = await response.json();
    return missions.filter(({ crew }) => crew.includes(+id));
  }

  async getMissionsByAstronautIds(ids) {
    //console.log(`Request getMissionsByAstronautIds: ${ids}`);
    const response = await fetch(`${apiUrl}/missions`);
    const missions = await response.json();
    return ids
      .map(id => 
        missions.filter(({ crew }) => 
          crew.includes(+id)
        )
      );
  }

  getMissionsDataLoader() {
    return new DataLoader(ids => this.getMissionsByAstronautIds(ids));
  }
}