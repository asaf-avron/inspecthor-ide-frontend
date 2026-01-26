/**
 * Shared TypeScript interfaces matching backend Pydantic models
 */

// === Location Types ===
export interface GapLocation {
    line: number | null;
    column: number | null;
    file: string | null;
}

// === Generation Types ===
export type GapSeverity = "critical" | "high" | "medium" | "low";
export type GapCategory = "missing-precondition" | "ambiguous-requirement" | "incomplete-spec" | "other";
export type TraceabilityStatus = "mapped" | "partial" | "missing";
export type RigorLevel = "sanity" | "standard" | "paranoid";

export interface Gap {
    id: string;
    severity: GapSeverity;
    category: GapCategory;
    description: string;
    location: GapLocation;
    suggestion?: string;
    code_snippet?: string;
}

export interface Ambiguity {
    id: string;
    text: string;
    possible_interpretations: string[];
    recommendation: string;
}

export interface TraceabilityEntry {
    id: string;
    source_text: string;
    code_line: string;
    line_number?: number;
    status: TraceabilityStatus;
    confidence: number;
}

export interface SpecStatistics {
    total_requirements: number;
    mapped_requirements: number;
    coverage_percentage: number;
    total_gaps: number;
    critical_gaps: number;
}

export interface GenerateSpecOptions {
    include_examples?: boolean;
    strictness_level?: "low" | "medium" | "high";
    target_language?: string;
}

export interface GenerateSpecRequest {
    english_spec: string;
    rigor_level?: RigorLevel;
    options?: GenerateSpecOptions;
}

export interface TriageResult {
    doc_type: string;
    confidence: number;
    detected_patterns?: string[];
}

export interface GenerateSpecResponse {
    triage: TriageResult;
    structured_spec: string;
    dafny_skeleton: string;
    gaps: Gap[];
    ambiguities: Ambiguity[];
    traceability_matrix: TraceabilityEntry[];
    statistics: SpecStatistics;
}

// === Verification Types ===
export type VerificationStatus = "verified" | "failed" | "pending" | "warning" | "timeout";
export type LogLevel = "info" | "debug" | "success" | "error" | "warn";
export type VerificationErrorType = "syntax" | "type" | "verification";
export type VerificationType = "method" | "function" | "invariant";
export type ProofStatus = "proven" | "failed";

export interface ProofObligation {
    id: string;
    name: string;
    location: string;
    status: VerificationStatus;
    time?: string;
    details?: string;
}

export interface LogEntry {
    time: string;
    level: LogLevel;
    message: string;
}

export interface VerificationError {
    type: VerificationErrorType;
    line: number;
    column: number;
    message: string;
    suggestion?: string;
}

export interface ProofObligationDetail {
    id: string;
    description: string;
    status: ProofStatus;
    counterexample?: string;
}

export interface VerificationResult {
    type: VerificationType;
    name: string;
    location: GapLocation;
    status: VerificationStatus;
    message: string;
    proof_obligations: ProofObligationDetail[];
}

export interface VerifyRequest {
    dafny_code: string;
    timeout_seconds?: number;
    solver?: "z3" | "cvc5";
    verbosity?: "quiet" | "normal" | "verbose";
}

export interface VerifyResponse {
    verified: boolean;
    verification_time_ms: number;
    results: VerificationResult[];
    errors: VerificationError[];
    warnings: Record<string, unknown>[];
    solver_output: string;
}

// Legacy verify endpoint (simpler)
export interface VerifyDafnyRequest {
    code: string;
    filename: string;
}

export interface VerifyDafnyResponse {
    success: boolean;
    proof_obligations: ProofObligation[];
    logs: LogEntry[];
}

// === File Management Types ===
export type FileType = "markdown" | "dafny";

export interface FileSaveRequest {
    filename: string;
    content: string;
    file_type: FileType;
    project_id?: string;
}

export interface FileSaveResponse {
    file_id: string;
    filename: string;
    saved_at: string;
    size_bytes: number;
}

export interface FileResponse {
    file_id: string;
    filename: string;
    content: string;
    file_type: string;
    created_at: string;
    updated_at: string;
    size_bytes: number;
}

export interface FileListItem {
    file_id: string;
    filename: string;
    file_type: string;
    size_bytes: number;
    created_at: string;
    updated_at: string;
}

export interface FileListResponse {
    files: FileListItem[];
    total: number;
}

export interface FileDeleteResponse {
    deleted: boolean;
    file_id: string;
}

// === AI Assistant Types ===
export type ChatRole = "user" | "assistant";

export interface ChatMessage {
    role: ChatRole;
    content: string;
}

export interface ChatContext {
    code: string;
    location: string;
    error: string;
}

export interface ChatRequest {
    message: string;
    context?: ChatContext;
    history?: ChatMessage[];
}

export interface ChatResponse {
    content: string;
    suggestions: string[];
}

// === Gap Resolution Types ===
export interface SuggestRequest {
    spec: string;
    gap: Gap;
}

export interface SuggestResponse {
    rationale: string;
    original_text: string;
    proposed_text: string;
}

// === Health Types ===
export interface HealthResponse {
    status: string;
    gemini_configured: boolean;
    dafny_available: boolean;
}

// === Project Explorer Types (Frontend-specific) ===
export type ProjectFileType = "md" | "dfy" | "folder" | "unit";
export type ProjectVerificationStatus = "verified" | "failed" | "pending" | "none";

export interface ProjectFileItem {
    id: string;
    name: string;
    type: ProjectFileType;
    linkedDfy?: string;
    verificationStatus?: ProjectVerificationStatus;
    children?: ProjectFileItem[];
    // API fields
    file_id?: string;
    content?: string;
}

// === Reference Mapping Types (for Traceability View) ===
export interface ReferenceMapping {
    id: string;
    markdownText: string;
    dafnyLines: { start: number; end: number };
    dafnyCode: string;
}
