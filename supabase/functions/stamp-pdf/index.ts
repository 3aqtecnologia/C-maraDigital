import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { PDFDocument, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    const { documento_id } = await req.json();
    if (!documento_id) throw new Error("ID do documento é obrigatório");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: doc, error: docError } = await supabase
      .from('documentos')
      .select('*')
      .eq('id', documento_id)
      .single();

    if (docError || !doc) throw new Error("Documento não encontrado");
    if (!doc.assinado) throw new Error("O documento ainda não possui uma assinatura digital");

    const { data: fileData, error: storageError } = await supabase.storage
      .from('documentos')
      .download(doc.arquivo_path);

    if (storageError || !fileData) throw new Error("Falha ao recuperar o arquivo original");

    const pdfDoc = await PDFDocument.load(await fileData.arrayBuffer());
    const pages = pdfDoc.getPages();
    const fontBold = await pdfDoc.embedStandardFont('Helvetica-Bold');
    const fontRegular = await pdfDoc.embedStandardFont('Helvetica');

    const meta = doc.assinatura_metadata;
    const rawCpf = meta?.assinante_cpf?.replace(/\D/g, '') || '';
    const maskedCpf = rawCpf.length >= 11
      ? `${rawCpf.substring(0, 3)}.***.***-${rawCpf.substring(rawCpf.length - 2)}`
      : '###.***.***-##';

    const assinanteInfo = `${meta?.assinante_nome || 'Usuário Identificado'} (CPF: ${maskedCpf})`;
    const tipoAssinatura = meta?.tipo || 'Assinatura Eletrônica';
    const verifyUrl = `${req.headers.get('origin') || 'https://camara.digital'}/verificar/${doc.arquivo_hash}`;

    // Aplicar selo em todas as páginas
    for (const page of pages) {
      const { width } = page.getSize();

      // Selo de Autenticidade no Rodapé
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: 65,
        color: rgb(0.95, 0.97, 1.0), // Azul bem claro
      });

      page.drawText(`AUTENTICIDADE GARANTIDA - LEI Nº 14.063/2020`, {
        x: 20,
        y: 48,
        size: 10,
        font: fontBold,
        color: rgb(0, 0.2, 0.5),
      });

      page.drawText(`${tipoAssinatura}`, {
        x: 20,
        y: 36,
        size: 8,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawText(`Assinado por: ${assinanteInfo}`, {
        x: 20,
        y: 24,
        size: 8,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawText(`Valide em: ${verifyUrl}`, {
        x: 20,
        y: 10,
        size: 7,
        font: fontRegular,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST'
      }
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('ERROR STAMP-PDF:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST' }
    });
  }
});
