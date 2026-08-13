'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, AlertCircle, X } from 'lucide-react';
import { CatalogItem } from '@/types';

interface AutocompleteInputProps {
  label: string;
  categoryType: string;
  linkType?: 'UTM' | 'ONELINK';
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
}

export default function AutocompleteInput({
  label,
  categoryType,
  linkType,
  value,
  onChange,
  placeholder,
  required = false,
  helpText,
}: AutocompleteInputProps) {
  const [options, setOptions] = useState<CatalogItem[]>([]);
  const [fieldMode, setFieldMode] = useState<'STRICT' | 'FREE'>('FREE');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const url = `/api/catalog?category=${categoryType}${linkType ? `&linkType=${linkType}` : ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setOptions(data.items || []);
          if (data.fieldModes) {
            const norm = categoryType.toLowerCase();
            let modeKey = norm;
            if (['utm_source', 'media_source', 'pid', 'source'].includes(norm)) modeKey = 'source';
            else if (['utm_medium', 'channel', 'af_channel', 'medium'].includes(norm)) modeKey = 'medium';
            else if (['utm_campaign', 'campaign_name', 'c', 'campaign'].includes(norm)) modeKey = 'campaign';
            else if (['utm_content', 'ad_name', 'af_ad', 'content'].includes(norm)) modeKey = 'content';
            else if (['ad_group', 'ad_set', 'af_adset'].includes(norm)) modeKey = 'ad_set';
            else if (['utm_id', 'campaign_id', 'af_c_id'].includes(norm)) modeKey = 'campaign_id';
            else if (['utm_term', 'keywords', 'af_keywords', 'keyword'].includes(norm)) modeKey = 'keyword';
            else if (['deep_link_value', 'deep_link_screen'].includes(norm)) modeKey = 'deep_link_screen';

            if (data.fieldModes[modeKey]) {
              setFieldMode(data.fieldModes[modeKey]);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load catalog:', e);
      }
    }
    loadCatalog();
  }, [categoryType, linkType]);

  const filteredOptions = options.filter((item) =>
    item.value.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (selectedVal: string) => {
    onChange(selectedVal);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      if (isOpen && focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        e.preventDefault();
        handleSelect(filteredOptions[focusedIndex].value);
      } else if (isOpen && filteredOptions.length > 0) {
        e.preventDefault();
        handleSelect(filteredOptions[0].value);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isValueInvalidInStrict =
    fieldMode === 'STRICT' &&
    value.trim() !== '' &&
    !options.some((opt) => opt.value.toLowerCase() === value.trim().toLowerCase());

  return (
    <div className="relative duhat-field" ref={containerRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="m-0">
          {label} {required && <span className="req">*</span>}
        </label>
        {fieldMode === 'STRICT' ? (
          <span
            className="mode-badge cursor-help"
            title="Chế độ 'Chỉ chọn trong danh sách': Trường này bắt buộc chọn đúng giá trị chuẩn sẵn có trong hệ thống."
          >
            Chỉ chọn trong danh sách
          </span>
        ) : (
          <span
            className="px-2 py-0.5 bg-[#eaf8ef] text-[#176b46] rounded-full text-[10px] font-extrabold cursor-help transition-colors hover:bg-[#d4f2de]"
            title="Chế độ 'Điền tự do': Trường này cho phép bạn tự nhập giá trị tùy chỉnh hoặc chọn từ danh mục gợi ý."
          >
            Điền tự do
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setFocusedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || `Nhập hoặc chọn ${label.toLowerCase()}...`}
          className={`${isValueInvalidInStrict ? 'error' : ''} ${value ? 'pr-14' : 'pr-8'}`}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1 z-10">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="text-[#a1a19a] hover:text-[#b42318] hover:bg-[#fff0ed] rounded-full border-0 bg-transparent cursor-pointer p-1 transition-colors flex items-center justify-center"
              title="Xóa nhanh giá trị này"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-[#71716a] hover:text-[#20201c] border-0 bg-transparent cursor-pointer p-0.5 flex items-center justify-center"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {helpText && !isValueInvalidInStrict && <p className="duhat-help">{helpText}</p>}

      {isValueInvalidInStrict && (
        <p className="duhat-help error flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Giá trị này chưa thuộc danh mục quy định (Trường đang để Chỉ chọn trong danh sách).
        </p>
      )}

      {/* Clean Duhat Suggestions Dropdown */}
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 top-[82px] left-0 right-0 p-1.5 bg-white border border-[#deded7] rounded-[14px] shadow-[0_16px_36px_rgba(32,32,28,0.16)] max-h-60 overflow-y-auto">
          {filteredOptions.map((item, idx) => {
            const isSelected = item.value.toLowerCase() === value.toLowerCase();
            const isFocused = idx === focusedIndex;
            return (
              <button
                type="button"
                key={item.id || idx}
                onClick={() => handleSelect(item.value)}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={`w-full min-h-[42px] px-3 rounded-[9px] text-left text-xs font-bold flex items-center justify-between border-0 cursor-pointer transition-colors ${
                  isFocused || isSelected ? 'bg-[#fff3bd] text-[#20201c]' : 'bg-transparent text-[#20201c] hover:bg-[#fff9df]'
                }`}
              >
                <div>
                  <span className="block font-mono">{item.value}</span>
                  {item.description && (
                    <span className="block text-[10px] font-normal text-[#71716a]">{item.description}</span>
                  )}
                </div>
                {isFocused && (
                  <small className="text-[#8a6200] text-[10px] font-extrabold flex-shrink-0 pl-2">
                    Enter chọn ↵
                  </small>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
