import { authenticatedFetch } from "@/lib/apiClient";
import type {
  AskResult,
  BackendAskResponse,
  SourceItem,
} from "@/types/assistant";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/**
 * Normalise raw document URIs (e.g. s3://bucket/path/to/doc.pdf -> path/to/doc.pdf)
 */
export function cleanDocumentPath(rawUri: string): string {
  const s3Match = rawUri.match(/^s3:\/\/[^/]+\/(.+)$/);
  if (s3Match && s3Match[1]) {
    return s3Match[1];
  }
  return rawUri;
}

/**
 * Extract human-readable document path from a Bedrock source item
 */
export function extractSourceCitation(item: SourceItem | string): string {
  if (!item) return "";
  if (typeof item === "string") {
    return cleanDocumentPath(item);
  }
  if (item.location && typeof item.location === "object" && item.location.s3Location?.uri) {
    return cleanDocumentPath(item.location.s3Location.uri);
  }
  if (typeof item.location === "string") {
    return cleanDocumentPath(item.location);
  }
  if (typeof item.metadata?.["x-amz-bedrock-kb-source-uri"] === "string") {
    return cleanDocumentPath(item.metadata["x-amz-bedrock-kb-source-uri"] as string);
  }
  if (item.document_id) {
    return cleanDocumentPath(item.document_id);
  }
  return "";
}

/**
 * Ask the KelanaAI Assistant a question grounded in knowledge base documents.
 */
export async function askQuestion(question: string): Promise<AskResult> {
  const res = await authenticatedFetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question: question.trim() }),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errJson = await res.json();
      if (errJson?.detail) {
        detail = errJson.detail;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(detail || `Request failed with status ${res.status}`);
  }

  const data: BackendAskResponse = await res.json();

  let answerText = "";
  const sources: string[] = [];

  if (typeof data.answer === "string") {
    answerText = data.answer;
  } else if (data.answer && typeof data.answer === "object") {
    answerText = data.answer.answer ?? "";
    if (Array.isArray(data.answer.source)) {
      for (const item of data.answer.source) {
        const citation = extractSourceCitation(item);
        if (citation && !sources.includes(citation)) {
          sources.push(citation);
        }
      }
    }
  }

  return {
    question: data.question || question,
    answer: answerText,
    sources,
  };
}
