/**
 * Few-shot example bank for Criaê content generation.
 *
 * These examples are fed into the strategy prompt so the model can infer the
 * expected level of specificity, tone, and format — not copy the text verbatim.
 *
 * Verticals mirror the values returned by normalizeProductType():
 *   food | service | saas | ecommerce | other (local businesses)
 *
 * Post types mirror the post type picklist in BrandDetail.tsx.
 */

export type FewShotExample = {
  vertical: "food" | "service" | "saas" | "ecommerce" | "other";
  postType:
    | "Dor do cliente"
    | "Solução / produto"
    | "Prova social / depoimento"
    | "Lançamento"
    | "Oferta relâmpago"
    | "Bastidores / founder"
    | "Dica / tutorial";
  angle: string;
  hook: string;
  caption: string;
  cta: string;
  imageText: string;
};

export const FEW_SHOT_BANK: FewShotExample[] = [
  // ── FOOD ────────────────────────────────────────────────────────────────────

  {
    vertical: "food",
    postType: "Dor do cliente",
    angle:
      "A frustração de pedir delivery e o lanche chegar morno e amassado — contraste com o padrão da marca.",
    hook: "Cê já pediu um lanche e ficou mais na caixa do que no sabor? Aqui a embalagem é só detalhe.",
    caption:
      "Cê já pediu um lanche e ficou mais na caixa do que no sabor? Aqui a embalagem é só detalhe. O que importa é o que tá dentro: pão brioche fresquinho, blend de carne com gordura na medida certa e aquele molho que cola no dedo.\n\nDelivery ou balcão, o padrão não muda.",
    cta: "Faz o pedido agora",
    imageText: "Do jeito que tem que ser",
  },

  {
    vertical: "food",
    postType: "Bastidores / founder",
    angle:
      "Founder mostrando a chegada do fornecedor na madrugada — prova de que a obsessão com ingrediente é real.",
    hook: "05h30 da manhã. O pão acabou de chegar direto da padaria artesanal. Isso é rotina aqui.",
    caption:
      "05h30 da manhã. O pão acabou de chegar direto da padaria artesanal que a gente escolheu depois de provar oito fornecedores diferentes.\n\nAlguns detalhes ninguém vê. Mas cê sente na primeira mordida.",
    cta: "Abre às 11h — te espero aqui",
    imageText: "Feito toda manhã",
  },

  {
    vertical: "food",
    postType: "Dica / tutorial",
    angle:
      "Hack simples que o cliente nunca pensou: montar o lanche ao contrário para não desmontar na mão.",
    hook: "Sabe quando o lanche desmonta na mão antes de você chegar na metade? Tem um jeito de evitar.",
    caption:
      "Sabe quando o lanche desmonta na mão antes de você chegar na metade? Tem um jeito de evitar.\n\nColoca a alface embaixo da carne, não em cima. Ela segura a umidade e o pão não desmancha. Pode parecer bobagem, mas muda tudo.\n\nNo nosso balcão a gente já monta assim. Mas agora cê sabe o motivo.",
    cta: "Vem experimentar",
    imageText: "Truque dos bastidores",
  },

  // ── SERVICE ──────────────────────────────────────────────────────────────────

  {
    vertical: "service",
    postType: "Prova social / depoimento",
    angle:
      "Cliente que tentou fazer sozinho, gastou mais do que previu e veio buscar a agência — ROI claro.",
    hook: "A Mariana tentou rodar os próprios anúncios por 3 meses. Gastou R$ 4.200 e vendeu R$ 1.800.",
    caption:
      "A Mariana tentou rodar os próprios anúncios por 3 meses. Gastou R$ 4.200 e vendeu R$ 1.800.\n\nNo primeiro mês com a gente, o ROAS dela foi 4,1. Sem fórmula mágica — revisamos a segmentação, reescrevemos os criativos e paramos de queimar budget em público errado.\n\nNem sempre o problema é o produto. Às vezes é só quem está na campanha.",
    cta: "Fala comigo hoje",
    imageText: "De ROAS 0,4 para 4,1",
  },

  {
    vertical: "service",
    postType: "Dor do cliente",
    angle:
      "A dor de receber um relatório de agência cheio de gráfico bonito mas sem nenhuma ação concreta.",
    hook: "Se o relatório da sua agência não diz o que vai mudar na semana que vem, ele não serve pra nada.",
    caption:
      "Se o relatório da sua agência não diz o que vai mudar na semana que vem, ele não serve pra nada.\n\nBonito no slide, inútil na prática. A gente não entrega PDF — entrega plano de ação com responsável e prazo. Toda semana.\n\nSe cê quer resultado, precisa de alguém que meça e mude. Não de alguém que explique por que não funcionou.",
    cta: "Vê como a gente trabalha",
    imageText: "Relatório que muda alguma coisa",
  },

  {
    vertical: "service",
    postType: "Lançamento",
    angle:
      "Lançamento de novo serviço de gestão de tráfego para e-commerce pequeno — foco no acesso democratizado.",
    hook: "Até agora gestão de tráfego de verdade era pra quem tinha budget de agência grande. Mudou.",
    caption:
      "Até agora gestão de tráfego de verdade era pra quem tinha budget de agência grande. Mudou.\n\nPresenteamos o plano Starter: gestão completa de Meta Ads para lojas faturando até R$ 50k/mês. Mesmo estratégia, mesmo time, metade do ticket.\n\nAbrimos 5 vagas nessa semana.",
    cta: "Garante a sua vaga",
    imageText: "Tráfego sério. Preço justo.",
  },

  // ── SAAS ─────────────────────────────────────────────────────────────────────

  {
    vertical: "saas",
    postType: "Dor do cliente",
    angle:
      "A agonia de fechar o mês e não saber exatamente quanto de receita recorrente a empresa tem de verdade.",
    hook: "Seu financeiro fecha o mês, soma tudo e ainda não sabe qual é o MRR real. Isso é um problema.",
    caption:
      "Seu financeiro fecha o mês, soma tudo e ainda não sabe qual é o MRR real. Isso é um problema — porque sem MRR você não sabe o que crescer, o que cortar nem quando contratar.\n\nA maioria das planilhas soma faturamento bruto e chama de receita. Não é a mesma coisa.\n\nCê não precisa de mais uma planilha. Precisa de um número em que dá pra confiar.",
    cta: "Vê como o Vela calcula isso",
    imageText: "MRR real. Não estimado.",
  },

  {
    vertical: "saas",
    postType: "Dica / tutorial",
    angle:
      "Um atalho de teclado ou fluxo de automação que o usuário avançado usa mas 90% dos clientes não conhece.",
    hook: "90% dos usuários do Vela nunca descobrem esse atalho. Economiza 40 minutos por semana facilmente.",
    caption:
      "90% dos usuários do Vela nunca descobrem esse atalho. Economiza 40 minutos por semana facilmente.\n\nNa tela de conciliação: `Ctrl + Shift + M` abre o modo multi-seleção. Você marca todas as entradas pendentes do mesmo fornecedor de uma vez e classifica em lote.\n\nPraticamente ninguém usa. Agora cê sabe.",
    cta: "Testa aí e me fala",
    imageText: "Ctrl + Shift + M",
  },

  {
    vertical: "saas",
    postType: "Prova social / depoimento",
    angle:
      "Time de 3 pessoas que substituiu um analista financeiro freelancer depois de adotar a ferramenta.",
    hook: "O Lucas gerencia o financeiro de uma operação de R$ 800k/mês. Só ele. Sem contador externo no dia a dia.",
    caption:
      "O Lucas gerencia o financeiro de uma operação de R$ 800k/mês. Só ele. Sem contador externo no dia a dia.\n\nAntes do Vela eram três planilhas, dois freelancers e uma reunião mensal que sempre terminava com dúvida. Hoje ele fecha o mês em dois dias e confia nos números.\n\n\"Parece que o produto foi feito pra operação do meu tamanho.\" — Lucas, Recife.",
    cta: "Começa grátis hoje",
    imageText: "Uma pessoa. Zero caos.",
  },

  // ── ECOMMERCE ────────────────────────────────────────────────────────────────

  {
    vertical: "ecommerce",
    postType: "Oferta relâmpago",
    angle:
      "Liquidação de estoque de uma SKU específica — urgência real baseada em quantidade, não em timer falso.",
    hook: "Sobraram 11 unidades do nosso kit mais vendido do verão. Quando acabar, acabou.",
    caption:
      "Sobraram 11 unidades do kit FPS 50 + After Sun que foi o mais vendido do verão.\n\nNão tem reposição prevista. Quando acabar, acabou de verdade — sem \"últimas unidades\" pra sempre.\n\nCupom SAIU30 tira 30% até meia-noite.",
    cta: "Pega o link na bio",
    imageText: "11 unidades. Cupom SAIU30.",
  },

  {
    vertical: "ecommerce",
    postType: "Solução / produto",
    angle:
      "Apresentar o diferencial técnico do produto (material, processo, certificação) sem parecer um manual.",
    hook: "O elástico desse shorts não afrouxa depois de 50 lavagens. Tem um motivo técnico pra isso.",
    caption:
      "O elástico desse shorts não afrouxa depois de 50 lavagens. Tem um motivo técnico pra isso.\n\nUsamos fio de poliuretano encapado, não elástico comum. Ele mantém a tensão mesmo com calor, cloro e uso intenso. É o mesmo padrão dos uniformes de natação competitiva.\n\nNão é marketing — é o que está na ficha técnica.",
    cta: "Vê as opções de cor",
    imageText: "50 lavagens. Mesmo elástico.",
  },

  {
    vertical: "ecommerce",
    postType: "Bastidores / founder",
    angle:
      "Founder mostrando o processo de controle de qualidade manual — quebra a percepção de e-commerce genérico.",
    hook: "Antes de qualquer pedido sair daqui, cada peça passa por mim. Não por uma câmera. Por mim.",
    caption:
      "Antes de qualquer pedido sair daqui, cada peça passa por mim. Não por uma câmera. Por mim.\n\nVerificamos costura, acabamento e cor em luz natural. Se algo parece fora do padrão, a peça fica. Não vai.\n\nIsso atrasa às vezes? Sim. Mas nunca teve uma cliente reclamando de qualidade.",
    cta: "Conhece a coleção nova",
    imageText: "Cada peça, uma por uma",
  },

  // ── OTHER (negócio local) ────────────────────────────────────────────────────

  {
    vertical: "other",
    postType: "Dor do cliente",
    angle:
      "A frustração de agendar serviço de beleza e o profissional atrasar ou cancelar em cima da hora.",
    hook: "Quantas vezes cê arrumou a agenda, foi ao salão e a profissional chegou 40 minutos atrasada?",
    caption:
      "Quantas vezes cê arrumou a agenda, foi ao salão e a profissional chegou 40 minutos atrasada?\n\nOu cancelou na véspera sem aviso nenhum. Cê que ficou na mão.\n\nAqui funciona diferente. Confirmamos todo agendamento 24h antes. Se por qualquer motivo precisarmos reagendar, cê sabe com antecedência. Seu tempo vale.",
    cta: "Reserva o seu horário",
    imageText: "Seu horário respeitado",
  },

  {
    vertical: "other",
    postType: "Lançamento",
    angle:
      "Abertura de nova unidade em bairro específico — comunicar localização de forma concreta e convidativa.",
    hook: "Finalmente. A segunda unidade fica na Rua das Flores, 412, Pinheiros. Abre quinta que vem.",
    caption:
      "Finalmente. A segunda unidade fica na Rua das Flores, 412, Pinheiros. Abre quinta que vem.\n\nMesmo padrão, mesma equipe treinada, novo endereço. Quem é da região não precisa mais cruzar a cidade.\n\nNos 3 primeiros dias: 20% de desconto pra quem mostrar esse post.",
    cta: "Salva o endereço",
    imageText: "Pinheiros. Abre quinta.",
  },

  {
    vertical: "other",
    postType: "Prova social / depoimento",
    angle:
      "Depoimento de cliente fiel que veio uma vez, virou frequentador — foco no vínculo, não no produto.",
    hook: "A Fernanda veio pela primeira vez em agosto do ano passado. Desde então não pulou um mês.",
    caption:
      "A Fernanda veio pela primeira vez em agosto do ano passado. Desde então não pulou um mês.\n\n\"Não é só o serviço — é como eu saio daqui me sentindo. Já indiquei pra cinco amigas.\"\n\nEsse tipo de coisa não dá pra colocar no cardápio.",
    cta: "Agenda o seu",
    imageText: "Uma vez. Todo mês desde então.",
  },
];

/**
 * Returns up to 2 relevant few-shot examples for a given vertical + post type.
 *
 * Selection priority:
 *   1. Exact vertical + exact post type match
 *   2. Exact vertical only (any post type)
 *   3. Any example if no vertical match exists
 *
 * The returned array is deduplicated and capped at 2 items.
 */
export function getFewShotExamples(
  productType: string,
  postType: string,
): FewShotExample[] {
  // Normalize the incoming productType to match bank verticals.
  // We don't import normalizeProductType here to keep this file free of
  // server-only deps — so we replicate the core mapping logic.
  const pt = productType.toLowerCase().trim();
  type Vertical = FewShotExample["vertical"];
  let vertical: Vertical;

  if (pt === "saas") {
    vertical = "saas";
  } else if (pt === "ecommerce") {
    vertical = "ecommerce";
  } else if (pt === "food") {
    vertical = "food";
  } else if (pt === "service") {
    vertical = "service";
  } else {
    vertical = "other";
  }

  // Exact vertical + exact post type
  const exactMatches = FEW_SHOT_BANK.filter(
    (ex) => ex.vertical === vertical && ex.postType === postType,
  );

  if (exactMatches.length >= 2) {
    return exactMatches.slice(0, 2);
  }

  // Exact vertical, any post type (exclude already-selected)
  const sameVertical = FEW_SHOT_BANK.filter(
    (ex) =>
      ex.vertical === vertical &&
      !exactMatches.includes(ex),
  );

  const combined = [...exactMatches, ...sameVertical].slice(0, 2);

  if (combined.length > 0) {
    return combined;
  }

  // Fallback: grab first 2 from the full bank
  return FEW_SHOT_BANK.slice(0, 2);
}
