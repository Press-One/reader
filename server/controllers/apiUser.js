const Conversation = require('../models/conversation');
const {
  assert,
  throws,
  Errors
} = require('../utils/validator');
const User = require('../models/user');
const Profile = require('../models/profile');
const {
  verifySmsCode
} = require('../models/verifycode');
const {
  removeEmpty
} = require('../utils');

exports.get = async ctx => {
  const {
    user
  } = ctx.verification;
  const conversation = await Conversation.get(user.id);
  const notificationEnabled = !!conversation;
  ctx.body = {
    ...user,
    notificationEnabled
  };
};

// update nickname or avatar or bio
exports.put = async (ctx) => {
  const {
    nickname,
    avatar,
    bio,
  } = ctx.request.body || {};
  const {
    user,
  } = ctx.verification;

  if (!(nickname || avatar || bio)) {
    throws(Errors.ERR_IS_REQUIRED('name or nickname or avatar or bio'));
  }

  const data = removeEmpty(ctx.request.body);
  const support_fields = ['nickname', 'bio', 'avatar'];
  for (const [k, _] of Object.entries(data)) {
    if (!support_fields.includes(k)) {
      throws(Errors.ERR_IS_INVALID(k));
    }
  }

  if (Object.keys(data).length >= 0) {
    await User.update(user.id, data);
  }
  ctx.body = await User.get(user.id);
}

// set password for phone
exports.setPassword = async (ctx) => {
  const {
    user
  } = ctx.verification;
  const userId = user.id;

  const {
    password,
    oldPassword,
    code,
  } = ctx.request.body || {};
  // FIXME: hardcode provider: `phone`
  const provider = 'phone';

  assert(password, Errors.ERR_IS_REQUIRED('password'));
  assert(oldPassword || code, Errors.ERR_IS_REQUIRED('oldPassword or code'));

  const profile = await Profile.getByUserIdAndProvider(userId, provider);
  assert(profile, Errors.ERR_NOT_FOUND(`profile by userId = {userId}, provider = ${provider}`));
  const phone = profile.providerId;
  assert(phone, Errors.ERR_IS_INVALID('phone is empty'));

  if (oldPassword) {
    await Profile.updatePasswordWithOldPassword(userId, oldPassword, password, provider);
  } else if (code) {
    await verifySmsCode(phone, code);
    await Profile.setPassword(user.id, password, provider);
  }

  ctx.body = {
    success: true
  };
}