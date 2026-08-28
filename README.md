# Ava Assistant

PROMPT MESTRE — RECEPCIONISTA IA MULTIEMPRESA

Crie um Micro-SaaS completo, profissional, moderno, responsivo e pronto para produção chamado provisoriamente RecepIA, uma recepcionista virtual com Inteligência Artificial destinada inicialmente a CLÍNICAS, CONSULTÓRIOS, BARBEARIAS e ÓTICAS.

O objetivo principal do sistema é permitir que pequenos negócios tenham uma recepcionista virtual disponível 24 horas por dia para responder perguntas dos clientes, apresentar informações da empresa, consultar disponibilidade, realizar agendamentos, remarcar horários, cancelar agendamentos e encaminhar atendimentos para uma pessoa quando necessário.

O sistema deve ser construído como uma plataforma SaaS multi-tenant. Cada empresa cadastrada deve possuir seu próprio ambiente, dados, profissionais, serviços, horários, clientes, configurações, conversas e agendamentos completamente isolados de outras empresas.

IMPORTANTE: não criar apenas uma interface visual. Desenvolver a estrutura funcional completa do produto, incluindo banco de dados, autenticação, permissões, lógica de agenda, estrutura preparada para integração com IA e WhatsApp, dashboard, onboarding e configurações.

==================================================

POSICIONAMENTO DO PRODUTO
==================================================

Nome provisório: RecepIA

Slogan:

"Sua recepcionista inteligente trabalhando 24 horas por dia."

Proposta:

A RecepIA atende automaticamente os clientes da empresa, responde dúvidas e transforma conversas em agendamentos.

O sistema deve ser apresentado como uma ferramenta de atendimento e agendamento com IA, e não simplesmente como um chatbot.

Principais benefícios:

Atendimento 24 horas;

Respostas automáticas;

Agendamento automático;

Redução de mensagens sem resposta;

Redução de trabalho manual da recepção;

Recuperação de oportunidades;

Organização dos clientes;

Centralização das conversas;

Histórico de atendimento;

Integração futura com WhatsApp.

==================================================
2. SEGMENTOS

Durante o cadastro, permitir que a empresa escolha seu segmento:

Clínica

Consultório

Barbearia

Ótica

Outro

A escolha do segmento deve personalizar automaticamente alguns textos, serviços sugeridos e configurações do sistema.

Exemplo:

Barbearia:

Corte;

Barba;

Corte + barba;

Sobrancelha;

Platinado.

Clínica:

Consulta;

Retorno;

Avaliação;

Procedimentos.

Ótica:

Avaliação;

Ajuste de armação;

Atendimento;

Retirada de pedido.

Consultório:

Consulta;

Retorno;

Avaliação.

Não assumir serviços médicos específicos automaticamente. O proprietário deve cadastrar seus próprios serviços.

==================================================
3. ESTRUTURA DO SAAS

Criar:

Landing Page
Login
Cadastro
Recuperação de senha
Onboarding
Dashboard
Agenda
Clientes
Serviços
Profissionais
Conversas
Configuração da IA
Configuração da empresa
Horários de funcionamento
Relatórios
Assinatura
Configurações
Central de ajuda

Criar também uma área administrativa separada para o proprietário da plataforma SaaS.

==================================================
4. LANDING PAGE

Criar uma landing page extremamente profissional.

Hero:

"Sua recepcionista inteligente. 24 horas por dia."

Subheadline:

"A IA atende seus clientes, responde dúvidas, encontra horários disponíveis e realiza agendamentos automaticamente."

CTA principal:

"Começar gratuitamente"

CTA secundário:

"Ver como funciona"

Criar seção demonstrando uma conversa:

Cliente:
"Oi, vocês atendem sábado?"

IA:
"Olá! Sim 😊 Nosso atendimento aos sábados funciona das 08:00 às 13:00. Gostaria de verificar os horários disponíveis?"

Cliente:
"Sim."

IA:
"Tenho estes horários disponíveis:
09:00
10:30
11:30

Qual prefere?"

Cliente:
"10:30."

IA:
"Perfeito! Para confirmar seu agendamento, preciso do seu nome e telefone."

Criar seções:

Como funciona;

Recursos;

Segmentos;

Benefícios;

Demonstração;

Perguntas frequentes;

Planos;

CTA final.

==================================================
5. PLANOS

Criar estrutura preparada para assinatura recorrente.

Plano Básico:
R$ 79,90/mês

Plano Profissional:
R$ 129,90/mês

Plano Premium:
R$ 199,90/mês

Não implementar cobrança falsa. Criar estrutura preparada para integração com gateway de pagamento posteriormente.

Cada plano deve possuir limites configuráveis pelo administrador:

Quantidade de profissionais;

Quantidade de agendamentos;

Quantidade de conversas;

Quantidade de mensagens;

Uso de IA;

Integrações;

Recursos disponíveis.

O administrador poderá alterar os limites dos planos.

==================================================
6. AUTENTICAÇÃO

Implementar autenticação segura.

Cadastro:

Nome
Nome da empresa
E-mail
Telefone
Senha
Segmento

Login:

E-mail
Senha

Recuperação de senha.

Após o cadastro, direcionar automaticamente para o onboarding.

==================================================
7. ONBOARDING

Criar onboarding em etapas.

ETAPA 1:

"Vamos configurar sua empresa."

Nome da empresa
Logo
Telefone
Endereço
Cidade
Estado
Descrição

ETAPA 2:

"Qual é o seu segmento?"

Clínica
Consultório
Barbearia
Ótica
Outro

ETAPA 3:

"Cadastre seus serviços."

Nome
Descrição
Duração
Preço
Profissional responsável

ETAPA 4:

"Configure seu horário."

Segunda
Terça
Quarta
Quinta
Sexta
Sábado
Domingo

Permitir configurar:

Aberto/fechado
Hora inicial
Hora final
Intervalo

ETAPA 5:

"Configure sua recepcionista IA."

Nome da IA

Exemplo:

"Júlia"

Tom:

Profissional
Amigável
Elegante
Casual

Mensagem inicial.

ETAPA 6:

"Pronto!"

Mostrar resumo da configuração.

CTA:

"Conhecer meu painel"

==================================================
8. DASHBOARD

Dashboard extremamente simples.

Mostrar:

Agendamentos de hoje
Novos clientes
Conversas hoje
Taxa de agendamento
Horários disponíveis
Horários ocupados
Atendimentos realizados
Cancelamentos

Criar gráfico de agendamentos.

Criar seção:

"Atividade recente"

Exemplo:

Maria agendou uma consulta.
João cancelou um horário.
Carlos iniciou uma conversa.
Ana foi cadastrada.

Criar card:

"IA trabalhando"

Conversas atendidas hoje:
47

Agendamentos realizados pela IA:
13

==================================================
9. AGENDA

Criar agenda profissional.

Visualizações:

Dia
Semana
Mês

Cada agendamento deve apresentar:

Cliente
Serviço
Profissional
Horário
Status

Status:

Agendado
Confirmado
Concluído
Cancelado
Não compareceu

Permitir:

Criar agendamento manualmente
Editar
Cancelar
Reagendar
Alterar profissional
Alterar serviço

Impedir automaticamente conflitos de horários.

A IA deve consultar a mesma agenda utilizada pelo painel.

==================================================
10. CLIENTES

Criar CRM simples.

Campos:

Nome
Telefone
E-mail
Data de nascimento opcional
Observações
Data do primeiro contato
Último atendimento
Quantidade de agendamentos
Status

Status:

Novo
Ativo
Inativo

Página individual do cliente:

Dados
Histórico
Agendamentos
Conversas
Observações

==================================================
11. PROFISSIONAIS

Permitir cadastrar profissionais.

Campos:

Nome
Foto
Especialidade/cargo
Serviços
Horários
Status

Cada profissional pode possuir horários próprios.

A agenda deve considerar:

horário da empresa
horário do profissional
duração do serviço
agendamentos existentes
intervalos

==================================================
12. SERVIÇOS

Cadastrar:

Nome
Descrição
Preço
Duração
Profissional responsável
Status

Exemplo:

Corte masculino
R$ 40
30 minutos

Consulta
R$ 150
60 minutos

A IA deverá utilizar essas informações ao responder perguntas.

==================================================
13. CENTRAL DE CONVERSAS

Criar uma caixa de entrada semelhante a um aplicativo de mensagens.

Coluna esquerda:

Lista de conversas.

Centro:

Conversa.

Direita:

Informações do cliente.

Mostrar:

Nome
Telefone
Último agendamento
Status
Observações

Permitir atendimento humano.

Botão:

"Assumir conversa"

Quando um funcionário assumir, a IA deve parar de responder aquela conversa até que seja devolvida para a IA.

Botão:

"Devolver para IA"

==================================================
14. INTELIGÊNCIA ARTIFICIAL

Criar uma camada de IA preparada para integração com um provedor de LLM.

NÃO colocar API KEY diretamente no frontend.

Utilizar backend/server-side functions para chamadas da IA.

A IA deverá receber como contexto:

Nome da empresa
Segmento
Descrição
Horários de funcionamento
Serviços
Preços
Profissionais
Disponibilidade
Políticas
Perguntas frequentes

A IA nunca deve inventar informações.

Se não souber:

"Não tenho essa informação no momento. Posso encaminhar você para nossa equipe."

==================================================
15. PERSONALIDADE DA IA

A empresa poderá configurar:

Nome da recepcionista
Tom
Mensagem inicial
Regras específicas

Exemplo:

"Você é Júlia, recepcionista virtual da Clínica X.

Seu objetivo é atender clientes de maneira educada, clara e objetiva.

Você pode:

responder dúvidas com base nas informações fornecidas;

apresentar serviços;

consultar horários;

realizar agendamentos;

cancelar;

reagendar;

coletar dados.

Nunca invente informações.

Nunca forneça diagnóstico médico.

Nunca substitua profissionais de saúde.

Quando uma situação exigir intervenção humana, encaminhe para a equipe."

Criar esse prompt dinamicamente com os dados da empresa.

==================================================
16. FLUXO DE AGENDAMENTO DA IA

Quando o cliente disser:

"Quero marcar."

A IA deve identificar:

Serviço

Profissional, caso necessário

Data

Horário

Se faltar informação, perguntar.

Exemplo:

"Claro! Qual serviço você gostaria de agendar?"

Depois consultar disponibilidade real.

Nunca oferecer horário já ocupado.

Mostrar no máximo 3 a 5 horários disponíveis.

Após o cliente escolher:

"Perfeito! Tenho seu horário para terça-feira às 15:30. Posso confirmar?"

Somente depois da confirmação criar o agendamento.

==================================================
17. CANCELAMENTO

Permitir:

"Quero cancelar minha consulta."

A IA deve localizar o agendamento do cliente.

Mostrar:

"Encontrei seu agendamento para quarta-feira às 14:00. Deseja realmente cancelar?"

Após confirmação:

Cancelar.

==================================================
18. REAGENDAMENTO

Permitir:

"Quero mudar meu horário."

A IA identifica o agendamento.

Pergunta nova data.

Consulta disponibilidade.

Apresenta horários.

Confirma.

Atualiza o agendamento.

==================================================
19. FAQ DA EMPRESA

Criar uma área:

"Conhecimento da IA"

Permitir cadastrar perguntas e respostas.

Exemplo:

Pergunta:
"Vocês aceitam cartão?"

Resposta:
"Sim, aceitamos cartão de crédito e débito."

A IA deverá utilizar essa base.

Permitir:

Adicionar
Editar
Excluir
Pesquisar

==================================================
20. TRANSFERÊNCIA PARA HUMANO

Criar gatilhos:

"Quero falar com alguém."

"Quero falar com uma pessoa."

"Preciso de atendimento humano."

Quando acionado:

"Claro! Vou encaminhar você para nossa equipe."

No painel, gerar notificação.

==================================================
21. WHATSAPP

Criar arquitetura preparada para integração com WhatsApp Business Platform/API oficial.

NÃO utilizar métodos não oficiais.

Criar página:

"Conectar WhatsApp"

Mostrar:

Status:
Desconectado

Botão:

"Conectar WhatsApp"

Estruturar backend para receber:

Mensagens recebidas
Mensagens enviadas
Status de entrega
Identificação do contato

A lógica da IA deverá funcionar independentemente do canal.

Isso significa:

Site Chat → IA
WhatsApp → IA
Futuras integrações → mesma IA

==================================================
22. CHAT NO SITE

Criar widget de chat que a empresa possa instalar no próprio site.

Botão:

"Copiar código"

Gerar código de instalação.

O widget deve mostrar:

Logo
Nome da empresa
Mensagem inicial
Campo de mensagem

O visitante conversa com a IA.

O chat deve estar vinculado ao tenant correto.

==================================================
23. NOTIFICAÇÕES

Criar notificações para:

Novo agendamento
Cancelamento
Reagendamento
Novo cliente
Solicitação de atendimento humano

Criar central de notificações.

==================================================
24. RELATÓRIOS

Criar:

Agendamentos por período
Cancelamentos
Comparecimentos
Novos clientes
Clientes recorrentes
Conversas
Agendamentos realizados pela IA

Mostrar gráficos simples.

Filtros:

Hoje
7 dias
30 dias
90 dias
Personalizado

==================================================
25. CONFIGURAÇÕES

Criar:

Empresa
Perfil
Usuários
Equipe
Horários
Serviços
IA
FAQ
Notificações
Integrações
Assinatura

==================================================
26. USUÁRIOS E PERMISSÕES

Criar níveis:

Owner
Administrador
Funcionário
Recepcionista

Owner:
acesso completo.

Administrador:
acesso administrativo.

Funcionário:
agenda, clientes e conversas.

Recepcionista:
agenda e conversas.

Implementar Row Level Security para garantir isolamento dos dados entre empresas.

==================================================
27. BANCO DE DADOS

Criar estrutura relacional.

Tabelas sugeridas:

users
organizations
organization_members
professionals
services
business_hours
professional_hours
clients
appointments
conversations
messages
ai_settings
faqs
notifications
subscriptions
plans
integrations
audit_logs

Todas as tabelas relacionadas à empresa devem possuir organization_id.

Implementar relacionamentos corretamente.

==================================================
28. SEGURANÇA

Priorizar segurança.

Nunca expor:

API Keys
Tokens
Credenciais
Secrets

No frontend.

Utilizar variáveis de ambiente e funções server-side.

Implementar:

Autenticação
Autorização
RLS
Validação de dados
Rate limiting quando necessário
Logs
Proteção contra acesso entre tenants

==================================================
29. PRIVACIDADE

Como o sistema poderá ser utilizado por clínicas e consultórios, estruturar o produto considerando proteção de dados.

Não permitir que a IA exponha informações de um cliente para outro.

Não permitir que clientes consultem dados internos.

Evitar armazenar informações sensíveis desnecessárias.

Criar área para:

Política de Privacidade
Termos de Uso

A arquitetura deve ser preparada para conformidade com a LGPD.

==================================================
30. PAINEL ADMINISTRADOR DO SAAS

Criar /admin separado.

Mostrar:

Empresas cadastradas
Usuários
Assinaturas
Receita recorrente
Planos
Conversas
Uso de IA
Agendamentos
Empresas ativas
Empresas canceladas

Permitir:

Criar planos
Editar preços
Editar limites
Bloquear empresa
Desbloquear empresa
Visualizar empresa
Visualizar métricas

==================================================
31. DESIGN

Criar design SaaS premium.

Interface:

Minimalista
Moderna
Profissional
Responsiva
Rápida
Intuitiva

Utilizar:

Cards
Tabelas
Gráficos
Badges
Modais
Menus laterais

Desktop:
Sidebar fixa.

Mobile:
Menu inferior ou menu lateral adaptado.

Evitar excesso de elementos.

O usuário deve conseguir entender o sistema rapidamente.

==================================================
32. CORES

Utilizar uma identidade moderna baseada em:

Fundo claro
Branco
Cinza suave
Cor principal azul/roxo

Criar opção futura de personalização.

==================================================
33. EXPERIÊNCIA DO USUÁRIO

O sistema deve ser extremamente simples para uma pessoa que não entende de tecnologia.

Evitar termos técnicos.

Por exemplo:

Não usar:

"Configurar webhook"

Usar:

"Conectar WhatsApp"

Não usar:

"Configurar LLM"

Usar:

"Configurar sua recepcionista IA"

==================================================
34. EMPTY STATES

Criar estados vazios profissionais.

Exemplo:

"Você ainda não possui agendamentos."

CTA:

"Novo agendamento"

Clientes:

"Você ainda não possui clientes."

CTA:

"Cadastrar cliente"

==================================================
35. DADOS DEMONSTRATIVOS

Durante desenvolvimento, utilizar dados mockados somente quando necessário para visualizar a interface.

Separar claramente dados de demonstração de dados reais.

Nunca misturar dados mockados com produção.

==================================================
36. ARQUITETURA

Construir de maneira modular.

Separar:

Frontend
Backend
Banco de dados
Autenticação
IA
Integrações
Pagamentos

A lógica da IA não deve ficar espalhada pela interface.

Criar uma camada central de processamento.

Fluxo:

Mensagem
↓
Identificação da empresa
↓
Identificação do cliente
↓
Contexto da empresa
↓
Contexto da conversa
↓
Consulta de dados
↓
IA
↓
Validação
↓
Resposta
↓
Ação, se necessário

==================================================
37. AÇÕES DA IA

A IA deve ser capaz de solicitar ações estruturadas:

check_availability
create_appointment
cancel_appointment
reschedule_appointment
get_services
get_professionals
get_business_hours
get_client
create_client
transfer_to_human

Não permitir que o modelo execute diretamente operações perigosas sem validação.

Todas as ações devem passar pelo backend.

==================================================
38. REGRA FUNDAMENTAL

A IA NÃO pode:

Inventar horários.
Inventar preços.
Inventar serviços.
Inventar profissionais.
Confirmar agendamento sem disponibilidade.
Cancelar sem confirmação.
Expor dados de clientes.
Fornecer diagnóstico médico.
Dar orientação médica como se fosse profissional.
Inventar informações que não estejam no banco ou na base de conhecimento.

==================================================
39. MÉTRICAS PRINCIPAIS

Criar no dashboard:

Atendimentos da IA
Agendamentos automáticos
Taxa de conversão
Tempo médio de atendimento
Clientes novos
Cancelamentos
Atendimentos humanos

Criar indicador:

"Agendamentos gerados pela IA"

==================================================
40. PREPARAÇÃO PARA ESCALA

O sistema deve ser preparado para futuramente suportar:

WhatsApp
Instagram
Messenger
Telegram
Google Calendar
Google Agenda
Stripe/Mercado Pago
E-mail
SMS

Não implementar integrações fictícias.

Criar interfaces e arquitetura para que essas integrações possam ser adicionadas posteriormente.

==================================================
41. MVP

Priorizar primeiro:

Cadastro

Login

Empresa

Onboarding

Serviços

Profissionais

Horários

Clientes

Agenda

Chat

IA

FAQ

Dashboard

Depois:

WhatsApp

Pagamentos

Relatórios avançados

Automação

Integrações

Não sacrificar estabilidade tentando implementar tudo simultaneamente.

==================================================
42. RESULTADO FINAL

Ao finalizar, o sistema deve parecer um produto SaaS comercial real.

Não criar apenas uma landing page.

Não criar apenas telas estáticas.

Criar:

Aplicação funcional;

Banco de dados;

Autenticação;

Multi-tenancy;

Agenda funcional;

CRM;

Chat;

Configuração da IA;

Estrutura de ações da IA;

Dashboard;

Administração;

Assinaturas preparadas;

Segurança;

Responsividade.

Sempre priorizar simplicidade, velocidade e experiência do usuário.

O produto final deve permitir que uma pequena empresa consiga se cadastrar, configurar seus serviços e horários e, posteriormente, conectar seu canal de atendimento para utilizar uma recepcionista virtual capaz de atender clientes e transformar conversas em agendamentos.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2f70a611-e080-488c-bc69-e36e69643374).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
