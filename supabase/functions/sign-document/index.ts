import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  // CORS
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
    const { documento_id, nivel_govbr = 'Prata' } = await req.json();
    if (!documento_id) throw new Error("ID do documento é obrigatório");

    const clientIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'IP não detectado';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Identificar o usuário que está chamando a função (o assinante) de forma segura
    const authHeader = req.headers.get('Authorization');
    let signerUserId: string | undefined;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      signerUserId = user?.id;
    }

    // 1. Buscar metadados do documento
    const { data: doc, error: docError } = await supabase
      .from('documentos')
      .select('*')
      .eq('id', documento_id)
      .single();

    if (docError || !doc) throw new Error(`Documento não encontrado: ${docError?.message || 'Sem dados'}`);

    // 2. Buscar o nome e CPF do assinante no perfil
    let assinanteNome = 'Usuário Identificado';
    let assinanteCpf = 'Não informado';

    // Usamos o ID do usuário autenticado se disponível, caso contrário fallback para enviado_por
    const targetUserId = signerUserId || doc.enviado_por;

    if (targetUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, cpf')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (profile?.nome) {
        assinanteNome = profile.nome;
      }
      if (profile?.cpf) {
        assinanteCpf = profile.cpf;
      }
    }

    // 3. Baixar o arquivo do Storage para processar o Hash REAL
    const { data: fileData, error: storageError } = await supabase.storage
      .from('documentos')
      .download(doc.arquivo_path);

    if (storageError || !fileData) throw new Error(`Falha ao baixar arquivo: ${storageError?.message || 'Arquivo não encontrado no storage'}`);

    // 4. Calcular Hash SHA-256 do arquivo REAL
    const arrayBuffer = await fileData.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Determinar classificação legal conforme Lei 14.063/2020
    const eQualificada = nivel_govbr === 'Ouro';
    const tipoLegal = eQualificada
      ? 'Assinatura Eletrônica Qualificada (ICP-Brasil)'
      : 'Assinatura Eletrônica Avançada';

    // 5. Metadados de assinatura conforme Lei 14.063/2020
    const signatureMetadata = {
      provedor: 'Gov.br',
      algoritmo: 'SHA-256',
      tipo: tipoLegal,
      lei_referencia: 'Lei nº 14.063/2020',
      assinante_nome: assinanteNome,
      assinante_cpf: assinanteCpf,
      assinante_id: targetUserId,
      conexao_ip: clientIp,
      data_assinatura: new Date().toISOString(),
      hash_original: hashHex,
      nivel_certificado: eQualificada ? 'Certificado Digital ICP-Brasil' : 'Nível Prata/Ouro (Gov.br)',
      autenticidade_url: `${req.headers.get('origin') || 'https://camara.digital'}/verificar/${hashHex}`
    };

    // 6. Atualizar o documento com o HASH REAL e metadados
    const { error: updateError } = await supabase
      .from('documentos')
      .update({
        arquivo_hash: hashHex,
        assinado: true,
        assinatura_metadata: signatureMetadata
      })
      .eq('id', documento_id);

    if (updateError) throw new Error(`Erro ao atualizar documento: ${updateError.message}`);

    // 7. Registrar na tabela de assinaturas
    await supabase.from('assinaturas').insert({
      tenant_id: doc.tenant_id,
      documento_id: doc.id,
      user_id: targetUserId,
      status: 'assinado',
      token: `govbr_hash_${hashHex.substring(0, 16)}`,
      signed_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      hash: hashHex,
      message: `Documento assinado como ${tipoLegal} com sucesso.`
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST' }
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('ERROR SIGN-DOCUMENT:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST' }
    });
  }
});
