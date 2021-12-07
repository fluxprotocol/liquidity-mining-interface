import { Contract } from '@ethersproject/contracts'
import { Pair } from "@uniswap/sdk";
import { useEffect, useState } from "react";
import { useStakingContract, useTokenContract } from '../hooks/useContract';
import Big from 'big.js';

async function getStakingRewardsInfo(tokenContract: Contract, rewardsAddress: string, ) {
  try {
    const amountDeposited = await tokenContract.balanceOf(rewardsAddress)
    
    return new Big(amountDeposited.toString())
  } catch (error) {
    console.error(error)
    return new Big(0)
  }
}

async function getGraphInfo(pair: Pair) {
  const token0Address = '0x3Ea8ea4237344C9931214796d9417Af1A1180770'//pair.token0.address.toLowerCase();
  const token1Address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'//pair.token1.address.toLowerCase();

  try {
    const query = `
        {
            pairs (where: {token0: "${token0Address.toLowerCase()}" token1: "${token1Address.toLowerCase()}"} ){
                id
                token0 {
                  id
                  symbol
                }
                token1 {
                  id
                  symbol
                }
                reserveUSD
                token0Price
                token1Price
                totalSupply
            }
        }
    `

    const result = await fetch(process.env.REACT_APP_UNISWAP_THE_GRAPH ?? '', {
      method: 'POST',
      body: JSON.stringify({ query })
    })

    const data = await result.json()
    const pairData = data.data.pairs[0];

    const liquidityTokenValue = new Big(pairData.reserveUSD).div(pairData.totalSupply);

    return {
      liquidityTokenAddress: pairData.id,
      liquidityTokenValue,
      mainTokenPrice: new Big(pairData.token1Price),
    }
  } catch (error) {
    console.error(error)
    return null
  }
}

export interface TokenFarmInfo {
  tvl: Big
  apr: Big
}

export function useTokenFarmInfo(pair: Pair | null, rewardsAddress?: string) {
  const liquidityTokenContract = useTokenContract(pair?.liquidityToken.address)
  const [fullInfo, setFullInfo] = useState<TokenFarmInfo>({
    apr: new Big(0),
    tvl: new Big(0)
  })

  useEffect(() => {
    async function run() {
      if (!pair || !liquidityTokenContract || !rewardsAddress) return

      const info = await getGraphInfo(pair)

      if (!info) {
        console.error('No Info for tokenfarm')
        return
      }

      const lpAmountDeposited = (await getStakingRewardsInfo(liquidityTokenContract, rewardsAddress)).div(1e18)
      const tvlOfFarm = lpAmountDeposited.mul(info.liquidityTokenValue)
      const valueOfRewards = new Big(process.env.REACT_APP_REWARDS_PER_YEAR ?? '1').mul(info.mainTokenPrice)
      const apr = valueOfRewards.div(tvlOfFarm).mul(100)

      setFullInfo({
        apr,
        tvl: tvlOfFarm
      })
    }

    run()
  }, [pair, liquidityTokenContract, rewardsAddress])

  return fullInfo
}
