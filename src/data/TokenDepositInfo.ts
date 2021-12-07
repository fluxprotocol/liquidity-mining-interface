import { Pair } from "@uniswap/sdk";
import { useEffect } from "react";

async function getGraphInfo(pair: Pair) {
  console.log('[] pair -> ', pair);

  try {
    const query = `
        {
            pairs (where: {token0: "${pair.token0.address.toLowerCase()}" token1: "${pair.token1.address.toLowerCase()}"} ){
                id
                reserveUSD
            }
        }
    `

    const result = await fetch(process.env.REACT_APP_UNISWAP_THE_GRAPH ?? '', {
      method: 'POST',
      body: JSON.stringify({query})
    })

    const data = await result.json()

    console.log('[] data -> ', data)
  } catch (error) {
    console.error(error)
    return 
  }
}

export async function getTokenDepositInfo() {
  try {
  } catch (error) {}
}

export function useTokenFarmInfo(pair: Pair | null) {
  useEffect(() => {
    if (!pair) return
    console.log('[] pair -> ', pair);
    getGraphInfo(pair);
  }, [pair]);
}