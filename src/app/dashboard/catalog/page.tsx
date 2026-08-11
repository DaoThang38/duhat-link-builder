'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CatalogItem } from '@/types';
import { Plus, Edit2, Trash2, X, Check, AlertCircle, Sparkles, Lock, Unlock, Search } from 'lucide-react';

export default function CatalogPage() {
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [fieldModes, setFieldModes] = useState<Record<string, 'STRICT' | 'FREE'>>({
    source: 'FREE',
    medium: 'FREE',
    deep_link_screen: 'STRICT',
    campaign: 'FREE',
    content: 'FREE',
    ad_set: 'FREE',
    campaign_id: 'FREE',
    keyword: 'FREE',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  // Form Fields
  const [formCategoryType, setFormCategoryType] = useState('source');
  const [formValue, setFormValue] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const categoryNames: Record<string, string> = {
    source: 'Nguồn (Source)',
    medium: 'Kênh (Medium / Channel)',
    deep_link_screen: 'Màn hình App (Deep Link)',
    campaign: 'Tên chiến dịch (Campaign)',
    content: 'Mẫu QC / Nội dung (Content)',
    ad_set: 'Nhóm Quảng Cáo (Ad Set)',
    campaign_id: 'ID Chiến dịch (Campaign ID)',
    keyword: 'Từ khóa (Keyword)',
  };

  const fetchCatalogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/catalog');
      if (res.ok) {
        const data = await res.json();
        setCatalogs(data.items || []);
        if (data.fieldModes) {
          setFieldModes(data.fieldModes);
        }
      }
    } catch (err) {
      console.error('Catalog fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const handleToggleFieldMode = async (categoryKey: string) => {
    const currentMode = fieldModes[categoryKey] || 'FREE';
    const newMode = currentMode === 'STRICT' ? 'FREE' : 'STRICT';

    setFieldModes((prev) => ({ ...prev, [categoryKey]: newMode }));

    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SET_FIELD_MODE', categoryType: categoryKey, mode: newMode }),
      });
      if (res.ok) {
        setSuccessMsg(`Đã đổi quy định trường "${categoryNames[categoryKey] || categoryKey}" thành "${newMode === 'STRICT' ? 'Chỉ chọn trong danh sách' : 'Điền tự do'}".`);
        setTimeout(() => setSuccessMsg(''), 3500);
      } else {
        fetchCatalogs();
      }
    } catch {
      fetchCatalogs();
    }
  };

  const openAddModal = (defaultCategory = 'source') => {
    setEditingItem(null);
    setFormCategoryType(defaultCategory);
    setFormValue('');
    setFormDescription('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setFormCategoryType(item.categoryType);
    setFormValue(item.value);
    setFormDescription(item.description || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formValue.trim()) {
      setError('Vui lòng nhập giá trị danh mục.');
      return;
    }

    try {
      const isEdit = !!editingItem;
      const url = '/api/catalog';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = isEdit
        ? { id: editingItem.id, value: formValue, description: formDescription }
        : { categoryType: formCategoryType, value: formValue, description: formDescription };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Lưu thất bại.');
      } else {
        setSuccessMsg(isEdit ? 'Đã cập nhật mục danh mục thành công!' : `Đã thêm mục mới cho ${categoryNames[formCategoryType] || formCategoryType}!`);
        setTimeout(() => setSuccessMsg(''), 3000);
        setIsModalOpen(false);
        fetchCatalogs();
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi mạng khi lưu.');
    }
  };

  const handleDelete = async (item: CatalogItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa "${item.value}" khỏi danh mục chuẩn?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/catalog?id=${item.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg(`Đã xóa "${item.value}" thành công.`);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchCatalogs();
      } else {
        const data = await res.json();
        alert(data.error || 'Xóa thất bại.');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi mạng khi xóa.');
    }
  };

  // Filter catalogs by search query
  const filteredCatalogs = useMemo(() => {
    if (!searchQuery.trim()) return catalogs;
    const q = searchQuery.toLowerCase();
    return catalogs.filter(
      (c) => c.value.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
    );
  }, [catalogs, searchQuery]);

  // Master Category Definitions for single unified grid
  const categoryDefinitions = [
    {
      key: 'source',
      title: 'NGUỒN',
      headerBg: 'bg-[#123e52]',
      rowBg: 'bg-[#f2f7fa]',
      hoverBg: 'hover:bg-[#e4eff5]',
      textColor: 'text-[#123e52]',
      matchKeys: ['source', 'utm_source', 'media_source'],
    },
    {
      key: 'medium',
      title: 'KÊNH',
      headerBg: 'bg-[#5c4200]',
      rowBg: 'bg-[#fffcf2]',
      hoverBg: 'hover:bg-[#fff7d9]',
      textColor: 'text-[#8a6200]',
      matchKeys: ['medium', 'utm_medium', 'channel', 'af_channel'],
    },
    {
      key: 'deep_link_screen',
      title: 'MÀN HÌNH APP',
      headerBg: 'bg-[#0f4d32]',
      rowBg: 'bg-[#f2fafd]',
      hoverBg: 'hover:bg-[#eaf8ef]',
      textColor: 'text-[#176b46]',
      matchKeys: ['deep_link_screen', 'deep_link_value'],
    },
    {
      key: 'campaign',
      title: 'TÊN CHIẾN DỊCH',
      headerBg: 'bg-[#20201c]',
      rowBg: 'bg-[#f9f9f6]',
      hoverBg: 'hover:bg-[#eee]',
      textColor: 'text-[#20201c]',
      matchKeys: ['campaign', 'utm_campaign', 'campaign_name'],
    },
    {
      key: 'content',
      title: 'MẪU QC / NỘI DUNG',
      headerBg: 'bg-[#4a2e56]',
      rowBg: 'bg-[#faf5fc]',
      hoverBg: 'hover:bg-[#f3e8f7]',
      textColor: 'text-[#4a2e56]',
      matchKeys: ['content', 'utm_content', 'ad_name', 'af_ad'],
    },
    {
      key: 'ad_set',
      title: 'NHÓM QUẢNG CÁO',
      headerBg: 'bg-[#1b3d2f]',
      rowBg: 'bg-[#f0f7f4]',
      hoverBg: 'hover:bg-[#e1f0e9]',
      textColor: 'text-[#1b3d2f]',
      matchKeys: ['ad_set', 'ad_group', 'af_adset'],
    },
    {
      key: 'campaign_id',
      title: 'ID CHIẾN DỊCH',
      headerBg: 'bg-[#3b2b1a]',
      rowBg: 'bg-[#fcf8f2]',
      hoverBg: 'hover:bg-[#f7eedf]',
      textColor: 'text-[#3b2b1a]',
      matchKeys: ['campaign_id', 'utm_id', 'af_c_id'],
    },
    {
      key: 'keyword',
      title: 'TỪ KHÓA',
      headerBg: 'bg-[#2b3a4a]',
      rowBg: 'bg-[#f2f6fa]',
      hoverBg: 'hover:bg-[#e4edf5]',
      textColor: 'text-[#2b3a4a]',
      matchKeys: ['keyword', 'utm_term', 'af_keywords', 'keywords'],
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top Banner */}
      <div className="bg-[#0e2a38] text-white p-6 rounded-2xl shadow-md border border-[#091e28]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-[#ffcc00] font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>BẢNG QUẢN TRỊ DUHAT MARKETING &amp; PRODUCT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide uppercase m-0 border-b-2 border-[#ffcc00] inline-block pb-1">
              DANH MỤC CHUẨN DUHAT
            </h1>
            <p className="text-xs text-[#a0c4d4] m-0 mt-2 font-medium">
              Click dấu <strong className="text-[#ffcc00]">+</strong> tại bất kỳ bảng nào để thêm nhanh mục mới vào đúng trường dữ liệu đó.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => openAddModal('source')}
              className="px-5 py-2.5 bg-[#ffcc00] hover:bg-[#ebd217] text-[#20201c] rounded-full text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-0 w-full md:w-auto flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Mục Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Notification Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71716a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nhanh trong tất cả danh mục..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#deded7] rounded-full text-xs font-semibold text-[#20201c] focus:outline-none focus:border-[#20201c] shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71716a] hover:text-[#20201c] border-0 bg-transparent cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {successMsg && (
          <div className="p-3 bg-[#eaf8ef] border border-[#176b46]/30 rounded-full text-[#176b46] text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#71716a]">
          <span className="inline-block w-7 h-7 border-3 border-[#20201c] border-t-transparent rounded-full animate-spin"></span>
          <span className="block mt-3 text-xs font-bold">Đang tải toàn bộ danh mục chuẩn...</span>
        </div>
      ) : (
        /* SINGLE UNIFIED GRID FOR ALL 8 CATEGORIES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {categoryDefinitions.map((cat) => {
            const items = filteredCatalogs.filter((c) => cat.matchKeys.includes(c.categoryType));
            const currentMode = fieldModes[cat.key] || 'FREE';

            return (
              <div key={cat.key} className="bg-white border border-[#deded7] rounded-xl overflow-hidden shadow-sm flex flex-col">
                {/* Column Header with Title, Mode Switcher & Add Button */}
                <div className={`${cat.headerBg} text-white px-4 py-3 font-bold text-xs flex items-center justify-between`}>
                  <div>
                    <span className="block uppercase tracking-wider text-sm">{cat.title} ({items.length})</span>
                    <button
                      type="button"
                      onClick={() => handleToggleFieldMode(cat.key)}
                      className={`mt-1 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase border-0 cursor-pointer flex items-center gap-1 transition-all ${
                        currentMode === 'STRICT'
                          ? 'bg-[#fff3bd] text-[#725000] hover:bg-[#ffe895]'
                          : 'bg-[#eaf8ef] text-[#176b46] hover:bg-[#d5f2de]'
                      }`}
                    >
                      {currentMode === 'STRICT' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span>{currentMode === 'STRICT' ? 'Chỉ chọn trong danh sách' : 'Điền tự do'}</span>
                    </button>
                  </div>
                  <button
                    onClick={() => openAddModal(cat.key)}
                    title={`Thêm mục mới cho ${cat.title}`}
                    className="p-1.5 hover:bg-white/20 rounded text-[#ffcc00] transition-colors border-0 cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Column Items List */}
                <div className={`divide-y divide-[#deded7] ${cat.rowBg} max-h-72 overflow-y-auto flex-1`}>
                  {items.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#71716a]">Chưa có mục nào. Bấm + để thêm mới.</div>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className={`grid grid-cols-[140px_1fr_auto] gap-3 p-3 text-xs items-center transition-colors group ${cat.hoverBg}`}>
                        <span className={`font-mono font-extrabold ${cat.textColor} text-xs whitespace-nowrap tracking-tight`}>
                          {item.value}
                        </span>
                        <span className="text-[#45453f] leading-snug text-xs">{item.description || '-'}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(item)} title="Sửa" className="p-1 text-[#45453f] hover:text-[#20201c] border-0 bg-transparent cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(item)} title="Xóa" className="p-1 text-[#b42318] hover:text-red-700 border-0 bg-transparent cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#20201c]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#deded7] rounded-[24px] max-w-lg w-full p-7 shadow-[0_28px_90px_rgba(0,0,0,0.24)] space-y-5 text-[#20201c]">
            <div className="flex items-center justify-between border-b border-[#deded7] pb-3">
              <h3 className="text-xl font-extrabold m-0">
                {editingItem
                  ? 'Sửa Mục Danh Mục'
                  : `Thêm Mục Mới Cho ${categoryNames[formCategoryType] || formCategoryType}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-[#71716a] hover:text-[#20201c] border-0 bg-transparent cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-[#fff0ed] text-[#b42318] text-xs font-bold rounded-xl border border-[#deded7] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="duhat-field">
                <label>Trường dữ liệu <span className="req">*</span></label>
                <select
                  disabled={!!editingItem}
                  value={formCategoryType}
                  onChange={(e) => setFormCategoryType(e.target.value)}
                >
                  <option value="source">Nguồn (Source)</option>
                  <option value="medium">Kênh (Medium / Channel)</option>
                  <option value="deep_link_screen">Màn hình App (Deep Link)</option>
                  <option value="campaign">Tên chiến dịch (Campaign)</option>
                  <option value="content">Mẫu QC / Nội dung (Content)</option>
                  <option value="ad_set">Nhóm Quảng Cáo (Ad Set)</option>
                  <option value="campaign_id">ID Chiến dịch (Campaign ID)</option>
                  <option value="keyword">Từ khóa (Keyword)</option>
                </select>
              </div>

              <div className="duhat-field">
                <label>Giá trị (Mã/Tên viết tắt) <span className="req">*</span></label>
                <input
                  type="text"
                  required
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="Ví dụ: google, organic_social, home..."
                />
              </div>

              <div className="duhat-field">
                <label>Mô tả (Dùng khi / Ý nghĩa)</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Giải thích mục đích sử dụng..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn secondary">
                  Hủy bỏ
                </button>
                <button type="submit" className="btn primary">
                  <span>{editingItem ? 'Cập Nhật' : 'Lưu Danh Mục'}</span>
                  <span className="arrow">→</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
