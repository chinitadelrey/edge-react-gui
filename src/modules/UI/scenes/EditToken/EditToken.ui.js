// @flow

import React, {Component} from 'react'
import {
  View,
  ActivityIndicator,
  ScrollView
} from 'react-native'
import Text from '../../components/FormattedText'
import s from '../../../../locales/strings.js'
import Gradient from '../../components/Gradient/Gradient.ui'
import styles from './style.js'
import {PrimaryButton, TertiaryButton} from '../../components/Buttons'
import {FormField} from '../../../../components/FormField.js'
// import * as WALLET_ACTIONS from '../../Wallets/action.js'
import type {CustomTokenInfo} from '../../../../types.js'
import StylizedModal from '../../components/Modal/Modal.ui'
import DeleteTokenButtons from './components/DeleteTokenButtons.ui.js'
import DeleteIcon from '../WalletList/components/DeleteIcon.ui'
import _ from 'lodash'

export type DispatchProps = {
}

type State = {
  currencyName: string,
  currencyCode: string,
  contractAddress: string,
  decimalPlaces: string,
  multiplier: string,
  errorMessage: string,
  enabled?: boolean
}

type Props = {
  walletId: string,
  addTokenPending: Function,
  addToken: Function,
  currencyCode: string,
  customTokens: CustomTokenInfo,
  deleteTokenModalVisible: boolean
}

export default class EditToken extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    // $FlowFixMe
    const tokenInfo: CustomTokenInfo = _.find(props.customTokens, (item) => item.currencyCode === props.currencyCode)
    console.log('in EditToken.ui.js, and currencyInfo is: ', tokenInfo)
    const { currencyName, contractAddress, decimalPlaces } = tokenInfo
    this.state = {
      currencyName,
      contractAddress,
      decimalPlaces,
      multiplier: '',
      currencyCode: props.currencyCode,
      errorMessage: ''
    }
  }

  render () {
    return (
      <View style={[styles.editTokens]}>
        <Gradient style={styles.gradient} />
        <StylizedModal
          headerText={'edittoken_delete_prompt'}
          visibilityBoolean={this.props.deleteTokenModalVisible}
          featuredIcon={<DeleteIcon />}
          modalBottom={<DeleteTokenButtons
            onPressDelete={this.deleteToken}
            onPressCancel={this.props.hideDeleteTokenModal}
            processingFlag={this.props.deleteCustomTokenProcessing}
          />}
          onExitButtonFxn={this.props.hideDeleteTokenModal}
        />
        <ScrollView style={styles.container}>
          <View style={styles.instructionalArea}>
            <Text style={styles.instructionalText}>{s.strings.edittoken_top_instructions}</Text>
          </View>
          <View style={styles.formArea}>
            <View style={[styles.nameArea]}>
              <FormField
                style={[styles.currencyName]}
                value={this.state.currencyName}
                onChangeText={this.onChangeName}
                autoCapitalize={'words'}
                label={s.strings.addtoken_name_input_text}
                returnKeyType={'done'}
                autoCorrect={false}
              />
            </View>
            <View style={[styles.currencyCodeArea]}>
              <FormField
                style={[styles.currencyCodeInput]}
                value={this.state.currencyCode}
                onChangeText={this.onChangeCurrencyCode}
                autoCapitalize={'characters'}
                label={s.strings.addtoken_currency_code_input_text}
                returnKeyType={'done'}
                autoCorrect={false}
              />
            </View>
            <View style={[styles.contractAddressArea]}>
              <FormField
                style={[styles.contractAddressInput]}
                value={this.state.contractAddress}
                onChangeText={this.onChangeContractAddress}
                label={s.strings.addtoken_contract_address_input_text}
                returnKeyType={'done'}
                autoCorrect={false}
              />
            </View>
            <View style={[styles.decimalPlacesArea]}>
              <FormField
                style={[styles.decimalPlacesInput]}
                value={this.state.decimalPlaces}
                onChangeText={this.onChangeDecimalPlaces}
                label={s.strings.addtoken_denomination_input_text}
                returnKeyType={'done'}
                autoCorrect={false}
                keyboardType={'numeric'}
              />
            </View>
          </View>
          <View style={styles.errorMessageArea}>
            <Text style={styles.errorMessageText}>{this.state.errorMessage}</Text>
          </View>
          <View style={[styles.buttonsArea]}>
            <TertiaryButton
              text={s.strings.edittoken_delete_token}
              onPressFunction={this.props.showDeleteTokenModal}
              buttonStyle={styles.deleteButton}
            />
            <PrimaryButton
              text={s.strings.string_save}
              style={[styles.saveButton, styles.button]}
              onPressFunction={this._onSave}
              processingElement={<ActivityIndicator />}
              processingFlag={this.props.addTokenPending}
            />
          </View>
          <View style={styles.bottomPaddingForKeyboard} />
        </ScrollView>
      </View>
    )
  }


  showDeleteTokenModal = () => {
    this.props.showDeleteTokenModal()
  }

  deleteToken = () => {
    this.props.deleteCustomToken(this.props.walletId, this.props.currencyCode)
  }

  onChangeName = (input: string) => {
    this.setState({
      currencyName: input
    })
  }

  onChangeCurrencyCode = (input: string) => {
    this.setState({
      currencyCode: input.substring(0,5)
    })
  }

  onChangeDecimalPlaces = (input: string) => {
    this.setState({
      decimalPlaces: input
    })
  }

  onChangeContractAddress = (input: string) => {
    this.setState({
      contractAddress: input.trim()
    })
  }

  _onSave = () => {
    const {currencyName, currencyCode, decimalPlaces, contractAddress} = this.state
    if (currencyName && currencyCode && decimalPlaces && contractAddress) {
      const {walletId} = this.props
      const numberOfDecimalPlaces: number = parseInt(this.state.decimalPlaces)
      const multiplier: string = '1' + '0'.repeat(numberOfDecimalPlaces)
      let tokenObj: any = this.state
      tokenObj.multiplier = multiplier
      tokenObj.denominations = [
        {
          name: currencyCode,
          multiplier
        }
      ]
      this.props.addToken(walletId, tokenObj)
    } else {
      this.setState({
        errorMessage: s.strings.addtoken_default_error_message
      })
    }
  }
}