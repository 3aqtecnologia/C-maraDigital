# Ouvidoria e e-SIC (Transparência)

## Goal
Implementar o módulo Ouvidoria/e-SIC conforme a Lei 12.527/2011 (LAI) exigindo autenticação do cidadão, rastreio de chamados e controle rigoroso de SLA no painel da câmara.

## Tasks
- [x] Task 1: Criar tabela `ouvidoria_tickets` e `ouvidoria_mensagens` (owner: cidadão, tenant) → Verify: Migration 015 rodada via backend
- [x] Task 2: Criar página/rota para Cidadão logado abrir e acompanhar Manifestos (painel "Minhas Solicitações") → Verify: Tela renderiza lista vazia e botão "Novo"
- [x] Task 3: Criar formulário de Nova Manifestação Pública (Assunto, Tipo: Reclamação/Denúncia/Pedido, Mensagem) vinculado ao perfil logado → Verify: Insert funciona no DB
- [x] Task 4: Criar Painel de Triagem Backoffice (para servidores da Câmara avaliarem chamados) → Verify: Tabela renderiza chamados de todos cidadãos ordenados por SLA
- [x] Task 5: Desenvolver sistema de Respostas/Mensagens (chat-like) dentro do Ticket entre Servidor e Cidadão → Verify: Ambos enxergam as mensagens inseridas
- [x] Task 6: Implementar Controle visual do SLA da LAI (20 dias prorrogáveis por +10) → Verify: Badge alerta (Verde/Amarelo/Vermelho) aparece na lista do servidor

## Done When
- [x] Cidadão consegue logar, criar abrir e-SIC/ouvidoria e acompanhar respostas.
- [x] Servidor no `/backoffice` consegue responder ao cidadão com o status e controlar prazo de 20 dias da LAI.
