export type MarketingShowcaseCase = {
  id: string;
  workflow: "Frame" | "Asset" | "Copycat";
  eyebrow: string;
  title: string;
  inputLabel: string;
  input: string;
  result: string;
  inputWidth: number;
  inputHeight: number;
  resultWidth: number;
  resultHeight: number;
  inputAlt: string;
  resultAlt: string;
};

export const marketingShowcaseCases: MarketingShowcaseCase[] = [
  {
    id: "frame-54-weeks",
    workflow: "Frame",
    eyebrow: "SOURCE → RESULT",
    title: "54 WEEKS",
    inputLabel: "Source frame",
    input: "/marketing/examples/set-03-frame-thief-source.webp",
    result: "/marketing/examples/set-03-frame-thief-result.webp",
    inputWidth: 1187,
    inputHeight: 917,
    resultWidth: 2047,
    resultHeight: 1152,
    inputAlt: "Source video frame for the 54 WEEKS thumbnail",
    resultAlt: "Generated 54 WEEKS YouTube thumbnail",
  },
  {
    id: "frame-travel",
    workflow: "Frame",
    eyebrow: "SOURCE → RESULT",
    title: "NEXT STOP?",
    inputLabel: "Source frame",
    input: "/marketing/examples/set-04-frame-travel-source.webp",
    result: "/marketing/examples/set-04-frame-travel-result.webp",
    inputWidth: 1200,
    inputHeight: 675,
    resultWidth: 1280,
    resultHeight: 731,
    inputAlt: "Source travel frame at the Colosseum",
    resultAlt: "Generated travel thumbnail with Next stop? and 13 countries",
  },
  {
    id: "asset-100-hours",
    workflow: "Asset",
    eyebrow: "ASSET → RESULT",
    title: "100 HOURS",
    inputLabel: "Creator asset",
    input: "/marketing/examples/set-01-asset-100-hours-source.webp",
    result: "/marketing/examples/set-01-asset-100-hours-result.webp",
    inputWidth: 151,
    inputHeight: 180,
    resultWidth: 1280,
    resultHeight: 731,
    inputAlt: "Creator face asset supplied to the Asset workflow",
    resultAlt: "Generated 100 HOURS challenge thumbnail",
  },
  {
    id: "asset-chef-rush",
    workflow: "Asset",
    eyebrow: "ASSET → RESULT",
    title: "WHAT IS THIS?",
    inputLabel: "Creator asset",
    input: "/marketing/examples/set-05-asset-chef-rush-source.webp",
    result: "/marketing/examples/set-05-asset-chef-rush-result.webp",
    inputWidth: 576,
    inputHeight: 533,
    resultWidth: 1280,
    resultHeight: 731,
    inputAlt: "Creator asset supplied to the Asset workflow",
    resultAlt: "Generated spicy dessert thumbnail",
  },
  {
    id: "asset-democracy",
    workflow: "Asset",
    eyebrow: "ASSET → RESULT",
    title: "CORE OF DEMOCRACY",
    inputLabel: "Creator asset",
    input: "/marketing/examples/set-06-asset-democracy-source.webp",
    result: "/marketing/examples/set-06-asset-democracy-result.webp",
    inputWidth: 260,
    inputHeight: 255,
    resultWidth: 1280,
    resultHeight: 731,
    inputAlt: "Creator asset supplied to the Asset workflow",
    resultAlt: "Generated Core of Democracy documentary thumbnail",
  },
  {
    id: "copycat-waffles",
    workflow: "Copycat",
    eyebrow: "REFERENCE → RESULT",
    title: "2AM WAFFLES",
    inputLabel: "Reference thumbnail",
    input: "/marketing/examples/set-02-copycat-reference.webp",
    result: "/marketing/examples/set-02-copycat-result.webp",
    inputWidth: 1280,
    inputHeight: 720,
    resultWidth: 1280,
    resultHeight: 731,
    inputAlt: "Reference thumbnail used for the Copycat workflow",
    resultAlt: "Generated 2AM Waffles thumbnail rebuilt from the reference structure",
  },
];

const getCase = (id: MarketingShowcaseCase["id"]) => {
  const item = marketingShowcaseCases.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Missing marketing showcase case: ${id}`);
  return item;
};

export const primaryTransformationCase = getCase("frame-54-weeks");
export const signInTransformationCase = getCase("asset-100-hours");
