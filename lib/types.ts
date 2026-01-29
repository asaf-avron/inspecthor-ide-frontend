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
    current_filename?: string;
    project_id?: string;
    source_file_id?: string;
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
    suggested_filename?: string;
    units_created?: UnitInfo[];
    subfolder_name?: string;
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
export type FileType = "md" | "dfy" | "unit";

export interface FileSaveRequest {
    filename: string;
    content: string;
    file_type: FileType;
    project_id: string;  // Required - files must belong to a project
}

export interface FileUpdateRequest {
    content: string;
    filename?: string;  // Optional rename
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
    project_id: string;
    created_at: string;
    updated_at: string;
    size_bytes: number;
    renamed?: boolean;  // Track if file was manually renamed
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

// === Project Management Types ===
export interface Project {
    project_id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    file_count: number;
}

export interface ProjectCreateRequest {
    name: string;
    description?: string;
}

export interface ProjectUpdateRequest {
    name?: string;
    description?: string;
}

export interface ProjectResponse {
    project_id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    file_count: number;
    redirect_url?: string;
}

export interface ProjectListParams {
    limit?: number;
    offset?: number;
    sort?: "created_at" | "updated_at" | "name";
    order?: "asc" | "desc";
}

export interface ProjectListResponse {
    projects: ProjectResponse[];
    total: number;
    limit: number;
    offset: number;
}

export interface FileMetadata {
    file_id: string;
    filename: string;
    file_type: string;
    updated_at: string;
    size_bytes: number;
}

export interface ProjectStructureResponse {
    project: ProjectResponse;
    files: FileMetadata[];
}

export interface ProjectDeleteResponse {
    deleted: boolean;
    project_id: string;
    files_deleted: number;
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

// === Spec Refinement Types ===
export interface FindGapsRequest {
    spec: string;
    project_id?: string;
    source_file_id?: string;
}

export interface FindGapsResponse {
    gaps: Gap[];
    ambiguities: Ambiguity[];
    statistics: SpecStatistics;
}

export interface RefineSpecRequest {
    spec: string;
    gaps: Gap[];
    apply_gap_ids?: string[];
}

export interface RefineSpecResponse {
    refined_spec: string;
    applied_gaps: Gap[];
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

// === Deconstruction Types ===
export interface UnitCandidate {
    title: string;
    description: string;
    requirements: string[];
    line_range: number[];  // [start, end]
    dependencies: string[];
}

export interface UnitInfo {
    unit_id: string;
    unit_filename: string;
    dafny_filename: string;
    title: string;
    description: string;
    requirements: string[];
    dafny_code: string;
    line_range: number[];  // [start, end]
}

export interface UnitLinkInfo {
    link_id: string;
    unit_file_id: string;
    dafny_file_id: string;
    source_file_id: string;
    link_type: string;
    title: string;
    source_range: {
        start_line: number;
        end_line: number;
    };
    verification_status: string;
    created_at: string;
}

export interface DeconstructStats {
    total_units: number;
    successful_units: number;
    failed_units: number;
    total_files_created: number;
    processing_time_seconds: number;
}

export interface DeconstructRequest {
    project_id: string;
    source_file_id: string;
    strategy?: "auto" | "manual";
    max_units?: number;
    unit_boundaries?: number[][];  // [[start, end], ...]
}

export interface DeconstructResponse {
    units: UnitInfo[];
    links: UnitLinkInfo[];
    statistics: DeconstructStats;
    errors: string[];
}

export interface TraceabilityLink {
    unit_id: string;
    dafny_file_id: string;
    title: string;
    source_range: {
        start_line: number;
        end_line: number;
    };
    status: string;
}

export interface TraceabilityResponse {
    source_file_id: string;
    links: TraceabilityLink[];
}

// === File Operations Types ===
export type SaveStatus = "clean" | "dirty" | "saving" | "error";

export interface ActiveFileState {
  id: string;
  content: string;           // Current editor content
  syncedContent: string;     // Last confirmed saved content
  status: SaveStatus;
  lastSavedAt: Date | null;
  filename: string;
  fileType: FileType;
  projectId: string;
}

export interface FileCache {
  [fileId: string]: {
    content: string;
    timestamp: number;
    fileType: string;
  }
}
