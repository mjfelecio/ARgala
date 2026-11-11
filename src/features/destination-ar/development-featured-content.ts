import type { DestinationId } from '@/features/destinations/catalog';
import type { RingContent } from './ring-content';
import en from '@/i18n/locales/en.json';

/** Research previews only. Never used for catalog approval or admission. */
const sources: Record<DestinationId, readonly string[]> = {
  D01: ['https://r8.emb.gov.ph/wp-content/uploads/2026/04/NOTICE_PDS-Lake-Danao-Natural-Park.pdf', 'https://repository.nfrdi.da.gov.ph/items/831d2e6a-1789-44d7-9d88-6a9698ac179e', 'https://ldr.senate.gov.ph/subject/lake-danao'],
  D02: ['https://www.scribd.com/document/726426948/2022-Ecological-Profile-Ormoc-City'],
  D03: ['https://www.scribd.com/document/726426948/2022-Ecological-Profile-Ormoc-City', 'https://shellwanders.com/a-locals-guide-to-things-to-do-in-ormoc-city/'],
  D04: ['https://ormoccityenvironment.org/wp-content/uploads/2023/08/BPOAML-of-Naungan-Ormoc-City_18May2023.pdf', 'https://mangroveecology.com/wp-content/uploads/2019/03/mangrove-summit-proceedings-central-and-eastern-visayas_final_for-web.pdf'],
  D05: ['https://www.ormocautorental.com/category/uncategorized/', 'https://shellwanders.com/a-locals-guide-to-things-to-do-in-ormoc-city/', 'https://www.vsu.edu.ph/vsu/21-content-main/informational/1744-distribution-of-queen-pineapple-in-region-v-viii-philippines', 'https://www.sunstar.com.ph/superbalita-cebu/balita/ormoc-city-pia-festival-sa-dominggo'],
  D06: ['https://www.1golf.eu/en/club/leyte-golf-country-club/'],
  D07: ['https://shellwanders.com/a-locals-guide-to-things-to-do-in-ormoc-city/'],
  D08: ['https://shellwanders.com/how-to-get-to-heavens-peak-ormoc/'],
  D09: ['https://tamstardot8.com/accreditations/establishment-info/2', 'https://www.sabinhotelormoc.com/'],
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
