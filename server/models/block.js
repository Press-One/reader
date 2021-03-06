const Block = require('../models/sequelize/block');
const {
  assert,
  Errors
} = require('../utils/validator');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

exports.get = async id => {
  assert(id, Errors.ERR_IS_REQUIRED('id'));
  const block = await Block.findOne({
    where: {
      id,
    }
  });
  return block ? block.toJSON() : null;
};

exports.create = async (block) => {
  const dbBlock = await Block.create(block);
  return dbBlock.toJSON();
}

exports.update = async (id, data) => {
  assert(id, Errors.ERR_IS_REQUIRED('id'));
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  assert(data.blockNum, Errors.ERR_IS_REQUIRED('blockNum'));
  assert(data.blockTransactionId, Errors.ERR_IS_REQUIRED('blockTransactionId'));
  await Block.update({
    blockNum: data.blockNum,
    blockTransactionId: data.blockTransactionId
  }, {
    where: {
      id
    }
  });
  return true;
};

exports.getAllowBlock = async (topic, address) => {
  const block = await Block.findOne({
    where: {
      data: {
        [Op.like]: `%"allow":"${address}","topic":"${topic}"%`
      }
    }
  });
  return block ? block.toJSON() : null;
}
