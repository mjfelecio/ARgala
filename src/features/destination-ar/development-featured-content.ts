import type { DestinationId } from '@/features/destinations/catalog';
import type { RingContent } from './ring-content';
import en from '@/i18n/locales/en.json';

const sources: Record<DestinationId, readonly string[]> = {
  "D01": [
    "https://lawphil.net/executive/proc/proc1998/proc_1155_1998.html",
    "https://lawphil.net/statutes/repacts/ra2018/ra_11038_2018.html",
    "https://repository.nfrdi.da.gov.ph/bitstreams/08815a7b-47f7-43cb-a578-6dea25c6bdc4/download",
    "https://basicresearch.nrcp.dost.gov.ph/supported_programs_and_projects/details/308",
    "https://tribune.net.ph/amp/story/2026/08/31/ormoc-reopens-lake-danao-natural-park-after-11-month-rehabilitation",
    "https://ormoc.gov.ph/assets/docs/investment.pdf",
    "https://commons.wikimedia.org/wiki/File:Always_take_the_scenic_route.jpg",
    "https://commons.wikimedia.org/wiki/File:Lake_Danao.jpg",
    "https://www.scribd.com/document/726426948/2022-Ecological-Profile-Ormoc-City",
    "https://r8.emb.gov.ph/wp-content/uploads/2026/04/NOTICE_PDS-Lake-Danao-Natural-Park.pdf"
  ],
  "D02": [
    "https://ormoc.gov.ph/assets/docs/investment.pdf",
    "https://www.scribd.com/document/726426948/2022-Ecological-Profile-Ormoc-City",
    "https://www.tripzilla.ph/adventurers-guide-ormoc-city-leyte/11576",
    "https://www.leytesamardailynews.com/major-road-project-set-to-enhance-tourism-in-ormoc-city/",
    "https://shellwanders.com/how-to-get-to-lake-kasudsuran-and-other-faqs/",
    "https://mapcarta.com/W28445863",
    "https://shellwanders.com/a-locals-guide-to-things-to-do-in-ormoc-city/"
  ],
  "D03": [
    "https://ormoc.gov.ph/assets/docs/investment.pdf",
    "https://www.scribd.com/document/726426948/2022-Ecological-Profile-Ormoc-City",
    "https://www.scribd.com/document/678595400/Cabintan-Reso-2022-40",
    "https://www.pna.gov.ph/articles/1048242",
    "https://shellwanders.com/how-to-get-to-lake-janagdan-budget-expenses/",
    "https://www.pinoymountaineer.com/2008/02/alto-peak-1332.html",
    "https://mapcarta.com/W28445862",
    "https://shellwanders.com/a-locals-guide-to-things-to-do-in-ormoc-city/",
    "https://bluelineph.com/lake-janagdan/"
  ],
  "D04": [
    "https://ormoc.gov.ph/assets/docs/investment.pdf",
    "https://ormoccityenvironment.org/wp-content/uploads/2023/08/BPOAML-of-Naungan-Ormoc-City_18May2023.pdf",
    "https://mangroveecology.com/wp-content/uploads/2019/03/3.-state-of-the-mangrove.pdf",
    "https://ormoccityenvironment.org/marine-litter-reduction/",
    "https://shellwanders.com/ormoc-mangrove-eco-park-tourist-spot-in-ormoc/",
    "https://www.scribd.com/document/726426948/2022-Ecological-Profile-Ormoc-City"
  ],
  "D05": [
    "https://ormoc.gov.ph/assets/docs/investment.pdf",
    "https://www.vsu.edu.ph/articles/news/21-content-main/informational/1744-distribution-of-queen-pineapple-in-region-v-viii-philippines",
    "https://pia.gov.ph/news/pina-festival-remains-ormoc-citys-primary-economic-driver/",
    "https://phworldexpo.tpb.gov.ph/queen-pineapple/",
    "https://pia.gov.ph/news/colors-culture-pride-shine-at-ormoc-citys-pina-festival/",
    "https://www.ormocautorental.com/your-ultimate-guide-to-ormoc-city/",
    "https://shellwanders.com/a-locals-guide-to-things-to-do-in-ormoc-city/",
    "https://chillandtravel.com/ormoc-tourist-spots/",
    "https://www.facebook.com/OrmocNU/posts/pfbid0eMPRUVWt8wSMXhypntVWiakrK3B1EBEv8eqt2MAdVWateDTVu15Ty6R3JiYAaSs1l",
    "https://www.scribd.com/document/726426948/2022-Ecological-Profile-Ormoc-City"
  ],
  "D06": [
    "https://ormoc.gov.ph/assets/docs/investment.pdf",
    "https://www.1golf.eu/en/club/leyte-golf-country-club/",
    "https://golfph.com/golf-courses/leyte-golf-and-country-club/",
    "https://tribune.net.ph/2026/10/16/11-courses-18-days-one-epic-golf-journey",
    "https://mitch18malinao.blogspot.com/2014/03/tourist-spots.html",
    "https://nickileodion.blogspot.com/2011/06/ormoc-city.html",
    "https://leytecc.com/",
    "https://eia.emb.gov.ph/?page_id=8009"
  ],
  "D07": [
    "https://ormoc.gov.ph/assets/docs/investment.pdf",
    "https://pia.gov.ph/news/study-identifies-over-10-3k-hectares-in-leyte-as-potential-philippine-eagle-release-sites/",
    "https://www.philippineeaglefoundation.org/post/new-study-identifies-where-philippine-eagles-can-thrive-again-in-leyte-gis-based-research-maps-more",
    "https://www.ormoc.gov.ph/new_site/",
    "https://mynaturetrip.wordpress.com/2022/07/27/alto-peak-the-marvelous-summit-of-mt-aminduen/",
    "https://shellwanders.com/how-to-get-to-mt-aminduens-alto-peak-in-ormoc-budget-expenses/",
    "https://shellwanders.com/a-locals-guide-to-things-to-do-in-ormoc-city/",
    "https://www.scribd.com/document/678595400/Cabintan-Reso-2022-40"
  ],
  "D08": [
    "https://ormoc.gov.ph/assets/docs/investment.pdf",
    "https://shellwanders.com/how-to-get-to-heavens-peak-ormoc/",
    "https://shellwanders.com/a-locals-guide-to-things-to-do-in-ormoc-city/",
    "https://www.aciar.gov.au/sites/default/files/2022-08/AGB-2017-039-final-report.pdf",
    "https://www.scribd.com/document/678595400/Cabintan-Reso-2022-40",
    "https://ph.trip.com/travel-guide/attraction/ormoc/heaven-s-peak-138126754/",
    "https://www.google.com/maps/d/embed?mid=1iE8iJNvDaNOy91s3RGkmonCs-T4zTP71"
  ],
  "D09": [
    "https://ormoc.gov.ph/assets/docs/investment.pdf",
    "https://tamstardot8.com/accreditations/establishment-info/2",
    "https://sabinresorthotel.com/about-sabin-resort-hotel/",
    "https://sabinresorthotel.com/services-and-facilities/",
    "https://philippinetravelnotes.blogspot.com/2016/04/sabin-resort-hotel-overnight.html",
    "https://www.dutchpickle.com/philippines/leyte/sabin-resort-hotel.html",
    "https://www.sabinhotelormoc.com/",
    "https://www.sabinhotelormoc.com/contactus/"
  ]
};
export const developmentFeaturedStories = Object.fromEntries(
  (Object.keys(sources) as DestinationId[]).map(id => [id, {
    sources: sources[id],
    chapters: en.featuredResearch.stories[id].map((_, index): RingContent => ({
      id: index === 0 ? 'overview' : `chapter-${index + 1}`,
      ...(index === 0 ? { role: 'overview' as const } : {}),
      titleKey: `featuredResearch.stories.${id}.${index}.title`,
      bodyKey: `featuredResearch.stories.${id}.${index}.body`,
    })),
  }]),
) as unknown as Record<DestinationId, { sources: readonly string[]; chapters: readonly RingContent[] }>;
