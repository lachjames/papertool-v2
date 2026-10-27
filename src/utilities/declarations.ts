import { DeclarationStatus, PaperDeclaration, PaperDeclarations } from '../types';

export interface DeclarationField {
    key: keyof PaperDeclarations;
    label: string;
    question: string;
    detailsLabel: string;
}

// Order and wording follow the Faculty Research Integrity committee request.
export const DECLARATION_FIELDS: DeclarationField[] = [
    {
        key: 'funding',
        label: 'Funding',
        question: 'Did the research receive funding?',
        detailsLabel: 'Funding details (funder, grant number)'
    },
    {
        key: 'conflictsOfInterest',
        label: 'Conflicts of interest',
        question: 'Do any authors have relevant conflicts of interest?',
        detailsLabel: 'Conflict of interest details'
    },
    {
        key: 'ethicsApproval',
        label: 'Ethics approval',
        question: 'Was ethics approval obtained?',
        detailsLabel: 'Ethics approval details (committee, approval number)'
    }
];

export function emptyDeclarations(): PaperDeclarations {
    return {
        funding: { status: 'not_provided' },
        conflictsOfInterest: { status: 'not_provided' },
        ethicsApproval: { status: 'not_provided' }
    };
}

function normalizeOne(input: unknown): PaperDeclaration {
    const raw = (input && typeof input === 'object') ? input as Record<string, unknown> : {};
    const status: DeclarationStatus = raw.status === 'yes' || raw.status === 'no' ? raw.status : 'not_provided';
    const details = typeof raw.details === 'string' ? raw.details : '';
    return details ? { status, details } : { status };
}

/** Historic papers have no `declarations` key at all; treat that as "not provided". */
export function normalizeDeclarations(input: unknown): PaperDeclarations {
    const raw = (input && typeof input === 'object') ? input as Record<string, unknown> : {};
    return {
        funding: normalizeOne(raw.funding),
        conflictsOfInterest: normalizeOne(raw.conflictsOfInterest),
        ethicsApproval: normalizeOne(raw.ethicsApproval)
    };
}

export function declarationsAnswered(declarations: PaperDeclarations | null | undefined): boolean {
    if (!declarations) return false;
    return DECLARATION_FIELDS.every(field => {
        const status = declarations[field.key]?.status;
        return status === 'yes' || status === 'no';
    });
}

export function describeDeclaration(declaration: PaperDeclaration | null | undefined): string {
    if (!declaration || declaration.status === 'not_provided') return 'Not provided';
    const base = declaration.status === 'yes' ? 'Yes' : 'No';
    const details = (declaration.details || '').trim();
    return details ? `${base} — ${details}` : base;
}
