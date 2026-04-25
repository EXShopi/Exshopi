import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  type DetailedSpecificationGroup,
  type SpecificationFieldDefinition,
  type SpecificationTemplate,
  type VariantDimensionKey,
} from '../../lib/productSpecifications';

type ProductSpecificationEditorProps = {
  template: SpecificationTemplate;
  fields: SpecificationFieldDefinition[];
  specificationValues: Record<string, any>;
  missingRequiredSpecifications: string[];
  briefHighlights: string[];
  onSpecificationChange: (key: string, value: any) => void;
  onHighlightChange: (index: number, value: string) => void;
  onAddHighlight: () => void;
  onRemoveHighlight: (index: number) => void;
  onMoveHighlight: (index: number, direction: -1 | 1) => void;
  whatsInTheBox: string[];
  onWhatsInTheBoxChange: (index: number, value: string) => void;
  onAddWhatsInTheBox: () => void;
  onRemoveWhatsInTheBox: (index: number) => void;
  onMoveWhatsInTheBox: (index: number, direction: -1 | 1) => void;
  customGroups: DetailedSpecificationGroup[];
  onCustomGroupChange: (groups: DetailedSpecificationGroup[]) => void;
  enabledVariantDimensions: VariantDimensionKey[];
};

const MOBILE_COLOR_TEMPLATE_IDS = new Set(['mobiles-smartphones', 'tablets']);

function ensureList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item || '')) : [];
}

function ensureKeyValueList(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => ({
        key: String((item as any)?.key || ''),
        value: String((item as any)?.value || ''),
      }))
    : [];
}

function normalizeColorValue(raw: unknown) {
  return String(raw || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

function ensureColorList(value: unknown) {
  const rawList = Array.isArray(value)
    ? value
    : String(value || '')
        .split(',')
        .map((item) => item.trim());

  const seen = new Set<string>();
  return rawList
    .map((item) => normalizeColorValue(item))
    .filter(Boolean)
    .filter((item) => {
      const normalized = item.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

function ColorFieldInput(props: {
  field: SpecificationFieldDefinition;
  value: any;
  onChange: (nextValue: any) => void;
  allowMultiple: boolean;
}) {
  const { field, value, onChange, allowMultiple } = props;
  const [query, setQuery] = React.useState('');
  const datalistId = React.useId();
  const selectedValues = React.useMemo(() => ensureColorList(value), [value]);
  const availableOptions = React.useMemo(() => {
    const seen = new Set<string>();
    return [...(field.options || []), ...selectedValues]
      .map((option) => normalizeColorValue(option))
      .filter(Boolean)
      .filter((option) => {
        const normalized = option.toLowerCase();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      });
  }, [field.options, selectedValues]);
  const filteredOptions = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return availableOptions.slice(0, 12);
    return availableOptions
      .filter((option) => option.toLowerCase().includes(normalizedQuery))
      .slice(0, 12);
  }, [availableOptions, query]);
  const normalizedQuery = normalizeColorValue(query);
  const hasExactMatch = availableOptions.some((option) => option.toLowerCase() === normalizedQuery.toLowerCase());

  React.useEffect(() => {
    if (allowMultiple) return;
    setQuery(selectedValues[0] || '');
  }, [allowMultiple, selectedValues]);

  const commitSingleValue = (nextValue: string) => {
    const normalized = normalizeColorValue(nextValue);
    setQuery(normalized);
    onChange(normalized);
  };

  const addMultiValue = (nextValue: string) => {
    const normalized = normalizeColorValue(nextValue);
    if (!normalized) return;
    onChange(ensureColorList([...selectedValues, normalized]));
    setQuery('');
  };

  if (!allowMultiple) {
    return (
      <div className="space-y-3">
        <input
          type="text"
          list={datalistId}
          value={query}
          onChange={(event) => commitSingleValue(event.target.value)}
          onBlur={() => commitSingleValue(query)}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        />
        <datalist id={datalistId}>
          {availableOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        {normalizedQuery && !hasExactMatch ? (
          <button
            type="button"
            onClick={() => commitSingleValue(normalizedQuery)}
            className="rounded-full border border-dashed border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
          >
            Add custom color "{normalizedQuery}"
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedValues.map((selectedValue) => (
          <button
            key={selectedValue}
            type="button"
            onClick={() => onChange(selectedValues.filter((item) => item.toLowerCase() !== selectedValue.toLowerCase()))}
            className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
          >
            {selectedValue} <span className="ml-1 text-blue-500">×</span>
          </button>
        ))}
      </div>
      <input
        type="text"
        list={datalistId}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addMultiValue(query);
          }
        }}
        placeholder={field.placeholder || `Search or add ${field.label.toLowerCase()}`}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
      <datalist id={datalistId}>
        {availableOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <div className="flex flex-wrap gap-2">
        {filteredOptions.map((option) => {
          const active = selectedValues.some((item) => item.toLowerCase() === option.toLowerCase());
          return (
            <button
              key={option}
              type="button"
              onClick={() => addMultiValue(option)}
              className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                active
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {option}
            </button>
          );
        })}
        {normalizedQuery && !hasExactMatch ? (
          <button
            type="button"
            onClick={() => addMultiValue(normalizedQuery)}
            className="rounded-full border border-dashed border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
          >
            Add custom color "{normalizedQuery}"
          </button>
        ) : null}
      </div>
    </div>
  );
}

function renderFieldInput(
  template: SpecificationTemplate,
  field: SpecificationFieldDefinition,
  value: any,
  onChange: (nextValue: any) => void
) {
  const baseClassName =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100';

  if (field.type === 'textarea') {
    return (
      <textarea
        rows={4}
        value={String(value || '')}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
        className={`${baseClassName} leading-7`}
      />
    );
  }

  if (field.key === 'color') {
    return (
      <ColorFieldInput
        field={field}
        value={value}
        onChange={onChange}
        allowMultiple={field.type === 'multi-select' || MOBILE_COLOR_TEMPLATE_IDS.has(template.id)}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select
        value={String(value || '')}
        onChange={(event) => onChange(event.target.value)}
        className={baseClassName}
      >
        <option value="">Select {field.label}</option>
        {(field.options || []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'boolean') {
    return (
      <div className="flex gap-3">
        {['Yes', 'No'].map((option) => {
          const active = String(value) === option.toLowerCase() || (option === 'Yes' ? value === true : value === false);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option === 'Yes')}
              className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                active
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.type === 'multi-select') {
    const listValue = new Set(ensureList(value));
    return (
      <div className="flex flex-wrap gap-2">
        {(field.options || []).map((option) => {
          const active = listValue.has(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                const next = new Set(listValue);
                if (next.has(option)) next.delete(option);
                else next.add(option);
                onChange(Array.from(next));
              }}
              className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                active
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.type === 'tags' || field.type === 'list') {
    const listValue = ensureList(value);
    return (
      <div className="space-y-3">
        {listValue.map((item, index) => (
          <div key={`${field.key}-${index}`} className="flex items-center gap-3">
            <input
              type="text"
              value={item}
              onChange={(event) => {
                const next = [...listValue];
                next[index] = event.target.value;
                onChange(next);
              }}
              placeholder={field.placeholder || `${field.label} item`}
              className={baseClassName}
            />
            <button
              type="button"
              onClick={() => onChange(listValue.filter((_, itemIndex) => itemIndex !== index))}
              className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-600 transition hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...listValue, ''])}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add {field.type === 'tags' ? 'Tag' : 'Item'}
        </button>
      </div>
    );
  }

  if (field.type === 'key-value') {
    const listValue = ensureKeyValueList(value);
    return (
      <div className="space-y-3">
        {listValue.map((item, index) => (
          <div key={`${field.key}-${index}`} className="grid gap-3 md:grid-cols-[0.45fr_0.45fr_56px]">
            <input
              type="text"
              value={item.key}
              onChange={(event) => {
                const next = [...listValue];
                next[index] = { ...next[index], key: event.target.value };
                onChange(next);
              }}
              placeholder="Label"
              className={baseClassName}
            />
            <input
              type="text"
              value={item.value}
              onChange={(event) => {
                const next = [...listValue];
                next[index] = { ...next[index], value: event.target.value };
                onChange(next);
              }}
              placeholder="Value"
              className={baseClassName}
            />
            <button
              type="button"
              onClick={() => onChange(listValue.filter((_, itemIndex) => itemIndex !== index))}
              className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-600 transition hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...listValue, { key: '', value: '' }])}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Pair
        </button>
      </div>
    );
  }

  return (
    <input
      type={field.type === 'number' ? 'number' : 'text'}
      value={String(value || '')}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
      className={baseClassName}
    />
  );
}

function ReorderableList(props: {
  title: string;
  subtitle: string;
  items: string[];
  minRecommended?: number;
  maxRecommended?: number;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  placeholder: string;
}) {
  const {
    title,
    subtitle,
    items,
    minRecommended,
    maxRecommended,
    onChange,
    onAdd,
    onRemove,
    onMove,
    placeholder,
  } = props;

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>
        </div>
        {(minRecommended || maxRecommended) ? (
          <div className="rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
            {items.filter((item) => item.trim()).length}/{maxRecommended || items.length}
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="grid gap-3 md:grid-cols-[32px_1fr_40px_40px_40px]">
            <div className="flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <GripVertical className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={item}
              onChange={(event) => onChange(index, event.target.value)}
              placeholder={placeholder}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => onMove(index, -1)}
              disabled={index === 0}
              className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onMove(index, 1)}
              disabled={index === items.length - 1}
              className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-600 transition hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={Boolean(maxRecommended && items.length >= maxRecommended)}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Add Row
      </button>
    </div>
  );
}

export default function ProductSpecificationEditor({
  template,
  fields,
  specificationValues,
  missingRequiredSpecifications,
  briefHighlights,
  onSpecificationChange,
  onHighlightChange,
  onAddHighlight,
  onRemoveHighlight,
  onMoveHighlight,
  whatsInTheBox,
  onWhatsInTheBoxChange,
  onAddWhatsInTheBox,
  onRemoveWhatsInTheBox,
  onMoveWhatsInTheBox,
  customGroups,
  onCustomGroupChange,
  enabledVariantDimensions,
}: ProductSpecificationEditorProps) {
  const orderedSections = [
    ...template.sections,
    ...Array.from(new Set(fields.map((field) => field.section))).filter(
      (section) => !template.sections.includes(section)
    ),
  ];
  const groupedFields = orderedSections
    .map((section) => ({
      section,
      fields: fields.filter((field) => field.section === section),
    }))
    .filter((group) => group.fields.length);

  const addCustomGroup = () => {
    onCustomGroupChange([
      ...customGroups,
      {
        key: `custom-${customGroups.length + 1}`,
        title: `Custom Group ${customGroups.length + 1}`,
        items: [{ key: '', label: '', value: '' }],
      },
    ]);
  };

  return (
    <section className="space-y-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 md:p-6">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Active Template</p>
          <h3 className="mt-2 text-xl font-black text-slate-900">{template.title}</h3>
          <p className="mt-3 text-sm font-medium text-slate-600">{template.description}</p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Variant Attributes</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {enabledVariantDimensions.length ? enabledVariantDimensions.map((dimension) => (
              <span key={dimension} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                {dimension}
              </span>
            )) : (
              <span className="text-sm font-medium text-slate-500">Single-SKU category.</span>
            )}
          </div>
        </div>
      </div>

      {missingRequiredSpecifications.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-700">
          Missing required specifications: {missingRequiredSpecifications.join(', ')}
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
          Required specification fields are complete for this category template.
        </div>
      )}

      <div className="space-y-5">
        {groupedFields.map((group) => (
          <div key={group.section} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Detailed Specifications</p>
                <h3 className="mt-2 text-lg font-black text-slate-900">{group.section}</h3>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {group.fields.map((field) => (
                <div key={field.key} className={field.type === 'textarea' || field.type === 'tags' || field.type === 'list' || field.type === 'key-value' ? 'md:col-span-2' : ''}>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    {field.label} {field.required ? '*' : null}
                  </label>
                  {renderFieldInput(template, field, specificationValues[field.key], (nextValue) => onSpecificationChange(field.key, nextValue))}
                  {field.helpText ? <p className="mt-2 text-xs font-medium text-slate-500">{field.helpText}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ReorderableList
          title="Brief Specifications / Highlights"
          subtitle="Add 3 to 10 short highlights that will appear as quick product selling points on the product page."
          items={briefHighlights}
          minRecommended={3}
          maxRecommended={10}
          onChange={onHighlightChange}
          onAdd={onAddHighlight}
          onRemove={onRemoveHighlight}
          onMove={onMoveHighlight}
          placeholder="Intel Core i7 Processor"
        />

        <ReorderableList
          title="What’s In The Box"
          subtitle="Add included package contents in order."
          items={whatsInTheBox}
          maxRecommended={10}
          onChange={onWhatsInTheBoxChange}
          onAdd={onAddWhatsInTheBox}
          onRemove={onRemoveWhatsInTheBox}
          onMove={onMoveWhatsInTheBox}
          placeholder="Charging cable"
        />
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">Additional Detailed Specification Groups</h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Add custom grouped rows for category-specific details that are not part of the default template yet.
            </p>
          </div>
          <button
            type="button"
            onClick={addCustomGroup}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Group
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {customGroups.map((group, groupIndex) => (
            <div key={`${group.key}-${groupIndex}`} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_48px]">
                <input
                  type="text"
                  value={group.title}
                  onChange={(event) => {
                    const next = [...customGroups];
                    next[groupIndex] = { ...group, title: event.target.value, key: event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') };
                    onCustomGroupChange(next);
                  }}
                  placeholder="Group title"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => onCustomGroupChange(customGroups.filter((_, index) => index !== groupIndex))}
                  className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-600 transition hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {group.items.map((item, itemIndex) => (
                  <div key={`${group.key}-${itemIndex}`} className="grid gap-3 md:grid-cols-[0.42fr_0.42fr_56px]">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(event) => {
                        const next = [...customGroups];
                        const nextItems = [...group.items];
                        nextItems[itemIndex] = { ...item, label: event.target.value, key: event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') };
                        next[groupIndex] = { ...group, items: nextItems };
                        onCustomGroupChange(next);
                      }}
                      placeholder="Label"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                      type="text"
                      value={item.value}
                      onChange={(event) => {
                        const next = [...customGroups];
                        const nextItems = [...group.items];
                        nextItems[itemIndex] = { ...item, value: event.target.value };
                        next[groupIndex] = { ...group, items: nextItems };
                        onCustomGroupChange(next);
                      }}
                      placeholder="Value"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...customGroups];
                        next[groupIndex] = {
                          ...group,
                          items: group.items.filter((_, index) => index !== itemIndex),
                        };
                        onCustomGroupChange(next);
                      }}
                      className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-600 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = [...customGroups];
                  next[groupIndex] = {
                    ...group,
                    items: [...group.items, { key: '', label: '', value: '' }],
                  };
                  onCustomGroupChange(next);
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Row
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
