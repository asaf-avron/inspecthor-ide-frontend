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

// === Blueprint Types ===
export type BlueprintDomain = "banking" | "healthcare" | "authentication" | "custom";

export interface BlueprintInitRequest {
    owner: string;
    repo_name: string;
    installation_id: number;
    blueprint_name: string;
    description?: string;
}

export interface BlueprintInitResponse {
    blueprint: BlueprintResponse;
    github_url: string;
    commit_sha: string;
    files_created: string[];
    setup_status: "success" | "partial" | "failed";
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
    blueprint_id?: string;
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
    blueprint_id: string;  // Required - files must belong to a blueprint
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
    blueprint_id: string;
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

// === Blueprint Management Types ===
export interface Blueprint {
    blueprint_id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    file_count: number;
    repository_url?: string;
    default_branch?: string;
}

export interface BlueprintCreateRequest {
    name: string;
    description?: string;
}

export interface BlueprintUpdateRequest {
    name?: string;
    description?: string;
}

export interface BlueprintResponse {
    blueprint_id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    file_count: number;
    redirect_url?: string;
    repository_url?: string;
    default_branch?: string;
}

export interface BlueprintListParams {
    limit?: number;
    offset?: number;
    sort?: "created_at" | "updated_at" | "name";
    order?: "asc" | "desc";
}

export interface BlueprintListResponse {
    blueprints: BlueprintResponse[];
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

export interface BlueprintStructureResponse {
    blueprint: BlueprintResponse;
    files: FileMetadata[];
}

export interface BlueprintDeleteResponse {
    deleted: boolean;
    blueprint_id: string;
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
    blueprint_id?: string;
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

// === Blueprint Explorer Types (Frontend-specific) ===
export type BlueprintFileType = "md" | "dfy" | "folder" | "unit";
export type BlueprintVerificationStatus = "verified" | "failed" | "pending" | "none";

export interface BlueprintFileItem {
    id: string;
    name: string;
    type: BlueprintFileType;
    linkedDfy?: string;
    verificationStatus?: BlueprintVerificationStatus;
    children?: BlueprintFileItem[];
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
    blueprint_id: string;
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
    blueprintId: string;
}

export interface FileCache {
    [fileId: string]: {
        content: string;
        timestamp: number;
        fileType: string;
    }
}

// === Proof Ledger Types ===
export type LedgerVerificationStatus = "verified" | "failed" | "timeout" | "error";

export interface LedgerEntry {
    entry_id: string;
    component_uuid: string;
    timestamp: string;
    dafny_content_hash: string;
    verification_status: LedgerVerificationStatus;
    proof_obligations_proven: number;
    proof_obligations_total: number;
    dafny_version: string;
    signature: string;
    previous_hash: string | null;
    entry_number: number;
}

export interface LedgerHistoryResponse {
    component_uuid: string;
    entries: LedgerEntry[];
    total_entries: number;
}

export interface ChainIntegrityResponse {
    component_uuid: string;
    chain_valid: boolean;
    total_entries: number;
    broken_links: number[];
    errors: string[];
}

export interface LatestEntryResponse {
    component_uuid: string;
    entry: LedgerEntry | null;
    has_history: boolean;
}

export interface CodeComparisonResponse {
    uuid: string;
    entry_id: string;
    verified_hash: string;
    current_hash: string;
    hash_match: boolean;
    verified_code: string;
    current_code: string;
    diff: {
        added_lines: number[];
        removed_lines: number[];
        modified_lines: number[];
    };
    changes_summary: string[];
}

// === Drift Detection Types ===
export type DriftIssueType = "moved" | "corrupted" | "missing" | "orphaned";
export type DriftRepairAction = "update_registry" | "regenerate" | "register" | "delete";

export interface DriftIssue {
    uuid: string;
    component_name: string;
    issue_type: DriftIssueType;
    expected_path: string | null;
    found_path: string | null;
    description: string;
    severity: "critical" | "high" | "medium" | "low";
    can_auto_repair: boolean;
    suggested_action: DriftRepairAction;
}

export interface DriftScanResponse {
    success: boolean;
    repo_path: string;
    scan_timestamp: string;
    total_components: number;
    issues: DriftIssue[];
    health_score: number;
}

export interface DriftRepairRequest {
    uuid: string;
    action: DriftRepairAction;
    new_path?: string;
}

export interface DriftRepairResponse {
    success: boolean;
    uuid: string;
    action: DriftRepairAction;
    message: string;
}

export interface DriftAutoRepairResponse {
    success: boolean;
    repaired_count: number;
    failed_count: number;
    repaired_components: string[];
    failed_components: string[];
    errors: string[];
}

export interface DriftHealthResponse {
    repo_path: string;
    health_score: number;
    total_components: number;
    healthy_components: number;
    issues_count: number;
    last_scan: string | null;
}

// === Diagram Generation Types ===
export type DiagramSourceType = "spec" | "code";
export type DiagramFormat = "mermaid" | "plantuml";

export interface GenerateDiagramRequest {
    source_type: DiagramSourceType;
    source_content: string;
    format?: DiagramFormat;
}

export interface GenerateDiagramResponse {
    success: boolean;
    diagram_code: string;
    format: DiagramFormat;
    nodes_count: number;
    edges_count: number;
}

export interface CompareDiagramsRequest {
    expected_diagram: string;
    actual_diagram: string;
}

export interface DiagramDifference {
    type: "missing_node" | "extra_node" | "missing_edge" | "extra_edge" | "modified_node";
    description: string;
    severity: "critical" | "high" | "medium" | "low";
}

export interface CompareDiagramsResponse {
    similarity_score: number;
    differences: DiagramDifference[];
    matching_nodes: string[];
    matching_edges: string[];
    missing_nodes: string[];
    extra_nodes: string[];
    missing_edges: string[];
    extra_edges: string[];
}

// === Harmonization Types ===
export type SyncStatus = "synchronized" | "desynchronized" | "verifying" | "error";
export type HarmonizationStrategy = "incremental" | "full" | "manual";

export interface HarmonizationStatusResponse {
    blueprint_id: string;
    status: SyncStatus;
    last_sync: string | null;
    spec_modified: string | null;
    dafny_modified: string | null;
    needs_harmonization: boolean;
    verification_passing: boolean;
}

export interface SpecDiffResponse {
    blueprint_id: string;
    has_changes: boolean;
    added_requirements: string[];
    removed_requirements: string[];
    modified_requirements: string[];
    diff_summary: string;
}

export interface HarmonizeRequest {
    blueprint_id: string;
    strategy: HarmonizationStrategy;
    force?: boolean;
}

export interface HarmonizeResponse {
    success: boolean;
    status: SyncStatus;
    steps_completed: string[];
    verification_result?: {
        passed: boolean;
        errors: string[];
    };
    message: string;
}
