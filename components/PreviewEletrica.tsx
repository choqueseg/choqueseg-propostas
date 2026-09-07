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

export type ItemEletricaPreview = {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: UnidadeOrcamento;
  valorUnitario: number;
};

export type DadosPreviewEletrica = {
  nome: string;
  telefone: string;
  cidade: string;
  endereco: string;
  observacoes: string;
  itens: ItemEletricaPreview[];
  subtotal: number;
  desconto: number;
  total: number;
  parcelasCartao: number;
  totalCartao: number;
  valorParcela: number;
};

type PreviewEletricaProps = {
  dados: DadosPreviewEletrica;
};

const LOGO = "/imagens/logo/brasao-choqueseg.png";

function moeda(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function textoSeguro(valor: string | undefined | null) {
  return String(valor ?? "").trim() || "—";
}

const PreviewEletrica = forwardRef<HTMLDivElement, PreviewEletricaProps>(
  function PreviewEletrica({ dados }, ref) {
    const itensValidos = dados.itens.filter(
      (item) => item.descricao.trim() && item.quantidade > 0,
    );

    return (
      <div ref={ref} className="space-y-6">
        <section
          data-pagina-proposta
          className="mx-auto min-h-[1122px] w-full max-w-[794px] overflow-hidden bg-white text-zinc-950 shadow-2xl"
        >
          <header className="flex items-center justify-between border-b-[6px] border-yellow-400 bg-black px-8 py-7 text-white">
            <div className="flex items-center gap-5">
              <img
                src={LOGO}
                alt="CHOQUESEG"
                className="h-20 w-20 object-contain"
              />
              <div>
                <p className="text-3xl font-black tracking-wide text-yellow-400">
                  CHOQUESEG
                </p>
                <p className="mt-1 text-sm font-bold">
                  Sistemas e Energia Solar
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                Proposta comercial
              </p>
              <p className="mt-1 text-xl font-black uppercase">
                Elétrica Residencial
              </p>
            </div>
          </header>

          <div className="p-8">
            <div className="rounded-3xl bg-zinc-100 p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                Cliente
              </p>
              <h1 className="mt-2 text-3xl font-black uppercase">
                {textoSeguro(dados.nome)}
              </h1>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Info titulo="Telefone" valor={textoSeguro(dados.telefone)} />
                <Info titulo="Cidade" valor={textoSeguro(dados.cidade)} />
                <div className="sm:col-span-2">
                  <Info titulo="Endereço" valor={textoSeguro(dados.endereco)} />
                </div>
              </div>
            </div>

            <div className="mt-7">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-600">
                    Escopo da proposta
                  </p>
                  <h2 className="mt-1 text-2xl font-black uppercase">
                    Materiais e serviços
                  </h2>
                </div>
                <p className="text-sm font-bold text-zinc-500">
                  {itensValidos.length} item(ns)
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-zinc-300">
                <div className="grid grid-cols-[minmax(0,1fr)_90px_80px_120px] bg-black px-4 py-3 text-xs font-black uppercase text-white">
                  <span>Descrição</span>
                  <span>Unidade</span>
                  <span className="text-center">Qtd.</span>
                  <span className="text-right">Total</span>
                </div>

                {itensValidos.length === 0 ? (
                  <div className="p-6 text-center text-sm text-zinc-500">
                    Nenhum item adicionado.
                  </div>
                ) : (
                  itensValidos.map((item, indice) => (
                    <div
                      key={item.id}
                      className={`grid grid-cols-[minmax(0,1fr)_90px_80px_120px] items-center px-4 py-3 text-sm ${
                        indice % 2 === 0 ? "bg-white" : "bg-zinc-50"
                      }`}
                    >
                      <span className="pr-3 font-bold">{item.descricao}</span>
                      <span className="text-zinc-600">{item.unidade}</span>
                      <span className="text-center">{item.quantidade}</span>
                      <span className="text-right font-black">
                        {moeda(item.quantidade * item.valorUnitario)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <Resumo titulo="Subtotal" valor={moeda(dados.subtotal)} />
              <Resumo titulo="Desconto" valor={moeda(dados.desconto)} />
              <Resumo titulo="Valor à vista" valor={moeda(dados.total)} destaque />
            </div>

            <div className="mt-5 rounded-3xl bg-yellow-400 p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                Condição no cartão
              </p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                <p className="text-3xl font-black">
                  {dados.parcelasCartao}x de {moeda(dados.valorParcela)}
                </p>
                <p className="text-sm font-black">
                  Total no cartão: {moeda(dados.totalCartao)}
                </p>
              </div>
            </div>

            {dados.observacoes.trim() && (
              <div className="mt-6 rounded-2xl border border-zinc-300 p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                  Observações
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {dados.observacoes}
                </p>
              </div>
            )}
          </div>

          <footer className="mt-auto border-t border-zinc-200 bg-zinc-950 px-8 py-6 text-white">
            <div className="grid gap-4 text-center text-xs font-black uppercase sm:grid-cols-4">
              <span>⚡ Elétrica Residencial</span>
              <span>📹 Segurança Eletrônica</span>
              <span>☀ Energia Solar</span>
              <span>⌂ Casa Inteligente</span>
            </div>
            <p className="mt-4 text-center text-xs text-zinc-400">
              CHOQUESEG • Atendimento profissional, segurança e qualidade.
            </p>
          </footer>
        </section>
      </div>
    );
  },
);

export default PreviewEletrica;

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-zinc-500">{titulo}</p>
      <p className="mt-1 font-bold">{valor}</p>
    </div>
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
      className={`rounded-2xl p-5 ${
        destaque ? "bg-black text-yellow-400" : "bg-zinc-100 text-zinc-950"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.12em] opacity-70">
        {titulo}
      </p>
      <p className="mt-2 text-xl font-black">{valor}</p>
    </div>
  );
}
