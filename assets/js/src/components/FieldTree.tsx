import React, { useState, useCallback } from "react";
import { Tree, Tag, Button, Spin } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";
import { FieldNode } from "../types/interfaces";
import { useRelatedFields } from "../hooks/useExpressionTester";

interface FieldTreeProps {
    fields: FieldNode[];
    onFieldClick: (snippet: string) => void;
    loading: boolean;
}

const FIELD_TYPE_COLORS: Record<string, string> = {
    input: "blue",
    textarea: "blue",
    wysiwyg: "blue",
    numeric: "purple",
    date: "orange",
    datetime: "orange",
    checkbox: "green",
    select: "cyan",
    multiselect: "cyan",
    manyToOneRelation: "magenta",
    manyToManyRelation: "magenta",
    manyToManyObjectRelation: "magenta",
    advancedManyToManyRelation: "magenta",
    advancedManyToManyObjectRelation: "magenta",
    localizedfields: "gold",
    objectbricks: "volcano",
    objectbrick: "volcano",
    fieldcollections: "geekblue",
    fieldcollection: "geekblue",
    block: "purple",
    classificationstore: "gold",
    classificationstore_group: "gold",
    dataQuality: "red",
    dataQuality_mark: "red",
    dataQuality_details: "red",
    image: "lime",
    calculatedValue: "red",
};

export function FieldTree({ fields, onFieldClick, loading }: FieldTreeProps) {
    const { fetchRelatedFields } = useRelatedFields();
    const [expandedRelations, setExpandedRelations] = useState<Record<string, FieldNode[]>>({});
    const [loadingRelations, setLoadingRelations] = useState<Record<string, boolean>>({});

    const handleExpandRelation = useCallback(
        async (className: string, nodeKey: string, accessorPrefix: string) => {
            if (expandedRelations[nodeKey]) return;

            setLoadingRelations((prev) => ({ ...prev, [nodeKey]: true }));
            const relatedFields = await fetchRelatedFields(className, accessorPrefix);
            setExpandedRelations((prev) => ({ ...prev, [nodeKey]: relatedFields }));
            setLoadingRelations((prev) => ({ ...prev, [nodeKey]: false }));
        },
        [expandedRelations, fetchRelatedFields]
    );

    const getRelationalNodeMap = useCallback(
        (nodes: FieldNode[], parentKey: string = ""): Record<string, { className: string; snippet: string }> => {
            const map: Record<string, { className: string; snippet: string }> = {};
            for (const field of nodes) {
                const key = parentKey ? `${parentKey}.${field.name}` : field.name;
                if (field.isExpandable && field.relatedClassName && field.expressionSnippet) {
                    map[key] = { className: field.relatedClassName, snippet: field.expressionSnippet };
                }
                if (field.children.length > 0) {
                    Object.assign(map, getRelationalNodeMap(field.children, key));
                }
            }
            return map;
        },
        []
    );

    const handleExpand = useCallback(
        (expandedKeys: React.Key[]) => {
            const lookup = getRelationalNodeMap(fields);
            for (const key of expandedKeys) {
                const info = lookup[key as string];
                if (info && !expandedRelations[key as string]) {
                    handleExpandRelation(info.className, key as string, info.snippet);
                }
            }
        },
        [fields, getRelationalNodeMap, expandedRelations, handleExpandRelation]
    );

    const buildTreeData = useCallback(
        (nodes: FieldNode[], parentKey: string = ""): DataNode[] => {
            return nodes.map((field) => {
                const key = parentKey ? `${parentKey}.${field.name}` : field.name;
                const color = FIELD_TYPE_COLORS[field.fieldType] || "default";

                const titleContent = (
                  <span style={ { display: "inline-flex", alignItems: "center", gap: "6px" } }>
                    <span>{field.title || field.name}</span>
                    <Tag
                      color={ color }
                      style={ { fontSize: "10px", lineHeight: "16px", padding: "0 4px" } }
                    >
                      {field.fieldType}
                    </Tag>
                    {field.expressionSnippet && (
                    <Button
                      icon={ <PlusOutlined /> }
                      onClick={ (e) => {
                                    e.stopPropagation();
                                    onFieldClick(field.expressionSnippet!);
                                } }
                      size="small"
                      style={ { padding: "0 4px", height: "20px", lineHeight: "20px" } }
                      title={ `Insert: ${field.expressionSnippet}` }
                      type="text"
                    />
                        )}
                    {field.isExpandable && loadingRelations[key] && <Spin size="small" />}
                  </span>
                );

                const children: DataNode[] = [];
                if (field.children.length > 0) {
                    children.push(...buildTreeData(field.children, key));
                }
                if (expandedRelations[key]) {
                    children.push(...buildTreeData(expandedRelations[key], key));
                }

                return {
                    key,
                    title: titleContent,
                    children: children.length > 0 ? children : undefined,
                    isLeaf: children.length === 0 && !field.isExpandable,
                };
            });
        },
        [onFieldClick, expandedRelations, loadingRelations]
    );

    if (loading) {
        return (
          <div style={ { textAlign: "center", padding: "24px 0" } }>
            <Spin tip="Loading fields..." />
          </div>
        );
    }

    if (fields.length === 0) {
        return <div style={ { color: "#999", padding: "12px 0" } }>Select a DataObject to browse its fields.</div>;
    }

    return (
      <Tree
        defaultExpandAll={ false }
        onExpand={ handleExpand }
        showLine
        style={ { fontSize: "13px" } }
        treeData={ buildTreeData(fields) }
      />
    );
}
