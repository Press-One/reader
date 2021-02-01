const User = require('../models/user');
const Finance = require('../models/finance');
const Wallet = require('../models/wallet');
const Post = require('../models/post')
const Log = require('../models/log')
const {
  assert,
  Errors
} = require('../utils/validator');
const {
  pSet,
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
  const balanceMap = await Finance.getBalanceMap(user.address);
  ctx.ok(balanceMap);
}

exports.recharge = async ctx => {
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const {
    user
  } = ctx.verification;
  const key = `RECHARGE_${user.address}`;
  try {
    await assertTooManyRequests(key);
    const {
      paymentUrl
    } = await Finance.recharge({
      userId: user.id,
      currency: data.currency,
      amount: data.amount,
      memo: data.memo
    });
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
  const key = `WITHDRAW_${user.address}`;
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
    offset = 0, limit, filterType
  } = ctx.query;
  const receipts = await Finance.getReceiptsByUserAddress(user.address, {
    filterType,
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
  await Wallet.updateCustomPin(user.address, pinCode, {
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
  const customPin = await Wallet.getCustomPinByUserAddress(user.address);
  ctx.ok(!!customPin);
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
  const isValid = await Wallet.validatePin(user.address, pinCode);
  Log.create(user.id, `验证 pin ${isValid ? '成功' : '失败'}`);
  ctx.ok(isValid);
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
  const key = `REWARD_${user.address}`;
  try {
    await assertTooManyRequests(key);
    await Finance.reward(fileRId, data, {
      userId: user.id
    });
    ctx.ok({
      success: true
    });
  } catch (err) {
    ctx.er(err);
  } finally {
    pUnLock(key);
  }
}

exports.rechargeThenReward = async ctx => {
  const {
    fileRId
  } = ctx.params;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  const userId = ctx.verification.user.id;
  const userAddress = ctx.verification.user.address;
  const key = `RECHARGE_${userAddress}`;
  try {
    await assertTooManyRequests(key);
    const {
      uuid,
      paymentUrl
    } = await Finance.recharge({
      userId,
      currency: data.currency,
      amount: data.amount,
      memo: data.memo
    });
    await pSet(`COMBO`, uuid, {
      meta: {
        userId,
        fileRId
      },
      data
    });
    ctx.ok({
      paymentUrl
    });
  } catch (err) {
    console.log(err);
    ctx.er(err);
  } finally {
    pUnLock(key);
  }
}

exports.getRewardSummary = async ctx => {
  const {
    fileRId
  } = ctx.params;
  const post = await Post.getByRId(fileRId);
  const summary = post && post.rewardSummary ? JSON.parse(post.rewardSummary) : {};
  const [pubReceipts] = await Promise.all([
    Finance.getReceiptsByFileRId(fileRId),
  ]);
  const receipts = [...pubReceipts];
  const userAddressSet = new Set();
  for (const receipt of receipts) {
    userAddressSet.add(receipt.fromAddress);
  }
  const userAddressArr = Array.from(userAddressSet)
  const tasks = userAddressArr.map(address => User.getByAddress(address));
  const users = await Promise.all(tasks)
  ctx.ok({
    amountMap: summary,
    users: users
  });
}