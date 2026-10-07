import './index.less';
import React, {
  type CSSProperties,
  type FC,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface InlineAutoCompleteOption {
  value: string;
  label?: ReactNode;
}

interface InlineAutoCompleteProps {
  /** 受 antd Form.Item 注入 */
  value?: string;
  /** 受 antd Form.Item 注入 */
  onChange?: (value: string) => void;
  options?: InlineAutoCompleteOption[];
  placeholder?: string;
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
  /** 自定义过滤；默认按输入子串大小写不敏感匹配 value/label */
  filter?: (input: string, option: InlineAutoCompleteOption) => boolean;
}

const defaultFilter = (input: string, option: InlineAutoCompleteOption): boolean => {
  const kw = input.toLowerCase();
  const label = typeof option.label === 'string' ? option.label : option.value;
  return option.value.toLowerCase().includes(kw) || label.toLowerCase().includes(kw);
};

/**
 * 不依赖 antd / portal 的内联自动补全输入（自由文本 + 建议下拉）。
 *
 * 建议浮层渲染在组件自身 position:relative 容器内，永远和输入框同 document，
 * 规避 Obsidian 多窗口下 antd portal 漂移问题。可直接放进 antd Form.Item。
 * 用于替换 `<AutoComplete options={...}><Input/></AutoComplete>`。
 */
export const InlineAutoComplete: FC<InlineAutoCompleteProps> = ({
  value,
  onChange,
  options = [],
  placeholder,
  disabled,
  style,
  className,
  filter = defaultFilter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const text = value ?? '';

  const filtered = useMemo(() => {
    if (!text) return options;
    return options.filter((o) => filter(text, o));
  }, [options, text, filter]);

  const close = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const doc = containerRef.current?.ownerDocument || document;
    const handle = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (t && containerRef.current && !containerRef.current.contains(t)) close();
    };
    doc.addEventListener('mousedown', handle);
    return () => doc.removeEventListener('mousedown', handle);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen || highlightedIndex < 0 || !dropdownRef.current) return;
    const items = dropdownRef.current.querySelectorAll('.inline-autocomplete-option');
    items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, isOpen]);

  const pick = useCallback(
    (val: string) => {
      onChange?.(val);
      close();
    },
    [onChange, close],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        else setHighlightedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
        break;
      case 'Enter':
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          e.preventDefault();
          pick(filtered[highlightedIndex].value);
        }
        break;
      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          close();
        }
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`inline-autocomplete ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''} ${className || ''}`}
      style={style}
    >
      <input
        className="inline-autocomplete-input"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen && filtered.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={isOpen && highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          onChange?.(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {isOpen && filtered.length > 0 && (
        <div id={listboxId} ref={dropdownRef} className="inline-autocomplete-dropdown" role="listbox" tabIndex={-1}>
          {filtered.map((opt, idx) => (
            <div
              id={`${listboxId}-option-${idx}`}
              key={opt.value}
              className={`inline-autocomplete-option ${idx === highlightedIndex ? 'highlighted' : ''} ${opt.value === text ? 'selected' : ''}`}
              role="option"
              tabIndex={-1}
              aria-selected={opt.value === text}
              onMouseEnter={() => setHighlightedIndex(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(opt.value);
              }}
            >
              {opt.label ?? opt.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
