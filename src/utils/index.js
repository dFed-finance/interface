import { ethers } from 'ethers'
import UncheckedJsonRpcSigner from './signer'
import TokenAmount from '../hooks/types/tokenAmount'

const ETHERSCAN_PREFIXES = {
  1: '',
  3: 'ropsten.',
  4: 'rinkeby.',
  5: 'goerli.',
  42: 'kovan.'
}

export function getEtherscanLink(networkId, data, type = 'transaction') {
  const prefix = `https://${ETHERSCAN_PREFIXES[networkId] || ETHERSCAN_PREFIXES[1]}etherscan.io`

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`
    }
  }
}

export function etherscanMessage(url,cb){
  const h = this.$createElement;
  this.$msgbox({
    title: '',
    message: h('div', null, [
      h('i', {class: 'el-icon-circle-check f_s80 color-success'}),
      h('p', {class: 'p_t20 m_b10'}, 'Transaction Submitted'),
      h('a',{attrs: {href: url, target:'_blank'},class: 'sk-text'},'View on Etherscan')
    ]),
    showCancelButton: false,
    confirmButtonText: 'Close',
    showClose:true,
    center: true
  }).then(() => {
    cb && cb()
  }).catch(()=>{
    cb && cb()
  })
}

export function waitingMessage(cb){
  const h = this.$createElement;
  return this.$msgbox({
    title: '',
    message: h('div', null, [
      h('i', {class: 'el-icon-loading f_s80 color-999'}),
      h('p', {class: 'p_t20 f_s16 color-333 m_b20'}, 'Waiting For Confirmation')
    ]),
    showCancelButton: false,
    showConfirmButton: false,
    confirmButtonClass:'msgbox-btn',
    confirmButtonText: 'Close',
    showClose:false,
    center: true
  }).then(() => {
    cb && cb()
  }).catch(()=>{
    cb && cb()
  })
}

export function isAddress(value) {
  return ethers.utils.isAddress(value)
}

export function isSameAddress(a, b) {
  return a.toLowerCase() === b.toLowerCase()
}

export function shortenAddress(address, digits = 4) {
  if (!isAddress(address)) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${address.substring(0, digits + 2)}...${address.substring(42 - digits)}`
}

export function calculateGasMargin(value) {
  return value.mul(ethers.BigNumber.from(10000).add(ethers.BigNumber.from(1000))).div(ethers.BigNumber.from(10000))
}

function getDefaultProvider() {
  if (!window.ethereum && !window.ethereum.isMetaMask) {
    throw new Error('No wallet found')
  }
  return new ethers.providers.Web3Provider(window.ethereum)
}

export function getProviderOrSigner(singer = false) {
  const library = getDefaultProvider()
  return singer ? new UncheckedJsonRpcSigner(library.getSigner()) : library
}

export function tryParseAmount(value, token){
  if (!value || !token) {
    return undefined
  }
  try {
    const typedValueParsed = ethers.utils.parseUnits(value, token.decimals)
    return new TokenAmount(token, typedValueParsed)
  } catch (error) {
    console.error(`Failed to parse input amount: "${value}"`, error)
  }
  return undefined
}

export function timeTo(deadline) {
  return Math.ceil(Date.now() / 1000) + deadline
}

export function handleError(error) {
  switch (error.code) {
    case 4001:
      return "The request was rejected by the user"
    case -32602:
      return "The parameters were invalid"
    case -32603:
      return error.data ? error.data.message : error.message
    default:
      console.log(error)
      return "Unknown error"
  }
}
