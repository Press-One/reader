const Post = require('../models/post');
const Author = require('../models/author');
const Topic = require('../models/topic');
const sequelize = require('../models/sequelize/database');
const Settings = require('../models/settings');
const View = require('../models/view');
const config = require('../config');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const {
  assert,
  Errors,
  throws
} = require('../utils/validator');
const Log = require("../models/log");

exports.get = async ctx => {
  const userId = ctx.verification && ctx.verification.user.id;
  const rId = ctx.params.id;
  const includeDeleted = ctx.query.includeDeleted;
  const dropContent = ctx.query.dropContent || false;
  const withPendingTopicUuids = ctx.query.withPendingTopicUuids;

  const post = await Post.getByRId(rId, {
    userId,
    withVoted: true,
    withFavorite: true,
    withContent: !dropContent,
    withPaymentUrl: true,
    ignoreDeleted: true,
    withPendingTopicUuids
  });
  assert(post, Errors.ERR_NOT_FOUND('post'))
  if (post.latestRId) {
    ctx.body = {
      latestRId: post.latestRId
    }
    return;
  }
  if (!includeDeleted && post.deleted && !post.latestRId) {
    throws(Errors.ERR_POST_HAS_BEEN_DELETED, 404);
  }
  if (post.author && post.author.address) {
    const { author, sequelizeAuthor } = await Author.getByAddress(post.author.address, {
      returnRaw: true,
      withUserId: true
    });
    const [
      followerCount,
      postCount
    ] = await Promise.all([
      sequelizeAuthor.countFollowers({
        where: {
          id: {
            [Op.not]: author.userId
          }
        }
      }),
      sequelizeAuthor.countPosts({
        where: {
          deleted: false,
          invisibility: false
        }
      })
    ]);    
    post.author.summary = {
      post: {
        count: postCount
      },
      follower: {
        count: followerCount
      }
    }
    if (!!userId) {
      const user = ctx.verification && ctx.verification.sequelizeUser;
      const count = await user.countFollowingAuthors({
        where: {
          address: post.author.address
        }
      });
      if (count > 0) {
        post.author.following = count > 0;
      }
    }
  }

  try {
    const cachedCount = await View.trySave(ctx.ip, rId, post.viewCount);
    post.viewCount = cachedCount || 0;
  } catch (err) {
    console.log(err);
  }

  ctx.body = post;
}

exports.listBySubscription = async ctx => {
  const type = ctx.query.type || 'author';
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const user = ctx.verification.sequelizeUser;
  const query = {
    offset,
    limit
  };
  assert(type, Errors.ERR_IS_REQUIRED("type"));
  let total = 0;
  let posts = [];

  if (type === 'author') {
    const followingAuthors = await user.getFollowingAuthors({
      attributes: ['address'],
      joinTableAttributes: []
    });
    const followingAuthorAddresses = followingAuthors.map(author => author.address);
    if (followingAuthorAddresses.length > 0) {
      query.addresses = followingAuthorAddresses;
      const result = await Post.list(query);
      total = result.total;
      posts = result.posts;
    }
  } else if (type === 'topic') {
    const followingTopics = await user.getFollowingTopics({
      where: {
        deleted: false
      },
      attributes: ['uuid'],
      joinTableAttributes: []
    });
    const followingTopicUuids = followingTopics.map(topics => topics.uuid);
    if (followingTopicUuids.length > 0) {

      const countSql = `
      SELECT count(DISTINCT p."rId") FROM posts_topics AS p_t 
        LEFT JOIN (
          SELECT * FROM posts AS all_p LEFT JOIN authors as a ON a.address = all_p."userAddress" WHERE a.status = 'allow' AND all_p."deleted" = false and all_p."invisibility" = false 
        ) p
        ON p."rId" = p_t."postRId"
        LEFT JOIN topics ON topics."uuid" = p_t."topicUuid" AND topics."deleted" = false 
      WHERE "topicUuid" IN (${followingTopicUuids.map(uuid => `'${uuid}'`).join(',')})`;

      const findSql = `
      SELECT DISTINCT ON ("postRId") * FROM posts_topics AS p_t 
        LEFT JOIN (
          SELECT * FROM posts AS all_p LEFT JOIN authors as a ON a.address = all_p."userAddress" WHERE a.status = 'allow' AND all_p."deleted" = false and all_p."invisibility" = false 
        ) p
        ON p."rId" = p_t."postRId" 
        LEFT JOIN topics ON topics."uuid" = p_t."topicUuid" AND topics."deleted" = false 
      WHERE "topicUuid" IN (${followingTopicUuids.map(uuid => `'${uuid}'`).join(',')}) 
      OFFSET ${offset} 
      LIMIT ${limit};`;

      const [countResult, rawPostTopics] = await Promise.all([sequelize.query(countSql), sequelize.query(findSql)])
      total = ~~countResult[0][0].count;
      const postRIds = rawPostTopics[0].map(postTopic => postTopic.postRId);
      if (postRIds.length > 0) {
        posts = await Post.listByRIds(postRIds);
      } 
    }
  }
  ctx.body = {
    total,
    posts,
  };
}

exports.listByPopularity = async ctx => {
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const address = ctx.query.address;
  let dayRange = ~~ctx.query.dayRange;
  const dayRangeOptions = config.settings['filter.dayRangeOptions'] || [];
  if (dayRange && !dayRangeOptions.includes(dayRange)) {
    dayRange = dayRangeOptions[0];
  }
  const query = {
    order: 'POPULARITY',
    dayRange,
    offset,
    limit
  };
  if (address) {
    query.addresses = [address];
    query.dropAuthor = true;
  }
  ctx.body = await Post.list(query);
}

exports.listByPubDate = async ctx => {
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const address = ctx.query.address;
  const filterBan = ctx.query.filterBan;
  const filterSticky = ctx.query.filterSticky;
  const withPendingTopicUuids = ctx.query.withPendingTopicUuids;
  const query = {
    order: 'PUB_DATE',
    filterBan,
    filterSticky,
    withPendingTopicUuids,
    offset,
    limit,
  };
  if (address) {
    query.addresses = [address];
    query.dropAuthor = true;
  }
  ctx.body = await Post.list(query);
}

exports.listByLatestComment = async ctx => {
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const findSql = `
    SELECT p."rId" FROM posts p LEFT JOIN comments c on c."objectId" = p."rId" WHERE c."deleted" = false AND p.deleted = false AND p.invisibility = false AND p."latestRId" is null GROUP BY p."rId", p."createdAt" ORDER BY COALESCE(MAX(c."createdAt"), p."createdAt") DESC 
    OFFSET ${offset} 
    LIMIT ${limit};`;
  const [count, rawPost] = await Promise.all([Post.SequelizePost.count({
    where: {
      commentsCount: {
        [Op.gt]: 0
      },
      latestRId: null,
      deleted: false,
      invisibility: false
    }
  }), sequelize.query(findSql)])
  const total = count;
  const postRIds = rawPost[0].map(rawPost => rawPost.rId);
  let posts = [];
  if (postRIds.length > 0) {
    posts = await Promise.all(postRIds.map(async rId => {
      return await Post.getByRId(rId)
    }))
  }
  ctx.body = {
    total,
    posts
  };
}

exports.update = async ctx => {
  const rId = ctx.params.id;
  const data = ctx.request.body.payload;
  assert(data, Errors.ERR_IS_REQUIRED('payload'));
  await Post.updateByRId(rId, data);
  ctx.body = true;
}

exports.listTopics = async ctx => {
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const currentUser = ctx.verification && ctx.verification.sequelizeUser;
  const rId = ctx.params.id;
  const post = await Post.getByRId(rId, {
    raw: true
  });
  assert(post, Errors.ERR_NOT_FOUND('post'));
  const topics = await post.getTopics({
    where: {
      deleted: false,
    },
    offset,
    limit,
    ...Topic.getTopicOrderQuery(),
    joinTableAttributes: []
  });
  const count = await post.countTopics({
    where: {
      deleted: false,
    },
  });
  const derivedTopics = await Promise.all(topics.map(async topic => {
    return await Topic.pickTopic(topic, {
      currentUser
    });
  }));
  ctx.body = {
    total: count,
    topics: derivedTopics
  }
}

exports.favorite = async ctx => {
  const { sequelizeUser } = ctx.verification;
  const rId = ctx.params.id;
  const post = await Post.getByRId(rId, {
    raw: true
  });
  assert(post, Errors.ERR_NOT_FOUND("post"));
  await post.addFavoriteUsers(sequelizeUser);
  const postUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${rId}`;
  Log.create(sequelizeUser.id, `收藏文章 ${postUrl}`);
  ctx.body = true;
}

exports.unfavorite = async ctx => {
  const { sequelizeUser } = ctx.verification;
  const rId = ctx.params.id;
  const post = await Post.getByRId(rId, {
    raw: true
  });
  assert(post, Errors.ERR_NOT_FOUND("post"));
  await post.removeFavoriteUsers(sequelizeUser);
  const postUrl = `${config.settings['site.url'] || config.serviceRoot}/posts/${rId}`;
  Log.create(sequelizeUser.id, `取消收藏文章 ${postUrl}`);
  ctx.body = true;
}

exports.listFavorites = async ctx => {
  const { sequelizeUser } = ctx.verification;
  const offset = ~~ctx.query.offset || 0;
  const limit = Math.min(~~ctx.query.limit || 10, 50);
  const where = {
    deleted: false,
    invisibility: false
  };
  const total = await sequelizeUser.countFavoritePosts({
    where
  });
  const posts = await sequelizeUser.getFavoritePosts({
    attributes: {
      exclude: ['content'],
    },
    where,
    joinTableAttributes: [],
    offset,
    limit,
    include: [{
      model: Author.SequelizeAuthor,
      where: {
        status: 'allow'
      }
    }],
    order: [[Sequelize.literal('posts_users_favorites."createdAt"'), 'DESC']]
  });
  const derivedPosts = await Promise.all(posts.map(async post => {
    return await Post.packPost(post, {
      withTopic:false
    });
  }));
  ctx.body = {
    total,
    posts: derivedPosts
  }
}