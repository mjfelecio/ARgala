import en from '@/i18n/locales/en.json';
import ja from '@/i18n/locales/ja.json';
import ko from '@/i18n/locales/ko.json';
import type { DestinationId } from '@/features/destinations/catalog';
import type { RingContent } from './ring-content';
import { developmentFeaturedStories } from './development-featured-content';
import { additionalPreviewAssets, featuredPreviewAssets } from './development-featured-media-assets';

// This shared native presentation shape is named "approved"; this explicitly
// labeled test material does not establish editorial, rights or GPS approval.
const draft = 'Owner-authorized development preview only; docs/featured-research-preview.md';
const value = (text: string) => ({ value: text, approvalReference: draft });
const descriptions = {
  D01: ['A person paddles on a lake in front of a forested shore.', '森に囲まれた湖でパドルをこぐ人。', '숲이 우거진 호숫가 앞에서 노를 젓는 사람.'],
  D02: ['A lake surrounded by forest and tall vegetation.', '森と背の高い草に囲まれた湖。', '숲과 키 큰 풀이 둘러싼 호수.'],
  D03: ['People near a mountain lake surrounded by green slopes.', '緑の斜面に囲まれた山の湖と人々。', '푸른 비탈에 둘러싸인 산속 호수와 사람들.'],
  D04: ['A lit walkway beside trees and the shoreline.', '木々と海岸沿いにある明かりのついた歩道。', '나무와 해안가 옆에 조명이 켜진 산책로.'],
  D05: ['Visitors stand beside a pineapple sculpture and fields.', 'パイナップルの像と畑のそばに立つ訪問者。', '파인애플 조형물과 밭 옆에 선 방문객들.'],
  D06: ['A large tree stands beside a golf fairway.', 'ゴルフのフェアウェイのそばに立つ大きな木。', '골프 페어웨이 옆에 서 있는 큰 나무.'],
  D07: ['A wooden sign identifying Alto Peak and Mt. Aminduen.', 'アルト・ピークとアミンドゥエン山の木製の標識。', '알토 피크와 아민두엔산을 나타내는 나무 표지판.'],
  D08: ['A visitor stands on a garden path below green mountains.', '緑の山を背景に、庭園の小道に立つ訪問者。', '푸른 산 아래 정원 길에 서 있는 방문객.'],
  D09: ['A swimming pool, palm trees and the bay at sunset.', '夕暮れのプール、ヤシの木と湾。', '해 질 무렵의 수영장과 야자수, 만.'],
} as const;
const photoPages = {
  D01: 'https://commons.wikimedia.org/wiki/File:Always_take_the_scenic_route.jpg',
  D02: 'https://shellwanders.com/a-locals-guide-to-things-to-do-in-ormoc-city/',
  D03: 'https://shellwanders.com/a-locals-guide-to-things-to-do-in-ormoc-city/',
  D04: 'https://shellwanders.com/ormoc-mangrove-eco-park-tourist-spot-in-ormoc/',
  D05: 'https://shellwanders.com/a-locals-guide-to-things-to-do-in-ormoc-city/',
  D06: 'https://mitch18malinao.blogspot.com/2014/03/tourist-spots.html',
  D07: 'https://shellwanders.com/a-locals-guide-to-things-to-do-in-ormoc-city/',
  D08: 'https://shellwanders.com/a-locals-guide-to-things-to-do-in-ormoc-city/',
  D09: 'https://philippinetravelnotes.blogspot.com/2016/04/sabin-resort-hotel-overnight.html',
} as const;
type PhotoId = keyof typeof featuredPreviewAssets;
const additionalPhotos = {
  D01: { page: 'https://commons.wikimedia.org/wiki/File:Lake_Danao.jpg', credit: 'Brenda Bonjoc · CC BY-SA 2.0 · 2008', description: ['A lakeside shelter looks out over the water and hills.', '湖畔の小屋から水面と丘を望む。', '호숫가 쉼터에서 물과 언덕이 보인다.'] },
  D03: { page: photoPages.D03, credit: 'Source: Shellwanders', description: ['A still lake reflects a green hillside.', '静かな湖に緑の丘が映る。', '고요한 호수에 푸른 언덕이 비친다.'] },
  D04: { page: photoPages.D04, credit: 'Source: Shellwanders', description: ['A lit boardwalk reaches across the mangrove shoreline.', 'マングローブの海岸に明かりのついた遊歩道が延びる。', '맹그로브 해안을 따라 불이 켜진 산책로가 뻗어 있다.'] },
  D05: { page: 'https://chillandtravel.com/ormoc-tourist-spots/', credit: 'Ormoc News and Updates · via Chill and Travel', description: ['A plantation sign beside a green field.', '緑の畑のそばに立つ農園の標識。', '푸른 밭 옆에 선 농장 표지판.'] },
  D06: { page: 'https://nickileodion.blogspot.com/2011/06/ormoc-city.html', credit: 'Source: Ormoc City blog', description: ['A line of trees borders a green golf course.', '緑のゴルフコースに木々が並ぶ。', '푸른 골프장 가장자리에 나무가 줄지어 있다.'] },
  D07: { page: photoPages.D07, credit: 'Source: Shellwanders', description: ['Mountain ridges stretch into the distance beneath clouds.', '雲の下に山の尾根が遠くまで続く。', '구름 아래 산등성이가 멀리 이어진다.'] },
  D09: { page: 'https://www.dutchpickle.com/philippines/leyte/sabin-resort-hotel.html', credit: 'Source: Dutchpickle', description: ['A waterfront walkway and benches beside palm trees.', 'ヤシの木のそばにある水辺の遊歩道とベンチ。', '야자수 옆 물가 산책로와 벤치.'] },
} as const;
function hasAdditionalPhoto(id: DestinationId): id is keyof typeof additionalPhotos { return id in additionalPhotos; }
function hasPhoto(id: DestinationId): id is PhotoId { return id in featuredPreviewAssets; }
export function previewStoryContent(id: DestinationId): readonly RingContent[] {
  const chapters = developmentFeaturedStories[id].chapters;
  if (!hasPhoto(id)) return chapters;
  const description = descriptions[id];
  const alt = { en: value(description[0]), ja: value(description[1]), ko: value(description[2]) };
  const overview: RingContent = { id: 'overview', role: 'overview', approved: {
    title: { en: value(en.featuredResearch.stories[id][0].title), ja: value(ja.featuredResearch.stories[id][0].title), ko: value(ko.featuredResearch.stories[id][0].title) },
    body: { en: value(en.featuredResearch.stories[id][0].body), ja: value(ja.featuredResearch.stories[id][0].body), ko: value(ko.featuredResearch.stories[id][0].body) },
    presentation: 'story', media: [{ id: `${id}-preview`, source: featuredPreviewAssets[id],
      credit: id === 'D01' ? 'Hydrochic · CC BY-SA 4.0 · 2017' : id === 'D09' ? 'Source: Philippine Travel Notes' : id === 'D06' ? 'Source: Ormoc City blog' : 'Source: Shellwanders',
      rightsReference: photoPages[id], approvalReference: draft, alt, caption: alt }, ...(!hasAdditionalPhoto(id) ? [] : (() => {
        const photo = additionalPhotos[id];
        const description = photo.description;
        const localized = { en: value(description[0]), ja: value(description[1]), ko: value(description[2]) };
        return [{ id: `${id}-preview-extra`, source: additionalPreviewAssets[id], credit: photo.credit,
          rightsReference: photo.page, approvalReference: draft, alt: localized, caption: localized }];
      })())],
  } };
  return [overview, ...chapters.slice(1)];
}
