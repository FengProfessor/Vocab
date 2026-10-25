import React, { createContext, forwardRef, useCallback, useContext, useImperativeHandle, useMemo, useRef, useState } from 'react';
import '@/components/ui/ui.css';

/* ═════════ THEME & CONFIG TYPES ═════════ */
export interface ThemeTokens {
  colorPrimary?: string;
  colorPrimaryBg?: string;
  colorSuccess?: string;
  colorSuccessBg?: string;
  colorSuccessBorder?: string;
  colorWarning?: string;
  colorWarningBg?: string;
  colorWarningBorder?: string;
  colorError?: string;
  colorErrorBg?: string;
  colorErrorBorder?: string;
  colorInfo?: string;
  colorBgBase?: string;
  colorBgContainer?: string;
  colorBgElevated?: string;
  colorBgLayout?: string;
  colorFillAlter?: string;
  colorBorder?: string;
  colorBorderSecondary?: string;
  colorText?: string;
  colorTextBase?: string;
  colorTextSecondary?: string;
  colorTextTertiary?: string;
  borderRadius?: number;
  borderRadiusLG?: number;
  fontFamily?: string;
}

export interface ThemeConfig {
  algorithm?: 'light' | 'dark';
  token?: ThemeTokens;
  components?: Record<string, Record<string, string | number>>;
}

export const theme = {
  defaultAlgorithm: 'light' as const,
  darkAlgorithm: 'dark' as const,
  getDesignToken: (cfg: ThemeConfig): Record<string, string | number> => {
    const isDark = cfg.algorithm === 'dark';
    const t = cfg.token ?? {};
    return {
      colorPrimary: t.colorPrimary ?? '#4f46e5',
      colorPrimaryBg: t.colorPrimaryBg ?? (isDark ? 'rgba(79, 70, 229, 0.18)' : '#eef2ff'),
      colorSuccess: t.colorSuccess ?? '#10b981',
      colorSuccessBg: t.colorSuccessBg ?? (isDark ? 'rgba(16, 185, 129, 0.16)' : '#ecfdf5'),
      colorSuccessBorder: t.colorSuccessBorder ?? (isDark ? '#065f46' : '#a7f3d0'),
      colorWarning: t.colorWarning ?? '#f59e0b',
      colorWarningBg: t.colorWarningBg ?? (isDark ? 'rgba(245, 158, 11, 0.16)' : '#fffbeb'),
      colorWarningBorder: t.colorWarningBorder ?? (isDark ? '#78350f' : '#fde68a'),
      colorError: t.colorError ?? '#ef4444',
      colorErrorBg: t.colorErrorBg ?? (isDark ? 'rgba(239, 68, 68, 0.16)' : '#fff1f2'),
      colorErrorBorder: t.colorErrorBorder ?? (isDark ? '#881337' : '#fecdd3'),
      colorInfo: t.colorInfo ?? '#0284c7',
      colorBgContainer: t.colorBgContainer ?? (isDark ? '#131b2e' : '#ffffff'),
      colorBgElevated: t.colorBgElevated ?? (isDark ? '#1a243b' : '#ffffff'),
      colorBgLayout: t.colorBgLayout ?? (isDark ? '#0b0f19' : '#f7f8fc'),
      colorFillAlter: t.colorFillAlter ?? (isDark ? '#162036' : '#f8fafc'),
      colorBorder: t.colorBorder ?? (isDark ? '#23324d' : '#cbd5e1'),
      colorBorderSecondary: t.colorBorderSecondary ?? (isDark ? '#1d2a42' : '#ececf1'),
      colorText: t.colorText ?? t.colorTextBase ?? (isDark ? '#f1f5f9' : '#0f172a'),
      colorTextSecondary: t.colorTextSecondary ?? (isDark ? '#94a3b8' : '#64748b'),
      colorTextTertiary: t.colorTextTertiary ?? (isDark ? '#64748b' : '#94a3b8'),
      borderRadius: t.borderRadius ?? 12,
      borderRadiusLG: t.borderRadiusLG ?? 16,
      fontFamily:
        t.fontFamily ??
        "'Be Vietnam Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    };
  },
};

export const ConfigProvider: React.FC<{
  locale?: unknown;
  theme?: ThemeConfig;
  children?: React.ReactNode;
}> = ({ children }) => <>{children}</>;

/* ═════════ TOAST & APP CONTEXT ═════════ */
interface ToastItem {
  id: number;
  kind: 'info' | 'success' | 'error' | 'warning';
  text: string;
}

interface MessageApi {
  success: (content: string) => Promise<void>;
  error: (content: string) => Promise<void>;
  info: (content: string) => Promise<void>;
  warning: (content: string) => Promise<void>;
}

let externalPushToast: ((kind: ToastItem['kind'], text: string) => void) | null = null;

const defaultMessageApi: MessageApi = {
  success: async (text) => externalPushToast?.('success', text),
  error: async (text) => externalPushToast?.('error', text),
  info: async (text) => externalPushToast?.('info', text),
  warning: async (text) => externalPushToast?.('warning', text),
};

const AppContext = createContext<{ message: MessageApi }>({ message: defaultMessageApi });

export const App: React.FC<{ children?: React.ReactNode }> & {
  useApp: () => { message: MessageApi };
} = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback((kind: ToastItem['kind'], text: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, kind, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  externalPushToast = push;

  const message = useMemo<MessageApi>(
    () => ({
      success: async (text) => push('success', text),
      error: async (text) => push('error', text),
      info: async (text) => push('info', text),
      warning: async (text) => push('warning', text),
    }),
    [push],
  );

  return (
    <AppContext.Provider value={{ message }}>
      {children}
      {toasts.length > 0 && (
        <div className="lp-toast-stack" role="status" aria-live="polite">
          {toasts.map((item) => (
            <div key={item.id} className={`lp-toast-item lp-toast-${item.kind}`}>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </AppContext.Provider>
  );
};

App.useApp = () => useContext(AppContext);

/* ═════════ BUTTON ═════════ */
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  htmlType?: 'button' | 'submit' | 'reset';
  size?: 'small' | 'middle' | 'large';
  shape?: 'default' | 'circle' | 'round' | string;
  ghost?: boolean;
  danger?: boolean;
  loading?: boolean;
  block?: boolean;
  icon?: React.ReactNode;
  href?: string;
  target?: string;
}

export const Button: React.FC<ButtonProps> = ({
  type = 'default',
  htmlType = 'button',
  size = 'middle',
  shape: _shape,
  ghost: _ghost,
  danger = false,
  loading = false,
  block = false,
  icon,
  disabled,
  className = '',
  children,
  ...rest
}) => {
  const classes = [
    'lp-ui-btn',
    type === 'primary' ? 'lp-ui-btn-primary' : '',
    type === 'link' || type === 'text' ? 'lp-ui-btn-link' : '',
    danger ? 'lp-ui-btn-danger' : '',
    size === 'small' ? 'lp-ui-btn-sm' : size === 'large' ? 'lp-ui-btn-lg' : '',
    block ? 'lp-ui-btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={htmlType} disabled={disabled || loading} className={classes} {...rest}>
      {loading ? <span className="lp-animate-spin">⟳</span> : icon}
      {children}
    </button>
  );
};

/* ═════════ CARD ═════════ */
export interface CardProps {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  size?: 'default' | 'small';
  hoverable?: boolean;
  bordered?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  extra,
  size = 'default',
  hoverable = false,
  className = '',
  style,
  onClick,
  children,
}) => (
  <div
    onClick={onClick}
    style={style}
    className={`lp-ui-card ${size === 'small' ? 'lp-ui-card-sm' : ''} ${hoverable ? 'lp-ui-card-hoverable' : ''} ${className}`.trim()}
  >
    {(title || extra) && (
      <div className="lp-ui-card-head">
        <div>{title}</div>
        {extra && <div>{extra}</div>}
      </div>
    )}
    <div className="lp-ui-card-body">{children}</div>
  </div>
);

/* ═════════ TAG & BADGE ═════════ */
export const Tag: React.FC<{
  color?: string;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
  children?: React.ReactNode;
}> = ({ color = 'default', icon, className = '', style, onClick, children }) => (
  <span
    onClick={onClick}
    style={style}
    className={`lp-ui-tag lp-ui-tag-${color} ${className}`.trim()}
  >
    {icon}
    {children}
  </span>
);

export const Badge: React.FC<{
  count?: React.ReactNode;
  color?: string;
  status?: string;
  text?: React.ReactNode;
  children?: React.ReactNode;
}> & {
  Ribbon: React.FC<{ text?: React.ReactNode; color?: string; children?: React.ReactNode }>;
} = ({ count, text, children }) => (
  <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    {children}
    {count !== undefined && count !== null && count !== 0 && (
      <span className="lp-ui-tag lp-ui-tag-blue">{count}</span>
    )}
    {text && <span>{text}</span>}
  </span>
);

Badge.Ribbon = ({ text, children }) => (
  <div style={{ position: 'relative' }}>
    {text && (
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 2,
        }}
      >
        <span className="lp-ui-tag lp-ui-tag-gold">{text}</span>
      </div>
    )}
    {children}
  </div>
);

/* ═════════ ALERT ═════════ */
export const Alert: React.FC<{
  type?: 'info' | 'success' | 'warning' | 'error';
  message?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  showIcon?: boolean;
  closable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ type = 'info', message, description, action, icon, className = '', style }) => (
  <div style={style} className={`lp-ui-alert lp-ui-alert-${type} ${className}`.trim()} role="alert">
    {icon && <div style={{ flexShrink: 0 }}>{icon}</div>}
    <div style={{ flex: 1 }}>
      {message && <div className="lp-ui-alert-title">{message}</div>}
      {description && <div className="lp-ui-alert-desc">{description}</div>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

/* ═════════ TYPOGRAPHY ═════════ */
const TypographyText: React.FC<{
  strong?: boolean;
  type?: 'secondary' | 'success' | 'warning' | 'danger';
  code?: boolean;
  copyable?: boolean | { text?: string };
  italic?: boolean;
  delete?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ strong, type, code, copyable, italic, className = '', style, children }) => {
  const color =
    type === 'secondary'
      ? 'var(--lp-color-text-secondary, #64748b)'
      : type === 'success'
        ? '#059669'
        : type === 'warning'
          ? '#d97706'
          : type === 'danger'
            ? '#e11d48'
            : undefined;
  return (
    <span
      className={className}
      style={{
        fontWeight: strong ? 700 : undefined,
        fontStyle: italic ? 'italic' : undefined,
        fontFamily: code ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined,
        color,
        ...style,
      }}
    >
      {children}
      {copyable && (
        <button
          type="button"
          onClick={() => {
            const raw =
              typeof copyable === 'object' && copyable.text
                ? copyable.text
                : String(children ?? '');
            void navigator.clipboard?.writeText(raw);
            externalPushToast?.('success', 'Đã sao chép!');
          }}
          style={{
            marginLeft: 6,
            border: 'none',
            background: 'transparent',
            color: '#4f46e5',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
          }}
          title="Sao chép"
        >
          📋
        </button>
      )}
    </span>
  );
};

const TypographyTitle: React.FC<{
  level?: 1 | 2 | 3 | 4 | 5;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ level = 2, className = '', style, children }) => {
  const sizes: Record<number, number> = { 1: 26, 2: 21, 3: 18, 4: 16, 5: 14 };
  return (
    <div
      className={className}
      style={{
        fontSize: sizes[level] ?? 18,
        fontWeight: 800,
        lineHeight: 1.3,
        margin: '0 0 6px 0',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const TypographyParagraph: React.FC<{
  type?: 'secondary' | 'success' | 'warning' | 'danger';
  strong?: boolean;
  ellipsis?: boolean | { rows?: number; expandable?: boolean; symbol?: React.ReactNode };
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ type, strong, className = '', style, children }) => (
  <p
    className={className}
    style={{
      margin: '0 0 8px 0',
      fontWeight: strong ? 700 : undefined,
      color: type === 'secondary' ? 'var(--lp-color-text-secondary, #64748b)' : undefined,
      ...style,
    }}
  >
    {children}
  </p>
);

export const Typography = {
  Text: TypographyText,
  Title: TypographyTitle,
  Paragraph: TypographyParagraph,
};

/* ═════════ SPACE, ROW, COL, DIVIDER ═════════ */
const SpaceBase: React.FC<{
  direction?: 'horizontal' | 'vertical';
  size?: number | 'small' | 'middle' | 'large' | [number, number];
  wrap?: boolean;
  align?: 'start' | 'end' | 'center' | 'baseline';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ direction = 'horizontal', size = 8, wrap = false, align, className = '', style, children }) => {
  const gap = Array.isArray(size)
    ? `${size[1]}px ${size[0]}px`
    : typeof size === 'number'
      ? `${size}px`
      : size === 'small'
        ? '6px'
        : size === 'large'
          ? '16px'
          : '10px';
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: direction === 'vertical' ? 'column' : 'row',
        flexWrap: wrap ? 'wrap' : undefined,
        alignItems: align ?? (direction === 'horizontal' ? 'center' : undefined),
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const SpaceCompact: React.FC<{
  block?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ block, className = '', style, children }) => (
  <div
    className={`lp-ui-input-group ${className}`.trim()}
    style={{ width: block ? '100%' : undefined, ...style }}
  >
    {children}
  </div>
);

export const Space = Object.assign(SpaceBase, {
  Compact: SpaceCompact,
});

export const Row: React.FC<{
  gutter?: number | [number, number];
  align?: 'top' | 'middle' | 'bottom' | 'stretch';
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ gutter = 16, className = '', style, children }) => {
  const gap = Array.isArray(gutter) ? `${gutter[1]}px ${gutter[0]}px` : `${gutter}px`;
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(24, minmax(0, 1fr))',
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Col: React.FC<{
  span?: number;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ span, md, lg, xl, sm, xs, className = '', style, children }) => {
  const effectiveSpan = lg ?? md ?? xl ?? sm ?? span ?? xs ?? 24;
  return (
    <div
      className={className}
      style={{
        gridColumn: `span ${effectiveSpan} / span ${effectiveSpan}`,
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Divider: React.FC<{
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}> = ({ style, className = '' }) => (
  <hr
    className={className}
    style={{
      border: 'none',
      borderTop: '1px solid var(--lp-color-border-secondary, #e2e8f0)',
      margin: '14px 0',
      ...style,
    }}
  />
);

/* ═════════ INPUT, INPUTNUMBER, SELECT, RADIO, SLIDER ═════════ */
export interface InputRef {
  focus: () => void;
  blur: () => void;
  input: HTMLInputElement | null;
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  size?: 'small' | 'middle' | 'large';
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  allowClear?: boolean;
  onPressEnter?: React.KeyboardEventHandler<HTMLInputElement>;
}

const BaseInput = forwardRef<InputRef, InputProps>(
  ({ size: _size, onPressEnter, onKeyDown, prefix: _prefix, suffix: _suffix, allowClear: _allowClear, className = '', ...rest }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => ({
      focus: () => innerRef.current?.focus(),
      blur: () => innerRef.current?.blur(),
      input: innerRef.current,
    }));
    return (
      <input
        ref={innerRef}
        className={`lp-ui-input ${className}`.trim()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onPressEnter?.(e);
          onKeyDown?.(e);
        }}
        {...rest}
      />
    );
  },
);
BaseInput.displayName = 'Input';

const InputTextArea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { autoSize?: boolean | { minRows?: number; maxRows?: number } }
> = ({ autoSize: _autoSize, className = '', ...rest }) => (
  <textarea className={`lp-ui-textarea ${className}`.trim()} {...rest} />
);

const InputSearch: React.FC<
  InputProps & {
    enterButton?: React.ReactNode;
    loading?: boolean;
    onSearch?: (value: string) => void;
  }
> = ({ size: _size, prefix: _prefix, suffix: _suffix, allowClear: _allowClear, onPressEnter: _onPressEnter, enterButton = 'Tìm kiếm', loading, onSearch, value, defaultValue, onChange, ...rest }) => {
  const [internal, setInternal] = useState(String(value ?? defaultValue ?? ''));
  const current = value !== undefined ? String(value) : internal;
  return (
    <div className="lp-ui-input-group">
      <input
        className="lp-ui-input"
        value={current}
        onChange={(e) => {
          setInternal(e.target.value);
          onChange?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSearch?.(current);
        }}
        {...rest}
      />
      <Button type="primary" loading={loading} onClick={() => onSearch?.(current)}>
        {enterButton === true ? 'Tra cứu' : enterButton}
      </Button>
    </div>
  );
};

export const Input = Object.assign(BaseInput, {
  TextArea: InputTextArea,
  Search: InputSearch,
});

export const InputNumber: React.FC<{
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  onChange?: (val: number | null) => void;
}> = ({ value, min, max, step = 1, disabled, className = '', onChange }) => (
  <input
    type="number"
    className={`lp-ui-input ${className}`.trim()}
    value={value ?? ''}
    min={min}
    max={max}
    step={step}
    disabled={disabled}
    onChange={(e) => {
      const parsed = Number(e.target.value);
      onChange?.(Number.isNaN(parsed) ? null : parsed);
    }}
  />
);

export function Select<T extends string | number = string>({
  value,
  defaultValue,
  options = [],
  onChange,
  className = '',
  style,
}: {
  value?: T;
  defaultValue?: T;
  size?: 'small' | 'middle' | 'large';
  options?: ReadonlyArray<{ value: T; label: React.ReactNode }>;
  onChange?: (value: T) => void;
  className?: string;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <select
      className={`lp-ui-select ${className}`.trim()}
      style={style}
      value={(value ?? defaultValue ?? '') as string | number}
      onChange={(e) => onChange?.(e.target.value as unknown as T)}
    >
      {options.map((opt) => (
        <option key={String(opt.value)} value={opt.value}>
          {typeof opt.label === 'string' || typeof opt.label === 'number' ? opt.label : String(opt.value)}
        </option>
      ))}
    </select>
  );
}

const RadioContext = createContext<{
  value?: unknown;
  onChange?: (val: unknown) => void;
}>({});

export const Radio: React.FC<{
  value?: unknown;
  checked?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}> & {
  Group: React.FC<{
    value?: unknown;
    size?: 'small' | 'middle' | 'large' | string;
    buttonStyle?: string;
    disabled?: boolean;
    onChange?: (e: { target: { value: any } }) => void;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }>;
  Button: React.FC<{ value: unknown; children?: React.ReactNode }>;
} = ({ value, checked, disabled, children }) => {
  const ctx = useContext(RadioContext);
  const isChecked = checked ?? (ctx.value !== undefined && ctx.value === value);
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '6px 0',
      }}
    >
      <input
        type="radio"
        checked={isChecked}
        disabled={disabled}
        onChange={() => ctx.onChange?.(value)}
      />
      <span>{children}</span>
    </label>
  );
};

Radio.Group = ({ value, onChange, className = '', style, children }) => (
  <RadioContext.Provider value={{ value, onChange: (val) => onChange?.({ target: { value: val } }) }}>
    <div className={className} style={style}>
      {children}
    </div>
  </RadioContext.Provider>
);

Radio.Button = ({ value, children }) => <Radio value={value}>{children}</Radio>;

export const Slider: React.FC<{
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onChange?: (value: number) => void;
}> = ({ min = 0, max = 100, step = 1, value = 0, disabled, className = '', style, onChange }) => (
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={value}
    disabled={disabled}
    className={className}
    style={{ width: '100%', accentColor: '#4f46e5', ...style }}
    onChange={(e) => onChange?.(Number(e.target.value))}
  />
);

/* ═════════ TABS, SEGMENTED, STEPS ═════════ */
export const Tabs: React.FC<{
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  items?: ReadonlyArray<{
    key: string;
    label: React.ReactNode;
    children?: React.ReactNode;
  }>;
}> = ({ defaultActiveKey, activeKey, onChange, items = [] }) => {
  const [internalKey, setInternalKey] = useState(defaultActiveKey ?? items[0]?.key ?? '');
  const currentKey = activeKey ?? internalKey;
  const currentItem = items.find((i) => i.key === currentKey) ?? items[0];

  return (
    <div>
      <div className="lp-ui-tabs-nav" role="tablist">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={item.key === currentKey}
            className={`lp-ui-tab-btn ${item.key === currentKey ? 'is-active' : ''}`}
            onClick={() => {
              setInternalKey(item.key);
              onChange?.(item.key);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div>{currentItem?.children}</div>
    </div>
  );
};

export function Segmented<T extends string | number = string>({
  value,
  options = [],
  onChange,
  block,
}: {
  value?: T;
  block?: boolean;
  size?: 'small' | 'middle' | 'large';
  options?: ReadonlyArray<{ value: T; label: React.ReactNode; icon?: React.ReactNode } | T>;
  onChange?: (val: T) => void;
}): React.ReactElement {
  return (
    <div className="lp-ui-segmented" style={block ? { width: '100%' } : undefined}>
      {options.map((raw) => {
        const opt =
          typeof raw === 'object' && raw !== null && 'value' in raw
            ? raw
            : { value: raw as T, label: String(raw), icon: undefined };
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            className={`lp-ui-segmented-item ${active ? 'is-active' : ''}`}
            style={block ? { flex: 1, justifyContent: 'center' } : undefined}
            onClick={() => onChange?.(opt.value)}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export const Steps: React.FC<{
  current?: number;
  size?: 'default' | 'small';
  items?: ReadonlyArray<{ title: React.ReactNode; description?: React.ReactNode; icon?: React.ReactNode }>;
  onChange?: (current: number) => void;
}> = ({ current = 0, items = [], onChange }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
    {items.map((item, idx) => {
      const active = idx === current;
      const done = idx < current;
      return (
        <button
          key={idx}
          type="button"
          onClick={() => onChange?.(idx)}
          style={{
            flex: 1,
            minWidth: 140,
            padding: '10px 12px',
            borderRadius: 12,
            border: active ? '2px solid #4f46e5' : '1px solid #e2e8f0',
            background: active ? '#eef2ff' : done ? '#f0fdf4' : '#ffffff',
            textAlign: 'left',
            cursor: onChange ? 'pointer' : 'default',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 13, color: active ? '#4338ca' : '#0f172a' }}>
            {idx + 1}. {item.title}
          </div>
          {item.description && (
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{item.description}</div>
          )}
        </button>
      );
    })}
  </div>
);

/* ═════════ STATISTIC, PROGRESS, DESCRIPTIONS, LIST, TABLE ═════════ */
export const Statistic: React.FC<{
  title?: React.ReactNode;
  value?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  valueStyle?: React.CSSProperties;
}> = ({ title, value, prefix, suffix, className = '', style, valueStyle }) => (
  <div className={className} style={style}>
    {title && <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{title}</div>}
    <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'baseline', gap: 6, ...valueStyle }}>
      {prefix}
      <span>{value}</span>
      {suffix && <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{suffix}</span>}
    </div>
  </div>
);

export const Progress: React.FC<{
  percent?: number;
  type?: 'line' | 'circle' | 'dashboard';
  size?: number | 'small' | 'default';
  strokeColor?: string;
  showInfo?: boolean;
  status?: 'normal' | 'active' | 'success' | 'exception';
  format?: (percent?: number) => React.ReactNode;
}> = ({ percent = 0, strokeColor, showInfo = true, format }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="lp-ui-progress">
      <div className="lp-ui-progress-track">
        <div
          className="lp-ui-progress-bar"
          style={{
            width: `${clamped}%`,
            background: strokeColor ?? undefined,
          }}
        />
      </div>
      {showInfo && (
        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', minWidth: 36, textAlign: 'right' }}>
          {format ? format(clamped) : `${clamped}%`}
        </span>
      )}
    </div>
  );
};

export const Descriptions: React.FC<{
  title?: React.ReactNode;
  column?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number; xxl?: number };
  size?: 'default' | 'middle' | 'small';
  bordered?: boolean;
  children?: React.ReactNode;
}> & {
  Item: React.FC<{ label?: React.ReactNode; span?: number; children?: React.ReactNode }>;
} = ({ title, children }) => (
  <div>
    {title && <div style={{ fontWeight: 800, marginBottom: 8 }}>{title}</div>}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
        padding: 12,
        borderRadius: 12,
        border: '1px solid #ececf1',
        background: '#f8fafc',
      }}
    >
      {children}
    </div>
  </div>
);

Descriptions.Item = ({ label, children }) => (
  <div>
    {label && <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b' }}>{label}</div>}
    <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>{children}</div>
  </div>
);

export function List<T>({
  dataSource = [],
  renderItem,
  size: _size,
  split: _split,
  locale,
  children,
}: {
  dataSource?: readonly T[];
  renderItem?: (item: T, index: number) => React.ReactNode;
  size?: 'default' | 'small' | 'large';
  split?: boolean;
  locale?: { emptyText?: React.ReactNode };
  children?: React.ReactNode;
}): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {dataSource.length === 0 && !children
        ? locale?.emptyText ?? null
        : dataSource.map((item, idx) => <React.Fragment key={idx}>{renderItem?.(item, idx)}</React.Fragment>)}
      {children}
    </div>
  );
}

List.Item = (({
  actions,
  onClick,
  className = '',
  style,
  children,
}: {
  actions?: React.ReactNode[];
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) => (
  <div
    onClick={onClick}
    className={className}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '10px 12px',
      borderRadius: 10,
      border: '1px solid #f1f5f9',
      cursor: onClick ? 'pointer' : undefined,
      ...style,
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    {actions && actions.length > 0 && <div style={{ display: 'flex', gap: 6 }}>{actions}</div>}
  </div>
)) as React.FC<{
  actions?: React.ReactNode[];
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> & {
  Meta: React.FC<{
    avatar?: React.ReactNode;
    title?: React.ReactNode;
    description?: React.ReactNode;
  }>;
};

List.Item.Meta = ({ avatar, title, description }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
    {avatar}
    <div style={{ minWidth: 0 }}>
      {title && <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>}
      {description && <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>{description}</div>}
    </div>
  </div>
);

export interface ColumnType<T> {
  key?: string;
  title?: React.ReactNode;
  dataIndex?: keyof T | string;
  width?: number | string;
  ellipsis?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export type ColumnsType<T> = ColumnType<T>[];

export function Table<T extends object>({
  columns = [],
  dataSource = [],
  rowKey = 'id',
  loading,
}: {
  columns?: ColumnsType<T>;
  dataSource?: readonly T[];
  rowKey?: keyof T | string | ((record: T) => string);
  size?: 'small' | 'middle' | 'large';
  loading?: boolean;
  pagination?: false | { pageSize?: number };
}): React.ReactElement {
  if (loading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }
  return (
    <div className="lp-ui-table-wrap">
      <table className="lp-ui-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={String(col.key ?? col.dataIndex ?? idx)} style={{ width: col.width }}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataSource.map((record, rIdx) => {
            const key =
              typeof rowKey === 'function'
                ? rowKey(record)
                : String((record as Record<string, unknown>)[String(rowKey)] ?? rIdx);
            return (
              <tr key={key}>
                {columns.map((col, cIdx) => {
                  const rawVal = col.dataIndex
                    ? (record as Record<string, unknown>)[String(col.dataIndex)]
                    : undefined;
                  return (
                    <td key={String(col.key ?? col.dataIndex ?? cIdx)}>
                      {col.render ? col.render(rawVal, record, rIdx) : (rawVal as React.ReactNode)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═════════ MODAL, DRAWER, RESULT, EMPTY, SKELETON, SPIN, TOOLTIP, DROPDOWN, AVATAR, UPLOAD ═════════ */
export const Modal: React.FC<{
  title?: React.ReactNode;
  open?: boolean;
  width?: number | string;
  centered?: boolean;
  destroyOnClose?: boolean;
  maskClosable?: boolean;
  footer?: React.ReactNode | null;
  confirmLoading?: boolean;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  onOk?: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
}> = ({
  title,
  open,
  width = 520,
  footer,
  confirmLoading,
  okText = 'Đồng ý',
  cancelText = 'Đóng',
  onOk,
  onCancel,
  children,
}) => {
  if (!open) return null;
  return (
    <div className="lp-ui-overlay" onClick={onCancel}>
      <div
        className="lp-ui-modal"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="lp-ui-modal-head">
            <span>{title}</span>
            <button
              type="button"
              onClick={onCancel}
              style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer', color: '#64748b' }}
            >
              ✕
            </button>
          </div>
        )}
        <div className="lp-ui-modal-body">{children}</div>
        {footer !== null && (
          <div className="lp-ui-modal-foot">
            {footer !== undefined ? (
              footer
            ) : (
              <>
                <Button onClick={onCancel}>{cancelText}</Button>
                {onOk && (
                  <Button type="primary" loading={confirmLoading} onClick={onOk}>
                    {okText}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const Drawer: React.FC<{
  title?: React.ReactNode;
  open?: boolean;
  width?: number | string;
  extra?: React.ReactNode;
  onClose?: () => void;
  children?: React.ReactNode;
}> = ({ title, open, width = 520, extra, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="lp-ui-overlay" onClick={onClose}>
      <div
        className="lp-ui-drawer"
        style={{ width: typeof width === 'number' ? `min(${width}px, 94vw)` : width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lp-ui-modal-head">
          <span>{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {extra}
            <button
              type="button"
              onClick={onClose}
              style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer', color: '#64748b' }}
            >
              ✕
            </button>
          </div>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};

export const Empty: React.FC<{
  image?: unknown;
  description?: React.ReactNode;
  children?: React.ReactNode;
}> & { PRESENTED_IMAGE_SIMPLE: string } = ({ description = 'Chưa có dữ liệu', children }) => (
  <div style={{ textAlign: 'center', padding: '28px 16px', color: '#64748b' }}>
    <div style={{ fontSize: 28, marginBottom: 6 }}>📭</div>
    <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: children ? 12 : 0 }}>{description}</div>
    {children}
  </div>
);
Empty.PRESENTED_IMAGE_SIMPLE = 'simple';

export const Skeleton: React.FC<{
  active?: boolean;
  paragraph?: { rows?: number };
}> = ({ paragraph }) => {
  const rows = paragraph?.rows ?? 3;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="lp-animate-pulse"
          style={{
            height: 14,
            width: i === rows - 1 ? '65%' : '100%',
            borderRadius: 6,
            background: '#e2e8f0',
          }}
        />
      ))}
    </div>
  );
};

export const Spin: React.FC<{
  size?: 'small' | 'default' | 'large';
  tip?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ size = 'default', tip, children }) => (
  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
    <span
      className="lp-animate-spin"
      style={{
        fontSize: size === 'large' ? 28 : size === 'small' ? 14 : 20,
        color: '#4f46e5',
      }}
    >
      ⟳
    </span>
    {tip && <span style={{ fontSize: 13, color: '#64748b' }}>{tip}</span>}
    {children}
  </div>
);

export const Result: React.FC<{
  status?: 'success' | 'error' | 'info' | 'warning' | '403' | '404' | '500';
  icon?: React.ReactNode;
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  extra?: React.ReactNode;
}> = ({ icon, title, subTitle, extra }) => (
  <div style={{ textAlign: 'center', padding: '28px 16px' }}>
    {icon && <div style={{ fontSize: 38, marginBottom: 10 }}>{icon}</div>}
    {title && <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{title}</div>}
    {subTitle && <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>{subTitle}</div>}
    {extra && <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>{extra}</div>}
  </div>
);

export const Tooltip: React.FC<{
  title?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <span title={typeof title === 'string' ? title : undefined} style={{ display: 'inline-flex' }}>
    {children}
  </span>
);

export const Avatar: React.FC<{
  size?: number | 'small' | 'default' | 'large';
  icon?: React.ReactNode;
  src?: string | null;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ size = 'default', icon, src, className = '', style, children }) => {
  const px = typeof size === 'number' ? size : size === 'small' ? 28 : size === 'large' ? 44 : 34;
  return (
    <span
      className={className}
      style={{
        width: px,
        height: px,
        borderRadius: '9999px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: Math.round(px * 0.42),
        overflow: 'hidden',
        flexShrink: 0,
        ...style,
      }}
    >
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : children ?? icon}
    </span>
  );
};

/* ═════════ MENU & DROPDOWN ═════════ */
export interface MenuItemType {
  key?: string;
  type?: 'divider';
  icon?: React.ReactNode;
  label?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: MenuItemType[];
}

export interface MenuProps {
  items?: MenuItemType[];
  selectedKeys?: string[];
  mode?: string;
  theme?: string;
  className?: string;
  onClick?: (info: { key: string }) => void;
}

export const Menu: React.FC<MenuProps> = ({ items = [], selectedKeys = [], className = '', onClick }) => (
  <nav className={className} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {items.map((item, idx) => {
      if (!item || item.type === 'divider') {
        return <Divider key={`div-${idx}`} style={{ margin: '6px 0' }} />;
      }
      const active = Boolean(item.key && selectedKeys.includes(item.key));
      return (
        <button
          key={item.key ?? idx}
          type="button"
          disabled={item.disabled}
          onClick={() => {
            item.onClick?.();
            if (item.key) onClick?.({ key: item.key });
          }}
          className={`lp-student-nav-link ${active ? 'is-active' : ''}`}
        >
          <span className="lp-student-nav-link-left">
            {item.icon}
            <span>{item.label}</span>
          </span>
        </button>
      );
    })}
  </nav>
);

export const Dropdown: React.FC<{
  menu?: MenuProps;
  trigger?: string[];
  placement?: string;
  children: React.ReactNode;
}> = ({ menu, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setOpen((v) => !v)}>{children}</div>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            zIndex: 60,
            minWidth: 220,
            background: 'var(--lp-color-bg-container, #ffffff)',
            border: '1px solid #ececf1',
            borderRadius: 12,
            padding: 6,
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)',
          }}
        >
          {(menu?.items ?? []).map((item, idx) => {
            if (!item || item.type === 'divider') {
              return <Divider key={`d-${idx}`} style={{ margin: '4px 0' }} />;
            }
            if (item.children && item.children.length > 0) {
              return (
                <div key={item.key ?? idx} style={{ padding: '4px 8px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>{item.label}</div>
                  {item.children.map((sub, sIdx) => (
                    <button
                      key={sub.key ?? sIdx}
                      type="button"
                      onClick={() => {
                        sub.onClick?.();
                        setOpen(false);
                      }}
                      className="lp-student-nav-link"
                    >
                      <span className="lp-student-nav-link-left">
                        {sub.icon}
                        <span>{sub.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              );
            }
            return (
              <button
                key={item.key ?? idx}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.();
                    setOpen(false);
                  }
                }}
                className="lp-student-nav-link"
                style={{ color: item.danger ? '#e11d48' : undefined }}
              >
                <span className="lp-student-nav-link-left">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ═════════ FORM ═════════ */
export interface FormInstance<T> {
  getFieldsValue: () => T;
  setFieldsValue: (values: Partial<T>) => void;
  validateFields: () => Promise<T>;
  resetFields: () => void;
}

const FormContext = createContext<{
  values: Record<string, any>;
  setField: (name: string, val: any) => void;
}>({
  values: {},
  setField: () => undefined,
});

function useForm<T extends Record<string, any> = Record<string, any>>(): [FormInstance<T>] {
  const storeRef = useRef<Record<string, any>>({});
  const [, forceRender] = useState(0);

  const instance = useMemo<FormInstance<T>>(
    () => ({
      getFieldsValue: () => ({ ...storeRef.current }) as T,
      setFieldsValue: (next) => {
        storeRef.current = { ...storeRef.current, ...next };
        forceRender((n) => n + 1);
      },
      validateFields: async () => ({ ...storeRef.current }) as T,
      resetFields: () => {
        storeRef.current = {};
        forceRender((n) => n + 1);
      },
    }),
    [],
  );

  return [instance];
}

export const Form: React.FC<{
  form?: FormInstance<any>;
  layout?: 'vertical' | 'horizontal' | 'inline';
  children?: React.ReactNode;
}> & {
  useForm: typeof useForm;
  Item: React.FC<{
    name?: string;
    label?: React.ReactNode;
    rules?: unknown[];
    children?: React.ReactElement<any>;
  }>;
} = ({ form, children }) => {
  const [fallback] = useForm();
  const activeForm = form ?? fallback;
  const setField = (name: string, val: any) => {
    activeForm.setFieldsValue({ [name]: val });
  };
  return (
    <FormContext.Provider value={{ values: activeForm.getFieldsValue(), setField }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </FormContext.Provider>
  );
};

Form.useForm = useForm;

Form.Item = ({ name, label, children }) => {
  const { values, setField } = useContext(FormContext);
  const child =
    name && React.isValidElement(children)
      ? React.cloneElement(children as React.ReactElement<any>, {
          value: values[name] ?? '',
          onChange: (arg: any) => {
            const val = arg && typeof arg === 'object' && 'target' in arg ? arg.target.value : arg;
            setField(name, val);
          },
        })
      : children;
  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
          {label}
        </label>
      )}
      {child}
    </div>
  );
};

/* ═════════ UPLOAD ═════════ */
export const Upload: {
  Dragger: React.FC<{
    accept?: string;
    showUploadList?: boolean;
    disabled?: boolean;
    beforeUpload?: (file: File) => boolean;
    children?: React.ReactNode;
  }>;
} = {
  Dragger: ({ accept, disabled, beforeUpload, children }) => {
    const fileRef = useRef<HTMLInputElement>(null);
    return (
      <div
        onClick={() => !disabled && fileRef.current?.click()}
        style={{
          padding: 24,
          borderRadius: 14,
          border: '2px dashed #cbd5e1',
          background: '#f8fafc',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          disabled={disabled}
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) beforeUpload?.(file);
          }}
        />
        {children}
      </div>
    );
  },
};

/* ═════════ LAYOUT ═════════ */
export const Layout: React.FC<{ className?: string; style?: React.CSSProperties; children?: React.ReactNode }> & {
  Header: React.FC<{ className?: string; style?: React.CSSProperties; children?: React.ReactNode }>;
  Sider: React.FC<{
    collapsible?: boolean;
    collapsed?: boolean;
    onCollapse?: (collapsed: boolean) => void;
    width?: number;
    className?: string;
    children?: React.ReactNode;
  }>;
  Content: React.FC<{ className?: string; style?: React.CSSProperties; children?: React.ReactNode }>;
} = ({ className = '', style, children }) => (
  <div className={className} style={{ display: 'flex', minHeight: '100dvh', width: '100%', ...style }}>
    {children}
  </div>
);

Layout.Header = ({ className = '', style, children }) => (
  <header className={className} style={style}>
    {children}
  </header>
);

Layout.Sider = ({ width = 248, className = '', children }) => (
  <aside className={className} style={{ width, flexShrink: 0 }}>
    {children}
  </aside>
);

Layout.Content = ({ className = '', style, children }) => (
  <main className={className} style={{ flex: 1, minWidth: 0, ...style }}>
    {children}
  </main>
);
