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
  countryTabs: { label: "Choose a region", KOR: "South Korea", CAL: "California", BC: "BC" },
  cell: {
    index: "03",
    toc: "Fire cells",
    title: "Fire cells: what we count",
    lead:
      "A fire cell is one 0.01° square (about 1 km) on one local day. If a satellite detects fire in that square on that day at " +
      "least once, it counts as 1.",
    figure: {
      title: "Same fire, different points, same number of cells",
      sub: "VIIRS records far more points, but both satellites collapse into the same cells",
      modis: { name: "MODIS", count: "4 points → 3 cells", label: "MODIS: 4 points fall in 3 cells" },
      viirs: { name: "VIIRS", count: "19 points → 3 cells", label: "VIIRS: 19 points fall in the same 3 cells" },
      caption: "Illustrative example, not real detections",
    },
    whyTitle: "Why count cells",
    items: [
      {
        title: "Cells, not points",
        body: [
          "VIIRS (375 m) records a fire 1 km across as about 7 points; MODIS (1 km) records it as 1. Counting points would turn a " +
            "sensor upgrade into an increase in fire.",
        ],
      },
      {
        title: "Once per day",
        body: [
          "Satellites pass over a different number of times per day. Counting each cell once per day keeps that difference out of the value.",
        ],
      },
      {
        title: "Day and night together",
        body: [
          "In South Korea, 46% of VIIRS fire cells were detected only at night, and the April 2019 Goseong fire had 0 day cells and " +
            "47 night cells. Counting daytime only would lower South Korea's monthly R² from 0.92 to 0.78.",
        ],
      },
      {
        title: "Not fire counts",
        body: [
          "One wildfire can produce hundreds of fire cells: the March 2025 Uiseong fire produced 438 in Uiseong County alone. " +
            "A cell means there was fire somewhere within that 1 km², not that the whole cell burned.",
        ],
      },
    ],
    gridTitle: "How the cell size was chosen",
    gridLead:
      "Over the overlap period (2012–2025) we predicted S-NPP values from MODIS values and compared four cell sizes. The better " +
      "the fit, the more the two satellites count the same thing at that size.",
    gridTable: {
      caption: "Fit of S-NPP values predicted from MODIS values, by cell size",
      head: ["Cell", "South Korea monthly R² · annual error", "California", "BC"],
      rows: [
        { key: "0.1", cells: ["0.1° (about 10 km)", "0.74 · 16.3%", "0.95 · 7.3%", "0.98 · 5.3%"] },
        { key: "0.05", cells: ["0.05°", "0.78 · 15.8%", "0.97 · 6.8%", "0.98 · 5.7%"] },
        { key: "0.02", cells: ["0.02°", "0.89 · 14.4%", "0.98 · 7.2%", "0.98 · 7.1%"] },
        { key: "0.01", cells: ["0.01° (used)", "0.92 · 14.9%", "0.98 · 7.4%", "0.96 · 8.6%"], highlight: true },
      ],
    },
    gridBody: [
      "The product is a monthly calendar, so monthly R² came first. The 0.5-point gap in annual error between 0.02° and 0.01° is " +
        "smaller than the year-to-year chance variation. 1 km matches the MODIS pixel size, and smaller cells straddle fewer district " +
        "boundaries. With large cells, everyday small fires and a large wildfire share a cell: March 2025 in South Korea looks 2.3× " +
        "normal at 0.1° but 8.6× at 0.01°.",
      "The cell size was chosen on Korean data and is used for every region. In BC, 0.01° has the lowest monthly R² and the highest " +
        "annual error of the four sizes. A team review also pointed out that smaller cells give larger values and so less relative " +
        "noise, and that national monthly R² is dominated by the seasonal cycle, so R² alone cannot settle the cell size. The cell " +
        "size was not revisited.",
    ],
    filterTitle: "Filters applied before counting",
    filterTable: {
      caption: "Rules applied before counting fire cells",
      head: ["Rule", "Applied"],
      rows: [
        {
          key: "static",
          cells: [
            "Non-fire heat sources",
            "The standard product keeps vegetation fires (type 0) only. Cells of about 2 km where static sources (type 2) or offshore " +
              "and port sources (type 3) were detected on 3 or more different days in the standard products of all four satellites " +
              "are removed from both the standard and near real-time data.",
          ],
        },
        { key: "confidence", cells: ["Confidence", "MODIS 30 or more, VIIRS nominal or high"] },
        {
          key: "outside",
          cells: [
            "Outside the region",
            "For California and BC, detections outside the state or province boundary (neighbouring states, countries and sea) are " +
              "removed. Sub-areas are assigned by the cell centre; cells at sea or outside the boundaries count only toward the regional total.",
          ],
        },
        {
          key: "date",
          cells: [
            "Local date",
            "FIRMS times are in UTC. Converting to UTC + longitude ÷ 15 hours (solar time) keeps South Korea's 1–3 a.m. night " +
              "passes from falling on the previous day.",
          ],
        },
      ],
    },
    change: {
      title: "What changed: the static-source mask",
      body: [
        "At first we removed cells with 3 or more static-source points. But a large fire produces more than 3 points in a single day, " +
          "so some real wildfires were being removed as factories. Changing the rule to 3 or more different days raised the April " +
          "2019 Goseong fire from 25 to 28 cells and the same-day Gangneung–Donghae fire from 28 to 32. Raising only the number, as in " +
          "10 or more points, lets 230 small factory cells back in. Korea's type 3 detections are concentrated at port and reclaimed-land " +
          "industrial sites rather than the open sea, so a land boundary cannot remove them; the same mask does.",
        "Near real-time data has no type, so only this mask applies. Applying the mask alone to the typed standard product changes " +
          "monthly fire-cell totals by 0.7% for VIIRS and 6.5% for MODIS in South Korea, 0.1% in California and 0.2% in BC.",
      ],
    },
  },
  harmonize: {
    index: "04",
    toc: "Harmonization",
    title: "Putting sensors on one scale",
    lead:
      "Every value is converted to what NOAA-20 would have counted. MODIS values before 2012 and S-NPP values before 2018 are " +
      "converted with monthly ratios learned over the periods when two satellites observed together.",
    figure: {
      title: "Annual fire cells, before and after harmonization",
      sub: "Before harmonization the record steps up in 2012; after, it runs on",
      before: "Before (raw values joined)",
      after: "After (NOAA-20 scale)",
      breakMark: "2012 · MODIS → VIIRS",
      note: "Raw values are in each satellite's own units, so the figure does not compare their sizes directly.",
      caption: (country: string) => `${country} · annual fire cells 2001–2025 · /landing annual`,
      yearHead: "Year",
      missing: "No value",
      label: (country: string) => `${country} annual fire cells 2001–2025, before and after harmonization`,
      point: (year: number, value: string) => `${year}: ${value} cells`,
      empty: "No annual values for this region.",
    },
    chainTitle: "The correction chain",
    chain: [
      { id: "terra", period: "2000-11 – 2002-06", sensor: "MODIS Terra", formula: "Terra × k_T × k_MS × k_SN", quality: "Medium or low" },
      {
        id: "modis",
        period: "2002-07 – 2012-01",
        sensor: "MODIS Terra or Aqua",
        formula: "(Terra or Aqua) × k_MS × k_SN",
        quality: "Medium or low",
      },
      { id: "snpp", period: "2012-02 – 2018-03", sensor: "VIIRS S-NPP", formula: "S-NPP × k_SN", quality: "High, medium or low" },
      { id: "noaa20", period: "2018-04 –", sensor: "VIIRS NOAA-20", formula: "Observed (NOAA-21 as backup)", quality: "High (NRT medium)" },
    ],
    chainLabel: "Correction chain: the satellite used in each period and the coefficients applied",
    formula: "k[month] = (new satellite cells that month + 20 × K) ÷ (old satellite cells that month + 20)",
    formulaNote: "K = ratio over the whole period",
    coefTable: {
      caption: "Overlap period and leave-one-year-out annual error for each coefficient",
      head: ["Coefficient", "Overlap", "Annual error (South Korea · California · BC)"],
      rows: [
        { key: "kT", cells: ["k_T: Terra → Terra or Aqua", "2003–2011", "11.2% · 4.6% · 2.6%"] },
        { key: "kMS", cells: ["k_MS: MODIS → S-NPP", "2012–2025", "14.9% · 6.8% · 8.6%"] },
        { key: "kSN", cells: ["k_SN: S-NPP → NOAA-20", "2019–2025", "6.2% · 5.1% · 4.7%"] },
        { key: "kN21", cells: ["k_N21: NOAA-21 → NOAA-20 (backup)", "2024–2025", "23.4% · 1.5% · 1.8%"] },
      ],
    },
    whyTitle: "Why this way",
    items: [
      {
        title: "Toward NOAA-20, not MODIS",
        body: [
          "The month that matters most, this month, stays an observation. Matching MODIS would mean correcting every new month toward " +
            "a retiring sensor. The first notebook (2 November) scaled VIIRS down to MODIS units; the team switched to the NOAA-20 scale.",
        ],
      },
      {
        title: "Ratio of sums",
        body: [
          "Years are summed first, then divided. Averaging yearly ratios lets one quiet year (2 MODIS cells vs 10 VIIRS cells = 5×) " +
            "swing the result.",
        ],
      },
      {
        title: "A ratio for each month",
        body: ["Even within South Korea the ratio ranges from 0.78 in July to 4.54 in December. One ratio would distort the seasonal shape."],
      },
      {
        title: "Thin months lean on the overall ratio (+20)",
        body: [
          "In months with little fire the division swings by chance. Until a month has 20 cells' worth of data, it is blended with the " +
            "overall ratio. At 20 cells the chance variation is about 1/√20 ≈ 22%. A month with 2 old-satellite cells uses its own ratio " +
            "at 9% weight, 20 cells at 50%, 1,000 cells at 98%.",
        ],
      },
      {
        title: "A 5-year window for sensor ageing",
        body: [
          "As the MODIS satellites aged, the ratio could change from year to year. We compared a coefficient from the whole overlap " +
            "with one from a 5-year window around each year (2 years either side) by leave-one-year-out error, and chose the smaller " +
            "error for each region: South Korea uses the window (14.9% annual error vs 20.5% fixed), California the fixed ratio (6.8% " +
            "vs 7.4%), BC the window (8.6% vs 8.8%). Years before 2012 use the earliest window (2012–2016).",
        ],
      },
      {
        title: "The ratio is the Poisson regression solution",
        body: [
          "Solving \"new cells = ratio × old cells\" as a Poisson regression gives exactly the division ratio. Zero stays zero, so no " +
            "value is created where there was no fire.",
        ],
      },
    ],
    change: {
      title: "What changed: day and night",
      body: [
        "A team review proposed using daytime only, because VIIRS night sensitivity is not comparable to MODIS. Checking showed that " +
          "46% of South Korea's VIIRS fire cells were night-only: daytime only would drop fires such as Goseong in April 2019 and lower " +
          "monthly R² from 0.92 to 0.78. Correcting night separately made South Korea's night ratio swing around 102 (46–423).",
        "So day and night are counted together and corrected with one ratio. The combined ratio is stable from year to year " +
          "(coefficient of variation 0.07–0.11) and the 2012 break disappears. In exchange, Korean MODIS detects little at night " +
          "(Aqua 4%, Terra 9%), so before 2012 the ratio fills in night fires.",
      ],
    },
    excludedTitle: "Alternatives we rejected",
    excludedTable: {
      caption: "Correction methods considered and not used, with reasons",
      head: ["Alternative", "Why not"],
      rows: [
        { key: "raw", cells: ["Join raw values", "A 2.06–2.61× step appears in 2012"] },
        { key: "modis", cells: ["Scale down to MODIS", "A retiring sensor, and the newest month becomes an estimate"] },
        { key: "annual", cells: ["One annual ratio", "Ratios differ several-fold by season"] },
        {
          key: "loglinear",
          cells: [
            "Regression log(V) = a + b·log(M+1)",
            "The +1 biases the slope below 1 where zeros are common and adds a value to every cell with 0 MODIS cells (found in team review)",
          ],
        },
        { key: "linear", cells: ["Linear regression", "A negative intercept makes small months negative"] },
        { key: "quantile", cells: ["Quantile mapping", "Only 14 samples per region and month, with many zeros, make the distribution unstable"] },
        {
          key: "frp",
          cells: ["Drop weak fires by an FRP threshold", "Discards the small fires VIIRS adds, so Korea, where small fires dominate, looks empty after 2012"],
        },
        { key: "prob", cells: ["Detection-probability model", "Needs retraining at every satellite change and could not be validated within the event"] },
        { key: "mean3", cells: ["Average three satellites after 2018", "NOAA-20 alone is simpler and keeps the reference fixed"] },
        { key: "day", cells: ["Daytime only", "Loses 46% of South Korea's VIIRS fire cells (night-only)"] },
      ],
    },
    limitsTitle: "Remaining limits",
    limits: [
      "There is one set of coefficients per region. They are not split by land cover or sub-area, so burning-heavy and wildfire-heavy areas use the same ratio.",
      "The shrinkage strength of 20 was set by judgement and not compared with 5, 10 or 50. One wildfire produces hundreds of cells, so 20 cells are not 20 independent samples.",
      "The MODIS → S-NPP period (2012–2025) includes Aqua's orbital drift (from July 2021).",
      "Because the ratio is taken from the combined Terra-or-Aqua record, k_MS mixes sensitivity differences with morning and afternoon overpass times.",
      "Errors across several coefficients are combined as √(e1² + e2²), assuming independence. The training periods partly overlap, so the actual error may differ.",
    ],
  },
  validate: {
    index: "05",
    toc: "Validation",
    title: "How we know it works",
    lead:
      "The same result is measured with three different rulers: satellites against each other, official records independent of " +
      "the satellites, and hiding one year at a time. Ranges and the cases that did not fit are reported alongside each number.",
    resultTable: {
      caption: "Validation results by region",
      head: ["Test", "South Korea", "California", "BC"],
      rows: [
        {
          key: "satellite",
          cells: ["2012 break between satellites, before → after [95% range]", "2.61 → 0.99 [0.92–1.05]", "2.06 → 1.02 [0.98–1.06]", "2.38 → 1.00 [0.97–1.03]"],
        },
        { key: "loyo", cells: ["Leave-one-year-out annual error (MODIS → S-NPP)", "14.9%", "6.8%", "8.6%"] },
        { key: "official", cells: ["2012 break against official fire counts, before → after", "2.67 → 1.04", "2.54 → 1.25", "4.99 → 2.14 · inconclusive"] },
        {
          key: "rank",
          cells: ["Rank correlation of annual fire cells with official records (counts / burned area, 2012–2025)", "0.69 / 0.54", "0.40 / 0.93", "0.58 / 0.92"],
        },
        { key: "large", cells: ["Rank correlation of burned area and fire cells, fires over 100 ha", "0.75", "0.58", "0.38"] },
      ],
    },
    figure: {
      title: "Detection by fire size",
      sub: "Larger fires are seen more often. Read the gap to the chance line",
      note:
        "Share of official fires since April 2018 with a fire cell in the same area within 2 days. The vertical line is the share " +
        "with dates shifted by 30 days (chance level).",
      caption: (country: string) => `${country} · NOAA-20 · official fire records · /landing detect_by_size`,
      binHead: "Fire size",
      detectedHead: "Detected",
      chanceHead: "Chance",
      countHead: "Records",
      label: (country: string) => `${country}: satellite detection rate by fire size, with chance level`,
      row: (bin: string, detected: string, chance: string, n: string) => `${bin}: detected ${detected}, chance ${chance}, ${n}`,
      count: (n: string) => `n=${n}`,
      empty: "No detection-rate data for this region.",
    },
    howTitle: "How we measured",
    items: [
      {
        title: "Satellite against satellite",
        body: [
          "Each series is divided by the MODIS-only record (on the NOAA-20 scale) and the ratio is compared before and after 2012. " +
            "Real changes in fire appear in both, so dividing leaves only the sensor difference. If the 95% range of after ÷ before " +
            "contains 1, there is no break.",
        ],
      },
      {
        title: "A ruler independent of the satellites",
        body: [
          "Each year we compute fire cells ÷ official fire count, then divide the 2012–2025 average by the 2001–2011 average. Official " +
            "records are counted the same way regardless of satellite changes, so a false step in the satellite values would make this " +
            "ratio jump in 2012 too.",
        ],
      },
      {
        title: "Hide one year, predict it",
        body: [
          "One overlap year is hidden, coefficients are built from the rest, and the hidden year is predicted; this is repeated for " +
            "every year. The error rate is the sum of |predicted − actual| over the sum of actual values (WAPE). Averaging yearly " +
            "percentages (MAPE) was not used: predicting 3 cells for a 1-cell year counts as 200%.",
        ],
      },
      {
        title: "Detection by size and the chance level",
        body: [
          "Forest Service records have no time of day, so the window was widened to the same day through 2 days later. A wider " +
            "window matches some fires by chance, so the same calculation is repeated with dates shifted by 30 days and used as the " +
            "chance level.",
        ],
      },
    ],
    bc: {
      title: "Why BC is \"inconclusive\"",
      body: [
        "Since about 2014, BC has had fewer small fires and many more megafires, so the official record itself changed (even after " +
          "harmonization, the change point in the official-count ratio is 2014). Dividing by counts gives 2.14×, by area 0.40×, so " +
          "the conclusions disagree. We show this as it is.",
      ],
    },
    change: {
      title: "What changed: the validation method",
      body: [
        "The first plan (8 November) learned coefficients on 2012–2017 and validated once on 2018–2020. The final version hides " +
          "every overlap year in turn. A Pettitt change-point test was also run, but after harmonization the pre-2012 difference is " +
          "exactly 0, so it reacts only to the sign of small differences; it is kept for reference and not used for the verdict.",
      ],
    },
    limitsTitle: "Limits of these tests",
    limits: [
      "The Forest Service counts wildfires only, while satellites also see crop burning. The ratio to official records mixes " +
        "detection rate with the share of burning, and a team review judged it a sanity check at best. So only order and change are " +
        "compared, not magnitudes.",
      "Year-level tests have only 23–25 samples and cannot rule out a small step of around ±20%.",
      "California and BC have frequent fires over large areas, so the chance level is high (45–54%). Read the gap to chance, not the detection rate alone.",
      "For fires over 100 ha, the rank correlation between burned area and fire cells is only 0.38 in BC. Fire cells under-represent megafire area.",
    ],
  },
  chip: {
    index: "06",
    toc: "Judgment chips",
    title: "Judgment chips",
    lead: "This month is compared with the same month over the reference period, and one chip says whether it falls outside the usual range.",
    chipsLabel: "The four judgment chips",
    figure: {
      title: "The same month, year by year",
      titleFull: (year: number, month: number, ratio: string, n: number) => {
        const name = new Date(Date.UTC(2000, month - 1, 1)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
        return `${name} ${year} was ${ratio}× the usual ${name}, the highest in ${n} years`;
      },
      titleShort: (year: number, month: number) => {
        const name = new Date(Date.UTC(2000, month - 1, 1)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
        return `Every ${name}, year by year (${year} highlighted)`;
      },
      sub: "Shading is the usual range, the dashed line is normal (median), and bar colour is that year's chip",
      caption: (country: string) => `${country} · /series · /baseline · chips follow the backend ranking`,
      yearHead: "Year",
      valueHead: "Fire cells",
      chipHead: "Chip",
      label: (country: string, month: number) => {
        const name = new Date(Date.UTC(2000, month - 1, 1)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
        return `${country}: fire cells in ${name}, 2001–2025, with the usual range`;
      },
      bar: (year: number, value: string, chip: string) => `${year}: ${value} cells · ${chip}`,
      record: (year: number, value: string) => `${year} · ${value} cells`,
      high: (v: string) => `range top ${v}`,
      median: (v: string) => `normal ${v}`,
      low: (v: string) => `bottom ${v}`,
      empty: "No data for this region's example month.",
    },
    formula: [
      "normal = median of the same month over the reference period",
      "upper = max(85th percentile, normal + 2√normal) · lower = min(15th percentile, normal − 2√normal) · √1 when normal is under 1 cell",
    ],
    orderTitle: "Only the first matching chip, from the top, is shown.",
    order: [
      "This month is above 0 and ranks 1st among the same months in the reference period → Very unusual (highest on record)",
      "Above the upper end → Above usual",
      "Below the lower end → Below usual",
      "Otherwise → Usual range",
    ],
    periodTitle: "Reference period",
    periodTable: {
      caption: "Reference period by unit",
      head: ["Unit", "Reference"],
      rows: [
        { key: "nation", cells: ["Whole region", "Harmonized 25 years (2001–2025)"] },
        { key: "prov25", cells: ["Korean provinces: Gyeonggi, Gyeongbuk, Chungnam", "Harmonized 25 years (leave-one-year-out error under 30%: 16%, 17%, 23%)"] },
        { key: "viirs", cells: ["Other Korean provinces; all districts, counties and regional districts", "VIIRS 14 years (2012–2025)"] },
      ],
    },
    whyTitle: "Why this rule",
    items: [
      { title: "Median, not mean", body: ["One extreme year drags the mean up. The median stays close to a typical year."] },
      {
        title: "Same month only",
        body: ["Each region has its own fire season, and normal varies widely between months (South Korea: 174 cells in March). Season has to come out of the comparison."],
      },
      {
        title: "A 2√normal margin",
        body: [
          "Satellites pass only a few times a day, so the same fire is caught more or less often by chance. A month whose normal is λ " +
            "cells wobbles by about √λ, so smaller differences are not called \"above\".",
        ],
      },
      {
        title: "Why not quartiles",
        body: [
          "S-NPP and NOAA-20 flew together in 2019–2025. Judging each month with each satellite alone, the quartile (25–75%) rule gave " +
            "both satellites the same chip 64% of the time; the current rule did so 81% of the time.",
        ],
      },
    ],
    compareTable: {
      caption: "Comparison of usual-range rules (South Korea, national monthly chip)",
      head: ["Measure (South Korea national monthly chip)", "Quartiles 25–75%", "15–85% + 2√normal"],
      rows: [
        { key: "agree", cells: ["S-NPP and NOAA-20 agree (84 months)", "64%", "81%"] },
        { key: "precision", cells: ["Satellite \"above\" months also in the top 25% of official counts", "57% (27 of 47)", "69% (24 of 35)"] },
        { key: "recall", cells: ["Top-25% official months caught", "57%", "51%"] },
        { key: "area", cells: ["Satellite \"above\" months also in the top 25% of burned area", "45%", "49%"] },
      ],
    },
    change: {
      title: "What changed: the usual range",
      body: [
        "The 8 November version used quartiles (25–75%) as the usual range. After the comparison above, the current rule was adopted on " +
          "11 November. At the same time the normal period changed from \"2003 on, excluding the year being judged\" to \"all of " +
          "2001–2025\", and the threshold for a Korean district to judge itself changed from \"same-month normal of 8 cells or more\" " +
          "(0 districts) to \"annual average of 11.1 cells or more\" (6 districts) (section 07).",
      ],
    },
    tradeoff: {
      title: "The trade-off",
      body: [
        "Judgments now agree across satellites, but the share of top official months caught falls from 57% to 51%. Short, intense fires " +
          "such as Yangyang in April 2005 or Goseong in April 2019 can read \"Usual range\" for the month; they show in the insight's " +
          "\"largest day\" and calendar. We chose fewer false alarms.",
      ],
    },
    limitsTitle: "Limits of this rule",
    limits: [
      "Agreement with burned area is low under both rules (45–49%). This reflects how poorly fire cells track burned area, not the rule.",
      "In burning-heavy provinces (Jeonbuk, Jeonnam, Gyeonggi, Jeju) the chip tracks agricultural burning more than wildfire.",
    ],
  },
  sparse: {
    index: "07",
    toc: "Sparse areas",
    title: "Areas where fire is rare",
    lead: "Areas averaging under 11.1 fire cells a year do not get their own chip. They borrow the judgment of the level above.",
    formula: "wobble = √λ ÷ λ = 1 ÷ √λ ≤ 0.30 → λ ≥ 1 ÷ 0.30² ≈ 11.1 cells/year",
    intro: [
      "Counts of rare events wobble by chance from year to year. With an average of λ cells the wobble is about √λ (Poisson). " +
        "An area that usually sees 4 cells a year moves between 2 and 6 by chance alone (±50%), so 6 cells this year cannot be " +
        "called \"above usual\".",
    ],
    flowLabel: "Order in which judgments are borrowed",
    flow: [
      { id: "district", title: "District", note: "Own chip at 11.1 cells/year or more" },
      { id: "province", title: "Its province", note: "If the district is sparse" },
      { id: "nearest", title: "Nearest sufficient province", note: "If the province is sparse too; stated in the text" },
    ],
    flowNote: "In California and BC, counties and regional districts borrow from the whole state or province.",
    statusTable: {
      caption: "Area status",
      head: ["Status", "Sufficient", "Sparse", "No detections"],
      rows: [
        { key: "kor-dist", cells: ["South Korea districts (229)", "6", "192", "31"] },
        { key: "kor-prov", cells: ["South Korea provinces (17)", "9", "8", "—"] },
        { key: "cal", cells: ["California counties (58)", "55", "3", "0"] },
        { key: "bc", cells: ["BC regional districts (28)", "28", "0", "0"] },
      ],
    },
    sufficient: [
      "The six sufficient Korean districts are Yeoncheon (32.3 cells a year), Jeju City (29.2), Gimje (20.9), Iksan (16.1), " +
        "Haenam (12.9) and Goseong, Gangwon (12.3).",
    ],
    whyTitle: "Why 30%",
    items: [
      {
        title: "Similar practice",
        body: [
          "The US National Center for Health Statistics flags estimates with a relative error of 30% or more as unreliable, and " +
            "Statistics Canada uses about 33%. 30% is not an official standard; it was set with reference to this practice.",
        ],
      },
      {
        title: "What it means on screen",
        body: [
          "At a 30% wobble, a month that looks \"2× normal\" is really about 1.5–2.6×, so \"above usual\" still holds. Above 50%, " +
            "2× could really be normal.",
        ],
      },
    ],
    thresholdTable: {
      caption: "Required annual average and number of sufficient Korean districts, by threshold",
      head: ["Threshold", "Required fire cells per year", "Sufficient Korean districts"],
      rows: [
        { key: "20", cells: ["20%", "25", "2"] },
        { key: "30", cells: ["30% (used)", "11.1", "6"], highlight: true },
        { key: "40", cells: ["40%", "6.3", "20"] },
        { key: "50", cells: ["50%", "4", "46"] },
      ],
    },
    notes: [
      {
        title: "The biggest year is left out of the average",
        body: [
          "One large fire should not turn an area into a place that \"usually burns\". Areas that burned once, such as Uiseong in 2025 " +
            "or Uljin in 2022, drop to 2.6 and 0.6 cells a year once that year is left out (8 November analysis). Yeoncheon, Gimje " +
            "and Iksan, which burn similarly every year, barely change.",
        ],
      },
      {
        title: "\"Sparse\" does not hide detections",
        body: [
          "Satellite points and fire cells are shown for every area. Only the \"above or below usual\" judgment is limited. Sparse " +
            "areas show a status chip with the judgment borrowed from the level above, and the insight lists the same month for " +
            "neighbouring areas. A detection where fire is rare is itself an important signal.",
        ],
      },
      {
        title: "The 25-year total is an exception",
        body: [
          "Districts still show the 2001–2025 total and annual average. Burning-heavy areas have larger satellite ratios and " +
            "wildfire-led areas smaller ones, so one national coefficient errs in a consistent direction per area. Each area gets its " +
            "own factor, pulled toward its province when data is thin (shrinkage 10 for districts, 20 for provinces). Tested on the " +
            "overlap, the 14-year total error was 25% for areas with 25–50 cells, 12% for 50–100 and 4% for 200 or more, while " +
            "7-year totals and single years did not pass. So only the total is shown, and only for areas with 25 cells or more.",
        ],
      },
    ],
    change: {
      title: "What changed: the threshold for an area's own judgment",
      body: [
        "The first rule was \"same-month normal of 8 cells or more\", which left no Korean district able to judge itself. Switching " +
          "to an annual average of 11.1 cells (biggest year excluded) gave 6. Provinces at first all judged themselves; under the " +
          "same rule they split into 9 sufficient and 8 sparse.",
      ],
    },
    limitsTitle: "Limits of this rule",
    limits: [
      "Only 6 of South Korea's 229 districts judge themselves; the other 223 (including 31 with no detections) borrow from their province or the nearest sufficient one.",
      "Areas near the threshold, such as Paju (10.3) and Naju (10.7), change status with the threshold.",
      "Even S-NPP and NOAA-20, nearly identical satellites, differ by a median 63% at district level. This is chance (whether a " +
        "fire was burning at overpass time) and no method removes it.",
      "Before 2012, monthly values for provinces and districts are too uncertain and are not used for comparison, except in " +
        "Gyeonggi, Gyeongbuk and Chungnam.",
    ],
  },
  indicators: {
    index: "08",
    toc: "Other indicators",
    title: "Other indicators",
    lead: "The other indicators are computed from the same harmonized series and the same reference periods in every region.",
    table: {
      caption: "How each indicator is computed and why",
      head: ["Indicator", "How", "Why"],
      rows: [
        {
          key: "risk",
          cells: [
            "Risk season",
            "Add monthly shares from the largest down until 50% is passed. South Korea Feb–Apr (64%), California Aug–Oct (60%), BC Jul–Aug (51%)",
            "The data, not a calendar, sets each region's season",
          ],
        },
        {
          key: "rank",
          cells: ["Same-month rank", "\"k-th of n {month}s, {start}–{end}\". Own-judgment areas only. \"No detections this month\" at 0 cells", "Works even when normal is 0"],
        },
        {
          key: "ratio",
          cells: ["× normal", "This month ÷ normal. Own-judgment areas only. \"A month that usually has almost none\" when normal is 0", "Small normals inflate ratios"],
        },
        { key: "ytd", cells: ["Year to date", "Sum from January to the chosen month; its ratio to those months' normals for own-judgment areas only", "The year's course, not one month"] },
        {
          key: "heat",
          cells: ["Heatmap colours (5)", "0 cells = step 1; the rest split at the 50th, 75th and 90th percentiles of the area's non-zero months", "Fixed bins collapse some areas into one colour"],
        },
        {
          key: "map",
          cells: [
            "Map area colours (5)",
            "District value that month, split at 0 and three fixed per-region bounds (South Korea 3·10·30, California 3·8·18, BC 2·8·47). Grey before February 2012",
            "Within a region the same colour means the same amount in every month",
          ],
        },
        {
          key: "cluster",
          cells: ["Detection clusters", "Fire cells within 3 km and 2 days form one cluster; 10+ cells is a large one. NOAA-20 only", "Shows one fire across days and borders"],
        },
        { key: "maxday", cells: ["Largest day", "Maximum daily fire cells in the area", "Catches short fires the monthly chip misses"] },
        { key: "near50", cells: ["First detection within 50 km", "First day of the month with fire outside the area but within 50 km of its centre", "Fire approaching from neighbours"] },
        { key: "recur", cells: ["Recurrence grid", "0.02° (about 2 km) cells with any fire cell in 2012–2025", "Separates one-off fires from yearly burning"] },
        { key: "annual", cells: ["Usual annual fire cells", "VIIRS annual average without the biggest year", "One large fire does not inflate the usual"] },
      ],
    },
    sensitivityTitle: "Changing the thresholds",
    sensitivityTable: {
      caption: "Results of changing the thresholds",
      head: ["Threshold", "Result"],
      rows: [
        {
          key: "risk",
          cells: [
            "Risk season 50%",
            "At 70% South Korea adds June; at 80% it becomes six months, February–June plus October. A six-month risk season is useless as a warning, so the short, clear 50% was chosen",
          ],
        },
        {
          key: "cluster",
          cells: [
            "Clusters 3 km · 2 days",
            "2 km·1 day / 3 km·2 days / 5 km·3 days give 4,211 / 4,118 / 3,975 clusters, and monthly cluster counts correlate 0.99–1.00 " +
              "across rules. Known large fires form one cluster of similar size and period under all three, and the Goseong and " +
              "Gangneung–Donghae fires 60 km apart on the same day (April 2019) stay separate under all three. 2 km·1 day splits the " +
              "Uiseong fire into more fragments (16 vs 7), so the middle rule was chosen",
          ],
        },
        { key: "near50", cells: ["First detection within 50 km", "In the March 2025 Gyeongbuk fires, it registered 2–3 days before the fire arrived"] },
      ],
    },
    change: {
      title: "What changed: indicator definitions",
      body: ["Several definitions changed in the final version of 11 November."],
    },
    changes: [
      "Heatmap colours: quartiles → 50th/75th/90th percentiles",
      "Map colours: national quartiles → fixed bins",
      "Detection clusters: 2 km·1 day → 3 km·2 days",
      "First detection within 50 km: from the boundary → from the centre",
      "Usual annual fire cells: median of annual totals → average without the biggest year",
      "Risk season: VIIRS period Mar–May (58%) → reference series Feb–Apr (64%)",
      "Top-3 list: largest \"value − normal\" → same-month rank, then value",
    ],
    limitsTitle: "Limits of these indicators",
    limits: [
      "Detection clusters are not fire counts. We set the clustering rule, so the number of clusters depends on it (table above).",
      "Detection clusters use NOAA-20 only, so they exist from April 2018. First detection within 50 km uses the points of the satellite shown for that month (MODIS before February 2012, S-NPP until March 2018, NOAA-20 after).",
    ],
  },
  limits: {
    index: "09",
    toc: "Limits",
    title: "Limits",
    lead: "Fire cells measure the fire the satellite saw. They are not burned area or fire counts. The limits discussed above are collected here.",
    items: [
      {
        title: "Not burned area",
        body: [
          "Megafires are under-represented. The rank correlation between annual fire cells and burned area is 0.54 in South Korea, " +
            "0.93 in California and 0.92 in BC; for fires over 100 ha only, it is 0.38 in BC.",
        ],
      },
      { title: "Small fires are missed", body: ["Detection falls with fire size. In South Korea only 5% of fires under 0.1 ha are caught within 2 days."] },
      {
        title: "Pre-2012 is estimated",
        body: [
          "Korean MODIS detects little at night (Aqua 4%, Terra 9%), so the ratio fills in night fires. Pre-2012 monthly values for " +
            "provinces and districts are not used for comparison, except in Gyeonggi, Gyeongbuk and Chungnam.",
        ],
      },
      { title: "Sparse areas borrow", body: ["Only 6 of South Korea's 229 districts judge themselves; the other 223 (including 31 with no detections) use the judgment of their province or the nearest sufficient one."] },
      {
        title: "Short, large fires",
        body: [
          "Can read \"Usual range\" for the month (Yangyang, April 2005; Goseong, April 2019). Such fires show in the insight's " +
            "\"largest day\" and calendar.",
        ],
      },
      {
        title: "Burning, not only wildfire",
        body: [
          "Satellites also see crop burning and land clearing. In burning-heavy provinces (Jeonbuk, Jeonnam, Gyeonggi, Jeju) the chip tracks burning activity.",
        ],
      },
      {
        title: "Official records differ",
        body: ["Agencies count differently and their records change over time. This is why BC's official-record test is inconclusive."],
      },
      {
        title: "Months in progress",
        body: ["Recent months come from near real-time data with \"medium\" quality, and a month that has not ended is still filling up."],
      },
      {
        title: "Satellite replacement",
        body: [
          "The reference satellite NOAA-20 is past its design life. The backup NOAA-21 coefficient has only two overlap years in " +
            "South Korea and a 23.4% annual error.",
        ],
      },
      {
        title: "Boundaries change",
        body: [
          "Each region uses one boundary version. Incheon's boundaries predate its July 2026 reorganization, so only Incheon " +
            "district values after that date are affected. Switching to official boundaries (SGIS) was left until after the event.",
        ],
      },
    ],
    untestedTitle: "Choices not yet tested",
    untested: [
      "The shrinkage strength of 20 was not compared with 5, 10 or 50.",
      "The 0.01° cell size was chosen on Korean data and is used everywhere; in BC it has the lowest fit of the four sizes.",
      "Coefficients are not split by land cover or sub-area.",
      "The MODIS → S-NPP training period includes Aqua's orbital drift (from July 2021).",
    ],
    untestedNote: "The reasons for these choices were not recorded; they are listed for testing after the event.",
  },
  built: {
    index: "10",
    toc: "How it's built",
    title: "How it's built and what we learned",
    lead: "Heavy computation runs once per region in advance, and the server returns only precomputed values.",
    table: {
      caption: "Technology and reasons by layer",
      head: ["Layer", "Tech", "Why"],
      rows: [
        {
          key: "processing",
          cells: ["Processing", "Python · pandas, NumPy, SciPy. One notebook shared by all three regions, only the settings differ", "A new region goes through the same computation and validation"],
        },
        { key: "storage", cells: ["Storage", "PostgreSQL 16 + Flyway", "Region × month × day queries, versioned schema"] },
        {
          key: "api",
          cells: ["Server", "Spring Boot 3.5 · Java 21, 4 services (catalog, time series, spatial, insight)", "Every endpoint takes a region code: /api/v1/{region}/…"],
        },
        {
          key: "cache",
          cells: ["Caching", "Redis (keyed on data version), ETag = data version, recent months 5 min · past months 24 h", "Past months never change; recent ones update with near real-time data"],
        },
        {
          key: "web",
          cells: ["Site", "React · TypeScript · Vite, TanStack Query, MapLibre, ECharts", "Uses server responses as they are; judgments follow the server's rules"],
        },
      ],
    },
    stepsTitle: "Adding a region",
    stepsLabel: "Five steps to add a region",
    steps: [
      { id: "boundary", title: "Boundaries", body: "Open administrative boundaries for the region and its sub-areas" },
      { id: "firms", title: "FIRMS data", body: "MODIS, S-NPP, NOAA-20 and NOAA-21 for the region's extent" },
      { id: "config", title: "One line of settings", body: "Region code, folders and an official fire record if one exists" },
      { id: "run", title: "Run the notebook", body: "Coefficients, chips, validation tests and server files are produced" },
      {
        id: "register",
        title: "Register on server and site",
        body: "Add the region code to the server's region list and the site's country list, and the same pages work for it",
      },
    ],
    lessonsTitle: "Decisions we made along the way",
    lessons: [
      {
        title: "Do not read a better sensor as more fire",
        body: ["Count cells × days, not points, and check the 2012 break with three different rulers (sections 03 and 05)."],
      },
      { title: "Keep this month observed", body: ["Match NOAA-20, which is operating, rather than the retiring MODIS (section 04)."] },
      {
        title: "If the simple method gives the same answer, use it",
        body: ["The monthly ratio equals the Poisson regression solution and keeps zero as zero; the regression pitfall was found in team review (section 04)."],
      },
      {
        title: "Check review comments against the data",
        body: ["The proposal to use daytime only was rejected after finding 46% night-only fire cells (section 04)."],
      },
      {
        title: "Set thresholds by trying alternatives",
        body: [
          "Cell size, 30%, the 50% risk season and 3 km · 2-day clusters are reported with the alternatives compared (sections 03, 07, 08). " +
            "Values not compared (shrinkage 20) are stated as such.",
        ],
      },
      {
        title: "Prefer fewer false alarms",
        body: ["Widening the usual range raised agreement between satellites from 64% to 81%, and the cost (short, large fires) is stated (section 06)."],
      },
      { title: "Show inconclusive results", body: ["BC's official-record test is shown as inconclusive, as it is (section 05)."] },
    ],
  },
  end: {
    sourcesTitle: "Sources",
    sources: [
      { id: "firms", label: "NASA FIRMS", body: "MODIS C6.1 and VIIRS C2 (S-NPP, NOAA-20, NOAA-21) active fires" },
      { id: "official", label: "Official records", body: "Korea Forest Service · KOSIS, CAL FIRE FRAP, BC Wildfire Service" },
      {
        id: "boundary",
        label: "Boundaries",
        body: "geoBoundaries (CC BY 3.0) · US Census Bureau (public domain) · BC Data Catalogue (OGL–BC)",
      },
    ],
    dashboard: "Explore dashboard →",
    top: "Back to top ↑",
  },
};
