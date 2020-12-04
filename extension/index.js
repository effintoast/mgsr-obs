"use strict";
const https = require('https');
module.exports = function (nodecg) {

  nodecg.listenFor('streamlabs-donations', (value, ack) => {
      
      https.get('https://www.twitchalerts.com/api/donations?access_token='+nodecg.bundleConfig.streamlabs_api_key, (resp) => {
        let data = '';

        resp.on('data', (chunk) => {
          data += chunk;
        });

        resp.on('end', () => {
          ack(null, JSON.parse(data));
        });

      }).on("error", (err) => {
        ack(new Error('Request to streamlabs api failed.'));
      });


  });

}