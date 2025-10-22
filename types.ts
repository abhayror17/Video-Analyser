export interface Segment {
  title: string;
  timestamp: string;
  duration: string;
}

export interface AnalysisResult {
  summary: string;
  sentiment: string;
  typeOfDiscussion: string;
  primaryTopic: string;
  subtopics: string[];
  toneOfDelivery: string;
  keyPeopleEntities: string[];
  regionCountryFocus: string;
  additionalInfo: string;
  segments: Segment[];
}
