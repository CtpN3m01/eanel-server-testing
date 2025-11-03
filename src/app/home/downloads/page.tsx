'use client';

import React from 'react';
import { Download, FileCode, Info, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';

export default function DownloadsPage() {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/downloads/SCANNER_v10.5_CLIENT_EANEL_PRO.ex5';
    link.download = 'SCANNER_v10.5_CLIENT_EANEL_PRO.ex5';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        icon={Download}
        title="Downloads"
      />

      <main className="flex-1 p-4 lg:p-8 max-w-5xl mx-auto w-full">
        <div className="space-y-6">
          {/* Información sobre descargas */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Información de Descarga
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Descarga el archivo SCANNER de EANEL y cópialo en la carpeta de Experts de tu terminal MT5.
                    Asegúrate de tener una licencia activa para poder utilizarlo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de descarga del SCANNER */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileCode className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">SCANNER v10.5 CLIENT EANEL PRO</CardTitle>
                    <CardDescription className="mt-1">
                      Expert Advisor para MetaTrader 5
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo de Archivo</p>
                    <p className="text-sm font-mono">.ex5</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Versión</p>
                    <p className="text-sm">10.5</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Plataforma</p>
                    <p className="text-sm">MetaTrader 5</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Características:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Requiere licencia activa</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Compatible con MT5</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Validación de cuenta automática</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleDownload}
                  className="w-full md:w-auto"
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Descargar SCANNER v10.5
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instrucciones de instalación */}
          <Card>
            <CardHeader>
              <CardTitle>Instrucciones de Instalación</CardTitle>
              <CardDescription>
                Sigue estos pasos para instalar el SCANNER en MetaTrader 5
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Descarga el archivo</p>
                    <p className="text-muted-foreground">
                      Haz clic en el botón de descarga para obtener el archivo SCANNER_v10.5_CLIENT_EANEL_PRO.ex5
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Abre la carpeta de datos de MT5</p>
                    <p className="text-muted-foreground">
                      En MetaTrader 5, ve a <span className="font-mono bg-muted px-1">Archivo → Abrir carpeta de datos</span>
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    3
                  </span>
                  <div>
                    <p className="font-medium">Copia el archivo</p>
                    <p className="text-muted-foreground">
                      Navega a la carpeta <span className="font-mono bg-muted px-1">MQL5/Experts/</span> y copia el archivo descargado
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    4
                  </span>
                  <div>
                    <p className="font-medium">Reinicia MetaTrader 5</p>
                    <p className="text-muted-foreground">
                      Cierra y vuelve a abrir MT5 para que reconozca el nuevo Expert Advisor
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    5
                  </span>
                  <div>
                    <p className="font-medium">Habilita WebRequest para el SCANNER</p>
                    <p className="text-muted-foreground mb-2">
                      Ve a <span className="font-mono bg-muted px-1">Herramientas → Opciones → Expert Advisors</span> y habilita la opción{' '}
                      <span className="font-semibold">&quot;Permitir WebRequest para las siguientes URLs&quot;</span>
                    </p>
                    <div className="mt-2 p-3 bg-muted rounded-md border">
                      <p className="text-xs text-muted-foreground mb-1">Agrega esta URL:</p>
                      <code className="text-sm font-mono font-semibold text-primary">https://eanel.pro</code>
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">
                      ⚠️ Este paso es <span className="font-semibold">obligatorio</span> para que el SCANNER pueda validar tu licencia
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    6
                  </span>
                  <div>
                    <p className="font-medium">Arrastra al gráfico</p>
                    <p className="text-muted-foreground">
                      Desde el Navegador, arrastra el SCANNER a cualquier gráfico. Asegúrate de tener una licencia activa para tu cuenta.
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Nota sobre licencia */}
          <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                    Importante: Licencia Requerida
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    El SCANNER requiere una licencia activa para funcionar. Si aún no tienes una licencia, 
                    puedes solicitarla desde la sección de {' '}
                    <a href="/home/request-license" className="underline font-medium">
                      Solicitar Licencia
                    </a>
                    . Una vez aprobada, el Expert Advisor validará automáticamente tu cuenta al iniciarse.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
