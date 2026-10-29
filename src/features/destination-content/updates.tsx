import { Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { useTranslation } from 'react-i18next';
import { useDestinationContent } from './context';

export function ContentUpdates() {
  const content = useDestinationContent(); const { t } = useTranslation();
  if (!content) return null;
  return <Card className="gap-3 p-4 shadow-none">
    <Text accessibilityRole="header" className="font-sans text-card font-semibold text-foreground">{t('content.title')}</Text>
    <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">{t(!content.ready ? 'common.loading' : content.checking ? 'content.checking' : content.message)}</Text>
    {content.error && <Text accessibilityRole="alert" className="font-sans text-sm text-danger">{t(content.error)}</Text>}
    <View><Button variant="secondary" isDisabled={!content.canCheck} accessibilityLabel={t(content.error ? 'common.retry' : 'content.check')} onPress={() => void content.checkUpdates()}>
      <Button.Label>{t(content.error ? 'common.retry' : 'content.check')}</Button.Label>
    </Button></View>
    <Text className="font-sans text-xs text-muted">{t(content.authenticated ? 'content.offlineNote' : 'content.authRequired')}</Text>
  </Card>;
}
