import React from 'react';
import { observer } from 'mobx-react-lite';
import MoreHoriz from '@material-ui/icons/MoreHoriz';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import People from '@material-ui/icons/People';
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet';
import NotificationsOutlined from '@material-ui/icons/NotificationsOutlined';
import NotificationModal from 'components/NotificationModal';
import Button from 'components/Button';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';
import HomeOutlined from '@material-ui/icons/HomeOutlined';
import ExitToApp from '@material-ui/icons/ExitToApp';
import OpenInNew from '@material-ui/icons/OpenInNew';
import { faUser } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Settings } from '@material-ui/icons';
import Fade from '@material-ui/core/Fade';
import Badge from '@material-ui/core/Badge';
import { Link } from 'react-router-dom';
import { useStore } from 'store';
import { getApiEndpoint, isMobile, isPc } from 'utils';
import Img from 'components/Img';
import { SearchInput } from './SearchInput';

export default observer((props: any) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [showBack, setShowBack] = React.useState(false);
  const [hideRightPanel, setHideRightPanel] = React.useState(false);
  const {
    preloadStore,
    userStore,
    modalStore,
    pathStore,
    settingsStore,
    notificationStore,
    walletStore,
  } = useStore();
  const { settings } = settingsStore;
  const { pushPath, prevPath } = pathStore;
  const { user, isLogin } = userStore;
  const { pathname } = props.location;
  const unread = notificationStore.getUnread() || 0;

  const handleClose = () => setAnchorEl(null);

  const handleOpenLogin = () => {
    modalStore.openLogin();
  };

  React.useEffect(() => {
    pushPath(pathname);
    setShowBack(pathname !== '/');
    if (isMobile && pathname.includes('/posts/')) {
      setHideRightPanel(true);
    } else {
      setHideRightPanel(false);
    }
  }, [pathname, pushPath]);

  if (isMobile && (pathname.includes('/authors/') || pathname.includes('/topics/'))) {
    return null;
  }

  if (!preloadStore.ready) {
    return isMobile ? <div className="h-12" /> : <div style={{ height: 53 }} />;
  }

  const logoutUrl = `${getApiEndpoint()}/api/logout?from=${window.location.origin}`;

  const pcMenuView = () => {
    return (
      <Menu
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {userStore.isLogin && (
          <div>
            <Link to={`/authors/${user.address}`}>
              <div
                onClick={() => {
                  handleClose();
                }}
              >
                <MenuItem className="text-gray-700">
                  <div className="py-1 flex items-center">
                    <span className="flex items-center text-xl mr-2">
                      <People />
                    </span>{' '}
                    我的主页
                  </div>
                </MenuItem>
              </div>
            </Link>
            <div
              onClick={() => {
                handleClose();
                walletStore.setFilterType('READER');
                modalStore.openWallet();
              }}
            >
              <MenuItem className="text-gray-700">
                <div className="py-1 flex items-center">
                  <span className="flex items-center text-xl mr-2">
                    <AccountBalanceWallet />
                  </span>{' '}
                  打赏{walletStore.rewardOnly ? '记录' : '钱包'}
                </div>
              </MenuItem>
            </div>
            <div>
              <MenuItem
                className="text-gray-700"
                onClick={() => {
                  handleClose();
                  modalStore.openSettings();
                }}
              >
                <div className="py-1 flex items-center">
                  <span className="flex items-center text-xl mr-2">
                    <Settings />
                  </span>{' '}
                  账号设置
                  <span className="pr-2" />
                </div>
              </MenuItem>
            </div>
            {settings['menu.links'].map((link: any) => {
              return (
                <div
                  key={link.name}
                  onClick={() => {
                    handleClose();
                    window.open(link.url);
                  }}
                >
                  <MenuItem className="text-gray-700">
                    <div className="py-1 flex items-center">
                      <span className="flex items-center text-xl mr-2">
                        <OpenInNew />
                      </span>{' '}
                      {link.name}
                      <span className="pr-2" />
                    </div>
                  </MenuItem>
                </div>
              );
            })}
            <a href={logoutUrl}>
              <MenuItem className="text-gray-700">
                <div className="py-1 flex items-center">
                  <span className="flex items-center text-xl mr-2">
                    <ExitToApp />
                  </span>{' '}
                  退出账号
                  <span className="pr-2" />
                </div>
              </MenuItem>
            </a>
          </div>
        )}
      </Menu>
    );
  };

  return (
    <Fade in={true} timeout={isMobile ? 400 : 1500}>
      <div>
        {isMobile && (
          <div>
            <div className="border-t border-gray-300 border-opacity-50" />
            <div className="flex justify-between items-center py-1 px-3 border-b border-gray-200 h-12">
              {!showBack && (
                <Link to="/">
                  <div className="flex items-center">
                    <img
                      className="rounded-md"
                      src={settings['site.logo']}
                      alt="logo"
                      width="36"
                      height="36"
                    />
                  </div>
                </Link>
              )}
              {showBack && (
                <div className="flex items-center">
                  <div
                    className="flex items-center text-xl text-gray-700 p-2"
                    onClick={() => (prevPath ? props.history.goBack() : props.history.push('/'))}
                  >
                    <ArrowBackIos />
                  </div>
                  {prevPath && prevPath !== '/' && (
                    <Link to="/" className="flex items-center text-28 text-gray-700 p-2 ml-2">
                      <HomeOutlined />
                    </Link>
                  )}
                </div>
              )}
              {!hideRightPanel && (
                <div className="flex items-center">
                  {isMobile && settings['notification.enabled'] && userStore.isLogin && (
                    <Badge
                      badgeContent={unread}
                      className="mr-8 transform scale-90 cursor-pointer"
                      color="error"
                      onClick={() => {
                        modalStore.openNotification();
                      }}
                    >
                      <div className="text-3xl flex items-center text-gray-88">
                        <NotificationsOutlined />
                      </div>
                    </Badge>
                  )}
                  {!userStore.isLogin && (
                    <div
                      className="text-26 text-gray-af flex justify-center items-center leading-none pl-2 pr-1"
                      onClick={() => {
                        handleOpenLogin();
                      }}
                    >
                      <FontAwesomeIcon icon={faUser} />
                    </div>
                  )}
                  {userStore.isLogin && (
                    <div className="pr-1">
                      <Link to={`/authors/${user.address}`}>
                        <Img
                          src={user.avatar}
                          className="w-7 h-7 rounded-full border border-gray-f2"
                          alt="头像"
                        />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {isPc && (
          <div className="py-2 border-b border-gray-300">
            <div className="container mx-auto">
              <div className="w-916 mx-auto flex justify-between items-center">
                <Link to="/">
                  <div className="flex items-center">
                    <img
                      className="rounded-md"
                      src={settings['site.logo']}
                      alt="logo"
                      width="36"
                      height="36"
                    />
                  </div>
                </Link>
                {!userStore.isLogin && (
                  <Button
                    size="small"
                    onClick={() => {
                      handleClose();
                      handleOpenLogin();
                    }}
                  >
                    登录
                  </Button>
                )}
                {userStore.isLogin && (
                  <div className="flex items-center -mr-2">
                    {isPc && settings.extra['search.enabled'] && <SearchInput className="mr-8" />}
                    {isPc && (
                      <Link to="/dashboard">
                        <Button size="small" className="mr-5">
                          写文章
                        </Button>
                      </Link>
                    )}
                    {settings['notification.enabled'] && (
                      <Badge
                        badgeContent={unread}
                        className="mr-4 transform scale-90 cursor-pointer"
                        color="error"
                        onClick={() => {
                          modalStore.openNotification();
                        }}
                      >
                        <div className="text-3xl flex items-center text-gray-88">
                          <NotificationsOutlined />
                        </div>
                      </Badge>
                    )}
                    {isLogin && (
                      <div className="flex items-center pl-1 mr-3">
                        <Link to={`/authors/${user.address}`}>
                          <Img src={user.avatar} className="w-8 h-8 rounded-full" alt="头像" />
                        </Link>
                      </div>
                    )}
                    <IconButton onClick={(event: any) => setAnchorEl(event.currentTarget)}>
                      <MoreHoriz />
                    </IconButton>
                    {pcMenuView()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {settings['notification.enabled'] && (
          <NotificationModal
            open={modalStore.notification.open}
            close={() => {
              modalStore.closeNotification();
              notificationStore.reset();
            }}
          />
        )}
        <style jsx global>{`
          .MuiIconButton-root {
            padding: 6px;
          }
        `}</style>
      </div>
    </Fade>
  );
});
