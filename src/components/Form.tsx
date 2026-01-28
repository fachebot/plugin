import { MouseEvent, useCallback, useMemo } from 'react';
import { NumberFormatValues, NumericFormat } from 'react-number-format';


import CoinBalance from './Coinbalance';
import JupButton from './JupButton';

import TokenIcon from './TokenIcon';

import { useSwapContext } from 'src/contexts/SwapContext';
import { useWalletPassThrough } from 'src/contexts/WalletPassthroughProvider';
import ChevronDownIcon from 'src/icons/ChevronDownIcon';
import WalletIcon from 'src/icons/WalletIcon';
import { detectedSeparator, hasNumericValue } from 'src/misc/utils';
import { MAX_INPUT_LIMIT, MINIMUM_SOL_BALANCE, WRAPPED_SOL_MINT } from '../constants';
import { CoinBalanceUSD } from './CoinBalanceUSD';
import PriceInfo from './PriceInfo/index';
import SwitchPairButton from './SwitchPairButton';
import Decimal from 'decimal.js';
import { cn } from 'src/misc/cn';
import { SwapMode } from 'src/types/constants';
import JupShield from './JupShield';
import { useScreenState } from 'src/contexts/ScreenProvider';
import { useBalances } from 'src/hooks/useBalances';
import { Asset } from 'src/entity/SearchResponse';
import { useUltraSwapMutation } from 'src/queries/useUltraSwapMutation';
import { SubmitButton } from './SubmitButton';

const FormInputContainer: React.FC<{
  tokenInfo?: Asset;
  onBalanceClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onClickHalf?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onClickMax?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title: string;
  pairSelectDisabled: boolean;
  onClickSelectPair: () => void;
  value: string;
  children: React.ReactNode;
  isWalletConnected?: boolean;
}> = ({ tokenInfo, onBalanceClick, onClickHalf, onClickMax, title, pairSelectDisabled, onClickSelectPair, children, value, isWalletConnected }) => {
  return (
    <div
      className={cn(
        'border border-transparent bg-module rounded-xl transition-all',
        'py-3 px-4 flex flex-col dark:text-primary-text  gap-y-2',
        'group focus-within:border-primary/50 focus-within:shadow-swap-input-dark rounded-xl',
      )}
    >
      <div className="flex justify-between items-center text-xs text-primary-text">
        <div>{title}</div>
        {tokenInfo && (
          <div className="flex items-center space-x-2">
            <div
              className={cn('flex  space-x-1 text-xs items-center text-primary-text/50 fill-current ', {
                'cursor-pointer': onBalanceClick,
              })}
              onClick={(e) => {
                onBalanceClick?.(e);
              }}
            >
              <WalletIcon width={10} height={10} />
              <CoinBalance mintAddress={tokenInfo.id} hideZeroBalance={false} />
              <span>{tokenInfo.symbol}</span>
            </div>
            {onClickHalf && onClickMax && isWalletConnected && (
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  ref={(el) => {
                    if (el) {
                      el.style.border = '2px solid transparent';
                      el.style.transition = 'border-color 0.15s ease-in-out, background-color 0.15s ease-in-out';
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClickHalf(e);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(199, 242, 132, 1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  className="percentage-button px-2 py-0.5 text-[10px] font-normal rounded bg-interactive text-primary-text/50 hover:bg-interactive/80 focus:outline-none"
                >
                  HALF
                </button>
                <button
                  type="button"
                  ref={(el) => {
                    if (el) {
                      el.style.border = '2px solid transparent';
                      el.style.transition = 'border-color 0.15s ease-in-out, background-color 0.15s ease-in-out';
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClickMax(e);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(199, 242, 132, 1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  className="percentage-button px-2 py-0.5 text-[10px] font-normal rounded bg-interactive text-primary-text/50 hover:bg-interactive/80 focus:outline-none"
                >
                  MAX
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex">
        <div>
          <button
            type="button"
            className={cn('py-2 px-3 rounded-lg flex items-center bg-interactive text-primary-text', {
              'hover:bg-interactive/80': !pairSelectDisabled,
            })}
            disabled={pairSelectDisabled}
            onClick={onClickSelectPair}
          >
            <div className="h-5 w-5">
              <TokenIcon info={tokenInfo} width={20} height={20} />
            </div>
            <div className="ml-4 mr-2 font-semibold" translate="no">
              <div className="truncate">{tokenInfo?.symbol}</div>
            </div>
            {pairSelectDisabled ? null : (
              <span className="text-primary-text/25 fill-current">
                <ChevronDownIcon />
              </span>
            )}
          </button>

          <div className="flex justify-between items-center h-[20px]">
            {tokenInfo?.id && <JupShield tokenAddress={tokenInfo.id} />}
          </div>
        </div>
        <div className="flex flex-col items-end justify-between w-full">
          {children}
          <span className="text-xs text-primary-text/50">

            {tokenInfo && <CoinBalanceUSD tokenInfo={tokenInfo} amount={value} />}
          </span>
        </div>
      </div>
    </div>
  );
};

const Form: React.FC<{
  isDisabled: boolean;
  setSelectPairSelector: React.Dispatch<React.SetStateAction<'fromMint' | 'toMint' | null>>;
}> = ({ setSelectPairSelector }) => {
  const { publicKey, wallet, connected } = useWalletPassThrough();

  const { data: balances } = useBalances();
  const {
    form,
    setForm,
    fromTokenInfo,
    toTokenInfo,
    quoteResponseMeta,
    formProps: { fixedAmount, fixedMint },
    currentSwapMode,
    loading,
    isToPairFocused,
    setIsToPairFocused,
    setTxStatus,
    setLastSwapResult,
  } = useSwapContext();
  const { setScreen } = useScreenState();
  const { mutateAsync: ultraSwapMutation } = useUltraSwapMutation();

  const onSubmit = useCallback(async () => {
    if (!wallet || !wallet.adapter.publicKey || !quoteResponseMeta) {
      return null;
    }

    try {
      if (!fromTokenInfo) throw new Error('Missing fromTokenInfo');
      if (!toTokenInfo) throw new Error('Missing toTokenInfo');
      await ultraSwapMutation({
        quoteResponseMeta,
        fromTokenInfo,
        toTokenInfo,
        setTxStatus,
        setLastSwapResult,
      });
    } catch (error) {
      console.log('Swap error', error);
    } finally {
      setScreen('Swapping');
    }
  }, [wallet, quoteResponseMeta, ultraSwapMutation, fromTokenInfo, toTokenInfo, setTxStatus, setLastSwapResult, setScreen]);


  const shouldDisabledFromSelector = useMemo(() => {
    if (fromTokenInfo?.id === fixedMint) {
      return true;
    }
    return false;
  }, [fixedMint, fromTokenInfo?.id]);

  const shouldDisabledToSelector = useMemo(() => {
    if (toTokenInfo?.id === fixedMint) {
      return true;
    }
    return false;
  }, [fixedMint, toTokenInfo?.id]);

  const walletPublicKey = useMemo(() => publicKey?.toString(), [publicKey]);

  const onChangeFromValue = ({ value }: NumberFormatValues) => {
    if (value === '') {
      setForm((form) => ({ ...form, fromValue: '', toValue: '' }));
      return;
    }
    if (value === '.') {
      setForm((form) => ({ ...form, fromValue: '0.' }));
      return;
    }
    const isInvalid = Number.isNaN(value);
    if (isInvalid) return;

    setForm((form) => ({ ...form, fromValue: value }));
  };

  const onChangeToValue = ({ value }: NumberFormatValues) => {
    if (value === '') {
      setForm((form) => ({ ...form, fromValue: '', toValue: '' }));
      return;
    }
    if (value === '.') {
      setForm((form) => ({ ...form, toValue: '0.' }));
      return;
    }

    const isInvalid = Number.isNaN(value);
    if (isInvalid) return;

    setForm((form) => ({ ...form, toValue: value }));
  };

  const balance: string | null = useMemo(() => {
    if (!fromTokenInfo?.id) return null;

    if (!balances) return null;
    const accBalanceObj = balances[fromTokenInfo.id];
    if (!accBalanceObj) return null;

    return accBalanceObj.uiAmount.toString();
  }, [balances, fromTokenInfo?.id]);

  const toBalance: string | null = useMemo(() => {
    if (!toTokenInfo?.id) return null;

    if (!balances) return null;
    const accBalanceObj = balances[toTokenInfo.id];
    if (!accBalanceObj) return null;

    return accBalanceObj.uiAmount.toString();
  }, [balances, toTokenInfo?.id]);

  const onClickMax = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();

      if (!balance) return;
      if (fromTokenInfo?.id === WRAPPED_SOL_MINT.toBase58()) {
        setForm((prev) => ({
          ...prev,
          fromValue: new Decimal(balance).gt(MINIMUM_SOL_BALANCE)
            ? new Decimal(balance).minus(MINIMUM_SOL_BALANCE).toFixed(9)
            : '0',
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          fromValue: balance,
        }));
      }
    },
    [balance, fromTokenInfo?.id, setForm],
  );

  const onClickHalf = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      if (!balance) return;
      if (fromTokenInfo?.id === WRAPPED_SOL_MINT.toBase58()) {
        const balanceDecimal = new Decimal(balance);
        if (balanceDecimal.gt(MINIMUM_SOL_BALANCE)) {
          const availableBalance = balanceDecimal.minus(MINIMUM_SOL_BALANCE);
          const halfAmount = availableBalance.div(2);
          setForm((prev) => ({
            ...prev,
            fromValue: halfAmount.gt(0) ? halfAmount.toFixed(9) : '0',
          }));
        } else {
          setForm((prev) => ({
            ...prev,
            fromValue: '0',
          }));
        }
      } else {
        const halfAmount = new Decimal(balance).div(2);
        setForm((prev) => ({
          ...prev,
          fromValue: halfAmount.toFixed(fromTokenInfo?.decimals || 9),
        }));
      }
    },
    [balance, fromTokenInfo?.id, fromTokenInfo?.decimals, setForm],
  );

  const onClickToMax = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();

      if (!toBalance) return;
      if (toTokenInfo?.id === WRAPPED_SOL_MINT.toBase58()) {
        setForm((prev) => ({
          ...prev,
          toValue: new Decimal(toBalance).gt(MINIMUM_SOL_BALANCE)
            ? new Decimal(toBalance).minus(MINIMUM_SOL_BALANCE).toFixed(9)
            : '0',
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          toValue: toBalance,
        }));
      }
    },
    [toBalance, toTokenInfo?.id, setForm],
  );

  const onClickToHalf = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      if (!toBalance) return;
      if (toTokenInfo?.id === WRAPPED_SOL_MINT.toBase58()) {
        const balanceDecimal = new Decimal(toBalance);
        if (balanceDecimal.gt(MINIMUM_SOL_BALANCE)) {
          const availableBalance = balanceDecimal.minus(MINIMUM_SOL_BALANCE);
          const halfAmount = availableBalance.div(2);
          setForm((prev) => ({
            ...prev,
            toValue: halfAmount.gt(0) ? halfAmount.toFixed(9) : '0',
          }));
        } else {
          setForm((prev) => ({
            ...prev,
            toValue: '0',
          }));
        }
      } else {
        const halfAmount = new Decimal(toBalance).div(2);
        setForm((prev) => ({
          ...prev,
          toValue: halfAmount.toFixed(toTokenInfo?.decimals || 9),
        }));
      }
    },
    [toBalance, toTokenInfo?.id, toTokenInfo?.decimals, setForm],
  );

  const onClickSwitchPair = () => {
    isToPairFocused.current = false;
    setIsToPairFocused(false);
    setForm((prev) => ({
      ...prev,
      fromValue: '',
      toValue: '',
      fromMint: prev.toMint,
      toMint: prev.fromMint,
    }));
  };

  const { inputAmountDisabled, outputAmountDisabled } = useMemo(() => {
    const result = { inputAmountDisabled: true, outputAmountDisabled: true };
    if (!fixedAmount) {
      const hasFromValue = !!(form.fromValue && hasNumericValue(form.fromValue));
      const hasToValue = !!(form.toValue && hasNumericValue(form.toValue));

      if (currentSwapMode === 'ExactIn') {
        // ExactIn mode: user is typing in Selling input
        result.inputAmountDisabled = false;
        // Disable Buying input only if Selling input has a value
        result.outputAmountDisabled = hasFromValue;
      } else if (currentSwapMode === 'ExactOut') {
        // ExactOut mode: user is typing in Buying input
        result.outputAmountDisabled = false;
        // Disable Selling input only if Buying input has a value
        result.inputAmountDisabled = hasToValue;
      } else {
        // ExactInOrOut mode: both inputs can be edited
        result.inputAmountDisabled = false;
        result.outputAmountDisabled = false;
      }
    }
    return result;
  }, [fixedAmount, currentSwapMode, form.fromValue, form.toValue]);

  const onClickSelectFromMint = useCallback(() => {
    if (shouldDisabledFromSelector) return;
    setSelectPairSelector('fromMint');
  }, [shouldDisabledFromSelector, setSelectPairSelector]);

  const onClickSelectToMint = useCallback(() => {
    if (shouldDisabledToSelector) return;
    setSelectPairSelector('toMint');
  }, [shouldDisabledToSelector, setSelectPairSelector]);

  const thousandSeparator = useMemo(() => (detectedSeparator === ',' ? '.' : ','), []);
  // Allow empty input, and input lower than max limit
  const withValueLimit = useCallback(
    ({ floatValue }: NumberFormatValues) => !floatValue || floatValue <= MAX_INPUT_LIMIT,
    [],
  );

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (window.Jupiter.enableWalletPassthrough && window.Jupiter.onRequestConnectWallet) {
        window.Jupiter.onRequestConnectWallet();
      } else {
        setScreen('Wallet');
      }
    },
    [setScreen],
  );

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="w-full mt-2 rounded-xl flex flex-col px-2">
        <div className="flex-col">
          <FormInputContainer
            tokenInfo={fromTokenInfo!}
            onBalanceClick={(e) => {
              isToPairFocused.current = false;
              setIsToPairFocused(false);
              onClickMax(e);
            }}
            onClickHalf={(e) => {
              isToPairFocused.current = false;
              setIsToPairFocused(false);
              onClickHalf(e);
            }}
            onClickMax={(e) => {
              isToPairFocused.current = false;
              setIsToPairFocused(false);
              onClickMax(e);
            }}
            title="Selling"
            pairSelectDisabled={shouldDisabledFromSelector}
            onClickSelectPair={onClickSelectFromMint}
            value={form.fromValue}
            isWalletConnected={connected}
          >
            {fromTokenInfo?.decimals && (
              <NumericFormat
                disabled={inputAmountDisabled}
                value={typeof form.fromValue === 'undefined' ? '' : form.fromValue}
                decimalScale={fromTokenInfo.decimals}
                thousandSeparator={thousandSeparator}
                allowNegative={false}
                valueIsNumericString
                inputMode="decimal"
                onValueChange={onChangeFromValue}
                placeholder={'0.00'}
                className={cn(
                  'w-full h-[40px] bg-transparent text-primary-text text-right font-semibold text-xl placeholder:text-primary-text/50',
                  {
                    'cursor-not-allowed': inputAmountDisabled,
                  },
                )}
                onFocus={() => {
                  isToPairFocused.current = false;
                  setIsToPairFocused(false);
                }}
                onKeyDown={() => {
                  isToPairFocused.current = false;
                  setIsToPairFocused(false);
                }}
                decimalSeparator={detectedSeparator}
                isAllowed={withValueLimit}
              />
            )}
          </FormInputContainer>
          <div className="relative z-10 -my-3 flex justify-center">
            <SwitchPairButton onClick={onClickSwitchPair} className={cn('transition-all')} />
          </div>
          <FormInputContainer
            tokenInfo={toTokenInfo!}
            onBalanceClick={(e) => {
              isToPairFocused.current = true;
              setIsToPairFocused(true);
              onClickToMax(e);
            }}
            onClickHalf={(e) => {
              isToPairFocused.current = true;
              setIsToPairFocused(true);
              onClickToHalf(e);
            }}
            onClickMax={(e) => {
              isToPairFocused.current = true;
              setIsToPairFocused(true);
              onClickToMax(e);
            }}
            title="Buying"
            pairSelectDisabled={shouldDisabledToSelector}
            onClickSelectPair={onClickSelectToMint}
            value={form.toValue}
            isWalletConnected={connected}
          >
            {toTokenInfo?.decimals && (
              <NumericFormat
                inputMode="decimal"
                disabled={outputAmountDisabled}
                value={typeof form.toValue === 'undefined' ? '' : form.toValue}
                decimalScale={toTokenInfo.decimals}
                thousandSeparator={thousandSeparator}
                allowNegative={false}
                valueIsNumericString
                onValueChange={onChangeToValue}
                className={cn(
                  'h-[40px] w-full bg-transparent text-primary-text text-right font-semibold text-lg placeholder:text-primary-text/50',
                  {
                    'cursor-not-allowed': outputAmountDisabled,
                  },
                )}
                placeholder='0.00'
                decimalSeparator={detectedSeparator}
                isAllowed={withValueLimit}
                onFocus={() => {
                  isToPairFocused.current = true;
                  setIsToPairFocused(true);
                }}
                onKeyDown={(e) => {
                  if (
                    e.metaKey ||
                    e.ctrlKey ||
                    e.key === 'Meta' ||
                    e.key === 'Control' ||
                    e.key === 'Alt' ||
                    e.key === 'Shift'
                  ) {
                    return;
                  }
                  isToPairFocused.current = true;
                  setIsToPairFocused(true);
                }}
              />
            )}
          </FormInputContainer>
        </div>
      </div>

      <div className="w-full px-2">
        {!walletPublicKey ? (
          <JupButton size="lg" className="w-full mt-4 bg-primary !text-uiv2-text/75" onClick={handleClick}>
            Connect Wallet
          </JupButton>
        ) : (
          <SubmitButton onSubmit={onSubmit} />
        )}

        {quoteResponseMeta && fromTokenInfo && toTokenInfo ? (
          <PriceInfo
            quoteResponse={quoteResponseMeta}
            fromTokenInfo={fromTokenInfo}
            toTokenInfo={toTokenInfo}
            loading={loading}
          />
        ) : null}
      </div>
    </div>
  );
};

export default Form;
