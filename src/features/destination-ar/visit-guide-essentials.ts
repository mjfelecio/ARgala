import type { DestinationId } from '@/features/destinations/catalog';
import type { ExhibitGuideSection } from './ring-content';

// Short display copy from the bundled visitor guides. The reader uses the
// original approved wording and keeps the provenance of that source.
type Essentials = Record<ExhibitGuideSection, string | readonly string[]>;
export const visitGuideEssentials: Record<DestinationId, Record<'en' | 'ja' | 'ko', Essentials>> = {
  D01: {
    en: {
      arrival: 'Use the entrance by the viewing deck in Barangay Danao.',
      bestTime: 'Visit in daylight. Ask staff about weather and water conditions.',
      activities: ['Viewing deck and picnics', 'Kayaks, boats and floating cottages'],
      preparation: ['Bring water and sun/rain gear.', 'Wear a fitted life jacket on boats and floating cottages.'],
      safety: ['Drowning risk: swim only inside the rope line, if safe. Watch children and follow staff.'],
    },
    ja: {
      arrival: 'バランガイ・ダナオの展望デッキ脇の入口へ。',
      bestTime: '明るいうちに訪問。天候と水辺の状況は係員に確認。',
      activities: ['展望デッキとピクニック', 'カヤック、ボート、水上コテージ'],
      preparation: ['飲料水と日よけ・雨具を持参。', 'ボートや水上コテージでは体に合った救命胴衣を着用。'],
      safety: ['深い湖で溺れる危険があります。安全な時だけロープ内で泳ぎ、子どもを見守り、係員に従う。'],
    },
    ko: {
      arrival: '다나오 바랑가이 전망 데크 옆 입구를 이용하세요.',
      bestTime: '낮에 방문하고 날씨와 물 상태를 직원에게 확인하세요.',
      activities: ['전망 데크와 피크닉', '카약, 보트, 수상 오두막'],
      preparation: ['물과 햇빛·비 대비용품을 챙기세요.', '보트와 수상 오두막에서는 몸에 맞는 구명조끼를 입으세요.'],
      safety: ['깊은 물에 빠질 위험이 있습니다. 안전할 때만 로프 안에서 수영하고 아이를 지켜보며 직원 지시를 따르세요.'],
    },
  },
  D02: {
    en: {
      arrival: 'Walk from the basketball court at Maglahug road end, Ga-as.',
      bestTime: 'Start early. Allow about an hour to hike and time to return in daylight.',
      activities: ['Guided hike', 'Lake views and photos from firm ground'],
      preparation: ['Book a guide and confirm check-in.', 'Pack water, rain gear and first aid. Wear grippy shoes.'],
      safety: ['Walk only beyond the road end. Avoid private land and unstable banks. Ask before swimming. Follow your guide.'],
    },
    ja: {
      arrival: 'ガアスのマグラフグ、道の終点のバスケットコート脇から徒歩。',
      bestTime: '朝早く出発。歩き約1時間を見込み、明るいうちに戻る。',
      activities: ['ガイド付きハイキング', '足場の安定した場所で湖の観賞と撮影'],
      preparation: ['ガイドを手配し、受付を確認。', '水、雨具、救急用品、滑りにくい靴を準備。'],
      safety: ['道の終点から徒歩のみ。私有地や崩れやすい岸を避け、遊泳の可否はガイドに確認。'],
    },
    ko: {
      arrival: '가아스 마글라후그 도로 끝 농구장 옆에서 걸어서 출발하세요.',
      bestTime: '일찍 출발하세요. 등산 약 1시간과 해 지기 전 돌아올 시간을 확보하세요.',
      activities: ['가이드 동행 하이킹', '단단한 지면에서 호수 감상과 촬영'],
      preparation: ['가이드를 예약하고 접수를 확인하세요.', '물·우비·구급용품과 미끄럼 방지 신발을 준비하세요.'],
      safety: ['도로 끝부터 도보만 가능합니다. 사유지와 불안정한 물가를 피하고 수영은 가이드에게 확인하세요.'],
    },
  },
  D03: {
    en: {
      arrival: 'Go to Lake Janagdan Staging Area in Cabintan. Confirm barangay check-in.',
      bestTime: 'Start early. Check trail and weather with your guide. Allow time to return.',
      activities: ['Guided hike', 'Lake views and photos from firm ground'],
      preparation: ['Confirm check-in and briefing.', 'Pack grippy shoes, long clothes, water, rain gear and first aid.'],
      safety: ['Use the agreed trail and firm banks. Ask before water activities. Watch for slips. Turn back if told.'],
    },
    ja: {
      arrival: 'カビンタンのジャナグダン集合地点へ。地区の受付を確認。',
      bestTime: '朝早く出発。天候と道の状態を確認し、帰りの時間に余裕を。',
      activities: ['ガイド付きハイキング', '足場の安定した場所で湖の観賞と撮影'],
      preparation: ['登録と説明の有無を確認。', '滑りにくい靴と長袖・長ズボン、水、雨具、救急用品を準備。'],
      safety: ['合意した道と安定した岸を通り、滑りに注意。水辺での活動はガイドに確認。指示があれば引き返す。'],
    },
    ko: {
      arrival: '카빈탄의 자나그단 집결지로 가세요. 바랑가이 접수를 확인하세요.',
      bestTime: '일찍 출발하고 가이드와 날씨·길 상태를 확인하세요. 돌아올 시간을 넉넉히 잡으세요.',
      activities: ['가이드 동행 하이킹', '단단한 지면에서 호수 감상과 촬영'],
      preparation: ['등록과 안전 안내를 확인하세요.', '미끄럼 방지 신발, 긴 옷, 물, 우비와 구급용품을 챙기세요.'],
      safety: ['정한 길과 단단한 물가만 이용하세요. 미끄럼 주의. 물놀이는 가이드에게 확인하고 지시에 따라 돌아서세요.'],
    },
  },
  D04: {
    en: {
      arrival: 'Use the park entrance in Barangay Naungan, Ormoc.',
      bestTime: 'Go in daylight, preferably morning or late afternoon. Check access and weather.',
      activities: ['Walk open paths.', 'Photograph mangroves and the shoreline.'],
      preparation: ['Bring water, sun protection and repellent.', 'Wear grippy shoes.'],
      safety: ['Stay on open paths. Wet surfaces slip. Keep off rails and mangrove roots, away from exposed water edges.'],
    },
    ja: {
      arrival: 'オルモックのバランガイ・ナウンガンの公園入口へ。',
      bestTime: '明るい時間帯の朝か夕方に。立入可否と天候を確認。',
      activities: ['開放された道を散策。', 'マングローブや岸辺を撮影。'],
      preparation: ['水、日よけ、虫よけを持参。', '滑りにくい靴を着用。'],
      safety: ['開放中の道を歩き、濡れた足元に注意。柵に登らず、根を踏まず、柵のない水際を避ける。'],
    },
    ko: {
      arrival: '오르모크 나웅안 바랑가이의 공원 입구를 이용하세요.',
      bestTime: '낮에 방문하세요. 아침이나 늦은 오후가 좋으며 출입과 날씨를 확인하세요.',
      activities: ['개방된 길 산책', '맹그로브와 해안 촬영'],
      preparation: ['물, 자외선 차단제와 벌레 기피제를 준비하세요.', '미끄럼 방지 신발을 신으세요.'],
      safety: ['개방된 길만 이용하세요. 젖은 곳은 미끄럽습니다. 난간에 오르거나 뿌리를 밟지 말고 물가를 피하세요.'],
    },
  },
  D05: {
    en: {
      arrival: 'Use the giant pineapple entrance on Ormoc Diversion Road in Biliboy.',
      bestTime: 'Go early or late to avoid heat. There is little shade. Finish before dark.',
      activities: ['Walk or jog on clear paths.', 'Photograph the landmark and fields from outside planted rows.'],
      preparation: ['Bring water, a hat and sun protection.', 'Wear walking shoes.'],
      safety: ['Keep off crops and rows. Never pick fruit. Watch for vehicles and leave farm access open.'],
    },
    ja: {
      arrival: 'ビリボイの迂回道路沿い、巨大パイナップルが目印の入口へ。',
      bestTime: '日陰がほとんどないため朝か夕方に。日没前に退出。',
      activities: ['通れる道を散歩・ジョギング。', '畝に入らず目印や畑を撮影。'],
      preparation: ['水、帽子、日よけを持参。', '歩きやすい靴を着用。'],
      safety: ['作物や畝を踏まず、果実を採らない。車に注意し、農作業の通路をふさがない。'],
    },
    ko: {
      arrival: '빌리보이 오르모크 우회도로의 대형 파인애플 입구를 이용하세요.',
      bestTime: '그늘이 거의 없어 이른 아침이나 늦은 오후에 방문하고 해 지기 전에 마치세요.',
      activities: ['통행 가능한 길에서 걷기와 조깅', '작물 줄 밖에서 조형물과 밭 촬영'],
      preparation: ['물, 모자, 자외선 차단용품을 챙기세요.', '걷기 편한 신발을 신으세요.'],
      safety: ['작물과 이랑을 밟거나 열매를 따지 마세요. 차량을 조심하고 농작업 통로를 비워 두세요.'],
    },
  },
  D06: {
    en: {
      arrival: 'Check in at the marked club registration area in San Antonio / Mabini.',
      bestTime: 'Agree on a time with the club and check weather before travelling.',
      activities: ['Golf by club permission only.', 'Enjoy views from authorized areas.'],
      preparation: ['Confirm guest rules, booking and fees.', 'Bring water, sun protection and club-approved attire.'],
      safety: ['Course access by permission. Watch for balls and carts. At thunder, stop and seek a solid building.'],
    },
    ja: {
      arrival: 'サンアントニオ／マビニ地区のクラブ受付で手続き。',
      bestTime: 'クラブと時間を調整し、出発前に天候を確認。',
      activities: ['クラブの許可を得てゴルフ。', '許可された場所から景色を観賞。'],
      preparation: ['利用条件、予約、料金を確認。', '水と日よけ、規定に合う服装を準備。'],
      safety: ['コースは許可制。球やカートに注意。雷の際は屋外活動をやめ、頑丈な建物へ避難。'],
    },
    ko: {
      arrival: '산안토니오·마비니 지역의 클럽 등록처에서 접수하세요.',
      bestTime: '클럽과 시간을 정하고 출발 전 날씨를 확인하세요.',
      activities: ['클럽 허가를 받은 경우에만 골프', '허용된 구역에서 풍경 감상'],
      preparation: ['이용 조건·예약·요금을 확인하세요.', '물, 자외선 차단용품과 규정에 맞는 복장을 준비하세요.'],
      safety: ['코스 출입은 허가가 필요합니다. 공과 카트를 조심하세요. 천둥이 치면 활동을 멈추고 튼튼한 건물로 대피하세요.'],
    },
  },
  D07: {
    en: {
      arrival: 'Use the SULFATARA trailhead, not the summit. Confirm check-in.',
      bestTime: 'Use a guide-approved weather window. Postpone in heavy rain or unsafe conditions.',
      activities: ['Strenuous guided trek', 'Mountain views from safe stops'],
      preparation: ['Confirm route and permits.', 'Pack boots, rope gloves, water, rain gear, a headlamp and first aid.'],
      safety: ['Steep, slippery trail. Scrambling or ropes may be needed. Stay with your guide. Turn back if unsafe.'],
    },
    ja: {
      arrival: '山頂ではなくスルファタラ登山口へ。受付はガイドに確認。',
      bestTime: '天候と出発時間はガイドと相談。大雨や危険時は延期。',
      activities: ['ガイド付きの本格登山', '安全な場所で山の景色を観賞'],
      preparation: ['ルート、許可、引き返す時刻を確認。', '滑りにくい靴、ロープ用手袋、水、雨具、ライト、救急用品を準備。'],
      safety: ['急で滑りやすく、岩登りやロープが必要な場合も。ガイドと行動し、危険なら引き返す。'],
    },
    ko: {
      arrival: '정상 대신 술파타라 등산로 입구로 가세요. 접수는 가이드에게 확인하세요.',
      bestTime: '가이드와 날씨·출발 시간을 정하세요. 폭우나 위험한 상황에는 연기하세요.',
      activities: ['가이드 동행 고난도 산행', '안전한 곳에서 산 풍경 감상'],
      preparation: ['경로·허가·하산 시각을 확인하세요.', '등산화, 로프용 장갑, 물, 우비, 헤드램프와 구급용품을 챙기세요.'],
      safety: ['길이 가파르고 미끄러워 암벽을 오르거나 로프가 필요할 수 있습니다. 가이드와 함께하고 위험하면 돌아서세요.'],
    },
  },
  D08: {
    en: {
      arrival: 'Use the Heaven’s Peak garden entrance in Barangay Cabintan.',
      bestTime: 'Choose daylight and fair weather. Confirm opening and admission.',
      activities: ['Garden paths and mountain views', 'Take photos outside planted borders.'],
      preparation: ['Bring water, sun/rain gear and grippy shoes.', 'Plan return transport.'],
      safety: ['Wet paths can be slippery. Stay on paths, keep children close and follow staff.'],
    },
    ja: {
      arrival: 'バランガイ・カビンタンのヘブンズピーク庭園入口へ。',
      bestTime: '晴れた日の明るいうちに。開園と入場条件を確認。',
      activities: ['庭園の散策と山の眺め', '植え込みに入らず撮影。'],
      preparation: ['水、日よけ・雨具、滑りにくい靴を準備。', '帰りの交通手段を確保。'],
      safety: ['濡れた道は滑りやすい。道から外れず、子どもを近くに。係員の指示に従う。'],
    },
    ko: {
      arrival: '카빈탄 바랑가이의 헤븐스 피크 정원 입구를 이용하세요.',
      bestTime: '날씨가 좋은 낮에 방문하세요. 운영과 입장 조건을 확인하세요.',
      activities: ['정원 산책과 산 전망 감상', '화단 밖에서 촬영'],
      preparation: ['물, 햇빛·비 대비용품과 미끄럼 방지 신발을 챙기세요.', '돌아올 교통편을 정하세요.'],
      safety: ['젖은 길은 미끄럽습니다. 길에서 벗어나지 말고 아이를 가까이 두며 직원 안내를 따르세요.'],
    },
  },
  D09: {
    en: {
      arrival: 'Use the Sabin Resort Hotel entrance in Bantigue and report to staff.',
      bestTime: 'Agree on a time with the hotel. Visit the bayfront in daylight if permitted.',
      activities: ['Bayfront views in permitted areas', 'Stay, dine or gather by arrangement.'],
      preparation: ['Confirm bookings and facility access.', 'Bring sun/rain gear and suitable shoes.'],
      safety: ['Use approved areas only. Watch children near water or wet floors. Ask staff before swimming.'],
    },
    ja: {
      arrival: 'バンティゲのサビン・リゾートホテル入口で係員へ。',
      bestTime: 'ホテルと時間を調整。湾岸は許可を得て明るいうちに。',
      activities: ['許可された湾岸から景色を観賞。', '宿泊、食事、集まりは事前に手配。'],
      preparation: ['予約と施設の利用可否を確認。', '日よけ、雨具、歩きやすい靴を準備。'],
      safety: ['許可区域のみ。水辺や濡れた床では子どもに注意。遊泳やプールの利用は係員に確認。'],
    },
    ko: {
      arrival: '반티게의 사빈 리조트 호텔 입구에서 직원에게 방문을 알리세요.',
      bestTime: '호텔과 시간을 정하세요. 허용되는 경우 낮에 해안가를 방문하세요.',
      activities: ['허용된 곳에서 만 전망 감상', '사전에 정한 숙박, 식사 또는 모임'],
      preparation: ['예약과 시설 이용 가능 여부를 확인하세요.', '햇빛·비 대비용품과 알맞은 신발을 챙기세요.'],
      safety: ['허용 구역만 이용하세요. 물가와 젖은 바닥에서 아이를 지켜보세요. 수영과 수영장 이용은 직원에게 확인하세요.'],
    },
  },
  D10: {
    en: {
      arrival: 'The campus is on Lilia Avenue in Barangay Cogon, Ormoc City, Leyte.',
      bestTime: 'Message the college’s official Facebook page before setting out to check visitor access and that day’s hours.',
      activities: ['From the public side of Lilia Avenue, look through the front fence for the orange tower and the white ACLC lettering.'],
      preparation: ['Ask staff at the gate before entering or taking photographs on campus.'],
      safety: ['Step clear of the driveway and stop walking before opening the AR view.'],
    },
    ja: {
      arrival: 'キャンパスはレイテ州オルモック市コゴン地区のリリア通りにあります。',
      bestTime: '見学できる時間や入構の可否は、出発前に学校の公式Facebookページでお問い合わせください。',
      activities: ['リリア通りの公道側から正面の柵越しに、オレンジ色の塔と白い「ACLC」の文字が見えます。'],
      preparation: ['構内に入るときや校内で撮影するときは、門の職員にお尋ねください。'],
      safety: ['車の出入口を避け、立ち止まってからARを開いてください。'],
    },
    ko: {
      arrival: '캠퍼스는 레이테주 오르모크시 코곤 바랑가이의 릴리아 애비뉴에 있습니다.',
      bestTime: '방문 전 학교 공식 페이스북 페이지로 그날의 방문 가능 여부와 시간을 문의하세요.',
      activities: ['릴리아 애비뉴의 공도에서 정문 울타리 너머를 바라보면 주황색 탑과 흰색 ACLC 글씨가 보입니다.'],
      preparation: ['교내에 들어가거나 안에서 사진을 찍기 전에는 정문 직원에게 먼저 문의하세요.'],
      safety: ['차량 출입구를 피해 잠시 멈춘 뒤 AR 화면을 여세요.'],
    },
  },
};
