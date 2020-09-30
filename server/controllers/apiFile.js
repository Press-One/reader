const File = require("../models/file");
const config = require('../config');
const {
  assert,
  Errors
} = require("../utils/validator");
const Log = require("../models/log");
const Post = require("../models/post");
const Chain = require("./chain");

exports.list = async ctx => {
  const {
    offset = 0, limit = 10
  } = ctx.query;
  const userId = ctx.verification.user.id;
  const files = await File.list(userId, {
    offset,
    limit: Math.min(~~limit, 50),
  });
  const total = await File.count(userId);
  ctx.body = {
    total,
    files
  };
};

const getFrontMatter = (user, title) => {
  return `---
title: ${title}
author: ${user.nickname ? user.nickname : ''}
avatar: ${user.avatar ? user.avatar : ''}
bio: ${user.bio ? user.bio : ''}
published: ${new Date().toISOString()}
---\n`;
};

const tryAppendFrontMatter = (user, title, file) => {
  if (file.content) {
    file.content = getFrontMatter(user, title) + file.content.trim();
    file.content = file.content.trim();
  }
  return file;
};

const createFile = async (user, data, options = {}) => {
  const {
    isDraft
  } = options;
  const shouldPushToChain = !isDraft;
  const derivedData = tryAppendFrontMatter(user, data.title, data);
  let file = await File.create(user.id, derivedData);
  if (shouldPushToChain) {
    const fileToChain = await File.get(file.id, {
      withRawContent: true
    });
    const {
      updatedFile,
      origin
    } = options;
    const block = await Chain.pushFile(fileToChain, {
      updatedFile,
      origin
    });
    const rId = block.id;
    file = await File.update(file.id, {
      rId
    });
    const postUrl = `${config.settings['site.url']}/posts/${rId}`;
    Log.create(user.id, `发布文章 ${postUrl}`);
  }
  Log.create(user.id, `创建文章 ${file.title} ${file.id}`);
  return file;
};
exports.createFile = createFile;

exports.create = async ctx => {
  const {
    user
  } = ctx.verification;
  const data = ctx.request.body.payload;
  const isDraft = ctx.query.type === "DRAFT";
  assert(data, Errors.ERR_IS_REQUIRED("data"));
  const file = await createFile(user, data, {
    isDraft,
    origin: ctx.request.body.origin
  });
  ctx.body = file;
};

exports.hide = async ctx => {
  const userId = ctx.verification.user.id;
  const id = ~~ctx.params.id;
  const file = await File.get(id);
  assert(file, Errors.ERR_NOT_FOUND("file"));
  assert(file.userId === userId, Errors.ERR_NO_PERMISSION);
  await Post.updateByRId(file.rId, {
    invisibility: true
  });
  await File.hide(id);
  Log.create(file.userId, `隐藏文章 ${file.title} ${file.id}`);
  ctx.body = true;
};

exports.show = async ctx => {
  const userId = ctx.verification.user.id;
  const id = ~~ctx.params.id;
  const file = await File.get(id);
  assert(file, Errors.ERR_NOT_FOUND("file"));
  assert(file.userId === userId, Errors.ERR_NO_PERMISSION);
  await Post.updateByRId(file.rId, {
    invisibility: false
  });
  await File.show(id);
  Log.create(file.userId, `显示文章 ${file.title} ${file.id}`);
  ctx.body = true;
};

exports.remove = async ctx => {
  const userId = ctx.verification.user.id;
  const id = ~~ctx.params.id;
  const file = await File.get(id);
  assert(file, Errors.ERR_NOT_FOUND("file"));
  assert(file.userId === userId, Errors.ERR_NO_PERMISSION);
  if (file.rId) {
    await Post.updateByRId(file.rId, {
      invisibility: true
    });
  }
  await File.delete(id);
  Log.create(file.userId, `删除文章 ${file.title} ${file.id}`);
  ctx.body = true;
};

exports.update = async ctx => {
  const {
    user
  } = ctx.verification;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED("data"));
  const id = ~~ctx.params.id;
  const file = await File.get(id);
  assert(file.userId === user.id, Errors.ERR_NO_PERMISSION);
  const {
    rId
  } = file;
  const isDraft = !rId;
  if (isDraft) {
    const derivedData = tryAppendFrontMatter(
      user,
      data.title || file.title,
      data
    );
    let updatedFile = await File.update(file.id, derivedData);
    const shouldPushToChain = ctx.query.action === "PUBLISH";
    if (shouldPushToChain) {
      const fileToChain = await File.get(file.id, {
        withRawContent: true
      });
      const block = await Chain.pushFile(fileToChain, {
        origin: ctx.request.body.origin
      });
      const rId = block.id;
      await File.update(updatedFile.id, {
        rId
      });
      updatedFile = await File.get(updatedFile.id);
      Log.create(file.userId, `发布草稿 ${block.id}`);
    }
    ctx.body = {
      updatedFile
    };
  } else {
    const newFile = await createFile(user, data, {
      updatedFile: file
    });
    await File.delete(file.id);
    Log.create(
      file.userId,
      `更新后的文章 ${newFile.title}，id ${newFile.id}`
    );
    Log.create(
      file.userId,
      `被替换的文章 ${file.title}，id ${file.id}`
    );
    ctx.body = {
      newFile,
      updatedFile: file
    };
  }
};

exports.get = async ctx => {
  const {
    user
  } = ctx.verification;
  const id = ~~ctx.params.id;
  const file = await File.get(id);
  assert(file, Errors.ERR_NOT_FOUND("file"));
  assert(file.userId === user.id, Errors.ERR_NO_PERMISSION);
  ctx.body = file;
};