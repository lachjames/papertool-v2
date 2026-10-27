/**
 * Shared PDF Generation Types
 * Single source of truth for all PDF generation interfaces
 * Used across: Client, Server, and Lambda
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Standard page sizes supported by the system
 */
export type StandardPageSize = 'letter' | 'a4' | 'small';

/**
 * Custom page size with dimensions as strings (with units)
 */
export interface CustomPageSize {
    width: string;   // e.g., "8.5in", "210mm", "612px"
    height: string;  // e.g., "11in", "297mm", "792px"
}

/**
 * Page size can be either a standard size or custom dimensions
 */
export type PageSize = StandardPageSize | CustomPageSize;

/**
 * Margin specification for PDF generation
 */
export interface PdfMargin {
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;
}

/**
 * Comprehensive PDF generation options
 */
export interface PdfOptions {
    /** Whether to print background graphics */
    printBackground?: boolean;
    /** Whether to prefer CSS page size over options */
    preferCSSPageSize?: boolean;
    /** Scale factor for the PDF (0.1 to 2) */
    scale?: number;
    /** Whether to generate in landscape orientation */
    landscape?: boolean;
    /** Page margins */
    margin?: PdfMargin;
    /** Whether to display header and footer */
    displayHeaderFooter?: boolean;
    /** HTML template for header */
    headerTemplate?: string;
    /** HTML template for footer */
    footerTemplate?: string;
    /** Timeout for page loading in milliseconds */
    timeout?: number;
    /** Wait until condition for page loading */
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
}

// ============================================================================
// REQUEST/RESPONSE INTERFACES
// ============================================================================

/**
 * Standard PDF generation request format
 * Used by Client → Server → Lambda
 */
export interface PdfGenerationRequest {
    /** HTML content to convert to PDF */
    html: string;
    /** Page size specification */
    size: PageSize;
    /** PDF generation options */
    options?: PdfOptions;
    /** Internal flag: whether to return PDF data in response */
    returnBuffer?: boolean;
}

/**
 * Standard PDF generation response format
 * Used by Lambda → Server → Client
 */
export interface PdfGenerationResponse {
    /** Whether the operation was successful */
    success: boolean;
    /** Size of generated PDF in bytes */
    bytes?: number;
    /** Page size used for generation */
    size?: string;
    /** Base64-encoded PDF data (only if returnBuffer was true) */
    pdfBase64?: string;
    /** Error message if success is false */
    error?: string;
    /** Additional error details for debugging */
    details?: string;
    /** Error stack trace (development only) */
    stack?: string;
}

/**
 * Lambda function event structure
 * Handles both API Gateway and direct invocation
 */
export interface LambdaEvent {
    /** HTTP method for API Gateway events */
    httpMethod?: string;
    /** Request body (may be string or object) */
    body?: string | PdfGenerationRequest;
    /** Headers for API Gateway events */
    headers?: Record<string, string>;
    /** Query parameters */
    queryStringParameters?: Record<string, string> | null;
    /** Path parameters */
    pathParameters?: Record<string, string> | null;
    /** Request context */
    requestContext?: any;
    /** Direct invocation payload */
    [key: string]: any;
}

/**
 * Lambda function response structure
 * Compatible with API Gateway format
 */
export interface LambdaResponse {
    /** HTTP status code */
    statusCode: number;
    /** Whether body is base64 encoded */
    isBase64Encoded?: boolean;
    /** Response headers */
    headers?: Record<string, string>;
    /** Response body (JSON stringified) */
    body: string;
}

/**
 * Lambda context object
 */
export interface LambdaContext {
    /** Function name */
    functionName: string;
    /** Function version */
    functionVersion: string;
    /** Invoked function ARN */
    invokedFunctionArn: string;
    /** Memory limit in MB */
    memoryLimitInMB: string;
    /** AWS request ID */
    awsRequestId: string;
    /** Log group name */
    logGroupName: string;
    /** Log stream name */
    logStreamName: string;
    /** Remaining time in milliseconds */
    getRemainingTimeInMillis(): number;
    /** Success callback */
    succeed(result: any): void;
    /** Fail callback */
    fail(error: Error): void;
    /** Done callback */
    done(error?: Error, result?: any): void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Standard page size dimensions in points (72 points = 1 inch)
 */
export const STANDARD_PAGE_SIZES: Record<StandardPageSize, { width: string; height: string }> = {
    small: { width: '6in', height: '4in' },      // 432x288 points
    letter: { width: '8.5in', height: '11in' },   // 612x792 points
    a4: { width: '8.27in', height: '11.69in' }    // 595x842 points
} as const;

/**
 * Default PDF generation options
 */
export const DEFAULT_PDF_OPTIONS: Required<PdfOptions> = {
    printBackground: true,
    preferCSSPageSize: true,
    scale: 1,
    landscape: false,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    displayHeaderFooter: false,
    headerTemplate: '',
    footerTemplate: '',
    timeout: 30000,
    waitUntil: 'networkidle0'
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a page size is a standard size
 */
export function isStandardPageSize(size: PageSize): size is StandardPageSize {
    return typeof size === 'string' && size in STANDARD_PAGE_SIZES;
}

/**
 * Type guard to check if a page size is a custom size
 */
export function isCustomPageSize(size: PageSize): size is CustomPageSize {
    return typeof size === 'object' && 'width' in size && 'height' in size;
}

/**
 * Type guard to check if an event is an API Gateway event
 */
export function isApiGatewayEvent(event: LambdaEvent): boolean {
    return 'httpMethod' in event && 'headers' in event;
}

/**
 * Type guard to check if a response is a successful PDF response
 */
export function isSuccessfulPdfResponse(response: PdfGenerationResponse): response is PdfGenerationResponse & { success: true; bytes: number } {
    return response.success === true && typeof response.bytes === 'number';
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates a page size specification
 */
export function validatePageSize(size: unknown): size is PageSize {
    if (typeof size === 'string') {
        return size in STANDARD_PAGE_SIZES;
    }

    if (typeof size === 'object' && size !== null) {
        const customSize = size as any;
        return typeof customSize.width === 'string' &&
            typeof customSize.height === 'string' &&
            customSize.width.length > 0 &&
            customSize.height.length > 0;
    }

    return false;
}

/**
 * Validates a PDF generation request
 */
export function validatePdfRequest(request: unknown): request is PdfGenerationRequest {
    if (typeof request !== 'object' || request === null) {
        return false;
    }

    const req = request as any;

    // Check required fields
    if (typeof req.html !== 'string' || req.html.length === 0) {
        return false;
    }

    if (!validatePageSize(req.size)) {
        return false;
    }

    // Check optional fields
    if (req.options !== undefined && typeof req.options !== 'object') {
        return false;
    }

    if (req.returnBuffer !== undefined && typeof req.returnBuffer !== 'boolean') {
        return false;
    }

    return true;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Resolves a page size to its dimensions
 */
export function resolvePageSize(size: PageSize): { width: string; height: string } | null {
    if (isStandardPageSize(size)) {
        return STANDARD_PAGE_SIZES[size];
    }

    if (isCustomPageSize(size)) {
        return { width: size.width, height: size.height };
    }

    return null;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
    statusCode: number,
    error: string,
    details?: string,
    stack?: string
): LambdaResponse {
    // This file is compiled for the browser too, where `process` is not declared.
    const nodeEnv = (globalThis as any).process?.env?.NODE_ENV as string | undefined;

    const response: PdfGenerationResponse = {
        success: false,
        error,
        ...(details && { details }),
        ...(stack && nodeEnv === 'development' && { stack })
    };

    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify(response)
    };
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(
    bytes: number,
    size: string,
    pdfBase64?: string
): LambdaResponse {
    const response: PdfGenerationResponse = {
        success: true,
        bytes,
        size,
        ...(pdfBase64 && { pdfBase64 })
    };

    return {
        statusCode: 200,
        isBase64Encoded: false,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify(response)
    };
}

/**
 * Merges PDF options with defaults
 */
export function mergePdfOptions(options?: PdfOptions): Required<PdfOptions> {
    return {
        ...DEFAULT_PDF_OPTIONS,
        ...options,
        margin: {
            ...DEFAULT_PDF_OPTIONS.margin,
            ...options?.margin
        }
    };
}
