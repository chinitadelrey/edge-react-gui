// @flow

import React, {Component} from 'react'
import {
  View,
  ActivityIndicator
} from 'react-native'
import s from '../../../../../locales/strings.js'
import styles from '../style.js'
import {PrimaryButton, SecondaryButton} from '../../../components/Buttons'

export default class EditToken extends Component {

  render () {
    return (
      <View style={[styles.deleteModalButtonsArea]}>
        <SecondaryButton
          text={s.strings.string_cancel_cap}
          onPressFunction={this.props.cancelButtonFunction}
          buttonStyle={[styles.modalCancelButton, styles.button]}
        />
        <PrimaryButton
          text={s.strings.string_delete}
          style={[styles.modalDeleteButton, styles.button]}
          onPressFunction={this.props.deleteButtonFunction}
          processingElement={<ActivityIndicator />}
          processingFlag={this.props.isDeleteCustomTokenProcessing}
        />
      </View>
    )
  }
}