import * as ACTION from './action'
import {combineReducers} from 'redux'
import * as WALLET_ACTIONS from '../../Wallets/action'
import * as SETTINGS_ACTIONS from '../../Settings/action'

export const deleteTokenModalVisible = (state = false, action) => {
  switch (action.type) {
  case ACTION.SHOW_DELETE_TOKEN_MODAL :
    return true
  case ACTION.HIDE_DELETE_TOKEN_MODAL :
    return false
  case WALLET_ACTIONS.DELETE_CUSTOM_TOKEN_SUCCESS :
    return false
  default:
    return state
  }
}

export const deleteCustomTokenProcessing = (state = false, action) => {
  switch (action.type) {
  case WALLET_ACTIONS.DELETE_CUSTOM_TOKEN_START :
    return true
  case WALLET_ACTIONS.DELETE_CUSTOM_TOKEN_SUCCESS :
    return false
  case SETTINGS_ACTIONS.DELETE_CUSTOM_TOKEN :
    return false
  default:
    return false
  }
}

const editToken = combineReducers({
  deleteTokenModalVisible,
  deleteCustomTokenProcessing
})

export default editToken