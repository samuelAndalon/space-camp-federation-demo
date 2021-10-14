const fetch = require("node-fetch");

const apiUrl = "http://localhost:3000";

module.exports = class MissionsService {
  async getMissions() {
    console.log(`Request getMissions`);
    const response = await fetch(`${apiUrl}/missions`);
    const body = await response.json();
    return body;
  }

  async getMission(id) {
    console.log(`Request getMission: ${id}`);
    const response = fetch(`${apiUrl}/missions/${id}`);
    const body = await response.body();
  }

  async getAstronautMissions(astronaut) {
    console.log(`Request getAstronautMissions: ${astronaut.id}`);
    const response = await fetch(`${apiUrl}/missions`);
    const missions = await response.json();
    return missions.filter(({ crew }) => crew.includes(parseInt(astronaut.id)));
  }
}