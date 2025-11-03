import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import License from '@/models/License';
import { requireAuth } from '@/lib/auth';

// GET single license
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    await dbConnect();
    const { id } = await params;

    const license = await License.findById(id).lean();

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    // Only admins can view licenses
    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ license });
  } catch (error) {
    console.error('Get license error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// UPDATE license
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    await dbConnect();
    const { id } = await params;

    // Only admin can update licenses
    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, accountIds, status, expiryDate, metadata } = body;

    const updateData: Record<string, unknown> = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (accountIds !== undefined) updateData.accountIds = accountIds;
    if (status !== undefined) updateData.status = status;
    if (expiryDate !== undefined) updateData.expiryDate = new Date(expiryDate);
    if (metadata !== undefined) updateData.metadata = metadata;

    const license = await License.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'License updated successfully',
      license,
    });
  } catch (error) {
    console.error('Update license error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// DELETE license
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    await dbConnect();
    const { id } = await params;

    // Only admin can delete licenses
    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const license = await License.findByIdAndDelete(id);

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'License deleted successfully',
    });
  } catch (error) {
    console.error('Delete license error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
