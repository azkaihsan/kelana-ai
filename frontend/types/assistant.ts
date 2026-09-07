export interface SourceLocation {
  type?: string;
  s3Location?: {
    uri?: string;
  };
  [key: string]: unknown;
}

export interface SourceItem {
  document_id?: string;
  location?: SourceLocation | string;
  metadata?: Record<string, unknown>;
  score?: number;
}

export interface BackendAnswerPayload {
  answer: string;
  source?: SourceItem[];
}

export interface BackendAskResponse {
  question: string;
  answer: BackendAnswerPayload | string;
}

export interface AskResult {
  question: string;
  answer: string;
  sources: string[];
}
