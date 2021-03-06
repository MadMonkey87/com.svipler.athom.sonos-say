'use strict';
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const tryDownloadTTS = require('../helpers/try-download-tts');
const singlePlayerAnnouncement = require('../helpers/single-player-announcement');
const settings = require('../../settings');

let port;
let system;

function sayUrl(player, values) {
  let url;
  try {
    console.log('values');
    console.log(values);
    url = Buffer.from(values[0], 'base64').toString('ascii');
  } catch (err) {
    if (err instanceof URIError) {
      err.message = `The encoded phrase ${values[0]} could not be URI decoded. Make sure your url encoded values (%xx) are within valid ranges. xx should be hexadecimal representations`;
    }
    return Promise.reject(err);
  }
  let announceVolume = values.length>2 ? values[1] : 25;
  let duration = values.length>2 ? values[2] : 5000;

  
  //return tryDownloadTTS(text, language)
  //  .then((result) => {
  console.log('url');
  console.log(url);
  return singlePlayerAnnouncement(player,url, announceVolume, duration);//result.duration);
  //  });
}

module.exports = function (api) {
  port = api.getPort();
  api.registerAction('sayurl', sayUrl);

  system = api.discovery;
}
