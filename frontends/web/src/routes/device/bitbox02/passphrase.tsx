/**
 * Copyright 2018 Shift Devices AG
 * Copyright 2021 Shift Crypto AG
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component } from 'react';
import { route } from '../../../utils/route';
import { getDeviceInfo, setMnemonicPassphraseEnabled } from '../../../api/bitbox02';
import { translate, TranslateProps } from '../../../decorators/translate';
import { MultilineMarkup, SimpleMarkup } from '../../../utils/markup';
import { Main } from '../../../components/layout';
import { Button, Checkbox } from '../../../components/forms';
import { alertUser } from '../../../components/alert/Alert';
import { View, ViewButtons, ViewContent, ViewHeader } from '../../../components/view/view';
import { PointToBitBox02 } from '../../../components/icon';
import { Status } from '../../../components/status/status';

// enabling has 6 dialogs with information
const INFO_STEPS_ENABLE = 5;

// disabling passphrase shows only 1 info dialog
const INFO_STEPS_DISABLE = 0;

const CONTENT_MIN_HEIGHT = '38em';

interface MnemonicPassphraseButtonProps {
    deviceID: string;
}

interface State {
    infoStep: number;
    passphraseEnabled?: boolean;
    status: 'info' | 'progress' | 'success';
    understood: boolean;
}

type Props = MnemonicPassphraseButtonProps & TranslateProps;

class Passphrase extends Component<Props, State> {
  public readonly state: State = {
    infoStep: 0,
    status: 'info',
    understood: false,
  };

  public componentDidMount() {
    getDeviceInfo(this.props.deviceID)
      .then(result => {
        if (!result.success) {
          console.error(result.message);
          alertUser(this.props.t('genericError'));
          return;
        }
        const { mnemonicPassphraseEnabled } = result.deviceInfo;
        this.setState({
          // before enabling/disabling we show 1 or more pages to inform about the feature
          // each page has a continue button that jumps to the next or finally toggles passphrase
          // infoStep counts down in decreasing order
          infoStep: mnemonicPassphraseEnabled
            ? INFO_STEPS_DISABLE
            : INFO_STEPS_ENABLE,
          passphraseEnabled: mnemonicPassphraseEnabled,
        });
      })
      .catch(console.error);
  }

  private togglePassphrase = async () => {
    const { deviceID, t } = this.props;
    const enable = !this.state.passphraseEnabled;
    this.setState({ status: 'progress' });
    try {
      const result = await setMnemonicPassphraseEnabled(deviceID, enable);
      if (!result.success) {
        route(`/settings/device-settings/${deviceID}`);
        alertUser(t(`passphrase.error.e${result.code}`, {
          defaultValue: result.message || t('genericError'),
        }));
        return;
      }
      const deviceInfoResult = await getDeviceInfo(deviceID);
      if (deviceInfoResult.success) {
        this.setState({
          passphraseEnabled: deviceInfoResult.deviceInfo.mnemonicPassphraseEnabled,
          status: 'success',
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  private stopInfo = () => route(`/settings/device-settings/${this.props.deviceID}`);

  private continueInfo = () => {
    if (this.state.infoStep === 0) {
      this.togglePassphrase();
      return;
    }
    this.setState(({ infoStep }) => ({ infoStep: infoStep - 1 }));
  };

  private backInfo = () => {
    if (this.state.infoStep === undefined) {
      return;
    }
    const enabled = this.state.passphraseEnabled;
    if (
      (!enabled && this.state.infoStep >= INFO_STEPS_ENABLE)
      || (enabled && this.state.infoStep >= INFO_STEPS_DISABLE)
    ) {
      this.stopInfo();
      return;
    }
    this.setState(({ infoStep }) => ({ infoStep: infoStep + 1 }));
  };

  private renderEnableInfo = () => {
    const { infoStep, understood } = this.state;
    const { t } = this.props;
    switch (infoStep) {
    case 5:
      return (
        <View
          key="step-intro"
          fullscreen
          minHeight={CONTENT_MIN_HEIGHT}
          onClose={this.stopInfo}
          verticallyCentered>
          <ViewHeader title={t('passphrase.intro.title')} />
          <ViewContent>
            <MultilineMarkup tagName="p" markup={t('passphrase.intro.message')} />
          </ViewContent>
          <ViewButtons>
            <Button primary onClick={this.continueInfo}>
              {t('passphrase.what.button')}
            </Button>
            <Button secondary onClick={this.backInfo}>
              {t('button.back')}
            </Button>
          </ViewButtons>
        </View>
      );
    case 4:
      return (
        <View
          key="step-what"
          fullscreen
          minHeight={CONTENT_MIN_HEIGHT}
          onClose={this.stopInfo}
          verticallyCentered>
          <ViewHeader title={t('passphrase.what.title')} />
          <ViewContent>
            <MultilineMarkup tagName="p" markup={t('passphrase.what.message')} />
          </ViewContent>
          <ViewButtons>
            <Button primary onClick={this.continueInfo}>
              {t('passphrase.why.button')}
            </Button>
            <Button secondary onClick={this.backInfo}>
              {t('button.back')}
            </Button>
          </ViewButtons>
        </View>
      );
    case 3:
      return (
        <View
          key="step-why"
          fullscreen
          minHeight={CONTENT_MIN_HEIGHT}
          onClose={this.stopInfo}
          verticallyCentered>
          <ViewHeader title={t('passphrase.why.title')} />
          <ViewContent>
            <MultilineMarkup tagName="p" markup={t('passphrase.why.message')} />
          </ViewContent>
          <ViewButtons>
            <Button primary onClick={this.continueInfo}>
              {t('passphrase.considerations.button')}
            </Button>
            <Button secondary onClick={this.backInfo}>
              {t('button.back')}
            </Button>
          </ViewButtons>
        </View>
      );
    case 2:
      return (
        <View
          key="step-considerations"
          fullscreen
          minHeight={CONTENT_MIN_HEIGHT}
          onClose={this.stopInfo}
          verticallyCentered>
          <ViewHeader title={t('passphrase.considerations.title')} />
          <ViewContent>
            <MultilineMarkup tagName="p" markup={t('passphrase.considerations.message')} />
          </ViewContent>
          <ViewButtons>
            <Button primary onClick={this.continueInfo}>
              {t('passphrase.how.button')}
            </Button>
            <Button secondary onClick={this.backInfo}>
              {t('button.back')}
            </Button>
          </ViewButtons>
        </View>
      );
    case 1:
      return (
        <View
          key="step-how"
          fullscreen
          minHeight={CONTENT_MIN_HEIGHT}
          onClose={this.stopInfo}
          verticallyCentered>
          <ViewHeader title={t('passphrase.how.title')} />
          <ViewContent>
            <MultilineMarkup tagName="p" markup={t('passphrase.how.message')} />
          </ViewContent>
          <ViewButtons>
            <Button primary onClick={this.continueInfo}>
              {t('passphrase.summary.button')}
            </Button>
            <Button secondary onClick={this.backInfo}>
              {t('button.back')}
            </Button>
          </ViewButtons>
        </View>
      );
    case 0:
      return (
        <View
          key="step-summary"
          fullscreen
          minHeight={CONTENT_MIN_HEIGHT}
          onClose={this.stopInfo}
          verticallyCentered>
          <ViewHeader title={t('passphrase.summary.title')} />
          <ViewContent>
            <ul>
              <SimpleMarkup key="info-1" tagName="li" markup={t('passphrase.summary.understandList.0')} />
              <SimpleMarkup key="info-2" tagName="li" markup={t('passphrase.summary.understandList.1')} />
              <SimpleMarkup key="info-3" tagName="li" markup={t('passphrase.summary.understandList.2')} />
              <SimpleMarkup key="info-4" tagName="li" markup={t('passphrase.summary.understandList.3')} />
            </ul>
            <Status type={understood ? 'success' : 'warning'}>
              <Checkbox
                onChange={e => this.setState({ understood: (e.target as HTMLInputElement)?.checked })}
                id="understood"
                checked={understood}
                label={t('passphrase.summary.understand')}
                checkboxStyle={understood ? 'success' : 'warning'} />
            </Status>
          </ViewContent>
          <ViewButtons>
            <Button primary onClick={this.continueInfo} disabled={!understood}>
              {t('passphrase.enable')}
            </Button>
            <Button secondary onClick={this.backInfo}>
              {t('button.back')}
            </Button>
          </ViewButtons>
        </View>
      );
    default:
      console.error(`invalid infoStep ${infoStep}`);
      return;
    }
  };

  private renderDisableInfo = () => {
    const { t } = this.props;
    return (
      <View
        key="step-disable-info1"
        fullscreen
        minHeight={CONTENT_MIN_HEIGHT}
        onClose={this.stopInfo}
        verticallyCentered>
        <ViewHeader title={t('passphrase.disable')} />
        <ViewContent>
          <MultilineMarkup tagName="p" markup={t('passphrase.disableInfo.message')} />
        </ViewContent>
        <ViewButtons>
          <Button primary onClick={this.continueInfo}>
            {t('passphrase.disableInfo.button')}
          </Button>
          <Button secondary onClick={this.backInfo}>
            {t('button.back')}
          </Button>
        </ViewButtons>
      </View>
    );
  };

  public render() {
    const { t } = this.props;
    const { passphraseEnabled, status } = this.state;
    if (passphraseEnabled === undefined) {
      return null;
    }
    return (
      <Main>
        {status === 'info' && (
          passphraseEnabled
            ? this.renderDisableInfo()
            : this.renderEnableInfo()
        )}
        {status === 'progress' && (
          <View
            key="progress"
            fullscreen
            minHeight={CONTENT_MIN_HEIGHT}
            textCenter
            verticallyCentered>
            <ViewHeader
              title={t(passphraseEnabled
                ? 'passphrase.progressDisable.title'
                : 'passphrase.progressEnable.title')}>
              <SimpleMarkup
                tagName="p"
                markup={t(passphraseEnabled
                  ? 'passphrase.progressDisable.message'
                  : 'passphrase.progressEnable.message')} />
            </ViewHeader>
            <ViewContent>
              <PointToBitBox02 />
            </ViewContent>
          </View>
        )}
        {status === 'success' && (
          <View
            key="progress"
            fullscreen
            verticallyCentered>
            <ViewHeader
              small
              title={t(passphraseEnabled
                ? 'passphrase.successDisabled.title'
                : 'passphrase.successEnabled.title')} >
            </ViewHeader>
            <ViewContent>
              <MultilineMarkup tagName="p" markup={t(passphraseEnabled
                ? 'passphrase.successDisabled.message'
                : 'passphrase.successEnabled.message')} />
              {passphraseEnabled && (
                <ul style={{ paddingLeft: 'var(--space-default)' }}>
                  <SimpleMarkup key="tip-1" tagName="li" markup={t('passphrase.successEnabled.tipsList.0')} />
                  <SimpleMarkup key="tip-2" tagName="li" markup={t('passphrase.successEnabled.tipsList.1')} />
                </ul>
              )}
              <SimpleMarkup tagName="p" markup={t(
                passphraseEnabled
                  ? 'passphrase.successDisabled.messageEnd'
                  : 'passphrase.successEnabled.messageEnd')} />
            </ViewContent>
          </View>
        )}
      </Main>
    );
  }
}

const HOC = translate()(Passphrase);
export { HOC as Passphrase };
