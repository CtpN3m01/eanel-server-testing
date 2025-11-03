import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PaymentMethod from '@/models/PaymentMethod';
import { verifyAuth } from '@/lib/auth';

// GET - Obtener métodos de pago activos
export async function GET() {
  try {
    await connectDB();

    const methods = await PaymentMethod.find({ isActive: true }).sort({ name: 1 });

    return NextResponse.json({ methods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

// POST - Crear método de pago (solo admin)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { name, type, details, instructions, isActive } = body;

    if (!name || !type || !details || !instructions) {
      return NextResponse.json(
        { error: 'Name, type, details, and instructions are required' },
        { status: 400 }
      );
    }

    const method = await PaymentMethod.create({
      name,
      type,
      details,
      instructions,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({ method }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar métodos de pago (solo admin)
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { methods } = body;

    if (!Array.isArray(methods)) {
      return NextResponse.json(
        { error: 'Methods must be an array' },
        { status: 400 }
      );
    }

    const updatePromises = methods.map((method: { _id: string; type: string; name: string; details: Record<string, unknown>; instructions: string; isActive: boolean }) =>
      PaymentMethod.findByIdAndUpdate(
        method._id,
        {
          type: method.type,
          name: method.name,
          details: method.details,
          instructions: method.instructions,
          isActive: method.isActive,
        },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    const updatedMethods = await PaymentMethod.find().sort({ name: 1 });

    return NextResponse.json({ methods: updatedMethods });
  } catch (error) {
    console.error('Error updating payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to update payment methods' },
      { status: 500 }
    );
  }
}
