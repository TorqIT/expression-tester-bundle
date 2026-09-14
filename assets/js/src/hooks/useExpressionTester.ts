import { useState, useEffect } from "react";
import { message } from "antd";
import { FieldTreeResponse, EvaluationResult, FieldNode } from "../types/interfaces";

const API_BASE = "/pimcore-studio/api/expression-tester";

export function useFieldTree(objectId: number | null) {
    const [fieldTree, setFieldTree] = useState<FieldTreeResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!objectId) {
            setFieldTree(null);
            return;
        }

        const loadFields = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE}/fields/${objectId}`);
                const data = await response.json();
                if (response.ok) {
                    setFieldTree(data);
                } else {
                    message.error(data.error || "Failed to load fields");
                }
            } catch {
                message.error("Network error loading fields");
            } finally {
                setLoading(false);
            }
        };

        loadFields();
    }, [objectId]);

    return { fieldTree, loading };
}

export function useEvaluateExpression() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<EvaluationResult | null>(null);

    const evaluate = async (objectId: number, expression: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/evaluate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ objectId, expression }),
            });
            const data = await response.json();
            if (response.ok) {
                setResult(data);
            } else {
                setResult({ success: false, result: null, resultType: null, error: data.error || "Evaluation failed" });
            }
        } catch {
            setResult({ success: false, result: null, resultType: null, error: "Network error during evaluation" });
        } finally {
            setLoading(false);
        }
    };

    return { evaluate, loading, result };
}

export function useRelatedFields() {
    const [loading, setLoading] = useState(false);

    const fetchRelatedFields = async (className: string, accessorPrefix?: string): Promise<FieldNode[]> => {
        setLoading(true);
        try {
            const params = accessorPrefix ? `?accessorPrefix=${encodeURIComponent(accessorPrefix)}` : "";
            const response = await fetch(`${API_BASE}/related-fields/${className}${params}`);
            const data = await response.json();
            if (response.ok) {
                return data.fields;
            } else {
                message.error(data.error || "Failed to load related fields");
                return [];
            }
        } catch {
            message.error("Network error loading related fields");
            return [];
        } finally {
            setLoading(false);
        }
    };

    return { fetchRelatedFields, loading };
}
