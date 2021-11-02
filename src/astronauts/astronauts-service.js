const fetch = require("node-fetch");
const DataLoader = require("dataloader");

const apiUrl = "http://localhost:3000";

module.exports = class AstronautsService {
  async getAstronauts() {
    //console.log(`Request getAstronauts`);
    const response = await fetch(`${apiUrl}/astronauts`);
    const body = await response.json();
    return body;
  } 

  async getAstronaut(id) {
    //console.log(`Request getAstronaut: ${id}`);
    const response = await fetch(`${apiUrl}/astronauts/${id}`);
    const body = await response.json();
    return body;
  }

  async getAstronautsByIds(ids) {
    //console.log(`Request getAstronautsByIds: ${ids}`);
    const query = ids.map(id => `id=${id}`).join('&');
    const response = await fetch(`${apiUrl}/astronauts?${query}`);
    const body = await response.json();
    return body;
  }

  getAstronautsDataLoader() {
    return new DataLoader(ids => this.getAstronautsByIds(ids));
  }
}