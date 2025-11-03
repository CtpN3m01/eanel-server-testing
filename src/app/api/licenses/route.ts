import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import License from '@/models/License';
import { requireAuth } from '@/lib/auth';
import { generateLicenseKey } from '@/lib/license-utils';

// GET all licenses
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { licenseKey: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [licenses, total] = await Promise.all([
      License.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      License.countDocuments(query),
    ]);

    return NextResponse.json({
      licenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get licenses error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// CREATE new license
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await dbConnect();

    // Only admin can create licenses
    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, accountIds, expiryDate } = body;

    if (!firstName || !lastName || !accountIds || !Array.isArray(accountIds) || accountIds.length === 0 || !expiryDate) {
      return NextResponse.json(
        { error: 'firstName, lastName, accountIds (array with at least one ID), and expiryDate are required' },
        { status: 400 }
      );
    }

    // Generate unique license key
    const licenseKey = generateLicenseKey();

    const license = await License.create({
      licenseKey,
      firstName,
      lastName,
      accountIds,
      expiryDate: new Date(expiryDate),
      metadata: {},
      status: 'active',
    });

    const createdLicense = await License.findById(license._id).lean();

    return NextResponse.json(
      {
        message: 'License created successfully',
        license: createdLicense,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create license error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
