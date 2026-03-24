# Pricing Oficial: Criaê

Este documento define a estrutura comercial final, os limites de uso baseados nos custos reais da API (Imagem / Nano Banana) e a estratégia de conversão pro mercado brasileiro. Tudo foi desenhado para proteger o caixa e escalar com lucros agressivos.

## A Matemática do Custo (COGS Benchmark)
* **Texto (Gemini Pro/Flash):** Quase insignificante. Média de R$ 0,10 por post gerado.
* **Imagem (Imagen Ultra / Nano Banana Multimodal):** Custo de faturamento rodando na vida real em **~R$ 0,65 por geração de imagem**.
*O modelo abaixo foi travado matematicamente para evitar que o usuário 'sugue' a margem. A meta é lucrar entre 55% e 75% limpos.*

---

## Estrutura Comercial Oficial

### 1. Starter (O Test-Drive)
**Preço:** R$ 0 / mês
**Para quem é:** O cara que viu o anúncio, não sabe se a IA presta e quer só brincar antes de converter. 
**Promessa:** "Veja como ter um marketeiro de IA jogando no seu time."

* **Limites de Segurança:**
  * **1 Brand**
  * **15 gerações de texto** (limite de saúde da conta)
  * **Exatas 3 imagens geradas por mes** (degustação visual rápida)
  * Sem acesso avançado a recursos premium.
* **Gatilho de Upgrade:** Após 3 cliques na imagem, esbarra no paywall pra converter no impulso.

### 2. Social Media Pro (A Grande Aposta)
**Preço:** R$ 97,00 / mês
**Para quem é:** Donos de negócios e freelas em início de carreira. R$ 97 não vira uma "conta de luz" no orçamento deles e compete diretamente com o Canva Pro.
**Promessa:** "Produza o dobro nas suas redes ganhando 15 horas de volta no seu mês."

* **Limites Toleráveis de Custo:**
  * **Até 3 Brands**
  * **150 gerações de texto / mês**
  * **40 imagens exclusivas / mês** (Custo máx de API se ele zerar a barra: ~R$ 31,00)
  * **Sua Margem no Pior Cenário:** R$ 66,00 de lucro líquido (quase 70% da venda).
* **O que entra:** Modo Automático de inteligência, Assets Reais (reconhecimento de produto), IA Crítica (avaliação anti-clichê).

### 3. Agência (Máquina Operacional)
**Preço:** R$ 397,00 / mês
**Para quem é:** Agências consolidadas ou Social Medias sênior. R$ 397 diluído em 15 clientes te dá o melhor negócio de atacado do mercado (R$ 26,46 po1r conta conectada).
**Promessa:** "Opere contas e escale sua carteira de clientes sem inchar sua folha de pagamento."

* **Limites Toleráveis de Custo:**
  * **Até 15 Brands** 
  * **1.000 gerações de texto / mês**
  * **250 imagens exclusivas / mês** (Custo máx de API se ele usar tudo: ~R$ 192,50)
  * **Sua Margem no Pior Cenário:** R$ 204,50 de lucro limpo (margem de 51%). Como as agências na real não abusam das 250 imgs porque já usam banco de imagem comum, essa margem real vai bater 70%.
* **O que entra:** Todo o poder da plataforma. Fila de geração prioritária, multi-brand pesado e escala profissional.

---

## Tabela Resumo para Implementação (`server.ts` & Supabase BD)

| Plano        | Preço       | Limite Brands | Limite Textos| Limite Imagens | Modo Premium |
|--------------|-------------|---------------|--------------|----------------|--------------|
| **Starter**  | R$ 0        | 1             | 15 totais    | 3 totais       | Não          |
| **Pro**      | R$ 97/mês   | 3             | 150/mês      | 40/mês         | Sim          |
| **Agência**  | R$ 397/mês  | 15            | 1000/mês     | 250/mês        | Sim          |

---

## Sugestão de Copy da Landing Page (No Tom da Criaê)

**"Sua marca não precisa de amadores. Você precisa do seu marketeiro pessoal."**

**[ Card 1: STARTER - R$ 0 ]**
*Dá uma olhadinha na mágica primeiro.*
- Conecte 1 conta e pronto
- 15 textos redigidinhos em Pt-BR real
- Criação de suas 3 primeiras imagens 100% autorais
*(CTA: Testar sem cartão)*

**[ Card 2: PRO - R$ 97/mês - 🔥 O Queridinho ]**
*A dupla imbatível do empreendedor que odeia perder tempo.*
- Até 3 Marcas gerenciadas
- Geração de 150 legendas ou ideias pro mês
- Crie até 40 fotos exclusivas
- Modo Automático com IA Crítica e Assets Reais
*(CTA: Virar Pro)*

**[ Card 3: AGÊNCIA - R$ 397/mês ]**
*Você vende serviço? Escale sua grana sem escalar o seu estresse.*
- Espaço pra até 15 Marcas separadas com identidades próprias
- Chuva de Posts: 1.000 copys prontas todo mês
- Fabrique até 250 Imagens de alta fidelidade
- Desconto brutal por cliente adicionado
*(CTA: Dominar o Jogo)*
