import { NextResponse } from 'next/server';
import {
  getCatalogItemsByCategory,
  getAllCatalogs,
  addCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  getFieldConfigs,
  setFieldMode,
} from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryType = searchParams.get('category');
  const linkType = searchParams.get('linkType');

  try {
    const fieldModes = await getFieldConfigs();
    if (categoryType) {
      const items = await getCatalogItemsByCategory(categoryType, linkType || undefined);
      return NextResponse.json({ items, fieldModes });
    } else {
      const items = await getAllCatalogs();
      return NextResponse.json({ items, fieldModes });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập để thực hiện.' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Check if this is a Field Mode toggle request
    if (body.action === 'SET_FIELD_MODE') {
      const { categoryType, mode } = body;
      if (!categoryType || !mode) {
        return NextResponse.json({ error: 'Thiếu categoryType hoặc mode.' }, { status: 400 });
      }
      const updatedModes = await setFieldMode(categoryType, mode);
      return NextResponse.json({ fieldModes: updatedModes, message: `Đã cập nhật chế độ cho ${categoryType}` });
    }

    const { linkType, categoryType, value, description, isStrict } = body;
    if (!categoryType || !value) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ Loại danh mục và Giá trị.' }, { status: 400 });
    }

    const { item, isExisting } = await addCatalogItem(linkType || 'BOTH', categoryType, value, description, isStrict || false, user.id);
    const message = isExisting
      ? `Mã "${value}" đã tồn tại trong danh mục chuẩn (hệ thống đã tự động gộp & cập nhật).`
      : `Đã thêm danh mục "${value}" thành công!`;
    return NextResponse.json({ item, message }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập để thực hiện.' }, { status: 401 });
  }

  try {
    const { id, linkType, value, description, isStrict } = await req.json();
    if (!id || !value) {
      return NextResponse.json({ error: 'Vui lòng nhập ID danh mục và Giá trị.' }, { status: 400 });
    }

    const item = await updateCatalogItem(id, linkType || 'BOTH', value, description, isStrict || false);
    if (!item) {
      return NextResponse.json({ error: 'Không tìm thấy danh mục để chỉnh sửa.' }, { status: 404 });
    }
    return NextResponse.json({ item, message: 'Cập nhật danh mục thành công!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập để thực hiện.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID danh mục để xóa.' }, { status: 400 });
    }

    const success = await deleteCatalogItem(id);
    if (!success) {
      return NextResponse.json({ error: 'Xóa danh mục thất bại hoặc không tìm thấy.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Đã xóa danh mục thành công!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
