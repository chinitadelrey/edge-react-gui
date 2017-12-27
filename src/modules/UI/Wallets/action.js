//@flow
export const PREFIX = 'UI/Wallets/'

export const UPSERT_WALLET = PREFIX + 'UPSERT_WALLET'

export const ACTIVATE_WALLET_ID = PREFIX + 'ACTIVATE_WALLET_ID'
export const ARCHIVE_WALLET_ID = PREFIX + 'ARCHIVE_WALLET_ID'

export const SELECT_WALLET = PREFIX + 'SELECT_WALLET'

export const MANAGE_TOKENS = 'MANAGE_TOKENS'
export const MANAGE_TOKENS_START = 'MANAGE_TOKENS_START'
export const MANAGE_TOKENS_SUCCESS = 'MANAGE_TOKENS_SUCCESS'
export const DELETE_CUSTOM_TOKEN_START = 'DELETE_CUSTOM_TOKEN_START'
export const DELETE_CUSTOM_TOKEN_SUCCESS = 'DELETE_CUSTOM_TOKEN_SUCCESS'
export const UPDATE_WALLET_ENABLED_TOKENS = 'UPDATE_WALLET_ENABLED_TOKENS'

// import * as UI_SELECTORS from '../selectors.js'
import * as CORE_SELECTORS from '../../Core/selectors.js'
import * as SETTINGS_SELECTORS from '../Settings/selectors'
import * as SETTINGS_API from '../../Core/Account/settings.js'
import {Actions} from 'react-native-router-flux'
import {
  updateSettings
} from '../Settings/action'

import type {Dispatch, GetState} from '../../ReduxTypes'
import type {AbcCurrencyWallet} from 'airbitz-core-types'

import * as WALLET_API from '../../Core/Wallets/api.js'
import _ from 'lodash'

export const selectWallet = (walletId: string, currencyCode: string) => ({
  type: SELECT_WALLET,
  data: {walletId, currencyCode}
})

function dispatchUpsertWallet (dispatch, wallet, walletId) {
  dispatch(upsertWallet(wallet))
  refreshDetails[walletId].delayUpsert = false
  refreshDetails[walletId].lastUpsert = Date.now()
}

const refreshDetails = {}

export const refreshWallet = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  if (wallet) {
    if (!refreshDetails[walletId]) {
      refreshDetails[walletId] = {
        delayUpsert: false,
        lastUpsert: 0
      }
    }
    if (!refreshDetails[walletId].delayUpsert) {
      const now = Date.now()
      if (now - refreshDetails[walletId].lastUpsert > 3000) {
        dispatchUpsertWallet(dispatch, wallet, walletId)
      } else {
        console.log('refreshWallets setTimeout delay upsert id:' + walletId)
        refreshDetails[walletId].delayUpsert = true
        setTimeout(() => {
          dispatchUpsertWallet(dispatch, wallet, walletId)
        }, 3000)
      }
    } else {
      console.log('refreshWallets delayUpsert id:' + walletId)
    }
  } else {
    console.log('refreshWallets no wallet. id:' + walletId)
  }
}

export const upsertWallet = (wallet: AbcCurrencyWallet) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const loginStatus = SETTINGS_SELECTORS.getLoginStatus(state)
  if (!loginStatus) {
    dispatch({type: 'LOGGED_OUT'})
  }

  dispatch({
    type: UPSERT_WALLET,
    data: {wallet}
  })
}

// adds to core and enables in core
export const addCustomToken = (walletId: string, tokenObj: any) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  WALLET_API.addCoreCustomToken(wallet, tokenObj)
  .catch((e) => console.log(e))
}

export const setEnabledTokens = (walletId: string, enabledTokens: Array<string>, disabledTokens: Array<string>) => (dispatch: Dispatch, getState: GetState) => {
  // tell Redux that we are updating the enabledTokens list
  dispatch(setTokensStart())
  // get a snapshot of the state
  const state = getState()
  // get a copy of the relevant core wallet
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  // now actually tell the wallet to enable the token(s) in the core and save to file
  WALLET_API.setEnabledTokens(wallet, enabledTokens, disabledTokens)
  .then((enabledTokens) => {
    // let Redux know it was completed successfully
    dispatch(setTokensSuccess())
    dispatch(updateWalletEnabledTokens(walletId, enabledTokens))
    // refresh the wallet in Redux
    dispatch(refreshWallet(walletId))
  })
  .catch((e) => console.log(e))
}

export const getEnabledTokens = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  // get a snapshot of the state
  const state = getState()
  // get the AbcWallet
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  // get token information from settings
  const customTokens = SETTINGS_SELECTORS.getCustomTokens(state)
  const customTokenPromises = customTokens.map((token) => {

    return wallet.addCustomToken(token)
  })
  Promise.all(customTokenPromises)
  .then(() => {
    return WALLET_API.getEnabledTokensFromFile(wallet)
  })
  .then((tokens) => {
    wallet.enableTokens(tokens)
    return tokens
  })
  .then((tokens) => {
    // now reflect that change in Redux's version of the wallet
    dispatch(updateWalletEnabledTokens(walletId, tokens))
  })
  .catch((e) => {
    console.log(e)
  })
}

export const deleteCustomToken = (walletId: string, currencyCode: string) => (dispatch: any, getState: any) => {
  const state = getState()
  const coreWallets = CORE_SELECTORS.getWallets(state)
  const guiWallets = state.ui.wallets.byId
  const account = CORE_SELECTORS.getAccount(state)
  const localSettings = {
    ...SETTINGS_SELECTORS.getSettings(state)
  }
  let coreWalletsToUpdate = []
  dispatch(deleteCustomTokenStart())
  SETTINGS_API.getSyncedSettings(account)
  .then((settings) => {
    settings[currencyCode].isVisible = false // remove top-level property. We should migrate away from it eventually anyway
    localSettings[currencyCode].isVisible = false
    const customTokensOnFile = [...settings.customTokens] // should use '|| []' as catch-all or no?
    const customTokensOnLocal = [...localSettings.customTokens]
    const indexOfToken = _.findIndex(customTokensOnFile, (item) => item.currencyCode = currencyCode)
    const indexOfTokenOnLocal = _.findIndex(customTokensOnLocal, (item) => item.currencyCode = currencyCode)
    customTokensOnFile[indexOfToken].isVisible = false
    customTokensOnLocal[indexOfTokenOnLocal].isVisible = false
    settings.customTokens = customTokensOnFile
    localSettings.customTokens = customTokensOnLocal
    return settings
  })
  .then((settings) => {
    return SETTINGS_API.setSyncedSettings(account, settings)
  })
  .then(() => {
    // now time to loop through wallets and disable (on wallet and in core)
    const walletPromises = Object.values(guiWallets).map((wallet) => {
      let theCoreWallet = coreWallets[wallet.id]
      if (wallet.enabledTokens && wallet.enabledTokens.length > 0) {
        coreWalletsToUpdate.push(theCoreWallet)
        return WALLET_API.updateEnabledTokens(theCoreWallet, [], [currencyCode])
      }
      return Promise.resolve()
    })
    return Promise.all(walletPromises)
  })
  .then(() => {
    coreWalletsToUpdate.forEach((wallet) => {
      dispatch(upsertWallet(wallet))
      const newEnabledTokens = _.difference(localSettings.customTokens, [currencyCode])
      dispatch(updateWalletEnabledTokens(wallet.id, newEnabledTokens))
    })
  })
  .then(() => {
    dispatch(updateSettings(localSettings))
    dispatch(deleteCustomTokenSuccess(currencyCode)) // need to remove modal and update settings
    Actions.walletList()
  })
  .catch((e) => {
    console.log(e)
  })
}

export const deleteCustomTokenStart = () => ({
  type: DELETE_CUSTOM_TOKEN_START
})

export const deleteCustomTokenSuccess = (currencyCode) => ({
  type: DELETE_CUSTOM_TOKEN_SUCCESS,
  data: {currencyCode}
})

export const setTokensStart = () => ({
  type: MANAGE_TOKENS_START
})

export const setTokensSuccess = () => ({
  type: MANAGE_TOKENS_SUCCESS
})

export const updateWalletEnabledTokens = (walletId, tokens) =>  ({
  type: UPDATE_WALLET_ENABLED_TOKENS,
  data: {walletId, tokens}
})