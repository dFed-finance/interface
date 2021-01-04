// Name of Fed token
export const FEDNAME = "aFED"
export const FED_DECIMALS = 18
export const USDX_DECIMALS = 6
export const POOLTOKEN_DECIMALS = 18
export const MINT_USDD_OFFSET = 0.01
export const DEFAULT_TOLERANCE = 0.5 // 0.5%
export const DEFAULT_DEADLINE = 20 // minutes

export const START_REWARD_BLOCK = 11450000

export const APPROVE_MAX = true

// Fee
export const FEE = 0
export const FEE_BASE = 10000

// Supported networkid
// MainNet: 1
// Ropsten: 3
export const SUPPORT_CHAIN = 1

// MainNet: 1
// Ropsten: 3
export const INIT_DATA = {
  3: []
}

// Infura ID
// this is only for testing, change it in product env.
export const INFURA_ID = "db4133a2e4e04c01919c275eb1a5ce24"

// Corresponding to contract
export const INIT_CODE_HASH = '0x1e13bfabd55c4a55728b1a04dd97db523e33af14aecddc9520af09c0853c78f7'

// Addresses
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const USDD_ADDRESS = '0xe6ec2f01348067e7b064a0503a47b93e038cce9f'
export const USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7'
export const FED_ADDRESS = '0xd750d799fcbf8a5ed8ba39d01afdd4091775a504'
export const INDEX_ADDRESS = '0x99629185c647757f131fe84a84c554ad87fcdad7'
export const FACTORY_ADDRESSES = '0xca4eb662fd17b6c275ab0b93bdd0bc252c07556e'
export const CREATOR_ADDRESS = '0x29900fffaffefed16fb52a1d04f4d6d8cd469316'

export const STORE_TRACKED_TOKENS = 'tokens'
export const STORE_DEBTS = 'debts'
export const APPROVE_STATE = {
  UNKNOWN: 0,
  APPROVING: 1,
  APPROVED: 2
}
