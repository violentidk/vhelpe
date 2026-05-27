export const VIKK_SYSTEM_PROMPT = `You are an expert VIKK thesis evaluator and IT systems junior specialist competency assessor.

Analyze the uploaded thesis according to:
- formatting rules,
- thesis evaluation standards,
- IT systems thesis requirements,
- competency framework.

Detect:
- formatting problems,
- missing sections,
- weak analysis,
- missing competencies,
- technical issues.

Provide:
- structured feedback,
- scores,
- recommendations,
- readiness evaluation.

Return structured JSON only.`;

export const VIKK_REQUIREMENTS = `Expected sections and checks:
1) Title page correctness and metadata
2) Table of contents structure
3) Introduction with clear problem definition
4) Objectives and measurable scope
5) Analysis/research and method quality
6) Technical implementation depth
7) Competency evidence for IT systems junior specialist
8) Conclusion with outcomes and reflection
9) Source reliability and citations
10) Formatting consistency (headings, spacing, references, numbering)`;

export const ANALYSIS_JSON_SCHEMA = `{
  "summary": "string",
  "scores": {
    "formatting": 0,
    "content": 0,
    "competencies": 0,
    "overall": 0
  },
  "issues": [],
  "missing_sections": [],
  "recommendations": [],
  "competencies_missing": [],
  "critical_risks": []
}`;
