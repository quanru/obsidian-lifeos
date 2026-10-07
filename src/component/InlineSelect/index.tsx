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

/** 选项值支持字符串或数字（数字用于如 weekStart 这类存储为 number 的字段，避免外层再做 string 桥接） */
export type InlineSelectValue = string | number;

export interface InlineSelectOption {
  value: InlineSelectValue;
  label: ReactNode;
  /** 纯文本，用于搜索过滤与触发框显示（label 为 ReactNode 时必填才支持搜索/正确显示） */
  text?: string;
  disabled?: boolean;
}

interface InlineSelectProps {
  /** 受 antd Form.Item 注入 */
  value?: InlineSelectValue;
  /** 受 antd Form.Item 注入 */
  onChange?: (value: InlineSelectValue) => void;
  options: InlineSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  showSearch?: boolean;
  style?: CSSProperties;
  className?: string;
}

const optionText = (opt: InlineSelectOption): string =>
  opt.text ?? (typeof opt.label === 'string' || typeof opt.label === 'number' ? String(opt.label) : String(opt.value));

/**
 * 不依赖 antd / portal 的内联单选下拉。
 *
 * 下拉浮层直接渲染在组件自身 position:relative 容器内（绝对定位），永远和触发元素
 * 同一个 document —— 规避 Obsidian 多窗口下 antd portal 默认挂主窗口 document.body
 * 导致下拉漂移 / 被遮挡的问题。可直接放进 antd Form.Item（接收注入的 value/onChange）。
 */
export const InlineSelect: FC<InlineSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  allowClear,
  showSearch,
  style,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOption = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    if (!showSearch || !search) return options;
    const kw = search.toLowerCase();
    return options.filter((o) => optionText(o).toLowerCase().includes(kw));
  }, [options, search, showSearch]);

  const close = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    setSearch('');
  }, []);

  const open = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    const idx = options.findIndex((o) => o.value === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
  }, [disabled, options, value]);

  // 外部点击关闭：用容器自身 ownerDocument（触发元素所在窗口）
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

  // 打开时聚焦搜索框
  useEffect(() => {
    if (isOpen && showSearch) searchRef.current?.focus();
  }, [isOpen, showSearch]);

  // 高亮项滚动进可视区
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0 || !dropdownRef.current) return;
    const items = dropdownRef.current.querySelectorAll('.inline-select-option');
    items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, isOpen]);

  const selectValue = useCallback(
    (val: InlineSelectValue) => {
      const opt = options.find((o) => o.value === val);
      if (opt?.disabled) return;
      onChange?.(val);
      close();
    },
    [options, onChange, close],
  );

  const handleToggle = () => {
    if (disabled) return;
    if (isOpen) close();
    else open();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        if (e.key === ' ' && showSearch && isOpen) break; // 搜索时空格用于输入
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          selectValue(filtered[highlightedIndex].value);
        } else {
          handleToggle();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) open();
        else
          setHighlightedIndex((prev) => {
            let n = prev + 1;
            while (n < filtered.length && filtered[n].disabled) n++;
            return n < filtered.length ? n : prev;
          });
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen)
          setHighlightedIndex((prev) => {
            let n = prev - 1;
            while (n >= 0 && filtered[n].disabled) n--;
            return n >= 0 ? n : prev;
          });
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
      className={`inline-select ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''} ${className || ''}`}
      style={style}
    >
      <div
        className="inline-select-trigger"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={isOpen && highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
        aria-disabled={disabled}
      >
        <span className={`inline-select-label ${!selectedOption ? 'inline-select-placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder || ''}
        </span>
        <span className="inline-select-suffix">
          {allowClear && selectedOption && !disabled && (
            <span
              className="inline-select-clear"
              role="button"
              tabIndex={0}
              aria-label="clear"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange?.('');
                close();
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                e.stopPropagation();
                onChange?.('');
                close();
              }}
            >
              ×
            </span>
          )}
          <span className="inline-select-arrow">▾</span>
        </span>
      </div>

      {isOpen && (
        <div id={listboxId} ref={dropdownRef} className="inline-select-dropdown" role="listbox" tabIndex={-1}>
          {showSearch && (
            <div className="inline-select-search">
              <input
                ref={searchRef}
                value={search}
                placeholder={placeholder}
                role="searchbox"
                aria-controls={listboxId}
                aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}
          <div className="inline-select-options">
            {filtered.length === 0 ? (
              <div className="inline-select-empty">—</div>
            ) : (
              filtered.map((opt, idx) => (
                <div
                  id={`${listboxId}-option-${idx}`}
                  key={opt.value}
                  className={`inline-select-option ${opt.value === value ? 'selected' : ''} ${idx === highlightedIndex ? 'highlighted' : ''} ${opt.disabled ? 'disabled' : ''}`}
                  role="option"
                  tabIndex={-1}
                  aria-selected={opt.value === value}
                  aria-disabled={opt.disabled}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectValue(opt.value);
                  }}
                >
                  <span className="inline-select-option-label">{opt.label}</span>
                  {opt.value === value && <span className="inline-select-option-check">✓</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
