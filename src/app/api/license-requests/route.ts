import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LicenseRequest from '@/models/LicenseRequest';
import { requireAuth } from '@/lib/auth';

// GET all license requests (admin only) or user's own requests
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};

    // If not admin, only show user's own requests
    if (session.role !== 'admin') {
      query.userId = session.id;
    }

    if (status) {
      query.status = status;
    }

    // Add search functionality (admin only)
    if (search && session.role === 'admin') {
      const searchRegex = { $regex: search, $options: 'i' };
      
      // First, find users matching the email or name
      const User = (await import('@/models/User')).default;
      const matchingUsers = await User.find({
        $or: [
          { email: searchRegex },
          { name: searchRegex }
        ]
      }).select('_id').lean();
      
      const userIds = matchingUsers.map(u => u._id);

      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { accountIds: searchRegex },
        { userId: { $in: userIds } }
      ];
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      LicenseRequest.find(query)
        .populate('userId', 'name email')
        .populate('approvedBy', 'name')
        .populate('rejectedBy', 'name')
        .populate('subscriptionPlanId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LicenseRequest.countDocuments(query),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get license requests error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// CREATE new license request (any authenticated user)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const body = await request.json();
    const { firstName, lastName, accountIds, reason, subscriptionPlanId } = body;

    if (!firstName || !lastName || !accountIds || !Array.isArray(accountIds) || accountIds.length === 0 || !reason) {
      return NextResponse.json(
        { error: 'firstName, lastName, accountIds (array with at least one ID), and reason are required' },
        { status: 400 }
      );
    }

    // Check if user already has a pending request
    const existingPendingRequest = await LicenseRequest.findOne({
      userId: session.id,
      status: { $in: ['pending', 'pending_payment', 'payment_verified'] }
    });

    if (existingPendingRequest) {
      return NextResponse.json(
        { 
          error: 'Ya tienes una solicitud pendiente. Por favor espera a que sea aprobada o rechazada antes de crear una nueva.',
          existingRequest: existingPendingRequest
        },
        { status: 400 }
      );
    }

    const licenseRequest = await LicenseRequest.create({
      userId: session.id,
      firstName,
      lastName,
      accountIds,
      reason,
      subscriptionPlanId: subscriptionPlanId || undefined,
      status: subscriptionPlanId ? 'pending_payment' : 'pending',
    });

    const populatedRequest = await LicenseRequest.findById(licenseRequest._id)
      .populate('userId', 'name email')
      .lean();

    return NextResponse.json(
      {
        message: 'License request submitted successfully',
        licenseRequest: populatedRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create license request error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
