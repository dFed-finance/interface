
import { calculateGasMargin } from '../utils/index'
import { getIndexContract } from './contract'
import { Percent } from '@uniswap/sdk'
import TokenAmount from '../hooks/types/tokenAmount'
import { FEE, FEE_BASE } from "../constants/index"

export function removeFee(usddAmount) {
  const feePercent = new Percent(FEE_BASE - FEE, FEE_BASE);
  const fee = feePercent.multiply(usddAmount.raw).quotient;
  const usddWithoutFee = new TokenAmount(usddAmount.token, fee);
  return usddWithoutFee
}

export async function sellToken(networkId, tokenAddress, amountIn, amountOutMin, to, deadline) {
  const contract = getIndexContract(networkId, true)
  const gas = await contract.estimateGas.sellToken(tokenAddress, amountIn, amountOutMin, to, deadline)
  const gasLimits = calculateGasMargin(gas)
  return contract.sellToken(tokenAddress, amountIn, amountOutMin, to, deadline, {
    gasLimit: gasLimits
  })
}

export async function buyToken(networkId, tokenAddress, amountIn, amountOutMin, to, deadline) {
  const contract = getIndexContract(networkId, true)
  const gas = await contract.estimateGas.buyToken(tokenAddress, amountIn, amountOutMin, to, deadline)
  const gasLimits = calculateGasMargin(gas)
  return contract.buyToken(tokenAddress, amountIn, amountOutMin, to, deadline, {
    gasLimit: gasLimits
  })
}

export async function buyTokenWithPermit(networkId, tokenAddress, amountIn, amountOutMin, to, deadline, approveMax, v, r, s) {
  const contract = getIndexContract(networkId, true)
  const gas = await contract.estimateGas.buyTokenWithPermit(tokenAddress, amountIn, amountOutMin, to, deadline, approveMax, v, r, s)
  const gasLimits = calculateGasMargin(gas)
  return contract.buyTokenWithPermit(tokenAddress, amountIn, amountOutMin, to, deadline, approveMax, v, r, s, {
    gasLimit: gasLimits
  })
}

