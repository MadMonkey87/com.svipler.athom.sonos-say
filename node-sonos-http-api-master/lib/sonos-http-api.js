'use strict';
const requireDir = require('./helpers/require-dir');
const path = require('path');
const request = require('sonos-discovery/lib/helpers/request');
const logger = require('sonos-discovery/lib/helpers/logger');

function HttpAPI(discovery, settings) {

  const port = settings.port;
  const webroot = settings.webroot;
  const actions = {};

  this.getWebRoot = function () {
    return webroot;
  };

  this.getPort = function () {
    return port;
  };

  this.discovery = discovery;

  discovery.on('transport-state', function (player) {
    invokeWebhook('transport-state', player);
  });

  discovery.on('topology-change', function (topology) {
    invokeWebhook('topology-change', topology);
  });

  discovery.on('volume-change', function (volumeChange) {
    invokeWebhook('volume-change', volumeChange);
  });

  discovery.on('mute-change', function (muteChange) {
    invokeWebhook('mute-change', muteChange);
  });

  // this handles registering of all actions
  this.registerAction = function (action, handler) {
    actions[action] = handler;
  };

  //load modularized actions
  requireDir(path.join(__dirname, './actions'), (registerAction) => {
    registerAction(this);
  });

  this.fakeRequest = function (url, callback) {
    if (discovery.zones.length === 0) {
      const msg = 'No system has yet been discovered. Please see https://github.com/jishi/node-sonos-http-api/issues/77 if it doesn\'t resolve itself in a few seconds.';
      logger.error(msg);
      callback({ status: 'error', error: msg }, null);
      return;
    }

    const params = url.substring(1).split('/');

    // parse decode player name considering decode errors
    let player;
    try {
      player = discovery.getPlayer(decodeURIComponent(params[0]));
    } catch (error) {
      logger.error(`Unable to parse supplied URI component (${params[0]})`, error);
      callback({ status: 'error', error: error.message, stack: error.stack }, null);
      return;
    }

    const opt = {};

    if (player) {
      opt.action = (params[1] || '').toLowerCase();
      opt.values = params.splice(2);
    } else {
      player = discovery.getAnyPlayer();
      opt.action = (params[0] || '').toLowerCase();
      opt.values = params.splice(1);
    }

    opt.player = player;
    Promise.resolve(handleAction(opt))
      .then((response) => {
        if (!response || response.constructor.name === 'IncomingMessage') {
          response = { status: 'success' };
        } else if (Array.isArray(response) && response.length > 0 && response[0].constructor.name === 'IncomingMessage') {
          response = { status: 'success' };
        }
        callback(null, response);
        return;
      }).catch((error) => {
        logger.error(error);
        callback({ status: 'error', error: error.message, stack: error.stack }, null);
        return;
      });
  };

  function handleAction(options) {
    var player = options.player;

    if (!actions[options.action]) {
      return Promise.reject({ error: 'action \'' + options.action + '\' not found' });
    }

    return actions[options.action](player, options.values);


  }

  function invokeWebhook(type, data) {
    var typeName = "type";
    var dataName = "data";
    if (!settings.webhook) return;

    if (settings.webhookType) { typeName = settings.webhookType; }
    if (settings.webhookData) { dataName = settings.webhookData; }

    const jsonBody = JSON.stringify({
      [typeName]: type,
      [dataName]: data
    });

    const body = Buffer.from(jsonBody, 'utf8');

    var headers = {
      'Content-Type': 'application/json',
      'Content-Length': body.length
    }
    if (settings.webhookHeaderName && settings.webhookHeaderContents) {
      headers[settings.webhookHeaderName] = settings.webhookHeaderContents;
    }

    request({
      method: 'POST',
      uri: settings.webhook,
      headers: headers,
      body
    })
      .catch(function (err) {
        logger.error('Could not reach webhook endpoint', settings.webhook, 'for some reason. Verify that the receiving end is up and running.');
        logger.error(err);
      })
  }

}

module.exports = HttpAPI;
