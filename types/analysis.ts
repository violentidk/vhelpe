export interface ThesisScore {
  formatting: number;
  content: number;
  competencies: number;
  overall: number;
}

export interface AnalysisJson {
  summary: string;
  scores: ThesisScore;
  issues: string[];
  missing_sections: string[];
  recommendations: string[];
  competencies_missing: string[];
  critical_risks: string[];
}

export interface CompetencyItem {
  name: string;
  score: number;
  confidence: number;
  evidence: string;
}

export interface ThesisAnalysisRecord {
  id: string;
  thesis_id: string;
  user_id: string;
  summary: string;
  scores: ThesisScore;
  issues: string[];
  missing_sections: string[];
  recommendations: string[];
  competencies_missing: string[];
  critical_risks: string[];
  competency_breakdown: CompetencyItem[];
  created_at: string;
}
