"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CartaoFinanceiro, CompraCartao } from "./types";

type SituacaoConta = "Pendente" | "Pago" | "Atrasado";

type ContaPagar = {
  id: string;
  descricao: string;
  categoria: string;
  fornecedor: string;
  valor: number;
  vencimento: string;
  formaPagamento: string;
  contaFinanceira: string;
  cartaoId?: string;
  situacao: SituacaoConta;
  observacao?: string;
  recorrenciaId?: string;
  parcelaAtual?: number;
  totalParcelas?: number;
  criadoEm: string;
};

const CHAVE_CONTAS_PAGAR = "choqueseg-financeiro-contas-pagar";
const CHAVE_CARTOES = "choqueseg-financeiro-cartoes";

const categorias = [
  "Fornecedor",
  "Material",
  "Combustível",
  "Alimentação",
  "Aluguel",
  "Energia",
  "Internet",
  "Salário",
  "Imposto",
  "Manutenção",
  "Outros",
];

const formasPagamento = [
  "PIX",
  "Dinheiro",
  "Débito",
  "Crédito",
  "Transferência",
  "Boleto",
  "Outro",
];

export default function ContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [cartoes, setCartoes] = useState<CartaoFinanceiro[]>([]);

  const [dadosCarregados, setDadosCarregados] = useState(false);
  const [cartoesCarregados, setCartoesCarregados] = useState(false);

  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Fornecedor");
  const [fornecedor, setFornecedor] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [contaFinanceira, setContaFinanceira] = useState("");
  const [cartaoId, setCartaoId] = useState("");
  const [situacao, setSituacao] =
    useState<SituacaoConta>("Pendente");
  const [observacao, setObservacao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [contaExpandidaId, setContaExpandidaId] = useState<string | null>(null);
  const [repeticao, setRepeticao] = useState<"Único" | "Mensal">("Único");
  const [quantidadeParcelas, setQuantidadeParcelas] = useState("12");

  const [busca, setBusca] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState<
    "Todas" | SituacaoConta
  >("Todas");

  useEffect(() => {
    const dadosSalvos = localStorage.getItem(CHAVE_CONTAS_PAGAR);

    if (dadosSalvos) {
      try {
        const dados = JSON.parse(dadosSalvos);
        setContas(Array.isArray(dados) ? dados : []);
      } catch {
        localStorage.removeItem(CHAVE_CONTAS_PAGAR);
        setContas([]);
        setMensagem(
          "Os dados das contas a pagar estavam inválidos e foram reiniciados.",
        );
      }
    }

    setDadosCarregados(true);
  }, []);


  useEffect(() => {
    const recarregarPorCentralVoz = () => {
      try {
        const bruto = localStorage.getItem(CHAVE_CONTAS_PAGAR);
        const dados = bruto ? JSON.parse(bruto) : [];
        setContas(Array.isArray(dados) ? dados : []);
      } catch {
        setContas([]);
      }
    };

    window.addEventListener(
      "choqueseg-financeiro-atualizado",
      recarregarPorCentralVoz,
    );

    return () => {
      window.removeEventListener(
        "choqueseg-financeiro-atualizado",
        recarregarPorCentralVoz,
      );
    };
  }, []);

  useEffect(() => {
    const cartoesSalvos = localStorage.getItem(CHAVE_CARTOES);

    if (cartoesSalvos) {
      try {
        const dados = JSON.parse(cartoesSalvos);
        setCartoes(Array.isArray(dados) ? dados : []);
      } catch {
        localStorage.removeItem(CHAVE_CARTOES);
        setCartoes([]);
      }
    }

    setCartoesCarregados(true);
  }, []);

  useEffect(() => {
    if (!dadosCarregados) return;

    localStorage.setItem(
      CHAVE_CONTAS_PAGAR,
      JSON.stringify(contas),
    );

    window.dispatchEvent(
      new CustomEvent("choqueseg-financeiro-atualizado"),
    );
  }, [contas, dadosCarregados]);

  useEffect(() => {
    if (!cartoesCarregados) return;

    localStorage.setItem(
      CHAVE_CARTOES,
      JSON.stringify(cartoes),
    );
  }, [cartoes, cartoesCarregados]);

  useEffect(() => {
    if (formaPagamento !== "Crédito") {
      setCartaoId("");
    }
  }, [formaPagamento]);

  const cartoesAtivos = useMemo(() => {
    return cartoes.filter((cartao) => cartao.ativo);
  }, [cartoes]);

  const contasAtualizadas = useMemo(() => {
    const hoje = hojeLocalISO();

    return contas.map((conta) => {
      if (
        conta.situacao === "Pendente" &&
        conta.vencimento &&
        conta.vencimento < hoje
      ) {
        return {
          ...conta,
          situacao: "Atrasado" as SituacaoConta,
        };
      }

      return conta;
    });
  }, [contas]);

  const contasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return contasAtualizadas
      .filter((conta) => {
        const atendeBusca =
          !termo ||
          conta.descricao.toLowerCase().includes(termo) ||
          conta.fornecedor.toLowerCase().includes(termo) ||
          conta.categoria.toLowerCase().includes(termo);

        const atendeSituacao =
          filtroSituacao === "Todas" ||
          conta.situacao === filtroSituacao;

        return atendeBusca && atendeSituacao;
      })
      .sort((a, b) =>
        a.vencimento.localeCompare(b.vencimento),
      );
  }, [contasAtualizadas, busca, filtroSituacao]);

  const resumo = useMemo(() => {
    let pendente = 0;
    let pago = 0;
    let atrasado = 0;

    for (const conta of contasAtualizadas) {
      if (conta.situacao === "Pago") {
        pago += conta.valor;
      } else if (conta.situacao === "Atrasado") {
        atrasado += conta.valor;
      } else {
        pendente += conta.valor;
      }
    }

    return { pendente, pago, atrasado };
  }, [contasAtualizadas]);


  const lembretesPagamento = useMemo(() => {
    return contasAtualizadas
      .filter((conta) => {
        if (conta.situacao === "Pago") return false;

        const dias = diasAte(conta.vencimento);

        return dias <= 2;
      })
      .sort((a, b) =>
        a.vencimento.localeCompare(b.vencimento),
      );
  }, [contasAtualizadas]);

  function salvarConta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    const valorNumerico = Number(
      valor.replace(/\./g, "").replace(",", "."),
    );

    if (!descricao.trim()) {
      setMensagem("Informe a descrição da conta.");
      return;
    }

    if (!valorNumerico || valorNumerico <= 0) {
      setMensagem("Informe um valor válido.");
      return;
    }

    if (!vencimento) {
      setMensagem("Informe a data de vencimento.");
      return;
    }

    if (formaPagamento === "Crédito" && !cartaoId) {
      setMensagem("Selecione o cartão utilizado.");
      return;
    }

    if (formaPagamento === "Crédito" && situacao === "Pago") {
      const cartaoSelecionado = cartoes.find(
        (cartao) => cartao.id === cartaoId,
      );

      if (!cartaoSelecionado) {
        setMensagem("O cartão selecionado não foi encontrado.");
        return;
      }

      if (!cartaoSelecionado.ativo) {
        setMensagem("O cartão selecionado está inativo.");
        return;
      }

      const utilizado = cartaoSelecionado.limiteUtilizado ?? 0;

      const disponivel =
        cartaoSelecionado.limite - utilizado;

      if (valorNumerico > disponivel) {
        setMensagem(
          `Limite insuficiente. Disponível: ${formatarMoeda(
            disponivel,
          )}.`,
        );
        return;
      }
    }

    const quantidade =
      repeticao === "Mensal"
        ? Math.max(1, Math.min(120, Number(quantidadeParcelas) || 1))
        : 1;

    const recorrenciaId =
      quantidade > 1 ? crypto.randomUUID() : undefined;

    const novasContas: ContaPagar[] = Array.from(
      { length: quantidade },
      (_, indice) => ({
        id: crypto.randomUUID(),
        descricao: descricao.trim(),
        categoria,
        fornecedor: fornecedor.trim(),
        valor: valorNumerico,
        vencimento: adicionarMeses(vencimento, indice),
        formaPagamento,
        contaFinanceira:
          formaPagamento === "Crédito"
            ? ""
            : contaFinanceira.trim(),
        cartaoId:
          formaPagamento === "Crédito"
            ? cartaoId
            : undefined,
        situacao:
          indice === 0 ? situacao : "Pendente",
        observacao: observacao.trim() || undefined,
        recorrenciaId,
        parcelaAtual: quantidade > 1 ? indice + 1 : undefined,
        totalParcelas: quantidade > 1 ? quantidade : undefined,
        criadoEm: new Date().toISOString(),
      }),
    );

    if (
      formaPagamento === "Crédito" &&
      situacao === "Pago" &&
      cartaoId
    ) {
      registrarCompraCartao(novasContas[0]);
    }

    setContas((atuais) => [...novasContas, ...atuais]);

    setDescricao("");
    setFornecedor("");
    setValor("");
    setVencimento("");
    setContaFinanceira("");
    setCartaoId("");
    setObservacao("");
    setSituacao("Pendente");
    setRepeticao("Único");
    setQuantidadeParcelas("12");

    setMensagem(
      quantidade > 1
        ? `${quantidade} vencimentos mensais cadastrados com sucesso.`
        : "Conta cadastrada com sucesso.",
    );
  }

  function registrarCompraCartao(conta: ContaPagar) {
    if (!conta.cartaoId) return;

    setCartoes((atuais) =>
      atuais.map((cartao) => {
        if (cartao.id !== conta.cartaoId) {
          return cartao;
        }

        const comprasAtuais = cartao.compras ?? [];

        const compraJaExiste = comprasAtuais.some(
          (compra) =>
            compra.contaPagarId === conta.id &&
            compra.situacao !== "Cancelada",
        );

        if (compraJaExiste) {
          return cartao;
        }

        const novaCompra: CompraCartao = {
          id: crypto.randomUUID(),
          descricao: conta.descricao,
          valor: conta.valor,
          data:
            conta.vencimento ||
            new Date().toISOString().slice(0, 10),
          categoria: conta.categoria,
          fornecedor: conta.fornecedor || undefined,
          contaPagarId: conta.id,
          observacao: conta.observacao,
          situacao: "Aberta",
          criadoEm: new Date().toISOString(),
        };

        return {
          ...cartao,
          limiteUtilizado:
            (cartao.limiteUtilizado ?? 0) +
            conta.valor,
          compras: [novaCompra, ...comprasAtuais],
        };
      }),
    );
  }

  function alterarSituacao(
    id: string,
    novaSituacao: SituacaoConta,
  ) {
    const conta = contas.find((item) => item.id === id);

    if (!conta) return;

    if (
      novaSituacao === "Pago" &&
      conta.formaPagamento === "Crédito" &&
      conta.cartaoId
    ) {
      const cartaoSelecionado = cartoes.find(
        (cartao) => cartao.id === conta.cartaoId,
      );

      if (!cartaoSelecionado) {
        setMensagem("O cartão da conta não foi encontrado.");
        return;
      }

      const compraJaExiste = (
        cartaoSelecionado.compras ?? []
      ).some(
        (compra) =>
          compra.contaPagarId === conta.id &&
          compra.situacao !== "Cancelada",
      );

      if (!compraJaExiste) {
        const utilizado =
          cartaoSelecionado.limiteUtilizado ?? 0;

        const disponivel =
          cartaoSelecionado.limite - utilizado;

        if (conta.valor > disponivel) {
          setMensagem(
            `Não foi possível pagar. O cartão ${cartaoSelecionado.nome} possui apenas ${formatarMoeda(
              disponivel,
            )} disponíveis.`,
          );
          return;
        }

        registrarCompraCartao(conta);
      }
    }

    setContas((atuais) =>
      atuais.map((contaAtual) =>
        contaAtual.id === id
          ? {
              ...contaAtual,
              situacao: novaSituacao,
            }
          : contaAtual,
      ),
    );

    setMensagem("Situação atualizada com sucesso.");
  }

  function mesmaRecorrencia(contaBase: ContaPagar, item: ContaPagar) {
    if (
      contaBase.recorrenciaId &&
      item.recorrenciaId &&
      contaBase.recorrenciaId === item.recorrenciaId
    ) {
      return true;
    }

    // Compatibilidade com recorrências antigas/geradas por outras rotas:
    // identifica parcelas do mesmo lançamento pelos dados principais.
    const texto = (valor: string | undefined) =>
      String(valor ?? "").trim().toLowerCase();

    return Boolean(
      contaBase.totalParcelas &&
        item.totalParcelas &&
        contaBase.totalParcelas === item.totalParcelas &&
        texto(contaBase.descricao) === texto(item.descricao) &&
        texto(contaBase.fornecedor) === texto(item.fornecedor) &&
        texto(contaBase.categoria) === texto(item.categoria) &&
        Number(contaBase.valor) === Number(item.valor) &&
        texto(contaBase.formaPagamento) === texto(item.formaPagamento),
    );
  }

  function persistirContas(novasContas: ContaPagar[]) {
    setContas(novasContas);
    localStorage.setItem(CHAVE_CONTAS_PAGAR, JSON.stringify(novasContas));
    window.dispatchEvent(
      new CustomEvent("choqueseg-financeiro-atualizado"),
    );
  }

  function ajustarCartoesAoExcluir(contasExcluidas: ContaPagar[]) {
    if (contasExcluidas.length === 0) return;

    const idsExcluidos = new Set(contasExcluidas.map((conta) => conta.id));

    setCartoes((atuais) =>
      atuais.map((cartao) => {
        const comprasAtuais = cartao.compras ?? [];
        const comprasRemovidas = comprasAtuais.filter(
          (compra) =>
            compra.contaPagarId &&
            idsExcluidos.has(compra.contaPagarId) &&
            compra.situacao !== "Cancelada",
        );

        if (comprasRemovidas.length === 0) return cartao;

        const valorRemovido = comprasRemovidas.reduce(
          (total, compra) => total + Number(compra.valor || 0),
          0,
        );

        return {
          ...cartao,
          limiteUtilizado: Math.max(
            0,
            (cartao.limiteUtilizado ?? 0) - valorRemovido,
          ),
          compras: comprasAtuais.filter(
            (compra) =>
              !(
                compra.contaPagarId &&
                idsExcluidos.has(compra.contaPagarId)
              ),
          ),
        };
      }),
    );
  }

  function excluirConta(conta: ContaPagar) {
    const confirmar = window.confirm(
      "Deseja realmente excluir esta parcela/conta?",
    );

    if (!confirmar) return;

    ajustarCartoesAoExcluir([conta]);

    const novasContas = contas.filter(
      (contaAtual) => contaAtual.id !== conta.id,
    );
    persistirContas(novasContas);

    if (contaExpandidaId === conta.id) {
      setContaExpandidaId(null);
    }

    setMensagem(
      conta.recorrenciaId
        ? "Parcela excluída. Os totais foram recalculados automaticamente."
        : "Conta excluída com sucesso. Os totais foram recalculados.",
    );
  }

  function excluirRecorrencia(conta: ContaPagar) {
    const grupo = contas.filter((item) =>
      mesmaRecorrencia(conta, item),
    );

    if (grupo.length <= 1 && !conta.recorrenciaId && !conta.totalParcelas) {
      excluirConta(conta);
      return;
    }

    const totalGrupo = grupo.reduce(
      (total, item) => total + Number(item.valor || 0),
      0,
    );

    const confirmar = window.confirm(
      `Excluir TODAS as ${grupo.length} parcela(s) deste lançamento?\n\n` +
        `${conta.descricao}\n` +
        `Valor que será retirado do financeiro: ${formatarMoeda(totalGrupo)}\n\n` +
        `Depois da exclusão, os totais serão recalculados imediatamente.`,
    );

    if (!confirmar) return;

    ajustarCartoesAoExcluir(grupo);

    const ids = new Set(grupo.map((item) => item.id));
    const novasContas = contas.filter((item) => !ids.has(item.id));

    persistirContas(novasContas);
    setContaExpandidaId(null);

    const saldoRestante = novasContas
      .filter((item) => item.situacao !== "Pago")
      .reduce((total, item) => total + Number(item.valor || 0), 0);

    setMensagem(
      `${grupo.length} parcela(s) excluída(s). Total pendente atualizado: ${formatarMoeda(saldoRestante)}.`,
    );
  }

  function nomeCartao(id?: string) {
    if (!id) return "";

    return (
      cartoes.find((cartao) => cartao.id === id)?.nome ??
      "Cartão não encontrado"
    );
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-black p-5">
      <div>
        <p className="text-xs font-black uppercase text-yellow-400">
          Obrigações financeiras
        </p>

        <h3 className="mt-1 text-2xl font-black uppercase text-white">
          Contas a pagar
        </h3>

        <p className="mt-2 text-sm text-zinc-400">
          Controle despesas, vencimentos, fornecedores e pagamentos.
        </p>
      </div>

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      {lembretesPagamento.length > 0 && (
        <section className="mt-5 rounded-2xl border border-orange-400/50 bg-orange-400/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-orange-300">
                ⏰ Lembretes de pagamento
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                Contas vencidas ou com vencimento nos próximos 2 dias.
              </p>
            </div>
            <span className="rounded-full bg-orange-400 px-3 py-1 text-sm font-black text-black">
              {lembretesPagamento.length}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {lembretesPagamento.map((conta) => {
              const dias = diasAte(conta.vencimento);

              return (
                <div
                  key={`lembrete-${conta.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-orange-400/25 bg-black/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-black text-white">
                      {conta.descricao}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {conta.fornecedor || "Fornecedor não informado"} ·{" "}
                      {formatarData(conta.vencimento)}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="font-black text-yellow-400">
                      {formatarMoeda(conta.valor)}
                    </p>
                    <p
                      className={`mt-1 text-xs font-black uppercase ${
                        dias < 0 ? "text-red-400" : "text-orange-300"
                      }`}
                    >
                      {textoPrazoPagamento(dias)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <CardResumo
          titulo="Pendente"
          valor={resumo.pendente}
        />

        <CardResumo
          titulo="Pago"
          valor={resumo.pago}
        />

        <CardResumo
          titulo="Atrasado"
          valor={resumo.atrasado}
        />
      </div>

      <form
        onSubmit={salvarConta}
        className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CampoTexto
            label="Descrição"
            valor={descricao}
            onChange={setDescricao}
            placeholder="Ex.: Combustível"
          />

          <CampoSelect
            label="Categoria"
            valor={categoria}
            onChange={setCategoria}
            opcoes={categorias}
          />

          <CampoTexto
            label="Fornecedor"
            valor={fornecedor}
            onChange={setFornecedor}
            placeholder="Ex.: Posto de combustível"
          />

          <CampoTexto
            label="Valor"
            valor={valor}
            onChange={setValor}
            placeholder="Ex.: 350,00"
          />

          <CampoTexto
            label="Vencimento"
            valor={vencimento}
            onChange={setVencimento}
            tipo="date"
          />

          <CampoSelect
            label="Forma de pagamento"
            valor={formaPagamento}
            onChange={setFormaPagamento}
            opcoes={formasPagamento}
          />

          {formaPagamento === "Crédito" ? (
            <div>
              <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
                Cartão utilizado
              </label>

              <select
                value={cartaoId}
                onChange={(evento) =>
                  setCartaoId(evento.target.value)
                }
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
              >
                <option value="">
                  Selecione um cartão
                </option>

                {cartoesAtivos.map((cartao) => {
                  const disponivel =
                    cartao.limite -
                    (cartao.limiteUtilizado ?? 0);

                  return (
                    <option
                      key={cartao.id}
                      value={cartao.id}
                    >
                      {cartao.nome} - disponível{" "}
                      {formatarMoeda(disponivel)}
                    </option>
                  );
                })}
              </select>

              {cartoesAtivos.length === 0 && (
                <p className="mt-2 text-xs font-bold text-red-400">
                  Nenhum cartão ativo cadastrado.
                </p>
              )}
            </div>
          ) : (
            <CampoTexto
              label="Conta financeira"
              valor={contaFinanceira}
              onChange={setContaFinanceira}
              placeholder="Ex.: Banco do Brasil"
            />
          )}

          <CampoSelect
            label="Situação"
            valor={situacao}
            onChange={(valor) =>
              setSituacao(valor as SituacaoConta)
            }
            opcoes={["Pendente", "Pago", "Atrasado"]}
          />

          <CampoSelect
            label="Repetição"
            valor={repeticao}
            onChange={(valor) =>
              setRepeticao(valor as "Único" | "Mensal")
            }
            opcoes={["Único", "Mensal"]}
          />

          {repeticao === "Mensal" && (
            <CampoTexto
              label="Quantidade de meses / parcelas"
              valor={quantidadeParcelas}
              onChange={setQuantidadeParcelas}
              placeholder="Ex.: 12"
              tipo="number"
            />
          )}
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
            Observação
          </label>

          <textarea
            value={observacao}
            onChange={(evento) =>
              setObservacao(evento.target.value)
            }
            rows={3}
            placeholder="Detalhes adicionais"
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
          />
        </div>

        <button
          type="submit"
          className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black"
        >
          Cadastrar conta
        </button>
      </form>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <CampoTexto
            label="Pesquisar"
            valor={busca}
            onChange={setBusca}
            placeholder="Descrição, fornecedor ou categoria"
          />

          <CampoSelect
            label="Situação"
            valor={filtroSituacao}
            onChange={(valor) =>
              setFiltroSituacao(
                valor as "Todas" | SituacaoConta,
              )
            }
            opcoes={[
              "Todas",
              "Pendente",
              "Pago",
              "Atrasado",
            ]}
          />
        </div>

        <div className="mt-6 space-y-3">
          {contasFiltradas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
              Nenhuma conta encontrada.
            </div>
          ) : (
            contasFiltradas.map((conta) => {
              const expandida = contaExpandidaId === conta.id;

              return (
                <article
                  key={conta.id}
                  className="rounded-2xl border border-zinc-800 bg-black transition hover:border-zinc-700"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setContaExpandidaId((atual) =>
                        atual === conta.id ? null : conta.id,
                      )
                    }
                    className="flex w-full min-w-0 items-center justify-between gap-3 p-4 text-left"
                    aria-expanded={expandida}
                  >
                    <div className="min-w-0">
                      <h4 className="truncate text-base font-black uppercase text-white">
                        {conta.descricao}
                      </h4>

                      <p className="mt-1 truncate text-sm text-zinc-400">
                        {conta.fornecedor || "Fornecedor não informado"}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="font-black text-yellow-400">
                          {formatarMoeda(conta.valor)}
                        </span>
                        <span className="text-zinc-500">
                          📅 {formatarData(conta.vencimento)}
                        </span>
                        <span
                          className={`font-black uppercase ${
                            conta.situacao === "Pago"
                              ? "text-emerald-400"
                              : conta.situacao === "Atrasado"
                                ? "text-red-400"
                                : "text-yellow-300"
                          }`}
                        >
                          {conta.situacao}
                        </span>
                        {conta.totalParcelas && conta.parcelaAtual && (
                          <span className="font-black text-blue-300">
                            {conta.parcelaAtual}/{conta.totalParcelas}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-black text-zinc-300">
                      {expandida ? "▲" : "▼"}
                    </span>
                  </button>

                  {expandida && (
                    <div className="border-t border-zinc-800 px-4 pb-4 pt-4">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <ResumoDetalhe titulo="Categoria" valor={conta.categoria} />
                        <ResumoDetalhe
                          titulo="Forma de pagamento"
                          valor={conta.formaPagamento}
                        />
                        <ResumoDetalhe
                          titulo="Conta / cartão"
                          valor={
                            conta.formaPagamento === "Crédito" && conta.cartaoId
                              ? nomeCartao(conta.cartaoId)
                              : conta.contaFinanceira || "Não informado"
                          }
                        />
                        <ResumoDetalhe
                          titulo="Recorrência"
                          valor={
                            conta.totalParcelas && conta.parcelaAtual
                              ? `Mensal • ${conta.parcelaAtual}/${conta.totalParcelas}`
                              : "Única"
                          }
                        />
                      </div>

                      {conta.observacao && (
                        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-400">
                          <p className="mb-1 text-xs font-black uppercase text-zinc-500">
                            Observação
                          </p>
                          {conta.observacao}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {conta.situacao !== "Pago" && (
                          <button
                            type="button"
                            onClick={() => alterarSituacao(conta.id, "Pago")}
                            className="rounded-xl border border-emerald-500/50 px-4 py-2 text-sm font-black uppercase text-emerald-400"
                          >
                            Marcar como pago
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => excluirConta(conta)}
                          className="rounded-xl border border-red-500/50 px-4 py-2 text-sm font-black uppercase text-red-400"
                        >
                          Excluir esta parcela
                        </button>

                        {conta.recorrenciaId && (
                          <button
                            type="button"
                            onClick={() => excluirRecorrencia(conta)}
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black uppercase text-white"
                          >
                            Excluir todas as parcelas
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </section>
  );
}



function ResumoDetalhe({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
      <p className="text-xs font-black uppercase text-zinc-500">{titulo}</p>
      <p className="mt-1 break-words text-sm font-bold text-zinc-200">
        {valor || "—"}
      </p>
    </div>
  );
}

function adicionarMeses(dataISO: string, quantidade: number) {
  if (!dataISO || quantidade === 0) return dataISO;

  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const base = new Date(ano, mes - 1 + quantidade, 1);
  const ultimoDia = new Date(
    base.getFullYear(),
    base.getMonth() + 1,
    0,
  ).getDate();

  const diaSeguro = Math.min(dia, ultimoDia);

  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(diaSeguro).padStart(2, "0")}`;
}

function hojeLocalISO() {
  const agora = new Date();
  const local = new Date(
    agora.getTime() - agora.getTimezoneOffset() * 60_000,
  );

  return local.toISOString().slice(0, 10);
}

function diasAte(dataISO: string) {
  if (!dataISO) return Number.POSITIVE_INFINITY;

  const hoje = new Date(`${hojeLocalISO()}T12:00:00`);
  const alvo = new Date(`${dataISO}T12:00:00`);

  return Math.round(
    (alvo.getTime() - hoje.getTime()) / 86_400_000,
  );
}

function textoPrazoPagamento(dias: number) {
  if (dias < 0) return `Atrasado há ${Math.abs(dias)} dia(s)`;
  if (dias === 0) return "Vence hoje";
  if (dias === 1) return "Vence amanhã";
  if (dias === 2) return "Vence em 2 dias";

  return "";
}

function CardResumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs font-black uppercase text-zinc-500">
        {titulo}
      </p>

      <p className="mt-2 text-xl font-black text-yellow-400">
        {formatarMoeda(valor)}
      </p>
    </div>
  );
}

function CampoTexto({
  label,
  valor,
  onChange,
  placeholder,
  tipo = "text",
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  tipo?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>

      <input
        type={tipo}
        min={tipo === "number" ? 1 : undefined}
        max={tipo === "number" ? 120 : undefined}
        value={valor}
        placeholder={placeholder}
        onChange={(evento) =>
          onChange(evento.target.value)
        }
        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </div>
  );
}

function CampoSelect({
  label,
  valor,
  onChange,
  opcoes,
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  opcoes: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>

      <select
        value={valor}
        onChange={(evento) =>
          onChange(evento.target.value)
        }
        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
      >
        {opcoes.map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>
    </div>
  );
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(data: string) {
  if (!data) return "Data não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(`${data}T00:00:00`));
}