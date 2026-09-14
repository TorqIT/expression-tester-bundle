import React from "react";
import { Input, Button, Select, Space } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";

const { TextArea } = Input;

interface ExpressionEditorProps {
    expression: string;
    onChange: (value: string) => void;
    onEvaluate: () => void;
    loading: boolean;
    disabled: boolean;
}

const COMMON_SNIPPETS = [
    { label: "Concatenation (~)", value: ' ~ " " ~ ' },
    { label: "Ternary (? :)", value: ' ? "yes" : "no"' },
    { label: "toLower()", value: "toLower()" },
    { label: "regexReplace()", value: 'regexReplace(object.getField(), "/pattern/", "replacement")' },
    { label: "in array", value: ' in ["a", "b"]' },
    { label: "matches regex", value: ' matches "/pattern/"' },
    { label: "null coalesce (?:)", value: " ?: 'default'" },
];

export function ExpressionEditor({ expression, onChange, onEvaluate, loading, disabled }: ExpressionEditorProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onEvaluate();
        }
    };

    return (
      <div>
        <div style={ { marginBottom: 8, fontWeight: 500 } }>Expression:</div>
        <TextArea
          autoSize={ { minRows: 4, maxRows: 10 } }
          disabled={ disabled }
          onChange={ (e) => onChange(e.target.value) }
          onKeyDown={ handleKeyDown }
          placeholder='e.g. object.getFirstName() ~ " " ~ object.getLastName()'
          style={ { fontFamily: "monospace", fontSize: "13px" } }
          value={ expression }
        />
        <Space
          style={ { marginTop: 8 } }
          wrap
        >
          <Select
            disabled={ disabled }
            onSelect={ (value: string) => onChange(expression + value) }
            options={ COMMON_SNIPPETS }
            placeholder="Common Snippets"
            style={ { width: 200 } }
            value={ null }
          />
          <Button
            disabled={ disabled || !expression.trim() }
            icon={ <PlayCircleOutlined /> }
            loading={ loading }
            onClick={ onEvaluate }
            type="primary"
          >
            Evaluate
          </Button>
          <span style={ { color: "#999", fontSize: "12px" } }>Ctrl+Enter</span>
        </Space>
      </div>
    );
}
