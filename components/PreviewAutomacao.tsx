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

export type ItemAutomacaoPreview = {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: UnidadeOrcamento;
  valorUnitario: number;
};

export type DadosPreviewAutomacao = {
  nome: string;
  telefone: string;
  cidade: string;
  endereco: string;
  observacoes: string;
  itens: ItemAutomacaoPreview[];
  subtotal: number;
  desconto: number;
  total: number;
  parcelasCartao: number;
  totalCartao: number;
  valorParcela: number;
};

type Props = {
  dados: DadosPreviewAutomacao;
};

const LOGO = "/imagens/logo/brasao-choqueseg.png";
const CAPA_AUTOMACAO = "/imagens/capa/automacao.jpg";
const WHATSAPP_CHOQUESEG = "5579999390653";

function moeda(valor?: number | null) {
  const numeroSeguro = Number(valor ?? 0);

  return (Number.isFinite(numeroSeguro) ? numeroSeguro : 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );
}

const PreviewAutomacao = forwardRef<HTMLDivElement, Props>(
  function PreviewAutomacao({ dados }, ref) {
    const mensagemFechamento = [
      "Olá, CHOQUESEG! Analisei minha proposta de Casa Inteligente e quero fechar o serviço.",
      "",
      `Cliente: ${dados.nome || "Não informado"}`,
      `Cidade: ${dados.cidade || "Não informada"}`,
      `Telefone: ${dados.telefone || "Não informado"}`,
      `Valor: ${moeda(dados.total)}`,
      "",
      "Quero dar continuidade ao fechamento.",
    ].join("\n");

    const linkFechamento = `https://wa.me/${WHATSAPP_CHOQUESEG}?text=${encodeURIComponent(
      mensagemFechamento,
    )}`;

    return (
      <div ref={ref} className="grid items-start gap-5">
        <Pagina numeroPagina={1} totalPaginas={2}>
          <section className="relative min-h-[390px] overflow-hidden rounded-[24px] border border-yellow-400 bg-black">
            <img
              src={CAPA_AUTOMACAO}
              alt="Sistema de automação"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(evento) => {
                evento.currentTarget.style.display = "none";
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/30" />

            <div className="relative z-10 p-7">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.28em] text-yellow-400">
                    Proposta comercial
                  </p>

                  <h1 className="mt-3 text-5xl font-black uppercase leading-[0.92] text-white">
                    Casa
                    <br />
                    Inteligente
                  </h1>
                </div>

                <img
                  src={LOGO}
                  alt="Brasão oficial da CHOQUESEG"
                  className="h-auto w-[150px] object-contain"
                />
              </div>

              <div className="mt-12 max-w-[78%]">
                <p className="text-2xl font-black leading-tight text-yellow-400">
                  Conforto, tecnologia e praticidade para sua casa inteligente.
                </p>

                <p className="mt-6 text-3xl font-black text-white">
                  {dados.nome || "Nome do cliente"}
                </p>

                <p className="mt-2 text-base font-bold text-zinc-200">
                  {[dados.cidade, dados.telefone].filter(Boolean).join(" • ") ||
                    "Cidade • Telefone"}
                </p>

                {dados.endereco && (
                  <p className="mt-1 text-sm font-bold text-zinc-300">
                    {dados.endereco}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[22px] border border-zinc-300 bg-white p-5 text-zinc-950">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                  Itens da proposta
                </p>
                <h2 className="mt-1 text-2xl font-black uppercase">
                  Equipamentos e serviços
                </h2>
              </div>

              <span className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black uppercase text-black">
                {dados.itens.length} item(ns)
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-zinc-300">
              <div className="grid grid-cols-[minmax(0,1fr)_70px_80px_110px_110px] bg-zinc-950 px-3 py-3 text-xs font-black uppercase text-white">
                <span>Descrição</span>
                <span className="text-center">Qtd.</span>
                <span className="text-center">Un.</span>
                <span className="text-right">Unitário</span>
                <span className="text-right">Total</span>
              </div>

              {dados.itens.length === 0 ? (
                <div className="p-8 text-center font-bold text-zinc-500">
                  Adicione os equipamentos e serviços no gerador.
                </div>
              ) : (
                dados.itens.map((item, indice) => (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[minmax(0,1fr)_70px_80px_110px_110px] items-center px-3 py-3 text-sm ${
                      indice % 2 === 0 ? "bg-white" : "bg-zinc-100"
                    }`}
                  >
                    <strong className="pr-2">{item.descricao}</strong>
                    <span className="text-center">{item.quantidade}</span>
                    <span className="text-center text-xs">{item.unidade}</span>
                    <span className="text-right">
                      {moeda(item.valorUnitario)}
                    </span>
                    <strong className="text-right">
                      {moeda(item.quantidade * item.valorUnitario)}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="mt-5 grid gap-3 sm:grid-cols-3">
            <Resumo titulo="Subtotal" valor={moeda(dados.subtotal)} />
            <Resumo titulo="Desconto" valor={moeda(dados.desconto)} />
            <Resumo titulo="Valor à vista" valor={moeda(dados.total)} destaque />
          </section>

          <section className="mt-4 rounded-[20px] border border-yellow-400 bg-black p-4 text-white">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-400">
              Condições de pagamento
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase text-zinc-400">À vista</p>
                <strong className="mt-1 block text-xl font-black">
                  {moeda(dados.total)}
                </strong>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-zinc-400">Cartão</p>
                <strong className="mt-1 block text-xl font-black text-yellow-400">
                  {dados.parcelasCartao}x de {moeda(dados.valorParcela)}
                </strong>
                <p className="mt-1 text-xs font-bold text-zinc-400">
                  Total no cartão: {moeda(dados.totalCartao)}
                </p>
              </div>
            </div>
          </section>
        </Pagina>

        <Pagina numeroPagina={2} totalPaginas={2}>
          <header className="flex items-center justify-between rounded-[22px] bg-black p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
                CHOQUESEG
              </p>
              <h2 className="mt-1 text-3xl font-black uppercase text-white">
                Tecnologia com instalação profissional
              </h2>
            </div>

            <img
              src={LOGO}
              alt="Brasão oficial da CHOQUESEG"
              className="h-auto w-[90px] object-contain"
            />
          </header>

          <section className="mt-5 grid gap-4 sm:grid-cols-2">
            <Bloco titulo="O que está incluso">
              <Diferencial texto="Fornecimento dos equipamentos de automação descritos na proposta" />
              <Diferencial texto="Instalação, configuração, integração e testes de funcionamento" />
              <Diferencial texto="Configuração do aplicativo e orientação de uso ao cliente" />
              <Diferencial texto="Criação e configuração das rotinas de automação contratadas" />
            </Bloco>

            <Bloco titulo="Por que escolher a CHOQUESEG">
              <Diferencial texto="Equipe técnica especializada" />
              <Diferencial texto="Equipamentos inteligentes de marcas reconhecidas" />
              <Diferencial texto="Atendimento próximo e suporte pós-venda" />
              <Diferencial texto="Soluções integradas para iluminação, segurança, acesso e conforto" />
            </Bloco>
          </section>

          <section className="mt-5 rounded-[22px] border border-yellow-400 bg-yellow-50 p-5 text-zinc-950">
            <h3 className="text-xl font-black uppercase">
              Observações da proposta
            </h3>

            <p className="mt-3 whitespace-pre-line text-sm font-bold leading-relaxed text-zinc-700">
              {dados.observacoes ||
                "Valores e condições válidos conforme os itens descritos nesta proposta. Alterações no escopo poderão gerar revisão do orçamento."}
            </p>
          </section>

          <section className="mt-5 rounded-[22px] bg-zinc-950 p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
              Tudo em um só lugar
            </p>

            <h3 className="mt-2 text-2xl font-black uppercase">
              A CHOQUESEG também trabalha com:
            </h3>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <Servico icone="☀️" titulo="Energia Solar" />
              <Servico icone="⚡" titulo="Elétrica" />
              <Servico icone="📹" titulo="Segurança Eletrônica" />
            </div>
          </section>

          <section className="mt-5 rounded-[22px] border border-yellow-400 bg-black p-5">
            <div className="flex items-center justify-between gap-5">
              <div>
                <p className="text-2xl font-black uppercase leading-tight text-yellow-400">
                  Vamos deixar sua casa mais inteligente?
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:max-w-[360px]">
                  <a
                    href={linkFechamento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase text-black"
                  >
                    ✅ Quero fechar com a CHOQUESEG
                  </a>
                </div>

                <p className="mt-4 font-bold text-white">
                  (79) 9.9939-0653 • @choqueseg
                </p>
              </div>

              <img
                src={LOGO}
                alt="Brasão oficial da CHOQUESEG"
                className="h-auto w-[110px] shrink-0 object-contain"
              />
            </div>
          </section>
        </Pagina>
      </div>
    );
  },
);

export default PreviewAutomacao;

function Pagina({
  children,
  numeroPagina,
  totalPaginas,
}: {
  children: React.ReactNode;
  numeroPagina: number;
  totalPaginas: number;
}) {
  return (
    <article
      data-pagina-proposta
      className="relative min-h-[1120px] w-full overflow-hidden rounded-[28px] border border-yellow-400 bg-zinc-100 p-6 shadow-2xl"
    >
      <div className="min-h-[1030px]">{children}</div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs font-bold text-zinc-500">
        Página {numeroPagina} de {totalPaginas}
      </footer>
    </article>
  );
}

function Resumo({
  titulo,
  valor,
  destaque = false,
}: {
  titulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-[20px] p-4 ${
        destaque
          ? "bg-yellow-400 text-black"
          : "border border-zinc-300 bg-white text-zinc-950"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.16em]">
        {titulo}
      </p>
      <strong className="mt-2 block text-2xl font-black">{valor}</strong>
    </div>
  );
}

function Bloco({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-zinc-300 bg-white p-5 text-zinc-950">
      <h3 className="text-xl font-black uppercase">{titulo}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Diferencial({ texto }: { texto: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-black">
        ✓
      </span>
      <p className="text-sm font-bold leading-snug">{texto}</p>
    </div>
  );
}

function Servico({ icone, titulo }: { icone: string; titulo: string }) {
  return (
    <div className="rounded-xl border border-yellow-400/40 bg-black p-4 text-center">
      <span className="text-3xl">{icone}</span>
      <p className="mt-2 text-sm font-black uppercase text-white">{titulo}</p>
    </div>
  );
}