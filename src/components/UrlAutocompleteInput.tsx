'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, History, Globe, X } from 'lucide-react';

interface UrlAutocompleteInputProps {
  label: string;
  linkType?: 'UTM' | 'ONELINK';
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
}

export default function UrlAutocompleteInput({
  label,
  linkType,
  value,
  onChange,
  placeholder,
  required = true,
  helpText,
}: UrlAutocompleteInputProps) {
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadRecentUrls() {
      try {
        const res = await fetch('/api/links');
        if (res.ok) {
          const data = await res.json();
          const links: any[] = data.links || [];

          let filtered = links.filter(
            (l) => l.originalUrl && (l.originalUrl.startsWith('http://') || l.originalUrl.startsWith('https://'))
          );

          if (linkType === 'UTM') {
            // Only suggest website landing page URLs for UTM (exclude AppsFlyer template URLs)
            filtered = filtered.filter((l) => !l.originalUrl.includes('onelink.me'));
          } else if (linkType === 'ONELINK') {
            // Only suggest AppsFlyer OneLink template URLs (contains onelink.me)
            filtered = filtered.filter((l) => l.originalUrl.includes('onelink.me'));
          }

          const urls = Array.from(new Set<string>(filtered.map((l) => l.originalUrl)));
          setRecentUrls(urls);
        }
      } catch (e) {
        console.error('Failed to load recent URLs:', e);
      }
    }
    loadRecentUrls();
  }, [linkType]);

  const filteredUrls = recentUrls.filter((url) =>
    url.toLowerCase().includes(value.toLowerCase())
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

  return (
    <div className="relative duhat-field" ref={containerRef}>
      <label>
        {label} {required && <span className="req">*</span>}
      </label>

      <div className="relative">
        <input
          type="url"
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || (linkType === 'ONELINK' ? 'https://duhat.onelink.me/abc1' : 'https://duhat.vn/landing-page')}
          className={`w-full ${recentUrls.length > 0 ? (value ? 'pr-32' : 'pr-24') : (value ? 'pr-10' : '')}`}
          autoComplete="url"
        />

        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className={`absolute ${recentUrls.length > 0 ? 'right-28' : 'right-3'} top-1/2 -translate-y-1/2 text-[#a1a19a] hover:text-[#b42318] border-0 bg-transparent cursor-pointer p-1 transition-colors`}
            title="Xóa nhanh URL"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {recentUrls.length > 0 && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71716a] hover:text-[#20201c] border border-[#deded7] bg-[#f9f9f6] px-2.5 py-1 rounded-[8px] text-[10px] font-extrabold cursor-pointer flex items-center space-x-1 transition-colors hover:bg-[#fff3bd]"
            title="Gợi ý URL đã dùng gần đây"
          >
            <History className="w-3 h-3 text-[#20201c]" />
            <span>Đã dùng ({recentUrls.length})</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {helpText && <p className="duhat-help">{helpText}</p>}

      {/* Suggestions Dropdown for Recent URLs */}
      {isOpen && filteredUrls.length > 0 && (
        <div className="absolute z-50 top-[76px] left-0 right-0 p-1.5 bg-white border border-[#deded7] rounded-[14px] shadow-[0_16px_36px_rgba(32,32,28,0.16)] max-h-60 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-black uppercase text-[#71716a] tracking-wider border-b border-[#f0f0eb] mb-1 flex items-center justify-between">
            <span>GỢI Ý URL {linkType === 'ONELINK' ? 'ONELINK' : 'WEBSITE'} ĐÃ DÙNG GẦN ĐÂY</span>
            <span>{filteredUrls.length} URL</span>
          </div>

          {filteredUrls.map((urlStr, idx) => {
            const isSelected = urlStr.toLowerCase() === value.toLowerCase();
            return (
              <button
                type="button"
                key={urlStr || idx}
                onClick={() => handleSelect(urlStr)}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={`w-full min-h-[38px] px-3 rounded-[9px] text-left text-xs font-mono font-bold flex items-center justify-between border-0 cursor-pointer transition-colors ${
                  idx === focusedIndex || isSelected ? 'bg-[#fff3bd] text-[#20201c]' : 'bg-transparent text-[#20201c] hover:bg-[#fff9df]'
                }`}
              >
                <div className="flex items-center space-x-2 truncate pr-2">
                  <Globe className="w-3.5 h-3.5 text-[#71716a] flex-shrink-0" />
                  <span className="truncate">{urlStr}</span>
                </div>
                <small className="text-[#8a6200] text-[10px] font-extrabold flex-shrink-0 pl-2">
                  Chọn ↵
                </small>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
