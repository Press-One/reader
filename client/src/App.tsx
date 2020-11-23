import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Header from './layouts/header';
import Feed from './pages/Feed';
import Post from './pages/Post';
import Author from './pages/Author';
import TryFetch from './pages/TryFetch';
import ManagementLayout from './pages/ManagementLayout';
import Editor from './pages/Editor';
import Topic from './pages/Topic';

import LoginModal from 'components/LoginModal';
import PhoneLoginModal from 'components/PhoneLoginModal';
import WalletModal from 'components/WalletModal';
import ReaderWalletModal from 'components/ReaderWalletModal';
import NotificationSocket from 'components/NotificationSocket';
import SnackBar from 'components/SnackBar';
import SettingsModal from 'components/SettingsModal';
import PageLoading from './components/PageLoading';
import Contact from './components/Contact';
import MixinNotificationModal from 'components/MixinNotificationModal';
import ConfirmDialog from './components/ConfirmDialog';
import UserListModal from './components/UserListModal';
import TopicListModal from './components/TopicListModal';
import GlobalQueryHandler from './components/GlobalQueryHandler';

import { isIPhone, isPc, isFirefox, isProduction } from 'utils';

import { StoreProvider } from './store';

import './styles/tailwind.css';
import './styles/base.scss';
import './styles/mobile-viewer.scss';

const Reader = () => {
  return (
    <div>
      <Route path="/" component={Header} />
      <Route
        path={['/', '/authors/:address', '/topics/:address']}
        exact
        component={() => (
          <div>
            <div className="gray-bg">
              <div className={`container m-auto min-h-screen pt-0 md:pt-2`}>
                <Route path="/" exact component={Feed} />
                <Route path="/authors/:address" exact component={Author} />
                <Route path="/topics/:uuid" exact component={Topic} />
              </div>
            </div>
          </div>
        )}
      />
      <Route
        path={['/posts/:address']}
        exact
        component={() => (
          <div className={`container m-auto pt-4 min-h-screen`}>
            <Route path="/posts/:rId" exact component={Post} />
          </div>
        )}
      />
      <style jsx>{`
        .gray-bg {
          background-color: #eff3f6;
        }
      `}</style>
    </div>
  );
};

const Pub = () => {
  return (
    <div>
      <Route path="/editor" exact component={Editor} />
      <Route
        path={['/dashboard', '/blockTopic', '/postManager', '/sticky']}
        exact
        component={ManagementLayout}
      />
    </div>
  );
};

const AppRouter = () => {
  return (
    <StoreProvider>
      <Router>
        <div>
          <Route path="/" component={TryFetch} />
          <Route
            path={['/', '/posts/:rId', '/authors/:address', '/topics/:address', '/subscriptions']}
            exact
            component={Reader}
          />
          {isPc && (
            <div>
              <Pub />
            </div>
          )}
          <Route path="/readerWallet" exact component={ReaderWalletModal} />

          <LoginModal />
          <PhoneLoginModal />
          <WalletModal />
          <SnackBar />
          {(isFirefox || isProduction) && <NotificationSocket />}
          <PageLoading />
          <SettingsModal />
          <MixinNotificationModal />
          <ConfirmDialog />
          <GlobalQueryHandler />
          <UserListModal />
          <TopicListModal />
          {isPc && <Contact />}
          <style jsx global>{`
            body {
              min-height: ${isIPhone ? '110vh' : '100vh'};
            }
          `}</style>
        </div>
      </Router>
    </StoreProvider>
  );
};

export default AppRouter;
