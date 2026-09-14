export interface FieldNode {
    name: string;
    title: string;
    fieldType: string;
    expressionSnippet: string | null;
    isRelational: boolean;
    isExpandable: boolean;
    relatedClassName?: string;
    children: FieldNode[];
}

export interface FieldTreeResponse {
    objectId: number;
    className: string;
    fields: FieldNode[];
}

export interface EvaluationResult {
    success: boolean;
    result: string | null;
    resultType: string | null;
    error: string | null;
}
