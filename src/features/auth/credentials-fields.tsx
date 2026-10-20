import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { Description } from 'heroui-native/description';
import { useThemeColor } from 'heroui-native/hooks';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export type CredentialsFieldsProps = {
  email: string;
  password: string;
  registering: boolean;
  disabled: boolean;
  onEmailChange(value: string): void;
  onPasswordChange(value: string): void;
  invalidEmail?: boolean;
  invalidPassword?: boolean;
};

export function CredentialsFields({ email, password, registering, disabled, onEmailChange, onPasswordChange, invalidEmail, invalidPassword }: CredentialsFieldsProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const muted = useThemeColor('muted');
  return <View className="gap-5">
    <TextField isDisabled={disabled} isInvalid={invalidEmail}>
      <Label className="font-sans text-sm font-semibold">{t('auth.email')}</Label>
      <View className="justify-center">
        <Input variant="primary" value={email} onChangeText={onEmailChange} accessibilityLabel={t('auth.email')}
          keyboardType="email-address" autoComplete="email" autoCapitalize="none" autoCorrect={false}
          className={`min-h-14 rounded-input bg-surface py-4 pl-12 font-sans text-base ${invalidEmail ? '' : 'android:border-outline'}`} />
        <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" className="absolute left-4">
          <Ionicons name="mail-outline" size={20} color={muted} />
        </View>
      </View>
    </TextField>
    <TextField isDisabled={disabled} isInvalid={invalidPassword}>
      <Label className="font-sans text-sm font-semibold">{t('auth.password')}</Label>
      <View className="justify-center">
        <Input variant="primary" value={password} onChangeText={onPasswordChange} accessibilityLabel={t('auth.password')}
          secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} autoComplete={registering ? 'new-password' : 'current-password'}
          className={`min-h-14 rounded-input bg-surface py-4 pl-12 pr-16 font-sans text-base ${invalidPassword ? '' : 'android:border-outline'}`} />
        <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" className="absolute left-4">
          <Ionicons name="lock-closed-outline" size={20} color={muted} />
        </View>
        <Button isIconOnly variant="ghost" isDisabled={disabled} className="absolute right-1"
          accessibilityLabel={t(visible ? 'auth.hidePassword' : 'auth.showPassword')} accessibilityState={{ disabled, checked: visible }}
          onPress={() => { if (!disabled) setVisible(value => !value); }}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={muted} />
        </Button>
      </View>
      {registering && <Description className="font-sans text-xs text-muted">{t('auth.passwordHint')}</Description>}
    </TextField>
  </View>;
}
