import React, { useState, useCallback } from "react";
import { Content, Header } from "@pimcore/studio-ui-bundle/components";
import { Button, Card, Row, Col, Typography } from "antd";
import { SelectOutlined } from "@ant-design/icons";
import { SelectionType, useElementSelector } from "@pimcore/studio-ui-bundle/modules/element";
import { useFieldTree, useEvaluateExpression } from "../hooks/useExpressionTester";
import { FieldTree } from "./FieldTree";
import { ExpressionEditor } from "./ExpressionEditor";
import { ResultDisplay } from "./ResultDisplay";

const { Text } = Typography;

export function ExpressionTesterWidget() {
    const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
    const [selectedObjectInfo, setSelectedObjectInfo] = useState<string>("");
    const [expression, setExpression] = useState("");

    const { fieldTree, loading: fieldsLoading } = useFieldTree(selectedObjectId);
    const { evaluate, loading: evalLoading, result } = useEvaluateExpression();

    const { open: openObjectSelector } = useElementSelector({
        selectionType: SelectionType.Single,
        areas: { asset: false, object: true, document: false },
        config: { objects: { allowedTypes: ["object"] } },
        onFinish: (event) => {
            if (event.items.length > 0) {
                const item = event.items[0];
                setSelectedObjectId(item.data.id);
                setSelectedObjectInfo(`${item.data.key} #${item.data.id}`);
            }
        },
    });

    const handleFieldClick = useCallback((snippet: string) => {
        setExpression((prev) => {
            const trimmed = prev.trimEnd();
            if (!trimmed) return snippet;
            return trimmed + ' ~ " " ~ ' + snippet;
        });
    }, []);

    const handleEvaluate = useCallback(() => {
        if (selectedObjectId && expression.trim()) {
            evaluate(selectedObjectId, expression);
        }
    }, [selectedObjectId, expression, evaluate]);

    return (
      <Content padded>
        <Header title="Expression Tester" />
        <Row
          gutter={ 16 }
          style={ { height: "100%" } }
        >
          <Col span={ 10 }>
            <Card
              size="small"
              style={ { marginBottom: 12 } }
            >
              <div style={ { display: "flex", alignItems: "center", gap: "8px" } }>
                <Button
                  icon={ <SelectOutlined /> }
                  onClick={ openObjectSelector }
                >
                  Select DataObject
                </Button>
                {selectedObjectInfo && (
                <Text strong>
                  {selectedObjectInfo}
                  {fieldTree?.className && <Text type="secondary"> ({fieldTree.className})</Text>}
                </Text>
                            )}
              </div>
            </Card>
            <Card
              size="small"
              style={ { overflow: "auto" } }
              title="Available Fields"
            >
              <FieldTree
                fields={ fieldTree?.fields || [] }
                loading={ fieldsLoading }
                onFieldClick={ handleFieldClick }
              />
            </Card>
          </Col>
          <Col span={ 14 }>
            <Card size="small">
              <ExpressionEditor
                disabled={ !selectedObjectId }
                expression={ expression }
                loading={ evalLoading }
                onChange={ setExpression }
                onEvaluate={ handleEvaluate }
              />
            </Card>
            <ResultDisplay
              loading={ evalLoading }
              result={ result }
            />
          </Col>
        </Row>
      </Content>
    );
}
