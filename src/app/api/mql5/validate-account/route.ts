import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import License from '@/models/License';

/**
 * Endpoint para validar licencia por Account ID de MT5
 * POST /api/mql5/validate-account
 * 
 * Body: {
 *   "account_id": "Login_ID_Account"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { account_id } = body;

    // Validar que account_id esté presente
    if (!account_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'account_id is required',
        },
        { status: 400 }
      );
    }

    // Buscar licencia que contenga este account_id en el array
    const license = await License.findOne({
      accountIds: account_id.toString(),
    }).lean();

    // Si no se encuentra la licencia
    if (!license) {
      return NextResponse.json(
        {
          success: false,
          error: 'No license found for this account_id',
          isActive: false,
        },
        { status: 404 }
      );
    }

    // Verificar si la licencia ha expirado
    const now = new Date();
    const expiryDate = new Date(license.expiryDate);
    const isExpired = now > expiryDate;

    // Calcular días restantes
    const daysRemaining = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determinar si está activa (no expirada y status activo)
    const isActive = !isExpired && license.status === 'active';

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      license: {
        licenseKey: license.licenseKey,
        firstName: license.firstName,
        lastName: license.lastName,
        fullName: `${license.firstName} ${license.lastName}`,
        expiryDate: license.expiryDate,
        isActive: isActive,
        isExpired: isExpired,
        status: license.status,
        daysRemaining: isExpired ? 0 : daysRemaining,
        accountIds: license.accountIds,
      },
    });

  } catch (error) {
    console.error('Validate account error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        success: false,
        error: message,
        isActive: false,
      },
      { status: 500 }
    );
  }
}
