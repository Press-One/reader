import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import Loading from 'components/Loading';
import Fade from '@material-ui/core/Fade';
import Info from '@material-ui/icons/Info';
import RechargeModal from './rechargeModal';
import WithdrawModal from './withdrawModal';
import { assets, assetIconMap } from './utils';
import { sleep } from 'utils';
import Api from './api';

const Asset = (props: any) => {
  const { snackbarStore } = useStore();
  const { asset, amount } = props;

  const onWithdraw = (currency: string) => {
    if (Number(amount) === 0) {
      snackbarStore.show({
        message: '没有余额可以提现哦',
      });
      return;
    }
    props.onWithdraw(currency);
  };

  return (
    <div className="flex items-center justify-between py-3 px-2 border-b border-gray-300 leading-none">
      <div className="flex items-center">
        <img src={assetIconMap[asset]} alt={asset} width="40" height="40" />
        <div className="flex items-center ml-4">
          <span className="font-bold mr-1 text-lg">{amount}</span>
          <span className="text-xs font-bold">{asset}</span>
        </div>
      </div>
      <div className="flex items-center">
        <span
          className="text-blue-400 text-sm mr-2 cursor-pointer p-1"
          onClick={() => props.onRecharge(asset)}
        >
          转入
        </span>
        <span
          className="text-blue-400 text-sm cursor-pointer p-1"
          onClick={() => onWithdraw(asset)}
        >
          转出
        </span>
      </div>
    </div>
  );
};

export default observer((props: any) => {
  const { userStore, walletStore, snackbarStore } = useStore();
  const [currency, setCurrency] = React.useState('');
  const [openRechargeModal, setOpenRechargeModal] = React.useState(false);
  const [openWithdrawModal, setOpenWithdrawModal] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const balance = await Api.getBalance();
        walletStore.setBalance(balance);
      } catch (err) {}
      await sleep(800);
      walletStore.setIsFetchedBalance(true);
    })();
  }, [walletStore]);

  const onWithdraw = (currency: string) => {
    setCurrency(currency);
    setOpenWithdrawModal(true);
  };

  const onRecharge = (currency: string) => {
    setCurrency(currency);
    setOpenRechargeModal(true);
  };

  const fetchBalance = async () => {
    try {
      walletStore.setIsFetchedBalance(false);
      const balance = await Api.getBalance();
      walletStore.setBalance(balance);
      walletStore.setIsFetchedBalance(true);
    } catch (err) {}
  };

  const onCloseWithdrawModal = async (isSuccess: boolean, message?: string) => {
    setOpenWithdrawModal(false);
    if (isSuccess) {
      await fetchBalance();
      await sleep(500);
      snackbarStore.show({
        message: message || '转出成功',
        duration: 8000,
      });
    }
  };

  const onCloseRechargeModal = async (isSuccess: boolean, message?: string) => {
    setOpenRechargeModal(false);
    if (isSuccess) {
      await fetchBalance();
      await sleep(500);
      snackbarStore.show({
        message: message || '转入成功',
      });
    }
  };

  if (!walletStore.isFetchedBalance) {
    return (
      <div className="mt-32">
        <Loading />
      </div>
    );
  }

  const { balance, hasBalance, isCustomPinExist } = walletStore;

  return (
    <Fade in={true} timeout={500}>
      <div>
        {hasBalance && !isCustomPinExist && (
          <div className="flex justify-between p-3 border border-blue-400 text-blue-400 bg-blue-100 flex items-center rounded mb-2 text-sm">
            <div className="flex items-center">
              <span className="flex items-center mr-1 text-lg">
                <Info />
              </span>
              再去设置一下支付密码，你就可以使用余额支付和提现啦
            </div>
            <span
              className="text-blue-400 cursor-pointer font-bold pr-2"
              onClick={() => props.setTab('settings')}
            >
              去设置
            </span>
          </div>
        )}
        {assets.map((asset: any) => {
          return (
            <div key={asset}>
              <Asset
                asset={asset}
                amount={balance[asset] || 0}
                onWithdraw={(currency: string) => onWithdraw(currency)}
                onRecharge={(currency: string) => onRecharge(currency)}
              />
            </div>
          );
        })}
        <WithdrawModal
          currency={currency}
          mixinAccount={userStore.user.mixinAccount}
          open={openWithdrawModal}
          onClose={onCloseWithdrawModal}
        />
        <RechargeModal
          currency={currency}
          open={openRechargeModal}
          onClose={onCloseRechargeModal}
        />
      </div>
    </Fade>
  );
});