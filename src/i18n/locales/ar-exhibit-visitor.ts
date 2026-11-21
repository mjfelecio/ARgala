export const exhibitVisitorCopy = {
  en: {
    visitPlan: 'Plan your visit',
    visitPlanUnavailable: 'Visitor guidance is unavailable for this destination.',
    history: 'History',
    historySources: 'Sources',
    historySourcesHint: 'See History in the destination details for sources.',
    historyFigure: 'View Figure 2 in the scientific paper',
    historyFigureHint: 'Find the link to Figure 2 in History on the destination details page.',
    historyVisualSource: 'View the original illustration',
    historyOpenImage: 'Open History image',
    historySchoolUse: 'Image for offline school use. Wider reuse rights are unverified.',
    historyUnavailable: 'History is unavailable for this destination.',
  },
  ja: {
    visitPlan: '訪問ガイド',
    visitPlanUnavailable: 'この目的地の訪問案内はまだありません。',
    history: '歴史',
    historySources: '出典',
    historySourcesHint: '出典は目的地の詳細画面の「歴史」で確認できます。',
    historyFigure: '論文の図2を見る',
    historyFigureHint: '論文の図2へのリンクは、目的地の詳細画面の「歴史」にあります。',
    historyVisualSource: '元の資料を見る',
    historyOpenImage: '歴史の画像を開く',
    historySchoolUse: '学校内でのオフライン利用向けの画像です。それ以外の利用許諾は確認されていません。',
    historyUnavailable: 'この目的地の歴史はまだ紹介されていません。',
  },
  ko: {
    visitPlan: '방문 계획',
    visitPlanUnavailable: '이곳의 방문 안내는 아직 제공되지 않습니다.',
    history: '역사',
    historySources: '출처',
    historySourcesHint: '출처는 목적지 상세 화면의 역사에서 확인할 수 있습니다.',
    historyFigure: '논문의 그림 2 보기',
    historyFigureHint: '목적지 상세 화면의 역사에서 논문의 그림 2 링크를 열 수 있습니다.',
    historyVisualSource: '원본 자료 보기',
    historyOpenImage: '역사 이미지 열기',
    historySchoolUse: '학교 프로젝트의 오프라인 사용을 위한 이미지입니다. 그 밖의 재사용 권한은 확인되지 않았습니다.',
    historyUnavailable: '이곳의 역사 소개는 아직 제공되지 않습니다.',
  },
} as const;

export function exhibitVisitorLocale(locale: string) {
  return locale.startsWith('ja') ? exhibitVisitorCopy.ja : locale.startsWith('ko') ? exhibitVisitorCopy.ko : exhibitVisitorCopy.en;
}
