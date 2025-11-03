import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import LicenseRequest from '@/models/LicenseRequest';
import License from '@/models/License';
import { requireAuth } from '@/lib/auth';
import { generateLicenseKey } from '@/lib/license-utils';

// GET single license request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    await dbConnect();
    const { id } = await params;

    const licenseRequest = await LicenseRequest.findById(id)
      .populate('userId', 'name email')
      .populate('approvedBy', 'name')
      .populate('rejectedBy', 'name')
      .populate('subscriptionPlanId')
      .lean();

    if (!licenseRequest) {
      return NextResponse.json(
        { error: 'License request not found' },
        { status: 404 }
      );
    }

    // Users can only view their own requests, admins can view all
    if (session.role !== 'admin' && licenseRequest.userId._id.toString() !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ licenseRequest });
  } catch (error) {
    console.error('Get license request error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// UPDATE license request (approve/reject - admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    await dbConnect();
    const { id } = await params;

    // Only admin can approve/reject
    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, adminNotes, expiryDate } = body;

    if (!action || !['approve', 'reject', 'exempt'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action (approve/reject/exempt) is required' },
        { status: 400 }
      );
    }

    const licenseRequest = await LicenseRequest.findById(id);

    if (!licenseRequest) {
      return NextResponse.json(
        { error: 'License request not found' },
        { status: 404 }
      );
    }

    // For exempt action, allow pending_payment and payment_verified statuses
    if (action === 'exempt') {
      if (!['pending_payment', 'payment_verified'].includes(licenseRequest.status)) {
        return NextResponse.json(
          { error: 'Can only exempt requests with pending_payment or payment_verified status' },
          { status: 400 }
        );
      }
    } else if (licenseRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'License request has already been processed' },
        { status: 400 }
      );
    }

    if (action === 'approve' || action === 'exempt') {
      // Create the license
      if (!expiryDate) {
        return NextResponse.json(
          { error: 'expiryDate is required for approval' },
          { status: 400 }
        );
      }

      const licenseKey = generateLicenseKey();

      await License.create({
        licenseKey,
        firstName: licenseRequest.firstName,
        lastName: licenseRequest.lastName,
        accountIds: licenseRequest.accountIds,
        expiryDate: new Date(expiryDate),
        status: 'active',
        metadata: {
          requestId: String(licenseRequest._id),
          approvedBy: session.id,
        },
      });

      licenseRequest.status = 'approved';
      licenseRequest.approvedBy = new mongoose.Types.ObjectId(session.id);
      licenseRequest.approvedAt = new Date();
      if (adminNotes) licenseRequest.adminNotes = adminNotes;
    } else {
      // Reject
      licenseRequest.status = 'rejected';
      licenseRequest.rejectedBy = new mongoose.Types.ObjectId(session.id);
      licenseRequest.rejectedAt = new Date();
      if (adminNotes) licenseRequest.adminNotes = adminNotes;
    }

    await licenseRequest.save();

    const updatedRequest = await LicenseRequest.findById(id)
      .populate('userId', 'name email')
      .populate('approvedBy', 'name')
      .populate('rejectedBy', 'name')
      .lean();

    return NextResponse.json({
      message: `License request ${action}d successfully`,
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Update license request error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// PATCH license request (user can edit their own pending request)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    await dbConnect();
    const { id } = await params;

    const licenseRequest = await LicenseRequest.findById(id);

    if (!licenseRequest) {
      return NextResponse.json(
        { error: 'License request not found' },
        { status: 404 }
      );
    }

    // Users can only edit their own requests
    if (licenseRequest.userId.toString() !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own requests' },
        { status: 403 }
      );
    }

    // Can only edit if status is pending (not paid, not approved, not rejected)
    if (licenseRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot edit request after payment or processing' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, accountIds, reason } = body;

    // Validate required fields
    if (!firstName || !lastName || !accountIds || !reason) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one account ID is required' },
        { status: 400 }
      );
    }

    // Update the request
    licenseRequest.firstName = firstName.trim();
    licenseRequest.lastName = lastName.trim();
    licenseRequest.accountIds = accountIds;
    licenseRequest.reason = reason.trim();

    await licenseRequest.save();

    const updatedRequest = await LicenseRequest.findById(id)
      .populate('userId', 'name email')
      .populate('subscriptionPlanId')
      .lean();

    return NextResponse.json({
      message: 'License request updated successfully',
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Update license request error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// DELETE license request (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    await dbConnect();
    const { id } = await params;

    // Only admin can delete
    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const licenseRequest = await LicenseRequest.findByIdAndDelete(id);

    if (!licenseRequest) {
      return NextResponse.json(
        { error: 'License request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'License request deleted successfully',
    });
  } catch (error) {
    console.error('Delete license request error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
