"use client";

import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { produtosIniciais } from "@/components/produtos";
import PreviewAutomacao, {
  type DadosPreviewAutomacao,
  type ItemAutomacaoPreview,
  type UnidadeOrcamento,
} from "./PreviewAutomacao";

const WHATSAPP_CHOQUESEG = "5579999390653";

type ItemOrcamento = ItemAutomacaoPreview & {
  produtoId: string;
};

const produtosAutomacao = produtosIniciais.filter(
  (produto) =>
    produto.categoria === "Automação" ||
    produto.categoria === "Mão de Obra",
);

const unidades: UnidadeOrcamento[] = [
  "Unidade",
  "Metro",
  "Rolo",
  "Caixa",
  "Kit",
  "Par",
  "Serviço",
];

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function inferirUnidade(nome: string): UnidadeOrcamento {
  const texto = nome.toLowerCase();

  if (
    texto.includes("cerca") ||
    texto.includes("cabo") ||
    texto.includes("fio") ||
    texto.includes("canaleta")
  ) {
    return "Metro";
  }

  if (texto.includes("mão de obra") || texto.includes("instalação")) {
    return "Serviço";
  }

  if (texto.includes("par")) return "Par";
  if (texto.includes("kit")) return "Kit";
  if (texto.includes("rolo")) return "Rolo";
  if (texto.includes("caixa")) return "Caixa";

  return "Unidade";
}

export default function FormularioAutomacao() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [endereco, setEndereco] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [parcelasCartao, setParcelasCartao] = useState(12);
  const [taxaCartao, setTaxaCartao] = useState(0);
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState("");
  const [mostrarMensagemWhatsApp, setMostrarMensagemWhatsApp] = useState(false);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [itens, setItens] = useState<ItemOrcamento[]>([]);

  const previewRef = useRef<HTMLDivElement>(null);

  function adicionarProduto() {
    const produto = produtosAutomacao.find(
      (item) => item.id === produtoSelecionado,
    );

    if (!produto) {
      alert("Selecione um produto.");
      return;
    }

    const novoItem: ItemOrcamento = {
      id: `${produto.id}-${Date.now()}`,
      produtoId: produto.id,
      descricao: produto.nome,
      quantidade: 1,
      unidade: inferirUnidade(produto.nome),
      valorUnitario: produto.valorVenda,
    };

    setItens((anteriores) => [...anteriores, novoItem]);
    setProdutoSelecionado("");
  }

  function adicionarItemManual() {
    const novoItem: ItemOrcamento = {
      id: `manual-${Date.now()}`,
      produtoId: "",
      descricao: "Novo item",
      quantidade: 1,
      unidade: "Unidade",
      valorUnitario: 0,
    };

    setItens((anteriores) => [...anteriores, novoItem]);
  }

  function atualizarItem(
    id: string,
    campo:
      | "descricao"
      | "quantidade"
      | "valorUnitario"
      | "unidade",
    valor: string,
  ) {
    setItens((anteriores) =>
      anteriores.map((item) => {
        if (item.id !== id) return item;

        if (campo === "descricao") {
          return { ...item, descricao: valor };
        }

        if (campo === "unidade") {
          return {
            ...item,
            unidade: valor as UnidadeOrcamento,
          };
        }

        const numero = Number(valor.replace(",", "."));

        return {
          ...item,
          [campo]: Number.isFinite(numero) ? Math.max(numero, 0) : 0,
        };
      }),
    );
  }

  function removerItem(id: string) {
    setItens((anteriores) =>
      anteriores.filter((item) => item.id !== id),
    );
  }

  const totais = useMemo(() => {
    let subtotal = 0;

    for (const item of itens) {
      subtotal += item.quantidade * item.valorUnitario;
    }

    const descontoAplicado = Math.min(
      Math.max(desconto, 0),
      subtotal,
    );

    const totalFinal = subtotal - descontoAplicado;
    const parcelasValidas = Math.max(1, Math.floor(parcelasCartao || 1));
    const taxaValida = Math.max(0, taxaCartao || 0);
    const totalCartao = totalFinal * (1 + taxaValida / 100);
    const valorParcela = totalCartao / parcelasValidas;

    return {
      subtotal,
      descontoAplicado,
      totalFinal,
      parcelasValidas,
      taxaValida,
      totalCartao,
      valorParcela,
    };
  }, [itens, desconto, parcelasCartao, taxaCartao]);

  const dadosPreview: DadosPreviewAutomacao = {
    nome,
    telefone,
    cidade,
    endereco,
    observacoes,
    itens,
    subtotal: totais.subtotal,
    desconto: totais.descontoAplicado,
    total: totais.totalFinal,
    parcelasCartao: totais.parcelasValidas,
    totalCartao: totais.totalCartao,
    valorParcela: totais.valorParcela,
  };

  function limparFormulario() {
    setNome("");
    setTelefone("");
    setCidade("");
    setEndereco("");
    setObservacoes("");
    setProdutoSelecionado("");
    setDesconto(0);
    setParcelasCartao(12);
    setTaxaCartao(0);
    setMensagemWhatsApp("");
    setMostrarMensagemWhatsApp(false);
    setItens([]);
  }

  async function gerarPDF() {
    const raiz = previewRef.current;

    if (!raiz) {
      alert("Não foi possível localizar a proposta.");
      return;
    }

    try {
      setGerandoPDF(true);

      const paginas = Array.from(
        raiz.querySelectorAll<HTMLElement>("[data-pagina-proposta]"),
      );

      if (paginas.length === 0) {
        alert("Nenhuma página foi encontrada.");
        return;
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      for (let indice = 0; indice < paginas.length; indice += 1) {
        const canvas = await html2canvas(paginas[indice], {
          scale: 1.35,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#f4f4f5",
          logging: false,
          imageTimeout: 8000,
          removeContainer: true,
        });

        const imagem = canvas.toDataURL("image/jpeg", 0.86);

        if (indice > 0) pdf.addPage();

        pdf.addImage(
          imagem,
          "JPEG",
          0,
          0,
          210,
          297,
          undefined,
          "FAST",
        );

        canvas.width = 1;
        canvas.height = 1;
      }

      const nomeCliente =
        nome.trim().replace(/[^a-zA-ZÀ-ÿ0-9]+/g, "-") || "Cliente";

      pdf.save(`Proposta-Automacao-CHOQUESEG-${nomeCliente}.pdf`);
      alert("PDF gerado com sucesso.");
    } catch (erro) {
      console.error("Erro ao gerar PDF:", erro);
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível gerar o PDF.",
      );
    } finally {
      setGerandoPDF(false);
    }
  }

  function montarMensagemProposta() {
    const primeiroNome = nome.trim().split(/\s+/)[0] || "cliente";

    const principaisItens = itens
      .filter((item) => item.descricao.trim())
      .slice(0, 3)
      .map((item) => {
        const quantidade = Number(item.quantidade) || 0;
        return quantidade > 1
          ? `${quantidade}x ${item.descricao.trim()}`
          : item.descricao.trim();
      });

    const resumoItens =
      principaisItens.length > 0
        ? ` A proposta contempla ${principaisItens.join(", ")}.`
        : "";

    const trechoCartao =
      totais.parcelasValidas > 1
        ? ` No cartão, o pagamento pode ser feito em ${totais.parcelasValidas}x de ${moeda(
            totais.valorParcela,
          )}, totalizando ${moeda(totais.totalCartao)}.`
        : "";

    return (
      `Olá, ${primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase()}! Tudo bem?\n\n` +
      `Preparei sua proposta de Casa Inteligente da CHOQUESEG.${resumoItens}\n\n` +
      `O valor à vista ficou em ${moeda(totais.totalFinal)}.${trechoCartao}\n\n` +
      `Todos os equipamentos, serviços, quantidades, valores e demais informações estão detalhados no PDF da proposta.\n\n` +
      `Fico à disposição para qualquer dúvida.\n` +
      `Equipe CHOQUESEG`
    );
  }

  function abrirPreparacaoWhatsApp() {
    const numeroCliente = telefone.replace(/\D/g, "");
    if (numeroCliente.length < 10) {
      alert("Informe um telefone válido do cliente.");
      return;
    }
    setMensagemWhatsApp(montarMensagemProposta());
    setMostrarMensagemWhatsApp(true);
  }

  function enviarMensagemWhatsApp() {
    const numeroCliente = telefone.replace(/\D/g, "");
    const destino =
      numeroCliente.startsWith("55") && numeroCliente.length >= 12
        ? numeroCliente
        : numeroCliente.length >= 10
          ? `55${numeroCliente}`
          : "";

    if (!destino) {
      alert("Informe um telefone válido do cliente.");
      return;
    }
    if (!mensagemWhatsApp.trim()) {
      alert("A mensagem não pode ficar vazia.");
      return;
    }

    window.open(
      `https://wa.me/${destino}?text=${encodeURIComponent(mensagemWhatsApp)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function fecharComChoqueSeg() {
    const mensagem = encodeURIComponent(
      `Olá, CHOQUESEG! Quero fechar a proposta de automação residencial de ${moeda(
        totais.totalFinal,
      )}. Cliente: ${nome || "Não informado"}.`,
    );

    window.open(
      `https://wa.me/${WHATSAPP_CHOQUESEG}?text=${mensagem}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 border-b border-yellow-400/40 bg-black/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
              CHOQUESEG
            </p>
            <h1 className="text-lg font-black uppercase md:text-2xl">
              Proposta Casa Inteligente
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={gerarPDF}
              disabled={gerandoPDF}
              className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black disabled:opacity-60"
            >
              {gerandoPDF ? "Gerando PDF..." : "Gerar PDF"}
            </button>

            <button
              type="button"
              onClick={abrirPreparacaoWhatsApp}
              className="rounded-xl bg-green-600 px-4 py-3 text-sm font-black uppercase text-white"
            >
              💬 Preparar mensagem
            </button>

            <button
              type="button"
              onClick={fecharComChoqueSeg}
              className="rounded-xl border border-yellow-400 px-4 py-3 text-sm font-black uppercase text-yellow-400"
            >
              Fechar com a CHOQUESEG
            </button>

            <button
              type="button"
              onClick={limparFormulario}
              className="rounded-xl border border-zinc-600 px-4 py-3 text-sm font-black uppercase text-white"
            >
              Limpar
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1800px] gap-5 p-4 xl:grid-cols-[430px_minmax(0,1fr)] xl:p-6">
        <aside className="self-start rounded-3xl border border-yellow-400/50 bg-black p-5 xl:sticky xl:top-24">
          <div className="space-y-5">
            <Secao titulo="Cliente">
              <Campo titulo="Nome" valor={nome} aoAlterar={setNome} />
              <Campo
                titulo="Telefone"
                valor={telefone}
                aoAlterar={setTelefone}
              />
              <Campo titulo="Cidade" valor={cidade} aoAlterar={setCidade} />
              <Campo
                titulo="Endereço"
                valor={endereco}
                aoAlterar={setEndereco}
              />
            </Secao>

            <Secao titulo="Adicionar equipamento">
              <select
                value={produtoSelecionado}
                onChange={(evento) =>
                  setProdutoSelecionado(evento.target.value)
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
              >
                <option value="">Selecione um produto</option>

                {produtosAutomacao.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={adicionarProduto}
                  className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black"
                >
                  Adicionar catálogo
                </button>

                <button
                  type="button"
                  onClick={adicionarItemManual}
                  className="rounded-xl border border-yellow-400 px-4 py-3 text-sm font-black uppercase text-yellow-400"
                >
                  Item manual
                </button>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-400">
                Selecione equipamentos de automação no catálogo ou use
                <strong className="text-yellow-400"> Item manual</strong> para
                adicionar soluções personalizadas.
              </div>
            </Secao>

            <Secao titulo="Observações">
              <textarea
                value={observacoes}
                onChange={(evento) =>
                  setObservacoes(evento.target.value)
                }
                rows={5}
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
              />
            </Secao>
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <section className="rounded-3xl border border-zinc-800 bg-black p-5">
            <div className="mb-5">
              <h2 className="text-xl font-black uppercase text-yellow-400">
                Itens do orçamento
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Ajuste descrição, unidade, quantidade e valor unitário.
              </p>
            </div>

            {itens.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-700 p-10 text-center text-zinc-500">
                Nenhum equipamento adicionado.
              </div>
            ) : (
              <div className="space-y-4">
                {itens.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
                  >
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_100px_150px_130px_auto] md:items-end">
                      <Campo
                        titulo="Descrição"
                        valor={item.descricao}
                        aoAlterar={(valor) =>
                          atualizarItem(item.id, "descricao", valor)
                        }
                      />

                      <SelectUnidade
                        valor={item.unidade}
                        aoAlterar={(valor) =>
                          atualizarItem(item.id, "unidade", valor)
                        }
                      />

                      <Campo
                        titulo="Quantidade"
                        valor={String(item.quantidade)}
                        aoAlterar={(valor) =>
                          atualizarItem(item.id, "quantidade", valor)
                        }
                      />

                      <Campo
                        titulo="Valor unitário"
                        valor={String(item.valorUnitario)}
                        aoAlterar={(valor) =>
                          atualizarItem(item.id, "valorUnitario", valor)
                        }
                      />

                      <div>
                        <span className="mb-1.5 block text-sm font-bold">
                          Total
                        </span>
                        <div className="rounded-xl border border-zinc-700 bg-black px-3 py-3 font-black text-yellow-400">
                          {moeda(
                            item.quantidade * item.valorUnitario,
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removerItem(item.id)}
                        className="rounded-xl bg-red-700 px-4 py-3 text-sm font-black uppercase text-white"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 grid gap-4 rounded-3xl border border-yellow-400/40 bg-zinc-900 p-5 md:grid-cols-3">
              <Resumo titulo="Subtotal" valor={moeda(totais.subtotal)} />

              <label>
                <span className="mb-1.5 block text-sm font-bold text-zinc-300">
                  Desconto em reais
                </span>
                <input
                  type="number"
                  min="0"
                  value={desconto}
                  onChange={(evento) =>
                    setDesconto(Number(evento.target.value) || 0)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3 font-black text-white outline-none focus:border-yellow-400"
                />
              </label>

              <Resumo
                titulo="Valor final"
                valor={moeda(totais.totalFinal)}
                destaque
              />
            </div>

            <section className="mt-6 border-t border-zinc-800 pt-6">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-yellow-400">
                Condições de pagamento
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-sm font-bold text-zinc-200">
                    Parcelas no cartão
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={parcelasCartao}
                    onChange={(evento) =>
                      setParcelasCartao(Math.max(1, Number(evento.target.value) || 1))
                    }
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-bold text-zinc-200">
                    Acréscimo do cartão (%)
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxaCartao}
                    onChange={(evento) =>
                      setTaxaCartao(Math.max(0, Number(evento.target.value) || 0))
                    }
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-2xl border border-yellow-400/40 bg-black p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
                  Resumo para o cliente
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  À vista: {moeda(totais.totalFinal)}
                </p>
                <p className="mt-1 text-lg font-black text-yellow-400">
                  Cartão: {totais.parcelasValidas}x de {moeda(totais.valorParcela)}
                </p>
                <p className="mt-1 text-sm font-bold text-zinc-400">
                  Total no cartão: {moeda(totais.totalCartao)}
                </p>
              </div>
            </section>
          </section>

          <PreviewAutomacao ref={previewRef} dados={dadosPreview} />
        </section>
      </div>

      {mostrarMensagemWhatsApp && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-black/80 p-3 backdrop-blur-sm md:p-6">
          <div className="mx-auto mt-8 w-full max-w-3xl rounded-3xl border border-green-500/50 bg-zinc-950 p-5 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-400">
                  Mensagem da proposta
                </p>
                <h2 className="mt-1 text-2xl font-black uppercase text-white">
                  Revise antes de abrir o WhatsApp
                </h2>
              </div>
              <button type="button" onClick={() => setMostrarMensagemWhatsApp(false)}
                className="rounded-xl border border-zinc-600 px-3 py-2 text-sm font-black uppercase text-zinc-300">
                Fechar
              </button>
            </div>

            <textarea value={mensagemWhatsApp}
              onChange={(evento) => setMensagemWhatsApp(evento.target.value)}
              rows={12}
              className="mt-5 w-full resize-y rounded-2xl border border-zinc-700 bg-black px-4 py-4 text-sm leading-relaxed text-white outline-none focus:border-green-500"
            />

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={enviarMensagemWhatsApp}
                className="rounded-xl bg-green-600 px-5 py-4 font-black uppercase text-white">
                💬 Abrir WhatsApp com esta mensagem
              </button>
              <button type="button" onClick={() => setMensagemWhatsApp(montarMensagemProposta())}
                className="rounded-xl border border-yellow-400 px-5 py-4 font-black uppercase text-yellow-400">
                Restaurar mensagem sugerida
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-zinc-800 pt-5 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-black uppercase tracking-[0.18em] text-yellow-400">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Campo({
  titulo,
  valor,
  aoAlterar,
}: {
  titulo: string;
  valor: string;
  aoAlterar: (valor: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-zinc-200">
        {titulo}
      </span>
      <input
        type="text"
        value={valor}
        autoComplete="off"
        onChange={(evento) => aoAlterar(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
      />
    </label>
  );
}

function SelectUnidade({
  valor,
  aoAlterar,
}: {
  valor: UnidadeOrcamento;
  aoAlterar: (valor: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-zinc-200">
        Unidade
      </span>
      <select
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
      >
        {unidades.map((unidade) => (
          <option key={unidade} value={unidade}>
            {unidade}
          </option>
        ))}
      </select>
    </label>
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
    <div>
      <p className="text-sm font-bold text-zinc-400">{titulo}</p>
      <p
        className={`mt-2 text-xl font-black ${
          destaque ? "text-yellow-400" : "text-white"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}