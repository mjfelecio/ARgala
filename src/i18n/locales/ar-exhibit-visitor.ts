export const exhibitVisitorCopy = {
  en: {
    safety: 'Safety',
    visitGuideUnavailable: 'Visitor guidance is unavailable for this destination.',
    history: 'History',
    historySources: 'Sources',
    historySourcesHint: 'Open the History photo in destination details for its credits.',
    historyOpenImage: 'Open History image',
    historySchoolUse: 'Image for offline school use. Wider reuse rights are unverified.',
    historySchoolScope: 'Included in ARgala’s offline school presentation.',
    historySchoolPermission: 'Included with school staff permission reported for the offline school project.',
    historyUnavailable: 'History is unavailable for this destination.',
  },
  ja: {
    safety: '安全',
    visitGuideUnavailable: 'この目的地の訪問案内はまだありません。',
    history: '歴史',
    historySources: '出典',
    historySourcesHint: '画像のクレジットは、目的地の詳細画面の「歴史」で写真を開くと確認できます。',
    historyOpenImage: '歴史の画像を開く',
    historySchoolUse: '学校内でのオフライン利用向けの画像です。それ以外の利用許諾は確認されていません。',
    historySchoolScope: 'ARgalaの学校向けオフライン発表で使用しています。',
    historySchoolPermission: '学校関係者の許可を得たとの報告に基づき、学校向けオフライン発表で使用しています。',
    historyUnavailable: 'この目的地の歴史はまだ紹介されていません。',
  },
  ko: {
    safety: '안전',
    visitGuideUnavailable: '이곳의 방문 안내는 아직 제공되지 않습니다.',
    history: '역사',
    historySources: '출처',
    historySourcesHint: '목적지 상세 화면의 역사 사진을 열면 이미지 출처를 확인할 수 있습니다.',
    historyOpenImage: '역사 이미지 열기',
    historySchoolUse: '학교 프로젝트의 오프라인 사용을 위한 이미지입니다. 그 밖의 재사용 권한은 확인되지 않았습니다.',
    historySchoolScope: 'ARgala의 오프라인 학교 발표에 포함된 이미지입니다.',
    historySchoolPermission: '학교 관계자의 허가를 받았다는 내용을 바탕으로 오프라인 학교 발표에 포함했습니다.',
    historyUnavailable: '이곳의 역사 소개는 아직 제공되지 않습니다.',
  },
} as const;

export function exhibitVisitorLocale(locale: string) {
  return locale.startsWith('ja') ? exhibitVisitorCopy.ja : locale.startsWith('ko') ? exhibitVisitorCopy.ko : exhibitVisitorCopy.en;
}
