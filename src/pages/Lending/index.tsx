import { lazy, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useMediaQuery } from 'react-responsive';
import { List, ListItem } from "@material-tailwind/react";
import { toast } from "react-toastify";
import { useAccount, useBalance, useContractRead } from "wagmi";
import Container from "../../components/containers/Container";
import InfoCard from "../../components/cards/InfoCard";
import OutlinedButton from "../../components/buttons/OutlinedButton";
import MainInput from "../../components/form/MainInput";
import CollapsibleBoard from "../../components/boards/CollapsibleBoard";
import PrimaryBoard from "../../components/boards/PrimaryBoard";
import Th from "../../components/tableComponents/Th";
import Td from "../../components/tableComponents/Td";
import Tr from "../../components/tableComponents/Tr";
import ProgressBar from "../../components/ProgressBar";
import Table from "../../components/tableComponents/Table";
import { POOL_CONTRACT_ABI, POOL_CONTRACT_ADDRESS, TEMP_CRYPTO_LOGO_URL, USDC_CONTRACT_ADDRESS, USDC_DECIMAL, WETH_CONTRACT_ADDRESS, WETH_DECIMAL } from "../../utils/constants";
import { TAssetSymbol } from "../../utils/types";
import { IAsset, IReturnValueOfCalcTokenPrice, IReturnValueOfPoolInfo, IReturnValueOfPools } from "../../utils/interfaces";
import DPRow from "./DPRow";
import { formatEther, formatUnits, parseEther, parseUnits } from "viem";
import MBRow from "./MBRow";
import { getVisibleWalletAddress } from "../../utils/functions";

// -----------------------------------------------------------------------------------

const AssetDialog = lazy(() => import('./AssetDialog'))

// -----------------------------------------------------------------------------------

const ASSETS: Array<IAsset> = [
  {
    id: 1,
    name: "Ethereum",
    symbol: "eth",
    imgSrc: "/assets/images/ethereum.png",
    contractAddress: WETH_CONTRACT_ADDRESS,
    decimals: WETH_DECIMAL
  },
  {
    id: 2,
    name: "USD Coin",
    symbol: "usdc",
    imgSrc: "/assets/images/usdc.png",
    contractAddress: USDC_CONTRACT_ADDRESS,
    decimals: USDC_DECIMAL
  }
]

// -----------------------------------------------------------------------------------

export default function Lending() {
  //  Context hooks -----------------------------------------------------
  const isMobile = useMediaQuery({ maxWidth: 1024 });
  const { isConnected, address } = useAccount();

  //  States  -----------------------------------------------------------
  const [dialogVisible, setDialogVisible] = useState<boolean>(false)
  const [assetSymbol, setAssetSymbol] = useState<TAssetSymbol>('eth');
  const [totalMarketSizeInUsd, setTotalMarketSizeInUsd] = useState<number>(0)
  const [totalBorrowedInUsd, setTotalBorrowedInUsd] = useState<number>(0)
  const [lentOut, setLentOut] = useState<number>(0)

  //  Wagmi hooks -------------------------------------------------------

  //  Get the price of ethereum in USD.
  const { data: ethPriceInBigInt }: IReturnValueOfCalcTokenPrice = useContractRead({
    address: POOL_CONTRACT_ADDRESS,
    abi: POOL_CONTRACT_ABI,
    args: [WETH_CONTRACT_ADDRESS, parseEther('1')],
    functionName: 'calcTokenPrice',
  })

  //  Get the price of ethereum in USD.
  const { data: usdcPriceInBigInt }: IReturnValueOfCalcTokenPrice = useContractRead({
    address: POOL_CONTRACT_ADDRESS,
    abi: POOL_CONTRACT_ABI,
    args: [USDC_CONTRACT_ADDRESS, parseUnits('1', USDC_DECIMAL)],
    functionName: 'calcTokenPrice',
  })

  const { data: poolInfos }: IReturnValueOfPools = useContractRead({
    address: POOL_CONTRACT_ADDRESS,
    abi: POOL_CONTRACT_ABI,
    functionName: 'listPools'
  })

  //  Functions ---------------------------------------------------------

  const openDialog = (_assetSymbol: TAssetSymbol) => {
    setAssetSymbol(_assetSymbol);
    if (isConnected) {
      return setDialogVisible(true);
    } else {
      return toast.info('Please connect your wallet.');
    }
  }

  //  useMemo ------------------------------------------------------------

  const ethPriceInUsd = useMemo<number>(() => {
    if (ethPriceInBigInt) {
      return Number(formatUnits(ethPriceInBigInt, USDC_DECIMAL))
    }
    return 0
  }, [ethPriceInBigInt])

  const usdcPriceInUsd = useMemo<number>(() => {
    if (usdcPriceInBigInt) {
      return Number(formatUnits(usdcPriceInBigInt, USDC_DECIMAL))
    }
    return 0
  }, [usdcPriceInBigInt])

  useEffect(() => {
    let _totalMarketSize = 0;
    let _totalBorrowed = 0;

    if (poolInfos) {
      for (let i = 0; i < poolInfos.length; i += 1) {
        if (i === 0) {
          _totalMarketSize += Number(formatEther(poolInfos[i].totalAmount)) * ethPriceInUsd
          _totalBorrowed += Number(formatEther(poolInfos[i].borrowAmount)) * ethPriceInUsd
        } else if (i === 1) {
          _totalMarketSize += Number(formatUnits(poolInfos[i].totalAmount, USDC_DECIMAL)) * usdcPriceInUsd
          _totalBorrowed += Number(formatUnits(poolInfos[i].borrowAmount, USDC_DECIMAL)) * usdcPriceInUsd
        }
      }
      setTotalMarketSizeInUsd(_totalMarketSize);
      setTotalBorrowedInUsd(_totalBorrowed);
      setLentOut(_totalBorrowed / _totalMarketSize * 100)
    }
  }, [poolInfos])

  //  --------------------------------------------------------------------

  return (
    <Container className="my-8">
      <div className="grid grid-cols-5 gap-8">
        <div className="col-span-5 lg:col-span-4">
          <div className="flex flex-col gap-4">
            {/* Infos and Liquidate button */}
            <div className="hidden lg:flex items-center justify-between">
              <div className="flex items-center gap-2">
                <InfoCard
                  label="Current Market Size"
                  value={totalMarketSizeInUsd.toFixed(2)}
                  unit="$"
                />
                <InfoCard
                  label="Total Borrowed"
                  value={totalBorrowedInUsd.toFixed(2)}
                  unit="$"
                />
                <InfoCard
                  label="Lent Out"
                  value={(totalBorrowedInUsd / totalMarketSizeInUsd * 100).toFixed(2) + '%'}
                />
              </div>

              <Link to="/liquidate">
                <OutlinedButton>
                  Liquidate
                </OutlinedButton>
              </Link>
            </div>

            <div className="lg:hidden grid grid-cols-2 gap-2">
              <InfoCard
                label="Current Market Size"
                value="761K"
                unit="$"
              />
              <InfoCard
                label="Total Borrowed"
                value="93K"
                unit="$"
              />
              <InfoCard
                label="Lent Out"
                value="12.2%"
              />
              <Link to="/liquidate">
                <OutlinedButton className="w-full">
                  Liquidate
                </OutlinedButton>
              </Link>
            </div>

            {/* Assets board */}
            <CollapsibleBoard title="Assets" collapsible>
              <div className="flex flex-col gap-4">
                {/* <div className="px-4 pt-4">
                  <div className="w-full lg:w-1/3">
                    <MainInput
                      startAdornment={<Icon icon="material-symbols:search" className="text-gray-700 text-lg" />}
                      className="bg-gray-900"
                      classNameOfInput="bg-gray-900"
                      placeholder="Search token"
                    />
                  </div>
                </div> */}

                {isMobile ? (
                  <List className="block lg:hidden text-sm">
                    {ASSETS.map(asset => (
                      <MBRow
                        key={asset.id}
                        asset={asset}
                        openDialog={openDialog}
                        ethPriceInUsd={ethPriceInUsd}
                        usdcPriceInUsd={usdcPriceInUsd}
                      />
                    ))}
                  </List>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th label="Asset Name" />
                        <Th label="LTV" />
                        <Th label="Deposit APY" />
                        <Th label="Market Size" />
                        <Th label="Borrow APY" />
                        <Th label="Total Borrowed" />
                        <Th label="Wallet" />
                      </tr>
                    </thead>

                    <tbody>
                      {ASSETS.map(asset => (
                        <DPRow
                          key={asset.id}
                          asset={asset}
                          openDialog={openDialog}
                          ethPriceInUsd={ethPriceInUsd}
                          usdcPriceInUsd={usdcPriceInUsd}
                        />
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </CollapsibleBoard>
          </div>
        </div >

        <div className="col-span-5 lg:col-span-1 flex flex-col gap-4">
          {/* Account Board */}
          <PrimaryBoard
            title="Account"
            action={<span className="text-gray-500 text-sm">{getVisibleWalletAddress(address || '', 6, 4)}</span>}
          >
            <div className="p-4 flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border border-gray-800 py-2 px-2 flex flex-col items-center">
                  <span className="text-gray-500 text-sm">APY</span>
                  <span className="text-green-500 font-semibold">0.00%</span>
                </div>
                <div className="rounded-md border border-gray-800 py-2 px-2 flex flex-col items-center">
                  <span className="text-gray-500 text-sm">Borrowed</span>
                  <span className="text-green-500 font-semibold">0.00%</span>
                </div>
                <div className="rounded-md border border-gray-800 py-2 px-2 flex flex-col items-center">
                  <span className="text-gray-500 text-sm">Risk Factor</span>
                  <span className="text-green-500 font-semibold">0.00%</span>
                </div>
              </div>

              <ProgressBar
                label="Borrowing Power"
                value={22.34}
                valueNode={<span className="text-red-500">22.34%</span>}
              />

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Available</span>
                  <span className="text-gray-100">65.45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Risk Factor</span>
                  <span className="text-red-500">45.65%</span>
                </div>
              </div>
            </div>
          </PrimaryBoard>

          {/* Deposits Board */}
          <PrimaryBoard title="Deposits" action={<span className="text-gray-100">$11.22</span>}>
            <div className="p-4 flex items-center justify-between text-gray-100">
              <div className="flex items-center gap-2">
                <img src={TEMP_CRYPTO_LOGO_URL} alt="" className="w-10" />
                <div className="flex flex-col">
                  <span className="font-semibold">USDC</span>
                  <span className="text-sm text-gray-500">$0.999925</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-semibold">11.22 USDC</span>
                <span className="text-sm text-gray-500">$11.22</span>
              </div>
            </div>
          </PrimaryBoard>

          {/* Borrow Board */}
          <PrimaryBoard title="Borrow" action={<span className="text-gray-100">$11.22</span>}>
            <div className="p-4 flex items-center justify-between text-gray-100">
              <div className="flex items-center gap-2">
                <img src={TEMP_CRYPTO_LOGO_URL} alt="" className="w-10" />
                <div className="flex flex-col">
                  <span className="font-semibold">USDC</span>
                  <span className="text-sm text-gray-500">$0.999925</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-semibold">11.22 USDC</span>
                <span className="text-sm text-gray-500">$11.22</span>
              </div>
            </div>
          </PrimaryBoard>
        </div>
      </div >
      <AssetDialog
        visible={dialogVisible}
        setVisible={setDialogVisible}
        assetSymbol={assetSymbol}
        ethPriceInUsd={ethPriceInUsd}
        usdcPriceInUsd={usdcPriceInUsd}
      />
    </Container >
  )
}