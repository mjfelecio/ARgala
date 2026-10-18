import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { withUniwind } from 'uniwind';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Chip } from 'heroui-native/chip';
import { Surface } from 'heroui-native/surface';
import { Spinner } from 'heroui-native/spinner';
import { useThemeColor } from 'heroui-native/hooks';

const StyledSafeAreaView = withUniwind(SafeAreaView);

/** Development diagnostic: local state only, with no device or provider services. */
export default function ShowcaseScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(false);
  const [iconColor, spinnerColor] = useThemeColor(['default-foreground', 'accent-foreground']);
  return <StyledSafeAreaView className="flex-1 bg-background">
    <ScrollView contentContainerClassName="gap-4 p-4 pb-8">
      <Text accessibilityRole="header" className="font-sans text-title font-bold text-foreground">{t('showcase.title')}</Text>
      <Text className="font-sans text-sm text-muted">{t('showcase.description')}</Text>
      <Card className="gap-4">
        <Card.Header><Card.Title accessibilityRole="header">{t('showcase.actions')}</Card.Title></Card.Header>
        <Card.Body className="gap-3">
          <Button accessibilityLabel={t('showcase.select')} accessibilityState={{ selected }} onPress={() => setSelected(true)}>
            <Button.Label>{t('showcase.select')}</Button.Label>
          </Button>
          <Button variant="secondary" accessibilityLabel={t('showcase.reset')} onPress={() => setSelected(false)}>
            <Button.Label>{t('showcase.reset')}</Button.Label>
          </Button>
          <Button variant="outline" isDisabled accessibilityLabel={t('showcase.disabled')}>
            <Button.Label>{t('showcase.disabled')}</Button.Label>
          </Button>
          <Button isDisabled accessibilityLabel={t('showcase.loading')} accessibilityState={{ disabled: true, busy: true }}>
            <Spinner color={spinnerColor} size="sm" />
            <Button.Label>{t('showcase.loading')}</Button.Label>
          </Button>
        </Card.Body>
        <Card.Footer className="flex-row flex-wrap items-center gap-3">
          <Chip variant={selected ? 'primary' : 'secondary'} accessibilityLabel={t(selected ? 'showcase.selected' : 'showcase.idle')}>
            <Chip.Label>{t(selected ? 'showcase.selected' : 'showcase.idle')}</Chip.Label>
          </Chip>
          <Button variant="secondary" isIconOnly accessibilityLabel={t('showcase.reset')} onPress={() => setSelected(false)}>
            <Ionicons name="refresh" size={24} color={iconColor} />
          </Button>
        </Card.Footer>
      </Card>
      <Surface variant="secondary" className="gap-2">
        <Text accessibilityLiveRegion="polite" className="font-sans text-base text-foreground">{t(selected ? 'showcase.selected' : 'showcase.idle')}</Text>
        <Text className="font-sans text-sm text-muted">{t('showcase.localOnly')}</Text>
      </Surface>
      <View className="gap-2">
        <Text accessibilityRole="header" className="font-sans text-section font-semibold text-foreground">{t('showcase.typography')}</Text>
        <Text className="font-sans text-base text-route">{t('showcase.routeAccent')}</Text>
        <Text className="font-sans text-sm text-foreground">{t('showcase.languages')}</Text>
      </View>
    </ScrollView>
  </StyledSafeAreaView>;
}
