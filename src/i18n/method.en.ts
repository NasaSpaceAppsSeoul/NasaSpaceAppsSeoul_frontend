import type { MethodMessages } from "./method.ko";

/* 기법 페이지 영어 문구. 한글(`method.ko.ts`)과 같은 사실을 옮긴다. 어조는 한글처럼 격식 있는 서술체 */
export const methodEn: MethodMessages = {
  back: "← Back to overview",
  eyebrow: "How it works",
  title: "One scale for 25 years of fire.",
  lead:
    "When the satellites changed in 2012, the same fires began to be detected far more often. Burnline puts MODIS and VIIRS " +
    "on one scale, and every region goes through the same notebook and the same validation. It currently covers South Korea, " +
    "California and British Columbia. A new region runs the same computation from its boundaries, satellite data and one " +
    "line of settings, and is then added to the server and the site by its region code.",
  stats: [
    {
      id: "break",
      value: { before: "≈ ", accent: "1.00×", after: "" },
      sub:
        "Jump at the 2012 sensor switch after harmonization: 0.99–1.02× in every region (2.06–2.61× before). " +
        "Ratio after vs before 2012, measured against the MODIS-only record",
    },
    {
      id: "areas",
      value: { before: "3 regions · ", accent: "315", after: " areas" },
      sub: "Every month: whole regions since 2001; districts, counties and regional districts since 2012",
    },
    {
      id: "detection",
      value: { before: "", accent: "86–93%", after: "" },
      sub:
        "Share of official fires over 100 ha seen by satellite within 2 days. Shifting the dates by 30 days gives 3–54%, " +
        "so the gap is what to read",
    },
  ],
  statsLabel: "Key figures",
  tocLabel: "Contents",
  question: {
    index: "01",
    toc: "The question",
    title: "The question we answer",
    lead:
      "Is this place burning more than usual this month? We answer with one chip by comparing it with the satellite " +
      "record for the same month in past years. Where fire is rare, the area borrows the judgment of the level above.",
    items: [
      {
        title: "What we do",
        body: [
          "Since 2001, we bring the fire seen by satellite each month onto the NOAA-20 scale and compare it with the same " +
            "month in past years. The judgment rules and validation methods are the same for every region.",
        ],
      },
      {
        title: "What we don't do",
        body: [
          "We do not produce fire counts or burned area. Each region's official records are shown alongside, with their " +
            "source. Satellites detect not only wildfires but also crop burning and land-clearing fires.",
        ],
      },
      {
        title: "Why it's hard",
        body: [
          "When the sensors switched from MODIS to VIIRS in 2012, the same fires began to be detected far more often. " +
            "Joining the raw values makes the years after 2012 look 2.06–2.61× more fiery. Fire did not increase; the " +
            "satellites changed to ones with higher resolution.",
          "2012 was not the only switch. Aqua joined in 2002, the record moved to NOAA-20 in 2018, and new S-NPP data " +
            "stopped in November 2026. Satellites will keep being replaced, so the record needed a procedure that joins " +
            "it the same way at every switch.",
        ],
      },
    ],
  },
  data: {
    index: "02",
    toc: "Data",
    title: "Data",
    lead:
      "The measurement is NASA FIRMS satellite fire detection. Official wildfire records, where a region has them, are " +
      "used only to validate the results and are not part of any indicator.",
    figure: {
      title: "When each satellite is used",
      sub: "The same periods apply to every region",
      label:
        "Periods each satellite is used in Burnline: Terra from November 2000, Aqua together with it from July 2002 to " +
        "January 2012, S-NPP from February 2012 to March 2018, NOAA-20 from April 2018 to now, NOAA-21 as a backup from March 2023",
      backup: "backup",
      caption:
        "NASA FIRMS · MODIS C6.1, VIIRS C2 · Standard product (SP) for history, near real-time (NRT) only for recent months without SP",
    },
    whyTitle: "Why these sources",
    items: [
      {
        title: "FIRMS",
        body: [
          "A public active-fire record that has observed the whole globe with the same processing since 2000. Any region " +
            "can therefore run through the same computation.",
        ],
      },
      {
        title: "NOAA-20 as the reference",
        body: [
          "It is operating now, so new months enter the record without correction. NOAA-20 was launched in 2017 and has " +
            "passed its 7-year design life, and NOAA has designated NOAA-21 as the primary satellite. In case NOAA-20 " +
            "stops, we keep a backup coefficient that converts NOAA-21 values to the NOAA-20 scale.",
        ],
      },
      {
        title: "Official records only for validation",
        body: [
          "Agencies count differently. The Korea Forest Service counts wildfires only, and CAL FIRE's perimeter data " +
            "centres on large fires with mapped perimeters. Many do not publish monthly data. They are therefore not used " +
            "in the indicators, and regions without official records can still be added.",
        ],
      },
      {
        title: "Open boundaries",
        body: [
          "geoBoundaries by default, or a finer official set where it fits better (BC's 28 regional districts from the " +
            "BC Data Catalogue). Yeonggwang County is missing from the Korean geoBoundaries file, so it was filled in as the " +
            "area left after removing the other counties from South Jeolla (some islands excluded). Gunwi County is assigned " +
            "to Daegu, following its transfer in July 2023.",
        ],
      },
    ],
    table: {
      caption: "Areas and official records used for validation, by region",
      head: ["Region", "Areas", "Official record (validation)"],
      rows: [
        {
          key: "KOR",
          cells: [
            "South Korea",
            "17 provinces · 229 districts",
            "Korea Forest Service fire records, 7,628 (2011-01 – 2026-11); KOSIS fire counts by province (2001 – 2025)",
          ],
        },
        { key: "CAL", cells: ["California", "58 counties", "CAL FIRE FRAP fire perimeters, 8,686 (2001 – 2025)"] },
        {
          key: "BC",
          cells: ["British Columbia", "28 regional districts", "BC Wildfire Service records, 42,170 (2001-01 – 2026-03)"],
        },
      ],
    },
  },
};
