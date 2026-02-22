// Tipos para o banco de dados Supabase
// Para regenerar: npx supabase gen types typescript --project-id joecchvnzxcnsgzyugdh

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'vereador' | 'servidor' | 'executivo' | 'cidadao'

export type ProposicaoTipo =
  | 'projeto_lei'
  | 'projeto_lei_complementar'
  | 'projeto_resolucao'
  | 'requerimento'
  | 'indicacao'
  | 'moca_aplausos'
  | 'voto_pesar'

export type ProposicaoStatus =
  | 'rascunho'
  | 'protocolado'
  | 'em_tramitacao'
  | 'em_comissao'
  | 'em_votacao'
  | 'aprovado'
  | 'rejeitado'
  | 'arquivado'
  | 'sancionado'
  | 'vetado'

export type VotoOpcao = 'sim' | 'nao' | 'abstencao' | 'ausente'

export type SessaoTipo = 'ordinaria' | 'extraordinaria' | 'especial' | 'solene'

export type SessaoStatus = 'agendada' | 'em_andamento' | 'encerrada' | 'cancelada'

export type TenantPlano = 'basico' | 'profissional' | 'enterprise'

export type TenantSituacao = 'ativo' | 'suspenso' | 'trial' | 'cancelado'

export type LeiStatus = 'em_vigor' | 'revogada_parcialmente' | 'revogada_totalmente'

export type DocumentoTipo = 'ata' | 'oficio' | 'requerimento' | 'decreto' | 'contrato' | 'portaria' | 'outro'

export type AssinaturaStatus = 'pendente' | 'assinado' | 'falhou' | 'cancelado'

export type TeletrabalhoStatus = 'pendente' | 'aprovado' | 'rejeitado'

export type ProtocoloTipo = 'entrada' | 'saida'

export type ProtocoloStatus = 'pendente' | 'em_tramitacao' | 'concluido' | 'arquivado'

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          nome: string
          municipio: string
          uf: string
          cnpj: string | null
          slug: string
          logo_url: string | null
          cor_primaria: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          nome: string
          municipio: string
          uf: string
          cnpj?: string | null
          slug: string
          logo_url?: string | null
          cor_primaria?: string
          ativo?: boolean
        }
        Update: {
          nome?: string
          municipio?: string
          uf?: string
          cnpj?: string | null
          slug?: string
          logo_url?: string | null
          cor_primaria?: string
          ativo?: boolean
        }
        Relationships: []
      }
      master_admins: {
        Row: {
          id: string
          user_id: string
          nome: string
          email: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          nome: string
          email: string
          ativo?: boolean
        }
        Update: {
          nome?: string
          email?: string
          ativo?: boolean
        }
        Relationships: []
      }
      tenant_planos_config: {
        Row: {
          id: string
          tenant_id: string
          plano: TenantPlano
          situacao: TenantSituacao
          max_usuarios: number
          max_storage_gb: number
          trial_ate: string | null
          proxima_cobranca: string | null
          valor_mensalidade: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          plano: TenantPlano
          situacao?: TenantSituacao
          max_usuarios?: number
          max_storage_gb?: number
          trial_ate?: string | null
          proxima_cobranca?: string | null
          valor_mensalidade?: number | null
        }
        Update: {
          plano?: TenantPlano
          situacao?: TenantSituacao
          max_usuarios?: number
          max_storage_gb?: number
          trial_ate?: string | null
          proxima_cobranca?: string | null
          valor_mensalidade?: number | null
        }
        Relationships: []
      }
      tenant_audit_log: {
        Row: {
          id: string
          master_admin_id: string
          tenant_id: string | null
          acao: string
          detalhes: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          master_admin_id: string
          tenant_id?: string | null
          acao: string
          detalhes?: Json | null
          ip_address?: string | null
        }
        Update: never
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          nome: string
          email: string
          role: UserRole
          avatar_url: string | null
          partido: string | null
          matricula: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          user_id: string
          nome: string
          email: string
          role: UserRole
          avatar_url?: string | null
          partido?: string | null
          matricula?: string | null
          ativo?: boolean
        }
        Update: {
          nome?: string
          email?: string
          role?: UserRole
          avatar_url?: string | null
          partido?: string | null
          matricula?: string | null
          ativo?: boolean
        }
        Relationships: []
      }
      proposicoes: {
        Row: {
          id: string
          tenant_id: string
          numero: string
          ano: number
          tipo: ProposicaoTipo
          ementa: string
          texto_integral: string | null
          autor_id: string
          status: ProposicaoStatus
          data_protocolo: string
          data_publicacao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          numero: string
          ano: number
          tipo: ProposicaoTipo
          ementa: string
          texto_integral?: string | null
          autor_id: string
          status?: ProposicaoStatus
          data_protocolo?: string
          data_publicacao?: string | null
        }
        Update: {
          numero?: string
          tipo?: ProposicaoTipo
          ementa?: string
          texto_integral?: string | null
          status?: ProposicaoStatus
          data_protocolo?: string
          data_publicacao?: string | null
        }
        Relationships: []
      }
      leis: {
        Row: {
          id: string
          tenant_id: string
          proposicao_id: string | null
          numero: string
          ano: number
          esfera: string
          ementa: string
          texto_compilado: string
          status: LeiStatus
          data_publicacao: string
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          proposicao_id?: string | null
          numero: string
          ano: number
          esfera?: string
          ementa: string
          texto_compilado: string
          status?: LeiStatus
          data_publicacao: string
          tags?: string[]
        }
        Update: {
          proposicao_id?: string | null
          numero?: string
          ano?: number
          esfera?: string
          ementa?: string
          texto_compilado?: string
          status?: LeiStatus
          data_publicacao?: string
          tags?: string[]
        }
        Relationships: []
      }
      tramitacoes: {
        Row: {
          id: string
          tenant_id: string
          proposicao_id: string
          status_anterior: ProposicaoStatus
          status_novo: ProposicaoStatus
          descricao: string | null
          responsavel_id: string
          created_at: string
        }
        Insert: {
          tenant_id: string
          proposicao_id: string
          status_anterior: ProposicaoStatus
          status_novo: ProposicaoStatus
          descricao?: string | null
          responsavel_id: string
        }
        Update: never
        Relationships: []
      }
      sessoes: {
        Row: {
          id: string
          tenant_id: string
          numero: number
          ano: number
          tipo: SessaoTipo
          status: SessaoStatus
          data_inicio: string
          data_fim: string | null
          local: string
          quorum_minimo: number
          presentes: string[]
          transmissao_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          numero: number
          ano: number
          tipo: SessaoTipo
          status?: SessaoStatus
          data_inicio: string
          data_fim?: string | null
          local: string
          quorum_minimo: number
          presentes?: string[]
          transmissao_url?: string | null
        }
        Update: {
          status?: SessaoStatus
          data_inicio?: string
          data_fim?: string | null
          local?: string
          quorum_minimo?: number
          presentes?: string[]
          transmissao_url?: string | null
        }
        Relationships: []
      }
      pauta_itens: {
        Row: {
          id: string
          sessao_id: string
          proposicao_id: string
          ordem: number
          em_votacao: boolean
          created_at: string
        }
        Insert: {
          sessao_id: string
          proposicao_id: string
          ordem: number
          em_votacao?: boolean
        }
        Update: {
          ordem?: number
          em_votacao?: boolean
        }
        Relationships: []
      }
      votos: {
        Row: {
          id: string
          tenant_id: string
          sessao_id: string
          proposicao_id: string
          vereador_id: string
          opcao: VotoOpcao
          created_at: string
        }
        Insert: {
          tenant_id: string
          sessao_id: string
          proposicao_id: string
          vereador_id: string
          opcao: VotoOpcao
        }
        Update: never
        Relationships: []
      }
      documentos: {
        Row: {
          id: string
          tenant_id: string
          nome: string
          tipo: DocumentoTipo
          descricao: string | null
          arquivo_path: string
          arquivo_nome: string
          arquivo_tamanho: number | null
          arquivo_mime: string | null
          enviado_por: string | null
          assinado: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          nome: string
          tipo: DocumentoTipo
          descricao?: string | null
          arquivo_path: string
          arquivo_nome: string
          arquivo_tamanho?: number | null
          arquivo_mime?: string | null
          enviado_por?: string | null
          assinado?: boolean
        }
        Update: {
          nome?: string
          tipo?: DocumentoTipo
          descricao?: string | null
          assinado?: boolean
        }
        Relationships: []
      }
      teletrabalho_registros: {
        Row: {
          id: string
          tenant_id: string
          profile_id: string
          data: string
          hora_inicio: string | null
          hora_fim: string | null
          atividades: string
          status: TeletrabalhoStatus
          obs_gestor: string | null
          aprovado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          profile_id: string
          data: string
          hora_inicio?: string | null
          hora_fim?: string | null
          atividades: string
          status?: TeletrabalhoStatus
          obs_gestor?: string | null
          aprovado_por?: string | null
        }
        Update: {
          hora_inicio?: string | null
          hora_fim?: string | null
          atividades?: string
          status?: TeletrabalhoStatus
          obs_gestor?: string | null
          aprovado_por?: string | null
        }
        Relationships: []
      }
      assinaturas: {
        Row: {
          id: string
          tenant_id: string
          documento_id: string
          user_id: string
          status: AssinaturaStatus
          token: string | null
          signed_at: string | null
          created_at: string
        }
        Insert: {
          tenant_id: string
          documento_id: string
          user_id: string
          status?: AssinaturaStatus
          token?: string | null
          signed_at?: string | null
        }
        Update: {
          status?: AssinaturaStatus
          token?: string | null
          signed_at?: string | null
        }
        Relationships: []
      }
      protocolos: {
        Row: {
          id: string
          tenant_id: string
          numero: string
          ano: number
          tipo: ProtocoloTipo
          status: ProtocoloStatus
          assunto: string
          remetente: string | null
          destinatario: string | null
          data_recebimento: string
          prazo: string | null
          observacoes: string | null
          criado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          numero: string
          ano: number
          tipo: ProtocoloTipo
          status?: ProtocoloStatus
          assunto: string
          remetente?: string | null
          destinatario?: string | null
          data_recebimento?: string
          prazo?: string | null
          observacoes?: string | null
          criado_por?: string | null
        }
        Update: {
          status?: ProtocoloStatus
          assunto?: string
          remetente?: string | null
          destinatario?: string | null
          prazo?: string | null
          observacoes?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      master_tenant_overview: {
        Row: {
          id: string
          nome: string
          municipio: string
          uf: string
          slug: string
          ativo: boolean
          created_at: string
          plano: TenantPlano | null
          situacao: TenantSituacao | null
          max_usuarios: number | null
          trial_ate: string | null
          valor_mensalidade: number | null
          usuarios_ativos: number
          total_proposicoes: number
          total_sessoes: number
        }
        Relationships: []
      }
    }
    Functions: {
      provisionar_tenant: {
        Args: {
          p_nome: string
          p_municipio: string
          p_uf: string
          p_cnpj: string
          p_slug: string
          p_plano?: TenantPlano
          p_max_usuarios?: number
          p_admin_nome?: string
          p_admin_email?: string
        }
        Returns: Json
      }
      admin_resetar_senha_tenant: {
        Args: {
          p_tenant_id: string
        }
        Returns: Json
      }
      next_proposicao_numero: {
        Args: {
          p_tenant_id: string
          p_tipo: string
          p_ano: number
        }
        Returns: string
      }
    }
    Enums: {
      user_role: UserRole
      proposicao_tipo: ProposicaoTipo
      proposicao_status: ProposicaoStatus
      voto_opcao: VotoOpcao
      sessao_tipo: SessaoTipo
      sessao_status: SessaoStatus
      tenant_plano: TenantPlano
      tenant_situacao: TenantSituacao
      documento_tipo: DocumentoTipo
      teletrabalho_status: TeletrabalhoStatus
      protocolo_tipo: ProtocoloTipo
      protocolo_status: ProtocoloStatus
    }
    CompositeTypes: Record<string, unknown>
  }
}
