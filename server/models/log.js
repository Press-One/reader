const request = require('request-promise');
const User = require('./user');
const Log = require('./sequelize/log');
const config = require('../config');
const Cache = require('./cache');
const {
  log
} = require('../utils');

exports.create = async (userId, message, options = {}) => {
  const userDevice = await Cache.pGet('USER_DEVICE', String(userId));
  const user = await User.get(userId, {
    withSSO: true
  });
  if (!user) {
    return;
  }
  const version = user.version ? `(v${user.version})` : '';
  const data = {
    userId,
    message: `【${config.serviceKey.replace('_FLYING_PUB', '')} ${userDevice || ''}】${user.nickname}${version}：${message}`,
  };
  await Log.create(data);
  if (config.bot && config.bot.enabled) {
    try {
      sendToBot(data, {
        toActiveMixinUser: options.toActiveMixinUser
      });
    } catch (e) {
      log(e);
    }
  }
}

exports.createAnonymity = async (identity, message, options = {}) => {
  const data = {
    userId: 0,
    message: `【${config.serviceKey.replace('_FLYING_PUB', '')}】 ${identity}：${message}`,
  };
  await Log.create(data);
  if (config.bot && config.bot.enabled) {
    try {
      sendToBot(data, {
        toActiveMixinUser: options.toActiveMixinUser
      });
    } catch (e) {
      log(e);
    }
  }
}

const sendToBot = async (data, options = {}) => {
  await request({
    uri: config.bot.url,
    method: 'post',
    timeout: 10000,
    json: true,
    body: {
      payload: data
    }
  }).promise();

  if (config.bot.mixin) {
    await request({
      uri: config.bot.mixin.url,
      method: 'post',
      timeout: 10000,
      json: true,
      body: {
        payload: {
          ...data,
          mixinUserUuid: options.toActiveMixinUser ? (config.bot.mixin.activeMixinUserUuid || '') : config.bot.mixin.lazyMixinUserUuid
        }
      }
    }).promise();
  }
};