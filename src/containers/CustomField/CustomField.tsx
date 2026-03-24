import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCustomField } from "../../common/hooks/useCustomField";
import { useAppConfig } from "../../common/hooks/useAppConfig";
import { useLyticsAttributes } from "../../common/hooks/useLyticsAttributes";
import { ATTRIBUTE_TOKEN_REGEX, parseAttributeToken } from "../../common/utils/functions";
import { AttributePicker } from "../../components/AttributePicker";
import { LyticsAttributesAppConfig, AttributeFieldData } from "../../common/types/types";
import localeTexts from "../../common/locales/en-us";
import "./CustomField.css";

const CustomField: React.FC = () => {
  const { customField, setFieldData } = useCustomField();
  const appConfig = useAppConfig() as unknown as LyticsAttributesAppConfig | null;
  const apiToken = appConfig?.lyticsApiToken || null;
  const { attributes, loading: attrsLoading, error: attrsError } = useLyticsAttributes(apiToken);

  const [text, setText] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPosRef = useRef<number>(0);

  // Load field data on mount
  useEffect(() => {
    if (customField) {
      const data = customField as AttributeFieldData;
      if (typeof data === "string") {
        setText(data);
      } else if (data?.text) {
        setText(data.text);
      }
    }
  }, [customField]);

  // Persist field data on text change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setText(val);
      cursorPosRef.current = e.target.selectionStart;
      setFieldData({ text: val });
    },
    [setFieldData]
  );

  // Insert attribute token at cursor position
  const handleInsertToken = useCallback(
    (token: string) => {
      const pos = cursorPosRef.current;
      const before = text.slice(0, pos);
      const after = text.slice(pos);
      const newText = before + token + after;
      setText(newText);
      setFieldData({ text: newText });
      setShowPicker(false);

      // Restore focus and cursor position after the inserted token
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = pos + token.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
          cursorPosRef.current = newPos;
        }
      }, 0);
    },
    [text, setFieldData]
  );

  // Track cursor position
  const handleSelect = useCallback(() => {
    if (textareaRef.current) {
      cursorPosRef.current = textareaRef.current.selectionStart;
    }
  }, []);

  // Build preview with highlighted tokens
  const renderPreview = () => {
    if (!text) return null;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const regex = new RegExp(ATTRIBUTE_TOKEN_REGEX.source, "g");
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Text before token
      if (match.index > lastIndex) {
        parts.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
      }
      // Token
      const parsed = parseAttributeToken(match[0]);
      if (parsed) {
        parts.push(
          <span key={`a-${match.index}`} className="cf-attribute-token">
            {"{{"}
            {parsed.slug}
            {parsed.defaultValue && <span className="cf-attribute-default">|{parsed.defaultValue}</span>}
            {"}}"}
          </span>
        );
      }
      lastIndex = match.index + match[0].length;
    }

    // Remaining text
    if (lastIndex < text.length) {
      parts.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex)}</span>);
    }

    return <div className="cf-preview">{parts}</div>;
  };

  const t = localeTexts.CustomField;

  return (
    <div className="cf-container">
      <div className="cf-header">
        <span className="cf-label">{t.title}</span>
        {apiToken && (
          <button
            type="button"
            className="cf-insert-btn"
            onClick={() => setShowPicker(!showPicker)}
          >
            {t.insertAttribute}
          </button>
        )}
      </div>

      <textarea
        ref={textareaRef}
        className="cf-textarea"
        value={text}
        onChange={handleChange}
        onSelect={handleSelect}
        onClick={handleSelect}
        placeholder={t.placeholder}
        rows={3}
      />

      {renderPreview()}

      {!apiToken && (
        <div className="cf-hint">{t.noConfig}</div>
      )}

      {showPicker && apiToken && (
        <div className="cf-picker-panel">
          <AttributePicker
            attributes={attributes}
            loading={attrsLoading}
            error={attrsError}
            onInsert={handleInsertToken}
            onCancel={() => setShowPicker(false)}
          />
        </div>
      )}
    </div>
  );
};

export default CustomField;
