const fetch = require('node-fetch');

const apiUrl = 'http://localhost:3000';

module.exports = class AstronautsService {
  async getAstronauts(ids) {
    // console.log(`Request getAstronauts ids: ${ids}`);
    const query = ids.map(id => `id=${id}`).join('&');
    const response = await fetch(`${apiUrl}/astronauts${query ? '?'+ query : ''}`);
    const body = await response.json();
    return body;
  }
}