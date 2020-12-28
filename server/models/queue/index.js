const Cache = require('../cache');
const config = require('../../config');
const {
  createSyncMixinSnapshotsQueue,
  createSyncInitializedQueue,
} = require('./mixin');
const {
  createAtomCacheQueue
} = require('./atom');
const {
  createViewSyncQueue,
  createAddAvgViewQueue,
  createAddHotViewQueue,
  createPublishViewQueue
} = require('./view');
const {
  createNotificationQueue
} = require('./notification');
const {
  createSyncSearchIndexQueue
} = require('./search');
const queues = [];

exports.up = async () => {
  await Cache.pDeleteKeysByPattern(`bull:${config.serviceKey}*`);
  const queueDisabledJobs = config.queueDisabledJobs || [];
  if (!queueDisabledJobs.includes('mixin')) {
    queues.push(createSyncMixinSnapshotsQueue());
    queues.push(createSyncInitializedQueue());
  }
  if (!queueDisabledJobs.includes('notification')) {
    queues.push(createNotificationQueue());
  }
  if (!queueDisabledJobs.includes('atom')) {
    queues.push(createAtomCacheQueue());
  }
  if (config.postView && config.postView.enabled && !queueDisabledJobs.includes('view')) {
    if (!queueDisabledJobs.includes('viewAddAvg')) {
      queues.push(createAddAvgViewQueue());
    }
    if (!queueDisabledJobs.includes('viewAddHot')) {
      queues.push(createAddHotViewQueue());
    }
    queues.push(createPublishViewQueue());
    queues.push(createViewSyncQueue());
  }
  if (config.search && config.search.enabled && !queueDisabledJobs.includes('search')) {
    queues.push(createSyncSearchIndexQueue());
  }
}

exports.down = () => {
  for (const queue of queues) {
    queue.close();
  }
}
