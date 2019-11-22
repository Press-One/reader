const request = require('request-promise');
const Finance = require('../models/finance');
const Wallet = require('../models/wallet');
const Post = require('../models/post')
const User = require('../models/user')
const Log = require('../models/log')
const {
  assert,
  Errors
} = require('../models/validator');
const {
  pTryLock,
  pUnLock
} = require('../models/cache');

const assertTooManyRequests = async (lockKey) => {
  const locked = await pTryLock(lockKey, 10);
  assert(!locked, 'too many request', 429);
};

exports.getBalance = async ctx => {
  const {
    user
  } = ctx.verification;
  const balanceMap = await Finance.getBalanceMap(user.id);
  ctx.ok(balanceMap);
}

exports.recharge = async ctx => {
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const {
    user
  } = ctx.verification;
  const key = `RECHARGE_${user.id}`;
  try {
    await assertTooManyRequests(key);
    const paymentUrl = await Finance.recharge({
      userId: user.id,
      currency: data.currency,
      amount: data.amount,
      memo: data.memo
    });
    Log.create(user.id, `打算充值 ${data.amount} ${data.currency} ${data.memo || ''}`);
    Log.create(user.id, '获得充值二维码 url');
    ctx.ok({
      paymentUrl
    });
  } catch (err) {
    ctx.er(err);
  } finally {
    pUnLock(key);
  }
};

exports.withdraw = async ctx => {
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const {
    user
  } = ctx.verification;
  const key = `WITHDRAW_${user.id}`;
  try {
    await assertTooManyRequests(key);
    Log.create(user.id, `开始提现 ${data.amount} ${data.currency} ${data.memo || ''}`);
    await Finance.withdraw({
      userId: user.id,
      currency: data.currency,
      amount: data.amount,
      memo: data.memo,
    });
    Log.create(user.id, `完成提现 ${data.amount} ${data.currency} ${data.memo || ''}`);
    ctx.ok({
      success: true
    });
  } catch (err) {
    console.log(` ------------- err ---------------`, err);
    ctx.er(err);
  } finally {
    pUnLock(key);
  }
};

exports.getReceipts = async ctx => {
  const {
    user
  } = ctx.verification;
  const {
    offset = 0, limit
  } = ctx.query;
  const receipts = await Finance.getReceiptsByUserAddress(user.address, {
    offset,
    limit: Math.min(~~limit || 10, 100),
    status: 'SUCCESS'
  });
  ctx.body = receipts;
}

exports.updateCustomPin = async ctx => {
  const {
    user
  } = ctx.verification;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const {
    pinCode,
    oldPinCode
  } = data;
  await Wallet.updateCustomPin(user.id, pinCode, {
    oldPinCode
  });
  Log.create(user.id, '更新 pin 成功');
  ctx.ok({
    success: true
  });
}

exports.isCustomPinExist = async ctx => {
  const {
    user
  } = ctx.verification;
  const wallet = await Wallet.getByUserId(user.id);
  ctx.ok(!!wallet.customPin);
}

exports.validatePin = async ctx => {
  const {
    user
  } = ctx.verification;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const {
    pinCode
  } = data;
  const isValid = await Wallet.validatePin(user.id, pinCode);
  Log.create(user.id, `验证 pin ${isValid ? '成功' : '失败'}`);
  ctx.ok(isValid);
}

const getAuthorInfoByRId = async rId => {
  const blocks = await request({
    uri: `https://press.one/api/v2/blocks/${rId}`,
    json: true
  }).promise();
  const block = blocks[0];
  const address = block.user_address;
  const {
    payment_url
  } = JSON.parse(block.meta);
  const mixinClientId = payment_url ? payment_url.split('/').pop() : '';
  return {
    address,
    mixinClientId
  }
}

exports.reward = async ctx => {
  const {
    fileRId
  } = ctx.params;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const {
    user
  } = ctx.verification;
  const key = `REWARD_${user.id}`;
  try {
    await assertTooManyRequests(key);
    const {
      address,
      mixinClientId
    } = await getAuthorInfoByRId(fileRId);
    assert(address, Errors.ERR_IS_REQUIRED('address'));
    assert(mixinClientId, Errors.ERR_IS_REQUIRED('mixinClientId'));
    Log.create(user.id, `开始打赏 ${data.amount} ${data.currency} ${data.memo || ''} ${fileRId} ${mixinClientId}`);
    await Finance.payForFile({
      userId: user.id,
      toAddress: address,
      fileRId,
      currency: data.currency,
      amount: data.amount,
      memo: data.memo,
      toMixinClientId: mixinClientId,
    });
    Log.create(user.id, `完成打赏 ${data.amount} ${data.currency} ${data.memo || ''} ${fileRId}`);
    ctx.ok({
      success: true
    });
  } catch (err) {
    console.log(` ------------- err ---------------`, err);
    ctx.er(err);
  } finally {
    pUnLock(key);
  }
}

exports.getRewardSummary = async ctx => {
  const {
    fileRId
  } = ctx.params;
  const post = await Post.get(fileRId);
  const summary = post && post.rewardSummary ? JSON.parse(post.rewardSummary) : {};
  const receipts = await Finance.getReceiptsByFileRId(fileRId);
  const userAddressSet = new Set();
  for (const receipt of receipts) {
    userAddressSet.add(receipt.fromAddress);
  }
  const userAddressArr = Array.from(userAddressSet)
  const tasks = userAddressArr.map(address => User.getByAddress(address, {
    withProfile: true
  }));
  const users = await Promise.all(tasks)
  ctx.ok({
    amountMap: summary,
    users
  });
}