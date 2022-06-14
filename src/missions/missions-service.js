const fetch = require('node-fetch');

const apiUrl = 'http://localhost:3000';

module.exports = class MissionsService {
  async getMissions(ids) {
    console.log(`Request getMissions: ${ids}`);
    const query = ids.map(id => `id=${id}`).join('&');
    const response = await fetch(`${apiUrl}/missions${query ? '?'+ query : ''}`);
    const body = await response.json();
    return body;
  }

  async getMissionsByAstronauts(ids) {
    console.log(`Request getMissionsByAstronautIds: ${ids}`);
    const response = await fetch(`${apiUrl}/missions`);
    const missions = await response.json();
    return ids
      .map(id => 
        missions.filter(({ crew }) => 
          crew.includes(+id)
        )
      );
  }
}