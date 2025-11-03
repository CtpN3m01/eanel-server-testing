import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { verifyAuth } from '@/lib/auth';

// GET - Obtener todos los planes (públicos)
export async function GET() {
  try {
    await connectDB();

    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ duration: 1 });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

// POST - Crear plan (solo admin)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { name, duration, price, currency, description } = body;

    if (!name || !duration || price === undefined) {
      return NextResponse.json(
        { error: 'Name, duration, and price are required' },
        { status: 400 }
      );
    }

    const plan = await SubscriptionPlan.create({
      name,
      duration,
      price,
      currency: currency || 'USD',
      description,
      isActive: true,
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar todos los planes (solo admin)
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { plans } = body;

    if (!plans || !Array.isArray(plans)) {
      return NextResponse.json(
        { error: 'Plans array is required' },
        { status: 400 }
      );
    }

    const updatePromises = plans.map((plan: { _id: string; name: string; duration: number; price: number; currency: string; isActive: boolean }) =>
      SubscriptionPlan.findByIdAndUpdate(
        plan._id,
        {
          name: plan.name,
          duration: plan.duration,
          price: plan.price,
          currency: plan.currency || 'USD',
          isActive: plan.isActive !== false,
        },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    const updatedPlans = await SubscriptionPlan.find().sort({ duration: 1 });

    return NextResponse.json({ plans: updatedPlans });
  } catch (error) {
    console.error('Error updating plans:', error);
    return NextResponse.json(
      { error: 'Failed to update plans' },
      { status: 500 }
    );
  }
}
