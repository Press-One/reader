const config = require('../config');

exports.crypto = require('./crypto');

exports.mimeTypes = require('./mimeTypes');

exports.fm = require('./front-matter');

exports.log = message => {
  if (config.debug) {
    console.log(message);
  }
}

exports.sleep = (duration) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

exports.truncate = (text, max = 8) => {
  const truncatedText = text.slice(0, max);
  const postfix = text.length > truncatedText.length ? '...' : '';
  return `${truncatedText}${postfix}`;
}


exports.removeEmpty = (obj) => {
  for (const key of Object.keys(obj)) {
    if (!obj[key]) {
      delete obj[key];
    }
  }
  return obj
}