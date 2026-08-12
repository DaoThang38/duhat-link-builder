import { NextResponse } from 'next/server';
import { getAllLinks } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const links = await getAllLinks();

    // 1. Format Sheet 1: Onelink
    const onelinkRecords = links
      .filter((item) => item.linkType === 'ONELINK')
      .map((item) => ({
        'Mã Yêu Cầu': item.id,
        'Thời Gian': new Date(item.createdAt).toLocaleString('vi-VN'),
        'Người Yêu Cầu': item.createdByName || '',
        'Email': item.createdByEmail || '',
        'OneLink Template': item.originalUrl || '',
        'Khách Hàng Mục Tiêu':
          item.targetUser === 'NEW_USER'
            ? 'Khách mới (New)'
            : item.targetUser === 'EXISTING_USER'
            ? 'Khách đã cài App (Existing)'
            : item.targetUser === 'BOTH'
            ? 'Cả hai (Both)'
            : '-',
        'Nguồn (pid)': item.mediaSource || item.utmSource || '',
        'Kênh (af_channel)': item.afChannel || item.utmMedium || '',
        'Chiến Dịch (c)': item.utmCampaign || '',
        'Mã Nội Bộ (af_c_id)': item.afCId || item.utmId || '',
        'Nhóm QC (af_adset)': item.afAdset || '',
        'Mẫu QC (af_ad)': item.afAd || item.utmContent || '',
        'Đích Đến App': item.deepLinkValue || '',
        'Slug Đề Xuất': item.desiredSlug || '',
        'Ghi Chú': item.note || '',
        'OneLink Hoàn Chỉnh': item.finalLink || '',
        'Trạng Thái':
          item.status === 'COMPLETED'
            ? 'Đã tạo link'
            : item.status === 'NEW'
            ? 'Mới tạo / Đang chờ'
            : item.status === 'IN_PROGRESS'
            ? 'Đang xử lý'
            : item.status === 'REJECTED'
            ? 'Từ chối'
            : 'Đã hoàn thành',
        'Người Xử Lý': item.processedByName || '',
      }));

    // 2. Format Sheet 2: UTM track
    const utmRecords = links
      .filter((item) => item.linkType === 'UTM')
      .map((item) => ({
        'Mã ID': item.id,
        'Thời Gian': new Date(item.createdAt).toLocaleString('vi-VN'),
        'Người Tạo': item.createdByName || '',
        'Email': item.createdByEmail || '',
        'URL Gốc (Landing Page)': item.originalUrl || '',
        'Nguồn (utm_source)': item.utmSource || '',
        'Kênh (utm_medium)': item.utmMedium || '',
        'Chiến Dịch (utm_campaign)': item.utmCampaign || '',
        'Mã Chiến Dịch (utm_id)': item.utmId || '',
        'Nội Dung QC (utm_content)': item.utmContent || '',
        'Từ Khóa (utm_term)': item.utmTerm || '',
        'Link UTM Hoàn Chỉnh': item.finalLink || '',
        'Trạng Thái': 'Đã tạo link',
      }));


    // 3. Create Workbook & Sheets
    const workbook = XLSX.utils.book_new();

    const onelinkSheet = XLSX.utils.json_to_sheet(
      onelinkRecords.length > 0
        ? onelinkRecords
        : [
            {
              'Mã Yêu Cầu': '',
              'Thời Gian': '',
              'Người Yêu Cầu': '',
              'Email': '',
              'OneLink Template': '',
              'Khách Hàng Mục Tiêu': '',
              'Nguồn (pid)': '',
              'Kênh (af_channel)': '',
              'Chiến Dịch (c)': '',
              'Mã Nội Bộ (af_c_id)': '',
              'Nhóm QC (af_adset)': '',
              'Mẫu QC (af_ad)': '',
              'Đích Đến App': '',
              'Slug Đề Xuất': '',
              'Ghi Chú': '',
              'OneLink Hoàn Chỉnh': '',
              'Trạng Thái': '',
              'Người Xử Lý': '',
            },
          ]
    );

    const utmSheet = XLSX.utils.json_to_sheet(
      utmRecords.length > 0
        ? utmRecords
        : [
            {
              'Mã ID': '',
              'Thời Gian': '',
              'Người Tạo': '',
              'Email': '',
              'URL Gốc (Landing Page)': '',
              'Nguồn (utm_source)': '',
              'Kênh (utm_medium)': '',
              'Chiến Dịch (utm_campaign)': '',
              'Mã Chiến Dịch (utm_id)': '',
              'Nội Dung QC (utm_content)': '',
              'Từ Khóa (utm_term)': '',
              'Link UTM Hoàn Chỉnh': '',
              'Trạng Thái': '',
            },
          ]
    );

    // Auto width for columns
    onelinkSheet['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 25 },
      { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 20 },
      { wch: 45 }, { wch: 15 }, { wch: 18 },
    ];

    utmSheet['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 35 },
      { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 15 }, { wch: 18 },
      { wch: 15 }, { wch: 45 }, { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(workbook, onelinkSheet, 'Onelink');
    XLSX.utils.book_append_sheet(workbook, utmSheet, 'UTM track');

    // 4. Generate Excel Buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    const nowStr = new Date().toISOString().split('T')[0];
    const filename = `Duhat_Link_Export_${nowStr}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Lỗi khi xuất file Excel:', error);
    return NextResponse.json(
      { error: 'Không thể xuất file Excel: ' + error.message },
      { status: 500 }
    );
  }
}
