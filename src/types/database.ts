/* eslint-disable @typescript-eslint/no-explicit-any */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assinaturas: {
        Row: {
          created_at: string
          documento_id: string
          id: string
          signed_at: string | null
          status: Database["public"]["Enums"]["assinatura_status"]
          tenant_id: string
          token: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          documento_id: string
          id?: string
          signed_at?: string | null
          status?: Database["public"]["Enums"]["assinatura_status"]
          tenant_id: string
          token?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          documento_id?: string
          id?: string
          signed_at?: string | null
          status?: Database["public"]["Enums"]["assinatura_status"]
          tenant_id?: string
          token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "master_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          arquivo_hash: string | null
          arquivo_mime: string | null
          arquivo_nome: string | null
          arquivo_path: string
          arquivo_tamanho: number | null
          assinado: boolean | null
          assinatura_metadata: Json | null
          created_at: string
          descricao: string | null
          enviado_por: string | null
          id: string
          nome: string
          tenant_id: string
          tipo: Database["public"]["Enums"]["documento_tipo"]
          updated_at: string
        }
        Insert: {
          arquivo_hash?: string | null
          arquivo_mime?: string | null
          arquivo_nome?: string | null
          arquivo_path: string
          arquivo_tamanho?: number | null
          assinado?: boolean | null
          assinatura_metadata?: Json | null
          created_at?: string
          descricao?: string | null
          enviado_por?: string | null
          id?: string
          nome: string
          tenant_id: string
          tipo?: Database["public"]["Enums"]["documento_tipo"]
          updated_at?: string
        }
        Update: {
          arquivo_hash?: string | null
          arquivo_mime?: string | null
          arquivo_nome?: string | null
          arquivo_path?: string
          arquivo_tamanho?: number | null
          assinado?: boolean | null
          assinatura_metadata?: Json | null
          created_at?: string
          descricao?: string | null
          enviado_por?: string | null
          id?: string
          nome?: string
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["documento_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "master_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leis: {
        Row: {
          ano: number
          created_at: string
          data_publicacao: string
          ementa: string
          esfera: string
          id: string
          numero: string
          proposicao_id: string | null
          status: Database["public"]["Enums"]["lei_status"]
          tags: string[] | null
          tenant_id: string
          texto_compilado: string
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          data_publicacao: string
          ementa: string
          esfera?: string
          id?: string
          numero: string
          proposicao_id?: string | null
          status?: Database["public"]["Enums"]["lei_status"]
          tags?: string[] | null
          tenant_id: string
          texto_compilado: string
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          data_publicacao?: string
          ementa?: string
          esfera?: string
          id?: string
          numero?: string
          proposicao_id?: string | null
          status?: Database["public"]["Enums"]["lei_status"]
          tags?: string[] | null
          tenant_id?: string
          texto_compilado?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leis_proposicao_id_fkey"
            columns: ["proposicao_id"]
            isOneToOne: false
            referencedRelation: "proposicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leis_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "master_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leis_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      master_admins: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ouvidoria_mensagens: {
        Row: {
          anexo_url: string | null
          autor_id: string
          created_at: string
          id: string
          mensagem: string
          origem: Database["public"]["Enums"]["ouvidoria_resposta_origem"]
          tenant_id: string
          ticket_id: string
        }
        Insert: {
          anexo_url?: string | null
          autor_id: string
          created_at?: string
          id?: string
          mensagem: string
          origem: Database["public"]["Enums"]["ouvidoria_resposta_origem"]
          tenant_id: string
          ticket_id: string
        }
        Update: {
          anexo_url?: string | null
          autor_id?: string
          created_at?: string
          id?: string
          mensagem?: string
          origem?: Database["public"]["Enums"]["ouvidoria_resposta_origem"]
          tenant_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ouvidoria_mensagens_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ouvidoria_mensagens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "master_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ouvidoria_mensagens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ouvidoria_mensagens_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ouvidoria_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ouvidoria_tickets: {
        Row: {
          assunto: string
          cidadao_id: string
          created_at: string
          descricao: string
          id: string
          prazo_prorrogado: boolean | null
          prazo_vencimento: string
          protocolo: string
          sigiloso: boolean
          status: Database["public"]["Enums"]["ouvidoria_status"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["ouvidoria_tipo"]
          updated_at: string
        }
        Insert: {
          assunto: string
          cidadao_id: string
          created_at?: string
          descricao: string
          id?: string
          prazo_prorrogado?: boolean | null
          prazo_vencimento: string
          protocolo: string
          sigiloso?: boolean
          status?: Database["public"]["Enums"]["ouvidoria_status"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["ouvidoria_tipo"]
          updated_at?: string
        }
        Update: {
          assunto?: string
          cidadao_id?: string
          created_at?: string
          descricao?: string
          id?: string
          prazo_prorrogado?: boolean | null
          prazo_vencimento?: string
          protocolo?: string
          sigiloso?: boolean
          status?: Database["public"]["Enums"]["ouvidoria_status"]
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["ouvidoria_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ouvidoria_tickets_cidadao_id_fkey"
            columns: ["cidadao_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ouvidoria_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "master_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ouvidoria_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pauta_itens: {
        Row: {
          created_at: string
          em_votacao: boolean
          id: string
          ordem: number
          proposicao_id: string
          sessao_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          em_votacao?: boolean
          id?: string
          ordem: number
          proposicao_id: string
          sessao_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          em_votacao?: boolean
          id?: string
          ordem?: number
          proposicao_id?: string
          sessao_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pauta_itens_proposicao_id_fkey"
            columns: ["proposicao_id"]
            isOneToOne: false
            referencedRelation: "proposicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pauta_itens_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pauta_itens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "master_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pauta_itens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          cpf: string | null
          created_at: string
          email: string
          id: string
          matricula: string | null
          nome: string
          partido: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          id?: string
          matricula?: string | null
          nome: string
          partido?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          matricula?: string | null
          nome?: string
          partido?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "master_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      proposicoes: {
        Row: {
          ano: number
          autor_id: string
          created_at: string
          data_protocolo: string
          data_publicacao: string | null
          ementa: string
          id: string
          numero: string
          status: Database["public"]["Enums"]["proposicao_status"]
          tenant_id: string
          texto_integral: string | null
          tipo: Database["public"]["Enums"]["proposicao_tipo"]
          updated_at: string
        }
        Insert: {
          ano?: number
          autor_id: string
          created_at?: string
          data_protocolo?: string
          data_publicacao?: string | null
          ementa: string
          id?: string
          numero: string
          status?: Database["public"]["Enums"]["proposicao_status"]
          tenant_id: string
          texto_integral?: string | null
          tipo: Database["public"]["Enums"]["proposicao_tipo"]
          updated_at?: string
        }
        Update: {
          ano?: number
          autor_id?: string
          created_at?: string
          data_protocolo?: string
          data_publicacao?: string | null
          ementa?: string
          id?: string
          numero?: string
          status?: Database["public"]["Enums"]["proposicao_status"]
          tenant_id?: string
          texto_integral?: string | null
          tipo?: Database["public"]["Enums"]["proposicao_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposicoes_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposicoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "master_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposicoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolos: {
        Row: {
          ano: number
          assunto: string
          created_at: string | null
          criado_por: string | null
          data_recebimento: string
          destinatario: string | null
          id: string
          numero: string
          observacoes: string | null
          prazo: string | null
          remetente: string | null
          status: Database["public"]["Enums"]["protocolo_status"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["protocolo_tipo"]
          updated_at: string | null
        }
        Insert: {
          ano?: number
          assunto: string
          created_at?: string | null
          criado_por?: string | null
          data_recebimento?: string
          destinatario?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          prazo?: string | null
          remetente?: string | null
          status?: Database["public"]["Enums"]["protocolo_status"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["protocolo_tipo"]
          updated_at?: string | null
        }
        Update: {
          ano?: number
          assunto?: string
          created_at?: string | null
          criado_por?: string | null
          data_recebimento?: string
          destinatario?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          prazo?: string | null
          remetente?: string | null
          status?: Database["public"]["Enums"]["protocolo_status"]
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["protocolo_tipo"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protocolos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocolos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "master_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocolos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes: {
        Row: {
          ano: number
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          local: string
          numero: number
          presentes: string[]
          quorum_minimo: number
          status: Database["public"]["Enums"]["sessao_status"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["sessao_tipo"]
          transmissao_url: string | null
          updated_at: string
        }
        Insert: {
          ano?: number
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          id?: string
          local?: string
          numero: number
          presentes?: string[]
          quorum_minimo?: number
          status?: Database["public"]["Enums"]["sessao_status"]
          tenant_id: string
          tipo?: Database["public"]["Enums"]["sessao_tipo"]
          transmissao_url?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          local?: string
          numero?: number
          presentes?: string[]
          quorum_minimo?: number
          status?: Database["public"]["Enums"]["sessao_status"]
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["sessao_tipo"]
          transmissao_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "master_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      teletrabalho_registros: {
        Row: {
          aprovado_por: string | null
          atividades: string
          created_at: string | null
          data: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          obs_gestor: string | null
          profile_id: string
          status: Database["public"]["Enums"]["teletrabalho_status"]
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          aprovado_por?: string | null
          atividades: string
          created_at?: string | null
          data: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          obs_gestor?: string | null
          profile_id: string
          status?: Database["public"]["Enums"]["teletrabalho_status"]
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          aprovado_por?: string | null
          atividades?: string
          created_at?: string | null
          data?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          obs_gestor?: string | null
          profile_id?: string
          status?: Database["public"]["Enums"]["teletrabalho_status"]
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teletrabalho_registros_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teletrabalho_registros_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teletrabalho_registros_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "master_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teletrabalho_registros_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_audit_log: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json | null
          id: string
          ip_address: unknown
          master_admin_id: string
          tenant_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json | null
          id?: string
          ip_address?: unknown
          master_admin_id: string
          tenant_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json | null
          id?: string
          ip_address?: unknown
          master_admin_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_audit_log_master_admin_id_fkey"
            columns: ["master_admin_id"]
            isOneToOne: false
            referencedRelation: "master_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "master_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_planos_config: {
        Row: {
          created_at: string
          id: string
          max_storage_gb: number
          max_usuarios: number
          plano: Database["public"]["Enums"]["tenant_plano"]
          proxima_cobranca: string | null
          situacao: Database["public"]["Enums"]["tenant_situacao"]
          tenant_id: string
          trial_ate: string | null
          updated_at: string
          valor_mensalidade: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          max_storage_gb?: number
          max_usuarios?: number
          plano?: Database["public"]["Enums"]["tenant_plano"]
          proxima_cobranca?: string | null
          situacao?: Database["public"]["Enums"]["tenant_situacao"]
          tenant_id: string
          trial_ate?: string | null
          updated_at?: string
          valor_mensalidade?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          max_storage_gb?: number
          max_usuarios?: number
          plano?: Database["public"]["Enums"]["tenant_plano"]
          proxima_cobranca?: string | null
          situacao?: Database["public"]["Enums"]["tenant_situacao"]
          tenant_id?: string
          trial_ate?: string | null
          updated_at?: string
          valor_mensalidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_planos_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "master_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_planos_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          ativo: boolean
          cnpj: string | null
          cor_primaria: string
          created_at: string
          id: string
          logo_url: string | null
          municipio: string
          nome: string
          slug: string
          uf: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          cor_primaria?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          municipio: string
          nome: string
          slug: string
          uf: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          cor_primaria?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          municipio?: string
          nome?: string
          slug?: string
          uf?: string
          updated_at?: string
        }
        Relationships: []
      }
      tramitacoes: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          proposicao_id: string
          responsavel_id: string | null
          status_anterior:
          | Database["public"]["Enums"]["proposicao_status"]
          | null
          status_novo: Database["public"]["Enums"]["proposicao_status"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          proposicao_id: string
          responsavel_id?: string | null
          status_anterior?:
          | Database["public"]["Enums"]["proposicao_status"]
          | null
          status_novo: Database["public"]["Enums"]["proposicao_status"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          proposicao_id?: string
          responsavel_id?: string | null
          status_anterior?:
          | Database["public"]["Enums"]["proposicao_status"]
          | null
          status_novo?: Database["public"]["Enums"]["proposicao_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tramitacoes_proposicao_id_fkey"
            columns: ["proposicao_id"]
            isOneToOne: false
            referencedRelation: "proposicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tramitacoes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tramitacoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "master_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tramitacoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      votos: {
        Row: {
          created_at: string
          id: string
          opcao: Database["public"]["Enums"]["voto_opcao"]
          proposicao_id: string
          sessao_id: string
          tenant_id: string
          vereador_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opcao: Database["public"]["Enums"]["voto_opcao"]
          proposicao_id: string
          sessao_id: string
          tenant_id: string
          vereador_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opcao?: Database["public"]["Enums"]["voto_opcao"]
          proposicao_id?: string
          sessao_id?: string
          tenant_id?: string
          vereador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votos_proposicao_id_fkey"
            columns: ["proposicao_id"]
            isOneToOne: false
            referencedRelation: "proposicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votos_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "master_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votos_vereador_id_fkey"
            columns: ["vereador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      master_tenant_overview: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string | null
          max_usuarios: number | null
          municipio: string | null
          nome: string | null
          plano: Database["public"]["Enums"]["tenant_plano"] | null
          situacao: Database["public"]["Enums"]["tenant_situacao"] | null
          slug: string | null
          total_proposicoes: number | null
          total_sessoes: number | null
          trial_ate: string | null
          uf: string | null
          usuarios_ativos: number | null
          valor_mensalidade: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_deletar_tenant: { Args: { p_tenant_id: string }; Returns: Json }
      admin_resetar_senha_tenant: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      admin_update_tenant:
      | {
        Args: {
          p_municipio: string
          p_nome: string
          p_plano: Database["public"]["Enums"]["tenant_plano"]
          p_situacao: Database["public"]["Enums"]["tenant_situacao"]
          p_tenant_id: string
          p_uf: string
        }
        Returns: undefined
      }
      | {
        Args: {
          p_municipio: string
          p_nome: string
          p_plano: Database["public"]["Enums"]["tenant_plano"]
          p_situacao: Database["public"]["Enums"]["tenant_situacao"]
          p_slug: string
          p_tenant_id: string
          p_uf: string
        }
        Returns: undefined
      }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_tenant_id: { Args: never; Returns: string }
      is_master_admin: { Args: never; Returns: boolean }
      next_ouvidoria_protocolo: {
        Args: { p_ano: number; p_tenant_id: string }
        Returns: string
      }
      next_proposicao_numero: {
        Args: {
          p_ano: number
          p_tenant_id: string
          p_tipo: Database["public"]["Enums"]["proposicao_tipo"]
        }
        Returns: string
      }
      next_protocolo_numero: {
        Args: { p_ano: number; p_tenant_id: string }
        Returns: string
      }
      provisionar_tenant:
      | {
        Args: {
          p_admin_email?: string
          p_admin_nome?: string
          p_cnpj: string
          p_max_usuarios?: number
          p_municipio: string
          p_nome: string
          p_plano?: Database["public"]["Enums"]["tenant_plano"]
          p_slug: string
          p_uf: string
        }
        Returns: Json
      }
      | {
        Args: {
          p_admin_nome?: string
          p_cnpj: string
          p_max_usuarios?: number
          p_municipio: string
          p_nome: string
          p_plano?: Database["public"]["Enums"]["tenant_plano"]
          p_slug: string
          p_uf: string
        }
        Returns: Json
      }
      user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      user_tenant_id: { Args: never; Returns: string }
    }
    Enums: {
      assinatura_status: "pendente" | "assinado" | "falhou" | "cancelado"
      documento_tipo:
      | "ata"
      | "oficio"
      | "requerimento"
      | "decreto"
      | "contrato"
      | "portaria"
      | "outro"
      lei_status: "em_vigor" | "revogada_parcialmente" | "revogada_totalmente"
      ouvidoria_resposta_origem: "cidadao" | "servidor"
      ouvidoria_status:
      | "novo"
      | "em_analise"
      | "respondido"
      | "concluido"
      | "arquivado"
      ouvidoria_tipo:
      | "denuncia"
      | "reclamacao"
      | "solicitacao"
      | "sugestao"
      | "elogio"
      | "pedido_informacao"
      proposicao_status:
      | "rascunho"
      | "protocolado"
      | "em_tramitacao"
      | "em_comissao"
      | "em_votacao"
      | "aprovado"
      | "rejeitado"
      | "arquivado"
      | "sancionado"
      | "vetado"
      proposicao_tipo:
      | "projeto_lei"
      | "projeto_lei_complementar"
      | "projeto_resolucao"
      | "requerimento"
      | "indicacao"
      | "moca_aplausos"
      | "voto_pesar"
      protocolo_status: "pendente" | "em_tramitacao" | "concluido" | "arquivado"
      protocolo_tipo: "entrada" | "saida"
      sessao_status: "agendada" | "em_andamento" | "encerrada" | "cancelada"
      sessao_tipo: "ordinaria" | "extraordinaria" | "especial" | "solene"
      teletrabalho_status: "pendente" | "aprovado" | "rejeitado"
      tenant_plano: "basico" | "profissional" | "enterprise"
      tenant_situacao: "ativo" | "suspenso" | "trial" | "cancelado"
      user_role: "admin" | "vereador" | "servidor" | "executivo" | "cidadao"
      voto_opcao: "sim" | "nao" | "abstencao" | "ausente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      assinatura_status: ["pendente", "assinado", "falhou", "cancelado"],
      documento_tipo: [
        "ata",
        "oficio",
        "requerimento",
        "decreto",
        "contrato",
        "portaria",
        "outro",
      ],
      lei_status: ["em_vigor", "revogada_parcialmente", "revogada_totalmente"],
      ouvidoria_resposta_origem: ["cidadao", "servidor"],
      ouvidoria_status: [
        "novo",
        "em_analise",
        "respondido",
        "concluido",
        "arquivado",
      ],
      ouvidoria_tipo: [
        "denuncia",
        "reclamacao",
        "solicitacao",
        "sugestao",
        "elogio",
        "pedido_informacao",
      ],
      proposicao_status: [
        "rascunho",
        "protocolado",
        "em_tramitacao",
        "em_comissao",
        "em_votacao",
        "aprovado",
        "rejeitado",
        "arquivado",
        "sancionado",
        "vetado",
      ],
      proposicao_tipo: [
        "projeto_lei",
        "projeto_lei_complementar",
        "projeto_resolucao",
        "requerimento",
        "indicacao",
        "moca_aplausos",
        "voto_pesar",
      ],
      protocolo_status: ["pendente", "em_tramitacao", "concluido", "arquivado"],
      protocolo_tipo: ["entrada", "saida"],
      sessao_status: ["agendada", "em_andamento", "encerrada", "cancelada"],
      sessao_tipo: ["ordinaria", "extraordinaria", "especial", "solene"],
      teletrabalho_status: ["pendente", "aprovado", "rejeitado"],
      tenant_plano: ["basico", "profissional", "enterprise"],
      tenant_situacao: ["ativo", "suspenso", "trial", "cancelado"],
      user_role: ["admin", "vereador", "servidor", "executivo", "cidadao"],
      voto_opcao: ["sim", "nao", "abstencao", "ausente"],
    },
  },
} as const

export type AssinaturaStatus = Database['public']['Enums']['assinatura_status']
export type DocumentoTipo = Database['public']['Enums']['documento_tipo']
export type LeiStatus = Database['public']['Enums']['lei_status']
export type OuvidoriaRespostaOrigem = Database['public']['Enums']['ouvidoria_resposta_origem']
export type OuvidoriaStatus = Database['public']['Enums']['ouvidoria_status']
export type OuvidoriaTipo = Database['public']['Enums']['ouvidoria_tipo']
export type ProposicaoStatus = Database['public']['Enums']['proposicao_status']
export type ProposicaoTipo = Database['public']['Enums']['proposicao_tipo']
export type ProtocoloStatus = Database['public']['Enums']['protocolo_status']
export type ProtocoloTipo = Database['public']['Enums']['protocolo_tipo']
export type SessaoStatus = Database['public']['Enums']['sessao_status']
export type SessaoTipo = Database['public']['Enums']['sessao_tipo']
export type TeletrabalhoStatus = Database['public']['Enums']['teletrabalho_status']
export type TenantPlano = Database['public']['Enums']['tenant_plano']
export type TenantSituacao = Database['public']['Enums']['tenant_situacao']
export type UserRole = Database['public']['Enums']['user_role']
export type VotoOpcao = Database['public']['Enums']['voto_opcao']
