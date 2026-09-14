import React from "react";
import { Card, Tag, Alert, Spin, Typography } from "antd";
import { EvaluationResult } from "../types/interfaces";

const { Text } = Typography;

interface ResultDisplayProps {
    result: EvaluationResult | null;
    loading: boolean;
}

export function ResultDisplay({ result, loading }: ResultDisplayProps) {
    if (loading) {
        return (
          <Card
            size="small"
            style={ { marginTop: 12 } }
            title="Result"
          >
            <div style={ { textAlign: "center", padding: "24px 0" } }>
              <Spin tip="Evaluating..." />
            </div>
          </Card>
        );
    }

    if (!result) {
        return (
          <Card
            size="small"
            style={ { marginTop: 12 } }
            title="Result"
          >
            <Text type="secondary">Enter an expression and click Evaluate to see results.</Text>
          </Card>
        );
    }

    return (
      <Card
        size="small"
        style={ { marginTop: 12 } }
        title="Result"
      >
        {!result.success ? (
          <Alert
            description={ result.error }
            message="Evaluation Error"
            showIcon
            type="error"
          />
            ) : (
              <div>
                <pre style={ {
                        background: "#f5f5f5",
                        padding: "12px",
                        borderRadius: "6px",
                        margin: "0 0 8px 0",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontSize: "13px",
                        fontFamily: "monospace",
                    } }
                >
                  {result.result}
                </pre>
                {result.resultType && <Tag color="blue">{result.resultType}</Tag>}
              </div>
            )}
      </Card>
    );
}
