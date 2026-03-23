import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, Brain, ArrowRight, CheckCircle2, TrendingUp, Users } from 'lucide-react';

type Props = {
  onStart: () => void;
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function LandingPage({ onStart }: Props) {
  return (
    <div className="min-h-screen bg-[#FFF8F0] font-sans text-neutral-900 selection:bg-[#FF8C5A] selection:text-white overflow-x-hidden">
      
      {/* Navbar Minimalista */}
      <header className="absolute top-0 w-full z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B35] flex items-center justify-center text-white font-bold cursor-pointer" onClick={onStart}>
              C
            </div>
            <span className="text-xl font-bold font-display tracking-tight cursor-pointer" onClick={onStart}>Criaê</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onStart} className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors hidden sm:block">
              Entrar
            </button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStart} 
              className="bg-[#1A1A2E] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
            >
              Começar grátis
            </motion.button>
          </div>
        </div>
      </header>

      {/* Hero Section (Jasper Style) */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMzkuNWg0ME0zOS41IDB2NDAiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjA0KSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] opacity-50 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div 
              initial="hidden" animate="visible" variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFE0D0] text-[#1A1A2E] text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4 text-[#FF6B35]" />
              <span>O seu marketeiro pessoal movido a IA</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="text-5xl sm:text-6xl lg:text-8xl font-display font-extrabold tracking-tight text-[#1A1A2E] leading-[1.05] mb-6"
            >
              Marketing que <br className="hidden sm:block" /> se faz sozinho.
            </motion.h1>
            
            <motion.p 
              initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl text-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Criaê é a plataforma de IA que entende a sua marca, acelera a criação de conteúdo e automatiza a rotina das suas redes sociais — tudo com a sua cara.
            </motion.p>
            
            <motion.div 
              initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStart}
                className="w-full sm:w-auto bg-[#FF6B35] text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-[#E55A28] transition-all shadow-lg shadow-[#FF6B35]/25 flex items-center justify-center gap-2"
              >
                Testar agora 
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <p className="text-sm text-neutral-500 sm:ml-4">
                Teste grátis. Não precisa de cartão.
              </p>
            </motion.div>
          </div>

          {/* Hero Image Component - Floating elements style */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mt-20 relative max-w-5xl mx-auto flex justify-center"
          >
            {/* Geometric Background Shapes (Jasper Vibe) */}
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
              <div className="w-[120%] h-64 bg-green-400/20 absolute bottom-0 -rotate-3 rounded-3xl blur-xl" />
              <div className="w-64 h-64 bg-[#FFD166]/30 absolute top-10 right-10 rounded-full blur-3xl" />
              <div className="w-80 h-80 bg-[#FF6B35]/20 absolute -left-10 bottom-10 rounded-full blur-3xl" />
            </div>

            {/* Main Portrait */}
            <div className="relative z-10 w-full max-w-lg">
              <img 
                src="/images/hero-student.png" 
                alt="Estudante de marketing sorrindo" 
                className="w-full h-auto mix-blend-darken"
              />
              
              {/* Floating UI Cards */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute top-1/3 -left-8 sm:-left-24 bg-white p-4 rounded-2xl shadow-xl border border-neutral-100 flex items-center gap-3 backdrop-blur-sm bg-white/90"
              >
                <div className="w-10 h-10 rounded-full bg-[#FFF1EB] flex items-center justify-center">
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900">Post criado em</p>
                  <p className="text-[#FF6B35] font-black text-lg">15 segundos</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute bottom-1/4 -right-12 sm:-right-20 bg-[#1A1A2E] text-white p-5 rounded-2xl shadow-2xl"
              >
                <p className="text-sm font-medium text-neutral-400 mb-1">Aumento de alcance</p>
                <p className="text-5xl font-display font-black text-[#06D6A0]">+84%</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Logo Cloud */}
      <section className="py-10 border-y border-neutral-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-medium text-neutral-500 mb-6 font-display uppercase tracking-widest">
            Feito para quem não tem tempo a perder
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-40 grayscale">
            <span className="font-display font-bold text-xl">Empreendedores</span>
            <span className="font-display font-bold text-xl">Marketing</span>
            <span className="font-display font-bold text-xl">Agências</span>
            <span className="font-display font-bold text-xl">E-commerces</span>
            <span className="font-display font-bold text-xl">Criadores</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#1A1A2E] mb-6 tracking-tight">
              Sua marca nunca foi tão consistente.
            </h2>
            <p className="text-lg text-neutral-600">
              O Criaê não gera textos genéricos. Ele lê o seu site, entende seu tom de voz e cria posts que parecem que foram escritos por você mesmo.
            </p>
          </div>

          <motion.div 
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <Brain className="w-8 h-8 text-[#FF6B35]" />,
                title: "Organize sua Marca",
                desc: "A IA centraliza suas cores, fontes e tom de voz em um brand kit automático. Nunca mais perca a identidade visual."
              },
              {
                icon: <Zap className="w-8 h-8 text-[#FFD166]" />,
                title: "Brainstorming Ilimitado",
                desc: "Gere ideias criativas, legendas persuasivas e escopos de campanhas sem travar na tela em branco."
              },
              {
                icon: <Users className="w-8 h-8 text-[#06D6A0]" />,
                title: "Foco no que importa",
                desc: "Deixe a criação pesada com o Criaê e foque o seu tempo em atender seus clientes e fechar vendas."
              }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-[#FFF8F0] p-8 rounded-3xl border border-neutral-100 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold font-display text-[#1A1A2E] mb-3">{feature.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Passo a Passo */}
      <section className="py-24 px-6 bg-[#1A1A2E] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className="text-3xl sm:text-5xl font-display font-bold mb-6 tracking-tight">
                Em três cliques o post tá pronto pra postar.
              </h2>
              <p className="text-neutral-400 text-lg mb-8">
                Chega de quebrar a cabeça com prompts complexos no ChatGPT. Nossa interface foi desenhada pra quem quer resultado direto e reto.
              </p>
              
              <div className="space-y-6">
                {[
                  "Cole o link do seu site (nós lemos ele em 2 seg)",
                  "Escolha o seu objetivo (Vender, Conectar, Ensinar)",
                  "O Criaê cospe Legenda, Imagem e Hashtags com a sua VIBE"
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF6B35] flex items-center justify-center font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-lg font-medium">{step}</p>
                  </div>
                ))}
              </div>
              
              <button onClick={onStart} className="mt-12 text-[#FFD166] font-bold text-lg flex items-center gap-2 hover:gap-4 transition-all">
                Ver na prática <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur"
            >
              {/* Fake UI Mockup */}
              <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
                <div className="bg-neutral-100 p-3 border-b border-neutral-200 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="p-6 pb-0 bg-neutral-50 h-80 relative overflow-hidden">
                  <div className="bg-white p-4 shadow-sm border border-neutral-100 rounded-lg mb-4">
                    <div className="h-4 w-3/4 bg-neutral-200 rounded mb-2" />
                    <div className="h-4 w-1/2 bg-neutral-200 rounded" />
                  </div>
                  <div className="bg-[#FFF1EB] p-4 border border-[#FFE0D0] rounded-lg">
                    <div className="flex items-center gap-2 text-[#FF6B35] font-bold mb-3">
                      <Sparkles className="w-4 h-4" /> Gerando legenda incrível...
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-[#FF6B35]/20 rounded" />
                      <div className="h-3 w-5/6 bg-[#FF6B35]/20 rounded" />
                      <div className="h-3 w-4/6 bg-[#FF6B35]/20 rounded" />
                    </div>
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-[#06D6A0]/20 rounded-full blur-2xl" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 bg-[#FFF1EB]">
        <div className="max-w-4xl mx-auto text-center">
          <TrendingUp className="w-12 h-12 text-[#FF6B35] mx-auto mb-8" />
          <h2 className="text-2xl sm:text-4xl font-display font-medium text-[#1A1A2E] leading-relaxed mb-10">
            "Eu gastava 4 horas no domingo planejando a semana da minha confeitaria. Com o Criaê, eu faço o mês todo em 20 minutos e a arte já sai com a minha logo e as minhas cores."
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neutral-300 overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Maria&backgroundColor=FFD166`} alt="Avatar" />
            </div>
            <div className="text-left">
              <p className="font-bold text-[#1A1A2E]">Mariana S.</p>
              <p className="text-sm text-neutral-600">Dona de Confeitaria</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-6xl font-display font-black text-[#1A1A2E] mb-6 tracking-tight">
            Pronto para faturar mais <br className="hidden sm:block" />
            com o digital?
          </h2>
          <p className="text-xl text-neutral-600 mb-10">
            Crie sua primeira marca grátis. Não pedimos cartão de crédito.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="bg-[#1A1A2E] text-white px-10 py-5 rounded-full text-xl font-bold hover:bg-neutral-800 transition-colors shadow-2xl flex items-center gap-3 mx-auto"
          >
            Começar meu teste grátis <ArrowRight className="w-6 h-6" />
          </motion.button>
          
          <div className="flex items-center justify-center gap-6 mt-8 text-neutral-500 font-medium">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Configuração em 1 min</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Cancele quando quiser</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A2E] text-neutral-400 py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B35] flex items-center justify-center text-white font-bold opacity-80">
              C
            </div>
            <span className="text-xl font-bold font-display text-white">Criaê</span>
          </div>
          
          <div className="flex gap-8 text-sm">
            <a href="#" className="hover:text-white transition-colors">Termos de uso</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>
          
          <div className="text-sm">
            © 2026 Criaê. Feito no Brasil com ☕
          </div>
        </div>
      </footer>
    </div>
  );
}
