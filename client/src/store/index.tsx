import React from 'react';
import { toJS } from 'mobx';
import { useLocalStore } from 'mobx-react-lite';
import { createPreloadStore } from './preload';
import { createUserStore } from './user';
import { createFeedStore } from './feed';
import { createCacheStore } from './cache';
import { createWalletStore } from './wallet';
import { createReaderWalletStore } from './readerWallet';
import { createSnackbarStore } from './snackbar';
import { createSocketStore } from './socket';
import { createCommentStore } from './comment';
import { createSubscriptionStore } from './subscription';
import { createModalStore } from './modal';
import { createPathStore } from './lastPath';
import { createSettingsStore } from './settings';
import { createAuthorStore } from './author';
import { createNotificationStore } from './notification';
import { createConfirmDialogStore } from './confirmDialog';
import { createFilesStore } from './files';
import { createPublishDialogStore } from './publishDialog';

const storeContext = React.createContext<any>(null);

interface IProps {
  children: React.ReactNode;
}

const useCreateStore = () => ({
  preloadStore: useLocalStore(createPreloadStore),
  userStore: useLocalStore(createUserStore),
  feedStore: useLocalStore(createFeedStore),
  cacheStore: useLocalStore(createCacheStore),
  walletStore: useLocalStore(createWalletStore),
  readerWalletStore: useLocalStore(createReaderWalletStore),
  snackbarStore: useLocalStore(createSnackbarStore),
  socketStore: useLocalStore(createSocketStore),
  commentStore: useLocalStore(createCommentStore),
  subscriptionStore: useLocalStore(createSubscriptionStore),
  modalStore: useLocalStore(createModalStore),
  pathStore: useLocalStore(createPathStore),
  settingsStore: useLocalStore(createSettingsStore),
  authorStore: useLocalStore(createAuthorStore),
  notificationStore: useLocalStore(createNotificationStore),
  confirmDialogStore: useLocalStore(createConfirmDialogStore),
  fileStore: useLocalStore(createFilesStore),
  publishDialogStore: useLocalStore(createPublishDialogStore),
});

export const StoreProvider = ({ children }: IProps) => {
  const store = useCreateStore();
  return <storeContext.Provider value={store}>{children}</storeContext.Provider>;
};

export const useStore = () => {
  const store = React.useContext(storeContext);
  if (!store) {
    throw new Error('You have forgot to use StoreProvider');
  }
  (window as any).toJS = toJS;
  (window as any).store = store;
  return store as ReturnType<typeof useCreateStore>;
};
