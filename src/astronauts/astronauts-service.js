const fetch = require("node-fetch");

const apiUrl = "http://localhost:3000";

module.exports = class AstronautsService {
  async getAstronauts(ids) {
    console.log(`Request getAstronauts: ${ids}`);
    const query = ids.map(id => `id=${id}`).join('&');
    const response = await fetch(`${apiUrl}/astronauts${query ? '?'+ query : ''}`);
    const body = await response.json();
    return body;
  } 

  async getAstronaut(id) {
    console.log(`Request getAstronaut: ${id}`);
    const response = await fetch(`${apiUrl}/astronauts/${id}`);
    const body = await response.json();
    return body;
  }

  async getAstronautsByIds(ids) {
    console.log(`Request getAstronautsByIds: ${ids}`);
    const query = ids.map(id => `id=${id}`).join('&');
    const response = await fetch(`${apiUrl}/astronauts?${query}`);
    const body = await response.json();
    return body;
  }
}