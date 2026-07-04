-- ============================================================
-- NEXORA — Seed: Biblioteca de Templates
-- Executar no SQL Editor do Supabase (roda como service_role)
-- ============================================================

do $$
declare
  -- Template IDs
  t_nr12   uuid;
  t_nr35   uuid;
  t_5s     uuid;
  t_iso9   uuid;
  t_17025  uuid;
  t_emp    uuid;

  -- Section IDs
  s uuid;
begin

-- ============================================================
-- TEMPLATE 1: NR-12 — Segurança em Máquinas e Equipamentos
-- ============================================================
insert into public.templates (title, category, norm_ref, version, status, is_library)
values ('NR-12 — Segurança em Máquinas e Equipamentos', 'seguranca', 'NR-12', 1, 'published', true)
returning id into t_nr12;

-- Seção 1
insert into public.template_sections (template_id, title, order_index) values (t_nr12, 'Proteções e Guardas', 0) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, requires_action_on_nc, order_index) values
  (s, 'As proteções fixas e móveis estão instaladas em todos os pontos de perigo identificados na análise de risco?', 'conforme_nc_na', 9, 'NR-12.38', true, 0),
  (s, 'As proteções são resistentes à trepidação, impactos e esforços mecânicos previstos na operação?', 'conforme_nc_na', 7, 'NR-12.41', true, 1),
  (s, 'As proteções móveis possuem intertravamento que impede a operação da máquina com a guarda aberta?', 'conforme_nc_na', 9, 'NR-12.43', true, 2),
  (s, 'Existe distância de segurança adequada entre a proteção e a zona de perigo conforme NR-12 Anexo I?', 'conforme_nc_na', 8, 'NR-12 Anexo I', true, 3),
  (s, 'As proteções não criam riscos adicionais, pontos de aprisionamento ou dificultam a operação segura?', 'conforme_nc_na', 6, 'NR-12.40', false, 4),
  (s, 'As zonas de perigo inacessíveis durante a operação normal estão devidamente segregadas fisicamente?', 'conforme_nc_na', 7, 'NR-12.38', true, 5);

-- Seção 2
insert into public.template_sections (template_id, title, order_index) values (t_nr12, 'Dispositivos de Segurança', 1) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, requires_photo_on_nc, requires_action_on_nc, order_index) values
  (s, 'A máquina possui dispositivo de parada de emergência (botão cogumelo) de fácil acesso pelo operador?', 'conforme_nc_na', 10, 'NR-12.56', true, true, 0),
  (s, 'O dispositivo de parada de emergência mantém-se atuado até ser intencionalmente resetado pelo operador?', 'conforme_nc_na', 9, 'NR-12.56', false, true, 1),
  (s, 'O dispositivo de parada de emergência funciona corretamente ao ser acionado (teste executado)?', 'conforme_nc_na', 10, 'NR-12.56', false, true, 2),
  (s, 'Existem sistemas de detecção de presença (barreiras de luz, tapetes de segurança) onde aplicável?', 'conforme_nc_na', 8, 'NR-12.46', true, true, 3),
  (s, 'A categoria de segurança do sistema de controle está documentada e comprovada por profissional habilitado?', 'conforme_nc_na', 7, 'NR-12.10', false, true, 4),
  (s, 'Após uma parada de emergência, a máquina não reinicia automaticamente sem ação deliberada do operador?', 'conforme_nc_na', 9, 'NR-12.60', false, true, 5);

-- Seção 3
insert into public.template_sections (template_id, title, order_index) values (t_nr12, 'Sinalização e Advertências', 2) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, order_index) values
  (s, 'A máquina possui placa de identificação com fabricante, modelo, número de série e ano de fabricação?', 'conforme_nc_na', 5, 'NR-12.3', 0),
  (s, 'Sinais de advertência de riscos são visíveis, legíveis e com pictogramas conforme ABNT NBR 7195?', 'conforme_nc_na', 7, 'NR-12.15', 1),
  (s, 'As zonas de perigo estão demarcadas no piso com faixa de segurança (amarelo ou amarelo/preto)?', 'conforme_nc_na', 6, 'NR-12.15', 2),
  (s, 'Existe sinalização indicando os EPIs obrigatórios para operação da máquina?', 'conforme_nc_na', 6, 'NR-12.15', 3),
  (s, 'Há sinalização de advertência nas zonas de risco elétrico ("Risco de Choque Elétrico")?', 'conforme_nc_na', 7, 'NR-10.6.1', 4);

-- Seção 4
insert into public.template_sections (template_id, title, order_index) values (t_nr12, 'Documentação e Treinamento', 3) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, requires_action_on_nc, order_index) values
  (s, 'Existe Apreciação de Risco (AR) documentada para a máquina, elaborada por profissional habilitado?', 'conforme_nc_na', 8, 'NR-12.8', true, 0),
  (s, 'O manual de operação e segurança em PT-BR está disponível e acessível no posto de trabalho?', 'conforme_nc_na', 7, 'NR-12.115', true, 1),
  (s, 'Os operadores possuem capacitação específica e documentada para operar esta máquina?', 'conforme_nc_na', 9, 'NR-12.112', true, 2),
  (s, 'Existe programa de manutenção preventiva com registros de datas, técnico responsável e atividades?', 'conforme_nc_na', 8, 'NR-12.117', true, 3),
  (s, 'A Ordem de Serviço (OS) para operação da máquina está assinada pelo operador?', 'conforme_nc_na', 5, 'NR-01.7.3', true, 4),
  (s, 'O inventário de máquinas e equipamentos da unidade está atualizado?', 'conforme_nc_na', 4, 'NR-12.7', false, 5);


-- ============================================================
-- TEMPLATE 2: NR-35 — Trabalho em Altura
-- ============================================================
insert into public.templates (title, category, norm_ref, version, status, is_library)
values ('NR-35 — Trabalho em Altura', 'seguranca', 'NR-35', 1, 'published', true)
returning id into t_nr35;

-- Seção 1
insert into public.template_sections (template_id, title, order_index) values (t_nr35, 'Planejamento e Autorização', 0) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, requires_action_on_nc, order_index) values
  (s, 'Existe Permissão de Trabalho em Altura (PTA) emitida, autorizada por responsável e em vigor?', 'conforme_nc_na', 10, 'NR-35.5.1', true, 0),
  (s, 'O planejamento inclui Análise de Risco específica para a atividade em altura a ser executada?', 'conforme_nc_na', 9, 'NR-35.5.2', true, 1),
  (s, 'As condições meteorológicas (vento, chuva, raios) foram avaliadas e são adequadas para o trabalho?', 'conforme_nc_na', 8, 'NR-35.5.3', true, 2),
  (s, 'Existe Plano de Emergência e Resgate específico e testado para o trabalho em altura?', 'conforme_nc_na', 9, 'NR-35.5.8', true, 3),
  (s, 'Todas as medidas de controle definidas na Análise de Risco foram implementadas antes do início?', 'conforme_nc_na', 9, 'NR-35.5.2', true, 4);

-- Seção 2
insert into public.template_sections (template_id, title, order_index) values (t_nr35, 'Proteção Coletiva', 1) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, requires_photo_on_nc, requires_action_on_nc, order_index) values
  (s, 'Existe guarda-corpo instalado nas bordas abertas e aberturas no piso acima de 2,0 m?', 'conforme_nc_na', 9, 'NR-18.16', true, true, 0),
  (s, 'As redes de proteção estão instaladas, corretamente tensionadas e sem rasgos ou aberturas?', 'conforme_nc_na', 8, 'NR-18.16.10', true, true, 1),
  (s, 'Os pontos de ancoragem estão identificados, inspecionados e com capacidade documentada (mín. 15 kN)?', 'conforme_nc_na', 10, 'NR-35.4.4', true, true, 2),
  (s, 'A área abaixo do trabalho em altura está isolada e sinalizada para prevenir circulação de pessoas?', 'conforme_nc_na', 8, 'NR-35.5.6', true, true, 3);

-- Seção 3
insert into public.template_sections (template_id, title, order_index) values (t_nr35, 'Equipamentos de Proteção Individual', 2) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, requires_photo_on_nc, order_index) values
  (s, 'Os trabalhadores utilizam cinto de segurança tipo paraquedista (tipo III) em toda a atividade?', 'conforme_nc_na', 10, 'NR-35.3.1', true, 0),
  (s, 'O talabarte e/ou dispositivo trava-quedas estão em bom estado de conservação e com CA válido?', 'conforme_nc_na', 10, 'NR-35.3.1', true, 1),
  (s, 'O capacete de segurança com jugular (classe A tipo II) está sendo utilizado por todos?', 'conforme_nc_na', 8, 'NR-35.3.1', true, 2),
  (s, 'Todos os EPIs utilizados possuem Certificado de Aprovação (CA) do Ministério do Trabalho válido?', 'conforme_nc_na', 9, 'NR-06.6.1', true, 3),
  (s, 'Os trabalhadores demonstram habilidade no uso correto e conexão dos EPIs de proteção contra queda?', 'conforme_nc_na', 8, 'NR-35.3.2', true, 4),
  (s, 'O ponto de ancoragem do talabarte é sempre acima da cintura do trabalhador (fator de queda ≤ 1)?', 'conforme_nc_na', 9, 'NR-35.4.4', true, 5);

-- Seção 4
insert into public.template_sections (template_id, title, order_index) values (t_nr35, 'Capacitação e Emergência', 3) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, requires_action_on_nc, order_index) values
  (s, 'Todos os trabalhadores possuem treinamento específico NR-35 com validade de 2 anos?', 'conforme_nc_na', 9, 'NR-35.3.2', true, 0),
  (s, 'O treinamento inclui técnicas de primeiros socorros e procedimentos de resgate em altura?', 'conforme_nc_na', 7, 'NR-35.3.2', true, 1),
  (s, 'A capacitação foi ministrada por profissional legalmente habilitado (médico do trabalho ou técnico)?', 'conforme_nc_na', 6, 'NR-35.3.3', true, 2),
  (s, 'Existe comunicação eficaz (rádio ou celular) entre a equipe em altura e a supervisão em terra?', 'conforme_nc_na', 7, 'NR-35.5.7', true, 3),
  (s, 'Os números de emergência (SAMU: 192, Bombeiros: 193) estão afixados na área de trabalho?', 'conforme_nc_na', 5, 'NR-35.5.8', false, 4);


-- ============================================================
-- TEMPLATE 3: Auditoria 5S
-- ============================================================
insert into public.templates (title, category, norm_ref, version, status, is_library)
values ('Auditoria 5S — Programa de Organização', 'operacional', '5S', 1, 'published', true)
returning id into t_5s;

-- Seiri
insert into public.template_sections (template_id, title, order_index) values (t_5s, 'Seiri — Utilização', 0) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, help_text, order_index) values
  (s, 'Existem apenas materiais, ferramentas e equipamentos necessários no local de trabalho?', 'escala', 5, 'Avaliar se há itens desnecessários, obsoletos ou quebrados no setor.', 0),
  (s, 'Itens sem uso frequente estão devidamente identificados e armazenados em local adequado?', 'escala', 4, 'Verificar se há itens raramente usados ocupando espaço prime.', 1),
  (s, 'Não há materiais vencidos, danificados ou sem identificação no setor?', 'escala', 5, 'Inspecionar estoques, gavetas e armários.', 2),
  (s, 'O setor possui critério documentado para definir o que é necessário e o que deve ser descartado?', 'escala', 3, 'Verificar existência de procedimento de classificação de itens.', 3);

-- Seiton
insert into public.template_sections (template_id, title, order_index) values (t_5s, 'Seiton — Organização', 1) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, help_text, order_index) values
  (s, 'Cada item possui local definido, identificado e de fácil acesso?', 'escala', 5, 'Verificar se há etiquetas ou demarcações indicando o local de cada item.', 0),
  (s, 'Ferramentas e equipamentos de uso frequente estão dispostos de forma ergonômica e acessível?', 'escala', 4, 'Itens mais usados devem estar mais próximos do operador.', 1),
  (s, 'A demarcação do piso (corredores, áreas de trabalho, saídas) está visível e conservada?', 'escala', 5, 'Verificar faixas amarelas, áreas de estoque e saídas de emergência.', 2),
  (s, 'Os documentos e registros do setor estão organizados e com acesso rápido quando necessário?', 'escala', 3, 'Verificar arquivos físicos, pasta de procedimentos e registros de qualidade.', 3);

-- Seiso
insert into public.template_sections (template_id, title, order_index) values (t_5s, 'Seiso — Limpeza', 2) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, help_text, order_index) values
  (s, 'Pisos, paredes e tetos estão limpos e sem sujeira acumulada, manchas ou resíduos?', 'escala', 5, 'Incluir cantos, embaixo de equipamentos e áreas de difícil acesso.', 0),
  (s, 'Máquinas e equipamentos estão limpos, sem acúmulo de óleo, poeira ou resíduos de processo?', 'escala', 5, 'A limpeza revela vazamentos e problemas incipientes.', 1),
  (s, 'Existe rotina de limpeza documentada com frequência, responsável e registro de execução?', 'escala', 4, 'Verificar lista de verificação de limpeza ou plano de higiene.', 2),
  (s, 'Os materiais de limpeza estão disponíveis, organizados e em bom estado de uso?', 'escala', 3, 'Verificar panos, vassouras, rodos, detergentes etc.', 3);

-- Seiketsu
insert into public.template_sections (template_id, title, order_index) values (t_5s, 'Seiketsu — Padronização', 3) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, help_text, order_index) values
  (s, 'Existem padrões visuais (fotos, placas, etiquetas) que facilitam a manutenção dos 3S anteriores?', 'escala', 5, 'Verificar uso de gestão visual: etiquetas coloridas, fotos do padrão, limites marcados.', 0),
  (s, 'Os procedimentos do setor estão documentados, atualizados e acessíveis aos colaboradores?', 'escala', 4, 'Verificar POP, instruções de trabalho ou procedimentos operacionais.', 1),
  (s, 'Os equipamentos de segurança (extintores, EPIs, saídas) estão visivelmente sinalizados?', 'escala', 5, 'Verificar sinalização de acordo com NR-26 e normas ABNT.', 2),
  (s, 'O setor possui indicadores de desempenho visíveis (quadro de gestão à vista)?', 'escala', 3, 'Verificar metas, resultados e indicadores de qualidade/produção.', 3);

-- Shitsuke
insert into public.template_sections (template_id, title, order_index) values (t_5s, 'Shitsuke — Disciplina', 4) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, help_text, order_index) values
  (s, 'Os colaboradores demonstram comportamento alinhado aos padrões 5S sem necessidade de cobrança?', 'escala', 5, 'Observar hábitos espontâneos de organização e limpeza.', 0),
  (s, 'Auditorias 5S são realizadas com a frequência estipulada e os resultados são registrados?', 'escala', 4, 'Verificar frequência real versus programada e registros de auditoria.', 1),
  (s, 'As ações corretivas de auditorias anteriores foram executadas nos prazos definidos?', 'escala', 5, 'Verificar pendências do ciclo anterior.', 2),
  (s, 'A liderança do setor participa ativamente e dá exemplo nas práticas do programa 5S?', 'escala', 4, 'Engajamento da liderança é o principal fator de sustentação.', 3);


-- ============================================================
-- TEMPLATE 4: ISO 9001:2015 — Seções §7 e §8
-- ============================================================
insert into public.templates (title, category, norm_ref, version, status, is_library)
values ('ISO 9001:2015 — Seções §7 e §8', 'qualidade', 'ISO 9001:2015', 1, 'published', true)
returning id into t_iso9;

-- §7.1 Recursos
insert into public.template_sections (template_id, title, order_index) values (t_iso9, '§7.1 Recursos', 0) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, order_index) values
  (s, 'A organização determina e provê os recursos necessários para estabelecer e manter o SGQ?', 'conforme_nc_na', 7, 'ISO 9001:2015 §7.1.1', 0),
  (s, 'As pessoas necessárias para a operação e controle do SGQ estão identificadas e disponíveis?', 'conforme_nc_na', 7, 'ISO 9001:2015 §7.1.2', 1),
  (s, 'A infraestrutura (edifícios, equipamentos, TI) necessária para a conformidade do produto está mantida?', 'conforme_nc_na', 7, 'ISO 9001:2015 §7.1.3', 2),
  (s, 'O ambiente de trabalho (físico, social, psicológico) é gerenciado para garantir a conformidade?', 'conforme_nc_na', 5, 'ISO 9001:2015 §7.1.4', 3),
  (s, 'Os recursos de monitoramento e medição são adequados, identificados e rastreáveis?', 'conforme_nc_na', 8, 'ISO 9001:2015 §7.1.5', 4),
  (s, 'Existe processo para determinar e gerenciar o conhecimento organizacional necessário ao SGQ?', 'conforme_nc_na', 6, 'ISO 9001:2015 §7.1.6', 5);

-- §7.2-7.4 Competência e Comunicação
insert into public.template_sections (template_id, title, order_index) values (t_iso9, '§7.2–§7.4 Competência e Comunicação', 1) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, order_index) values
  (s, 'As competências necessárias para funções que afetam o SGQ estão determinadas e documentadas?', 'conforme_nc_na', 8, 'ISO 9001:2015 §7.2', 0),
  (s, 'Os colaboradores possuem educação, treinamento e experiência adequados às suas funções?', 'conforme_nc_na', 8, 'ISO 9001:2015 §7.2', 1),
  (s, 'Existe registro de treinamentos realizados com evidências de eficácia (avaliações)?', 'conforme_nc_na', 7, 'ISO 9001:2015 §7.2', 2),
  (s, 'Os colaboradores estão conscientes da política da qualidade e como contribuem para o SGQ?', 'conforme_nc_na', 6, 'ISO 9001:2015 §7.3', 3),
  (s, 'As comunicações internas e externas relevantes ao SGQ estão definidas (o quê, quando, com quem)?', 'conforme_nc_na', 6, 'ISO 9001:2015 §7.4', 4),
  (s, 'Existe canal estabelecido para comunicação com clientes sobre dúvidas e reclamações?', 'conforme_nc_na', 7, 'ISO 9001:2015 §7.4', 5);

-- §7.5 Informação Documentada
insert into public.template_sections (template_id, title, order_index) values (t_iso9, '§7.5 Informação Documentada', 2) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, order_index) values
  (s, 'Os documentos obrigatórios pela ISO 9001:2015 estão criados, controlados e disponíveis?', 'conforme_nc_na', 8, 'ISO 9001:2015 §7.5.1', 0),
  (s, 'Existe controle de revisões, aprovações e versões para documentos do SGQ?', 'conforme_nc_na', 8, 'ISO 9001:2015 §7.5.2', 1),
  (s, 'Os registros de qualidade são legíveis, identificados, armazenados e protegidos adequadamente?', 'conforme_nc_na', 7, 'ISO 9001:2015 §7.5.3', 2),
  (s, 'Os prazos de retenção de registros estão definidos e sendo respeitados?', 'conforme_nc_na', 6, 'ISO 9001:2015 §7.5.3', 3),
  (s, 'Documentos externos (normas, requisitos de clientes) estão identificados e controlados?', 'conforme_nc_na', 6, 'ISO 9001:2015 §7.5.3', 4);

-- §8.1 Planejamento Operacional
insert into public.template_sections (template_id, title, order_index) values (t_iso9, '§8.1 Planejamento e Controle Operacional', 3) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, order_index) values
  (s, 'Os processos necessários para atender aos requisitos de produto/serviço estão planejados e implementados?', 'conforme_nc_na', 8, 'ISO 9001:2015 §8.1', 0),
  (s, 'Existem critérios para o controle dos processos e aceitação de produtos/serviços documentados?', 'conforme_nc_na', 8, 'ISO 9001:2015 §8.1', 1),
  (s, 'Os recursos necessários para conformidade do produto/serviço estão determinados e disponíveis?', 'conforme_nc_na', 7, 'ISO 9001:2015 §8.1', 2),
  (s, 'As saídas planejadas são atingidas por meio do controle implementado nos processos?', 'conforme_nc_na', 7, 'ISO 9001:2015 §8.1', 3),
  (s, 'As mudanças não planejadas são analisadas criticamente e controladas para minimizar efeitos adversos?', 'conforme_nc_na', 7, 'ISO 9001:2015 §8.1', 4);

-- §8.4 Controle de Fornecedores
insert into public.template_sections (template_id, title, order_index) values (t_iso9, '§8.4 Controle de Processos Externos', 4) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, order_index) values
  (s, 'Os fornecedores externos são avaliados, selecionados e monitorados com base em critérios definidos?', 'conforme_nc_na', 8, 'ISO 9001:2015 §8.4.1', 0),
  (s, 'Existe lista de fornecedores aprovados, atualizada e com resultado das avaliações?', 'conforme_nc_na', 7, 'ISO 9001:2015 §8.4.1', 1),
  (s, 'Os requisitos comunicados aos fornecedores (especificações, qualidade, prazo) são claros e adequados?', 'conforme_nc_na', 8, 'ISO 9001:2015 §8.4.3', 2),
  (s, 'Existe verificação de que os produtos/serviços de fornecedores atendem aos requisitos antes do uso?', 'conforme_nc_na', 8, 'ISO 9001:2015 §8.4.3', 3),
  (s, 'Os processos terceirizados que afetam a conformidade do produto estão controlados?', 'conforme_nc_na', 8, 'ISO 9001:2015 §8.4.1', 4);


-- ============================================================
-- TEMPLATE 5: ISO/IEC 17025:2017 — §6 Recursos
-- ============================================================
insert into public.templates (title, category, norm_ref, version, status, is_library)
values ('ISO/IEC 17025:2017 — §6 Recursos', 'laboratorio', 'ISO/IEC 17025:2017', 1, 'published', true)
returning id into t_17025;

-- §6.2 Pessoal
insert into public.template_sections (template_id, title, order_index) values (t_17025, '§6.2 Pessoal', 0) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, order_index) values
  (s, 'As competências do pessoal que afeta os resultados de ensaio/calibração estão documentadas?', 'conforme_nc_na', 8, 'ISO/IEC 17025:2017 §6.2.2', 0),
  (s, 'O pessoal que realiza atividades específicas é autorizado formalmente (credenciamento interno)?', 'conforme_nc_na', 9, 'ISO/IEC 17025:2017 §6.2.4', 1),
  (s, 'O treinamento do pessoal é supervisionado e há avaliação de eficácia documentada?', 'conforme_nc_na', 8, 'ISO/IEC 17025:2017 §6.2.3', 2),
  (s, 'Registros de treinamentos, qualificações e autorizações estão atualizados e conservados?', 'conforme_nc_na', 7, 'ISO/IEC 17025:2017 §6.2.5', 3),
  (s, 'Pessoal externo (estagiários, temporários) que afeta resultados é supervisionado adequadamente?', 'conforme_nc_na', 7, 'ISO/IEC 17025:2017 §6.2.3', 4),
  (s, 'O laboratório possui política de desenvolvimento e atualização de competências do pessoal?', 'conforme_nc_na', 5, 'ISO/IEC 17025:2017 §6.2.1', 5);

-- §6.3 Instalações
insert into public.template_sections (template_id, title, order_index) values (t_17025, '§6.3 Instalações e Condições Ambientais', 1) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, order_index) values
  (s, 'As condições ambientais (temperatura, umidade, pressão) são monitoradas e registradas?', 'conforme_nc_na', 9, 'ISO/IEC 17025:2017 §6.3.3', 0),
  (s, 'Os limites aceitáveis para as condições ambientais estão definidos para cada tipo de ensaio?', 'conforme_nc_na', 8, 'ISO/IEC 17025:2017 §6.3.2', 1),
  (s, 'O acesso às áreas de ensaio é controlado para evitar contaminação e resultados inválidos?', 'conforme_nc_na', 8, 'ISO/IEC 17025:2017 §6.3.5', 2),
  (s, 'Há separação efetiva entre áreas com atividades incompatíveis (ex: laboratório de micro vs. químico)?', 'conforme_nc_na', 8, 'ISO/IEC 17025:2017 §6.3.4', 3),
  (s, 'As instalações de suporte (elétrica, água purificada) são adequadas e mantidas?', 'conforme_nc_na', 6, 'ISO/IEC 17025:2017 §6.3.1', 4);

-- §6.4 Equipamentos
insert into public.template_sections (template_id, title, order_index) values (t_17025, '§6.4 Equipamentos', 2) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, requires_photo_on_nc, order_index) values
  (s, 'Todos os equipamentos usados em ensaios estão identificados com número único e etiqueta de calibração?', 'conforme_nc_na', 9, 'ISO/IEC 17025:2017 §6.4.4', true, 0),
  (s, 'Os equipamentos estão dentro do prazo de calibração/verificação válido?', 'conforme_nc_na', 10, 'ISO/IEC 17025:2017 §6.4.6', true, 1),
  (s, 'Os certificados de calibração estão disponíveis e indicam rastreabilidade ao SI?', 'conforme_nc_na', 9, 'ISO/IEC 17025:2017 §6.4.7', false, 2),
  (s, 'Equipamentos fora de serviço estão segregados fisicamente e sinalizados ("Fora de uso")?', 'conforme_nc_na', 8, 'ISO/IEC 17025:2017 §6.4.9', true, 3),
  (s, 'Existe programa de manutenção preventiva com registros para todos os equipamentos críticos?', 'conforme_nc_na', 7, 'ISO/IEC 17025:2017 §6.4.10', false, 4),
  (s, 'Os registros de equipamentos (fabricante, série, calibração, histórico) estão completos?', 'conforme_nc_na', 7, 'ISO/IEC 17025:2017 §6.4.13', false, 5),
  (s, 'Há avaliação do impacto em resultados anteriores quando um equipamento é encontrado fora de especificação?', 'conforme_nc_na', 8, 'ISO/IEC 17025:2017 §6.4.11', false, 6);

-- §6.5 Rastreabilidade
insert into public.template_sections (template_id, title, order_index) values (t_17025, '§6.5 Rastreabilidade de Medição', 3) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, order_index) values
  (s, 'As calibrações são realizadas por laboratórios acreditados (INMETRO/CGCRE) ou com rastreabilidade ao SI?', 'conforme_nc_na', 10, 'ISO/IEC 17025:2017 §6.5.2', 0),
  (s, 'Os padrões de referência internos são calibrados e rastreáveis a padrões nacionais/internacionais?', 'conforme_nc_na', 9, 'ISO/IEC 17025:2017 §6.5.3', 1),
  (s, 'Os padrões de referência são utilizados exclusivamente para calibração, não para ensaios rotineiros?', 'conforme_nc_na', 8, 'ISO/IEC 17025:2017 §6.5.3', 2),
  (s, 'Existe avaliação da incerteza de medição para todos os tipos de ensaio/calibração realizados?', 'conforme_nc_na', 9, 'ISO/IEC 17025:2017 §7.6', 3);

-- §6.6 Recursos Externos
insert into public.template_sections (template_id, title, order_index) values (t_17025, '§6.6 Recursos Externos', 4) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, order_index) values
  (s, 'Os fornecedores externos de produtos e serviços críticos são avaliados e aprovados formalmente?', 'conforme_nc_na', 7, 'ISO/IEC 17025:2017 §6.6.1', 0),
  (s, 'Reagentes, materiais de referência e consumíveis são verificados no recebimento?', 'conforme_nc_na', 8, 'ISO/IEC 17025:2017 §6.6.2', 1),
  (s, 'Os serviços de calibração externos são contratados de laboratórios com acreditação válida?', 'conforme_nc_na', 9, 'ISO/IEC 17025:2017 §6.6.1', 2);


-- ============================================================
-- TEMPLATE 6: Inspeção Diária de Empilhadeira
-- ============================================================
insert into public.templates (title, category, norm_ref, version, status, is_library)
values ('Inspeção Diária de Empilhadeira', 'operacional', 'NR-12 / ABNT NBR 15040', 1, 'published', true)
returning id into t_emp;

-- Seção 1: Pré-operação
insert into public.template_sections (template_id, title, order_index) values (t_emp, 'Inspeção Pré-operação', 0) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, help_text, requires_photo_on_nc, order_index) values
  (s, 'Nível de combustível/carga da bateria está adequado para o turno de operação?', 'conforme_nc_na', 6, 'Verificar indicador de nível ou manômetro. Bateria: carga mínima 80%.', false, 0),
  (s, 'O nível de óleo do motor está dentro da faixa correta (entre min e max)?', 'conforme_nc_na', 7, 'Verificar vareta de óleo com motor frio.', false, 1),
  (s, 'O nível do fluido de arrefecimento (radiador) está adequado?', 'conforme_nc_na', 6, 'Verificar com motor frio. Nunca abrir o radiador quente.', false, 2),
  (s, 'Pneus estão em bom estado, sem cortes, desgaste excessivo e com pressão correta?', 'conforme_nc_na', 7, 'Pneus maciços: verificar desgaste lateral. Pneumáticos: calibrar conforme manual.', true, 3),
  (s, 'Buzina, alarme de ré e luzes (farol, giroflex) funcionam corretamente?', 'conforme_nc_na', 8, 'Testar buzina e alarme de ré antes de iniciar a operação.', false, 4),
  (s, 'Os freios (serviço e estacionamento) funcionam adequadamente?', 'conforme_nc_na', 9, 'Testar em local seguro com carga leve. Freio de estacionamento deve travar a máquina.', false, 5),
  (s, 'Não há vazamentos visíveis de óleo, combustível ou fluido hidráulico na máquina ou no piso?', 'conforme_nc_na', 8, 'Verificar embaixo da máquina e nas mangueiras do sistema hidráulico.', true, 6),
  (s, 'Cintos de segurança, encosto do operador e espelhos retrovisores estão em bom estado?', 'conforme_nc_na', 7, 'O cinto de segurança é obrigatório em empilhadeiras com cabine fechada.', true, 7),
  (s, 'Extintor de incêndio está fixado, lacrado e dentro do prazo de validade?', 'conforme_nc_na', 8, 'Verificar lacre, pressão do manômetro e data de validade na etiqueta.', true, 8);

-- Seção 2: Sistema Hidráulico e Garfos
insert into public.template_sections (template_id, title, order_index) values (t_emp, 'Sistema Hidráulico e Garfos', 1) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, help_text, requires_photo_on_nc, order_index) values
  (s, 'Os garfos estão sem trincas, dobras, desgaste excessivo ou deformações visíveis?', 'conforme_nc_na', 9, 'Desgaste superior a 10% da espessura original exige substituição imediata.', true, 0),
  (s, 'As correntes de elevação estão lubrificadas, sem elos danificados, esticados ou oxidados?', 'conforme_nc_na', 8, 'Inspecionar toda a extensão das correntes com mastro elevado.', true, 1),
  (s, 'O mastro eleva, inclina e abaixa suavemente, sem travamentos, ruídos anormais ou deriva?', 'conforme_nc_na', 8, 'Testar movimentos com carga leve em área segura.', false, 2),
  (s, 'O nível do óleo hidráulico está dentro da faixa correta indicada no reservatório?', 'conforme_nc_na', 7, 'Verificar com mastro abaixado e sistema sem pressão.', false, 3);

-- Seção 3: Documentação
insert into public.template_sections (template_id, title, order_index) values (t_emp, 'Documentação e Habilitação', 2) returning id into s;
insert into public.template_items (section_id, question, response_type, weight, norm_clause, requires_action_on_nc, order_index) values
  (s, 'O operador possui habilitação interna válida para operar empilhadeira nesta unidade?', 'conforme_nc_na', 10, 'NR-12.112', true, 0),
  (s, 'O plano de manutenção preventiva da empilhadeira está em dia e com registros atualizados?', 'conforme_nc_na', 7, 'NR-12.117', true, 1),
  (s, 'Não há pendências de manutenção corretiva registradas que comprometam a operação segura?', 'conforme_nc_na', 9, 'NR-12.117', true, 2);

end $$;
