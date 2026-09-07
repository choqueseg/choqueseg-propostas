"use client";

import { forwardRef } from "react";

export type UnidadeOrcamento =
  | "Unidade"
  | "Metro"
  | "Rolo"
  | "Caixa"
  | "Kit"
  | "Par"
  | "Serviço";

export type ItemSegurancaPreview = {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: UnidadeOrcamento;
  valorUnitario: number;
};

export type DadosPreviewSeguranca = {
  nome: string;
  telefone: string;
  cidade: string;
  endereco: string;
  observacoes: string;
  itens: ItemSegurancaPreview[];
  subtotal: number;
  desconto: number;
  total: number;
  parcelasCartao: number;
  totalCartao: number;
  parcelaCartao: number;
  temaPDF: "claro" | "escuro";
  enderecoEmpresa: string;
};

type Props = { dados: DadosPreviewSeguranca };
type TemaSeguranca = "camera" | "cerca" | "alarme" | "motor" | "acesso" | "geral";

const LOGO = "/imagens/logo/brasao-choqueseg.png";

const CAPAS: Record<TemaSeguranca, string> = {
  camera: "/imagens/seguranca/cabecalho-camera.svg",
  cerca: "/imagens/seguranca/cabecalho-cerca.svg",
  alarme: "/imagens/seguranca/cabecalho-alarme.svg",
  motor: "/imagens/seguranca/cabecalho-motor.svg",
  acesso: "/imagens/seguranca/cabecalho-acesso.svg",
  geral: "/imagens/seguranca/cabecalho-geral.svg",
};

const IMAGENS: Record<TemaSeguranca, string> = {
  camera: "/imagens/seguranca/item-camera.svg",
  cerca: "/imagens/seguranca/item-cerca.svg",
  alarme: "/imagens/seguranca/item-alarme.svg",
  motor: "/imagens/seguranca/item-motor.svg",
  acesso: "/imagens/seguranca/item-acesso.svg",
  geral: "/imagens/seguranca/item-geral.svg",
};

function normalizar(v: string) {
  return (v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function temaDoTexto(texto: string): TemaSeguranca {
  const v = normalizar(texto);
  if (/(camera|dvr|nvr|cftv|balun)/.test(v)) return "camera";
  if (/(cerca|eletrificador|haste)/.test(v)) return "cerca";
  if (/(alarme|sirene|sensor)/.test(v)) return "alarme";
  if (/(motor|portao|automatizador|cremalheira|controle remoto)/.test(v)) return "motor";
  if (/(controle de acesso|interfone|video porteiro|fechadura)/.test(v)) return "acesso";
  return "geral";
}
function temaPrincipal(itens: ItemSegurancaPreview[]): TemaSeguranca {
  const contagem: Record<TemaSeguranca, number> = { camera:0,cerca:0,alarme:0,motor:0,acesso:0,geral:0 };
  itens.forEach(i => { contagem[temaDoTexto(i.descricao)] += Math.max(Number(i.quantidade)||1,1); });
  return (["camera","cerca","alarme","motor","acesso"] as TemaSeguranca[])
    .sort((a,b)=>contagem[b]-contagem[a])[0] || "geral";
}
function moeda(v:number) {
  return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}
function qtd(v:number) {
  return Number(v||0).toLocaleString("pt-BR",{maximumFractionDigits:2});
}
function hoje() { return new Intl.DateTimeFormat("pt-BR").format(new Date()); }

function beneficio(t:TemaSeguranca) {
  const mapa: Record<TemaSeguranca,{titulo:string;texto:string;frase:string}> = {
    camera:{titulo:"Veja o que acontece mesmo quando você não está no local",texto:"O CFTV permite registrar imagens e, conforme o equipamento escolhido, acompanhar as câmeras pelo celular. Mais controle, registro e tranquilidade para sua família ou empresa.",frase:"Segurança e tranquilidade para sua família você encontra com a CHOQUESEG."},
    cerca:{titulo:"Proteção começa antes que o invasor chegue ao imóvel",texto:"A cerca elétrica reforça a proteção do perímetro e atua como importante elemento de inibição contra tentativas de invasão, com instalação profissional e acabamento adequado.",frase:"Proteção de verdade começa no perímetro."},
    alarme:{titulo:"Detecção rápida para aumentar sua segurança",texto:"Sensores, central e sirene trabalham em conjunto para identificar acessos ou movimentações indevidas e alertar rapidamente sobre situações de risco.",frase:"Tecnologia trabalhando para proteger o que importa."},
    motor:{titulo:"Mais praticidade e segurança para entrar e sair",texto:"O automatizador reduz o tempo de exposição na rua e evita descer do veículo para abrir o portão, trazendo conforto principalmente à noite e em períodos de chuva.",frase:"Conforto para entrar. Segurança para chegar."},
    acesso:{titulo:"Controle quem entra com mais tecnologia",texto:"Fechaduras digitais, vídeo porteiros e controle de acesso oferecem praticidade, registro e maior controle da entrada de pessoas no imóvel.",frase:"Mais controle, praticidade e segurança no seu acesso."},
    geral:{titulo:"Uma solução pensada para o seu patrimônio",texto:"A CHOQUESEG combina equipamentos, instalação profissional, configuração e orientação de uso para entregar uma solução adequada à necessidade apresentada.",frase:"Tecnologia, proteção e tranquilidade com a CHOQUESEG."},
  };
  return mapa[t];
}

function numeroPaginas(itens: ItemSegurancaPreview[]) {
  const validos = itens.filter(i=>i.descricao?.trim());
  // Orçamentos enxutos (ex.: motor + controles + cremalheira + placa) fecham em 1 página.
  if (validos.length <= 4) return 1;
  if (validos.length <= 8) return 2;
  return 3;
}

const PreviewSeguranca = forwardRef<HTMLDivElement, Props>(
  function PreviewSeguranca({dados}, ref) {
    const itens = dados.itens.filter(i=>i.descricao?.trim());
    const tema = temaPrincipal(itens);
    const totalPaginas = numeroPaginas(itens);
    const escuro = dados.temaPDF === "escuro";
    const info = beneficio(tema);

    const primeiraParte = totalPaginas === 3 ? itens.slice(0,6) : itens.slice(0,8);
    const segundaParte = totalPaginas === 3 ? itens.slice(6) : [];

    return (
      <div ref={ref} className="flex flex-col items-center gap-6">
        <Pagina numero={`1/${totalPaginas}`} tema={dados.temaPDF}>
          <Hero tema={tema} pagina={1} />
          <InfoCliente dados={dados} escuro={escuro} />
          <section className={`mt-3 flex min-h-0 flex-1 flex-col rounded-2xl border-2 border-yellow-400 p-4 ${escuro?"bg-zinc-950 text-white":"bg-white text-zinc-950"}`}>
            <Etiqueta>Solução completa CHOQUESEG</Etiqueta>
            <h2 className="mt-1 text-[32px] font-black uppercase leading-[0.98]">O que está incluso<br/>na sua instalação</h2>
            <p className={`mt-2 text-[14px] font-semibold leading-snug ${escuro?"text-zinc-300":"text-zinc-600"}`}>
              Equipamentos e serviços selecionados nesta proposta, apresentados de forma clara para facilitar sua análise.
            </p>
            <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 content-start gap-3">
              {primeiraParte.map(item=><CardItem key={item.id} item={item} escuro={escuro}/>)}
            </div>
            {totalPaginas===1 && <FechamentoCompacto dados={dados} tema={tema} escuro={escuro} />}
          </section>
          <Rodape endereco={dados.enderecoEmpresa}/>
        </Pagina>

        {totalPaginas >= 2 && (
          <Pagina numero={`2/${totalPaginas}`} tema={dados.temaPDF}>
            <Hero tema={tema} pagina={2}/>
            <section className={`mt-3 flex min-h-0 flex-1 flex-col rounded-2xl border-2 border-yellow-400 p-5 ${escuro?"bg-zinc-950 text-white":"bg-white text-zinc-950"}`}>
              {totalPaginas===3 && segundaParte.length>0 ? (
                <>
                  <Etiqueta>Continuação dos equipamentos</Etiqueta>
                  <h2 className="mt-1 text-[31px] font-black uppercase leading-none">Sua solução completa</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {segundaParte.map(item=><CardItem key={item.id} item={item} escuro={escuro}/>)}
                  </div>
                  <div className="mt-5"><Beneficio tema={tema} escuro={escuro}/></div>
                </>
              ):(
                <>
                  <Etiqueta>Benefícios da solução</Etiqueta>
                  <h2 className="mt-1 text-[31px] font-black uppercase leading-none">{info.titulo}</h2>
                  <p className={`mt-3 text-[17px] font-semibold leading-relaxed ${escuro?"text-zinc-200":"text-zinc-700"}`}>{info.texto}</p>
                  <Etapas tema={tema} escuro={escuro}/>
                  <div className="mt-auto"><Fechamento dados={dados} tema={tema} escuro={escuro}/></div>
                </>
              )}
            </section>
            <Rodape endereco={dados.enderecoEmpresa}/>
          </Pagina>
        )}

        {totalPaginas === 3 && (
          <Pagina numero="3/3" tema={dados.temaPDF}>
            <Hero tema={tema} pagina={3}/>
            <section className={`mt-3 flex min-h-0 flex-1 flex-col rounded-2xl border-2 border-yellow-400 p-5 ${escuro?"bg-zinc-950 text-white":"bg-white text-zinc-950"}`}>
              <Etiqueta>Instalação profissional</Etiqueta>
              <h2 className="mt-1 text-[31px] font-black uppercase leading-none">{info.titulo}</h2>
              <p className={`mt-3 text-[17px] font-semibold leading-relaxed ${escuro?"text-zinc-200":"text-zinc-700"}`}>{info.texto}</p>
              <Etapas tema={tema} escuro={escuro}/>
              <div className="mt-auto"><Fechamento dados={dados} tema={tema} escuro={escuro}/></div>
            </section>
            <Rodape endereco={dados.enderecoEmpresa}/>
          </Pagina>
        )}
      </div>
    );
  }
);
export default PreviewSeguranca;

function Pagina({children,numero,tema}:{children:React.ReactNode;numero:string;tema:"claro"|"escuro"}) {
  return (
    <article data-pagina-proposta className={`relative flex h-[1123px] w-[794px] flex-col overflow-hidden p-[10px] font-sans shadow-2xl ${tema==="escuro"?"bg-zinc-950 text-white":"bg-white text-zinc-950"}`} style={{boxSizing:"border-box",fontFamily:"Arial, Helvetica, sans-serif"}}>
      <div className="pointer-events-none absolute inset-0 rounded-[24px] border-2 border-yellow-400"/>
      {children}
      <div className="absolute right-[16px] top-[10px] z-30 rounded-bl-xl bg-yellow-400 px-4 py-1.5 text-[12px] font-black uppercase text-black">Página {numero}</div>
    </article>
  );
}

function Hero({tema,pagina}:{tema:TemaSeguranca;pagina:number}) {
  return (
    <header className="relative h-[180px] shrink-0 overflow-hidden rounded-2xl border border-yellow-400 bg-black">
      <div className="absolute inset-y-0 right-0 w-[50%] overflow-hidden">
        <img src={CAPAS[tema]} alt="Segurança eletrônica CHOQUESEG" className="h-full w-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent"/>
      </div>
      <div className="relative z-10 flex h-full items-center gap-5 px-6">
        <img src={LOGO} alt="CHOQUESEG" className="h-[116px] w-[116px] shrink-0 object-contain"/>
        <div className="max-w-[410px] min-w-0">
          <p className="text-[13px] font-black uppercase tracking-[0.14em] text-white">Proposta comercial</p>
          <h1 className="mt-1 text-[34px] font-black uppercase leading-[0.92] text-yellow-400">Segurança Eletrônica</h1>
          <p className="mt-3 text-[15px] font-black uppercase leading-tight text-white">{beneficio(tema).frase}</p>
          <p className="mt-2 text-[9px] font-bold uppercase tracking-wide text-zinc-300">Imagem meramente ilustrativa</p>
        </div>
      </div>
    </header>
  );
}

function InfoCliente({dados,escuro}:{dados:DadosPreviewSeguranca;escuro:boolean}) {
  return (
    <div className={`mt-3 grid h-[72px] shrink-0 grid-cols-3 gap-2 rounded-2xl p-2 ${escuro?"bg-zinc-900 text-white":"bg-zinc-100 text-zinc-950"}`}>
      <Info titulo="Cliente" valor={dados.nome||"Nome do cliente"} icone="👤"/>
      <Info titulo="Cidade" valor={dados.cidade||"—"} icone="📍"/>
      <Info titulo="Data" valor={hoje()} icone="📅"/>
    </div>
  );
}
function Info({titulo,valor,icone}:{titulo:string;valor:string;icone:string}) {
  return <div className="flex min-w-0 items-center gap-3 rounded-xl px-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-xl">{icone}</div><div className="min-w-0"><p className="text-[9px] font-black uppercase text-zinc-500">{titulo}</p><p className="truncate text-[15px] font-black">{valor}</p></div></div>
}
function Etiqueta({children}:{children:React.ReactNode}) {
  return <p className="inline-flex self-start rounded-md bg-yellow-400 px-3 py-1 text-[14px] font-black uppercase tracking-[0.08em] text-black">{children}</p>
}
function CardItem({item,escuro}:{item:ItemSegurancaPreview;escuro:boolean}) {
  const tema=temaDoTexto(item.descricao);
  return (
    <div className={`grid min-h-[92px] grid-cols-[82px_1fr] items-center overflow-hidden rounded-xl border ${escuro?"border-zinc-700 bg-zinc-900":"border-zinc-200 bg-white"} shadow-sm`}>
      <div className="flex h-full items-center justify-center bg-white p-2"><img src={IMAGENS[tema]} alt="" className="h-[68px] w-[68px] object-contain"/></div>
      <div className="min-w-0 px-3 py-2">
        <p className="text-[15px] font-black leading-tight">{item.descricao}</p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="text-[12px] font-bold text-zinc-500">{qtd(item.quantidade)} {item.unidade}</span>
          <span className="text-[14px] font-black text-yellow-500">{moeda(item.quantidade*item.valorUnitario)}</span>
        </div>
      </div>
    </div>
  );
}
function Beneficio({tema,escuro}:{tema:TemaSeguranca;escuro:boolean}) {
  const b=beneficio(tema);
  return <div className={`rounded-2xl border-2 border-yellow-400 p-5 ${escuro?"bg-zinc-900":"bg-yellow-50"}`}><p className="text-[13px] font-black uppercase tracking-wide text-yellow-500">Por que essa solução faz diferença</p><p className="mt-2 text-[24px] font-black uppercase leading-tight">{b.titulo}</p><p className={`mt-3 text-[15px] font-semibold leading-relaxed ${escuro?"text-zinc-200":"text-zinc-700"}`}>{b.texto}</p></div>
}
function Etapas({tema,escuro}:{tema:TemaSeguranca;escuro:boolean}) {
  const etapas = tema==="motor"
    ? ["Conferência do local e do portão","Instalação e fixação do automatizador","Configuração, testes e orientação de uso"]
    : ["Conferência técnica do local","Instalação dos equipamentos e infraestrutura","Configuração, testes e orientação de uso"];
  return <div className="mt-5"><p className="text-[18px] font-black uppercase">Etapas da instalação</p><div className="mt-3 grid grid-cols-3 gap-3">{etapas.map((e,i)=><div key={e} className={`rounded-xl border p-3 ${escuro?"border-zinc-700 bg-zinc-900":"border-zinc-200 bg-zinc-50"}`}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-[15px] font-black text-black">{i+1}</span><p className="mt-3 text-[13px] font-black leading-tight">{e}</p></div>)}</div></div>
}
function FechamentoCompacto({dados,tema,escuro}:{dados:DadosPreviewSeguranca;tema:TemaSeguranca;escuro:boolean}) {
  return <div className="mt-3 grid grid-cols-[1fr_1.15fr] gap-3"><BeneficioMini tema={tema} escuro={escuro}/><Fechamento dados={dados} tema={tema} escuro={escuro} compacto/></div>
}
function BeneficioMini({tema,escuro}:{tema:TemaSeguranca;escuro:boolean}) {
  const b=beneficio(tema); return <div className={`rounded-xl border border-yellow-400 p-3 ${escuro?"bg-zinc-900":"bg-yellow-50"}`}><p className="text-[11px] font-black uppercase text-yellow-500">Benefício</p><p className="mt-1 text-[16px] font-black leading-tight">{b.titulo}</p></div>
}
function Fechamento({dados,tema,escuro,compacto=false}:{dados:DadosPreviewSeguranca;tema:TemaSeguranca;escuro:boolean;compacto?:boolean}) {
  return (
    <div className={`rounded-2xl border-2 border-yellow-400 ${compacto?"p-3":"p-5"} ${escuro?"bg-black":"bg-zinc-50"}`}>
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-[12px] font-black uppercase tracking-wide text-zinc-500">Investimento</p><p className={`${compacto?"text-[26px]":"text-[38px]"} font-black leading-none text-yellow-500`}>{moeda(dados.total)}</p></div>
        {dados.parcelasCartao>1 && <div className="text-right"><p className="text-[11px] font-black uppercase text-zinc-500">Cartão</p><p className="text-[17px] font-black">{dados.parcelasCartao}x de {moeda(dados.parcelaCartao)}</p></div>}
      </div>
      {dados.observacoes?.trim() && !compacto && <p className={`mt-3 text-[12px] font-semibold ${escuro?"text-zinc-300":"text-zinc-600"}`}>{dados.observacoes}</p>}
      <a data-cta-fechamento href={`https://wa.me/5579999390653?text=${encodeURIComponent("Olá, quero fechar minha proposta de Segurança Eletrônica com a CHOQUESEG.")}`} target="_blank" rel="noreferrer" className={`mt-3 flex min-h-[48px] items-center justify-center rounded-xl bg-yellow-400 px-4 text-center ${compacto?"text-[14px]":"text-[17px]"} font-black uppercase text-black`}>Quero fechar com a CHOQUESEG! ›</a>
    </div>
  );
}
function Rodape({endereco}:{endereco:string}) {
  return (
    <footer className="mt-2 grid h-[58px] shrink-0 grid-cols-[95px_1fr_1.35fr_105px] items-center gap-2 rounded-2xl bg-black px-3 py-1 text-white">
      <img src={LOGO} alt="CHOQUESEG" className="h-[48px] w-[86px] object-contain"/>
      <div className="border-l border-yellow-400 pl-3"><p className="text-[12px] font-black">☎ (79) 9.9939-0653</p><p className="mt-0.5 text-[12px] font-black">◎ @CHOQUESEG</p></div>
      <div className="min-w-0 border-l border-yellow-400 pl-3"><p className="text-[8px] font-black uppercase tracking-wide text-zinc-400">Endereço da loja CHOQUESEG</p><p className="mt-0.5 truncate text-[11px] font-bold">{endereco||"Rodovia dos Náufragos, Robalo, 710 · Aracaju - SE"}</p></div>
      <div className="border-l border-yellow-400 pl-3 text-center"><p className="text-[8px] font-black uppercase text-zinc-400">Credenciado</p><p className="text-[15px] font-black text-green-500">Intelbras</p></div>
    </footer>
  );
}
