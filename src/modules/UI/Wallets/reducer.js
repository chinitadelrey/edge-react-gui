// @flow

import {combineReducers} from 'redux'
import {GuiWallet} from '../../../types.js'
import type {AbcDenomination, AbcMetaToken} from 'airbitz-core-types'
import * as ACTION from './action'
import * as ADD_TOKEN_ACTION from '../scenes/AddToken/action.js'
import {UPDATE_WALLETS} from '../../Core/Wallets/action.js'

export const byId = (state: any = {}, action: any) => {
  const {type, data = {} } = action
  switch (type) {
  case UPDATE_WALLETS: {
    const wallets = action.data.currencyWallets
    const out = {}
    for (const walletId of Object.keys(wallets)) {
      let tempWallet = schema(wallets[walletId])
      if (state[walletId]) {
        const enabledTokensOnWallet = state[walletId].enabledTokens
        tempWallet.enabledTokens = enabledTokensOnWallet
        enabledTokensOnWallet.forEach((customToken) => {
          tempWallet.nativeBalances[customToken] = wallets[walletId].getBalance({currencyCode: customToken})
        })
      }
      out[walletId] = tempWallet
    }

    return out
  }

  case ACTION.UPDATE_WALLET_ENABLED_TOKENS : {
    const {walletId, tokens} = action.data
    return {
      ...state,
      [walletId]: {
        ...state[walletId],
        enabledTokens: tokens
      }
    }
  }

  case ACTION.UPSERT_WALLET: {
    let guiWallet = schema(data.wallet)
    const enabledTokensOnWallet = state[data.wallet.id].enabledTokens
    guiWallet.enabledTokens = enabledTokensOnWallet
    enabledTokensOnWallet.forEach((customToken) => {
      guiWallet.nativeBalances[customToken] = data.wallet.getBalance({currencyCode: customToken})
    })
    return {
      ...state,
      [data.wallet.id]: guiWallet
    }
  }

  default:
    return state
  }
}

export const walletEnabledTokens = (state: any = {}, action: any) => {
  if (action.type === UPDATE_WALLETS) {
    return action.data.activeWalletIds
  }

  return state
}
export const activeWalletIds = (state: any = [], action: any) => {
  if (action.type === UPDATE_WALLETS) {
    return action.data.activeWalletIds
  }

  return state
}

export const archivedWalletIds = (state: any = [], action: any) => {
  if (action.type === UPDATE_WALLETS) {
    return action.data.archivedWalletIds
  }

  return state
}

export const selectedWalletId = (state: string = '', action: any) => {
  const {type, data = {} } = action
  const {walletId} = data

  switch (type) {
  case ACTION.SELECT_WALLET:
    return walletId
  default:
    return state
  }
}

export const selectedCurrencyCode = (state: string = '', action: any) => {
  const {type, data = {} } = action
  const {currencyCode} = data

  switch (type) {
  case ACTION.SELECT_WALLET:
    return currencyCode
  default:
    return state
  }
}

const addTokenPending = (state = false, action) => {
  const type = action.type
  switch (type) {
  case ADD_TOKEN_ACTION.ADD_TOKEN_START :
    return true
  case ADD_TOKEN_ACTION.ADD_TOKEN_SUCCESS :
    return false
  default:
    return state
  }
}

const manageTokensPending = (state = false, action) => {
  const type = action.type
  switch (type) {
  case ACTION.MANAGE_TOKENS_START :
    return true
  case ACTION.MANAGE_TOKENS_SUCCESS :
    return false
  default:
    return state
  }
}

function schema (wallet: any): GuiWallet {
  const id: string = wallet.id
  const type: string = wallet.type
  const name: string = wallet.name || 'no wallet name'

  const currencyCode: string = wallet.currencyInfo.currencyCode
  const fiatCurrencyCode: string = wallet.fiatCurrencyCode.replace('iso:', '')
  const isoFiatCurrencyCode: string = wallet.fiatCurrencyCode
  const symbolImage: string = wallet.currencyInfo.symbolImage
  const symbolImageDarkMono: string = wallet.currencyInfo.symbolImageDarkMono
  const metaTokens: Array<AbcMetaToken> = wallet.currencyInfo.metaTokens
  const denominations: Array<AbcDenomination> = wallet.currencyInfo.denominations
  const enabledTokens: Array<string> = wallet.enabledTokens || []

  const allDenominations: {
    [currencyCode: string]: { [denomination: string]: AbcDenomination }
  } = {}

  // Add all parent currency denominations to allDenominations
  const parentDenominations = denominations.reduce((denominations, denomination) => ({
    ...denominations, [denomination.multiplier]: denomination
  }), {})

  allDenominations[currencyCode] = parentDenominations

  const nativeBalances: { [currencyCode: string]: string } = {}
  // Add parent currency balance to balances
  nativeBalances[currencyCode] = wallet.getBalance({currencyCode})

  // Add parent currency currencyCode
  const currencyNames: { [currencyCode: string]: string } = {}
  currencyNames[currencyCode] = wallet.currencyInfo.currencyName

  metaTokens.forEach((metaToken) => {
    const currencyCode: string = metaToken.currencyCode
    const currencyName: string = metaToken.currencyName
    const balance: string = wallet.getBalance({currencyCode})
    const denominations: Array<AbcDenomination> = metaToken.denominations

    // Add token balance to allBalances
    nativeBalances[currencyCode] = balance
    currencyNames[currencyCode] = currencyName

    // Add all token denominations to allDenominations
    const tokenDenominations: {
      [denomination: string]: AbcDenomination
    } = denominations.reduce((denominations, denomination) => ({...denominations, [denomination.multiplier]: denomination}), {})
    allDenominations[currencyCode] = tokenDenominations
  })

  const primaryNativeBalance: string = nativeBalances[currencyCode]

  const newWallet = new GuiWallet(
    id,
    type,
    name,
    primaryNativeBalance,
    nativeBalances,
    currencyNames,
    currencyCode,
    isoFiatCurrencyCode,
    fiatCurrencyCode,
    denominations,
    allDenominations,
    symbolImage,
    symbolImageDarkMono,
    metaTokens,
    enabledTokens
  )

  return newWallet
}

export const wallets = combineReducers({
  byId,
  activeWalletIds,
  archivedWalletIds,
  selectedWalletId,
  selectedCurrencyCode,
  addTokenPending,
  manageTokensPending
})