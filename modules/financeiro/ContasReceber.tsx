"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type SituacaoRecebimento =
  | "Pendente"
  | "Recebido"
  | "Atrasado"
  | "Parcial";

type ContaReceber = {
  id: string;
  descricao: string;
  cliente: string;
  categoria: string;
  valorTotal: number;
  valorRecebido: number;
  vencimento: string;
  formaRecebimento: string;
  contaFinanceira: string;
  situacao: SituacaoRecebimento;
  observacao?: string;
  telefoneCliente?: string;
  recorrenciaId?: string;
  parcelaAtual?: number;
  totalParcelas?: number;
  criadoEm: string;
};

const CHAVE_CONTAS_RECEBER =
  "choqueseg-financeiro-contas-receber";

const categorias = [
  "Venda",
  "Serviço",
  "Energia Solar",
  "Segurança Eletrônica",
  "Elétrica",
  "Automação",
  "Manutenção",
  "Outros",
];

const formasRecebimento = [
  "PIX",
  "Dinheiro",
  "Débito",
  "Crédito",
  "Transferência",
  "Boleto",
  "Outro",
];

export default function ContasReceber() {
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  const [descricao, setDescricao] = useState("");
  const [cliente, setCliente] = useState("");
  const [categoria, setCategoria] = useState("Venda");
  const [valorTotal, setValorTotal] = useState("");
  const [valorRecebido, setValorRecebido] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [formaRecebimento, setFormaRecebimento] =
    useState("PIX");
  const [contaFinanceira, setContaFinanceira] = useState("");
  const [observacao, setObservacao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [contaExpandidaId, setContaExpandidaId] = useState<string | null>(null);
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [repeticao, setRepeticao] = useState<"Único" | "Mensal">("Único");
  const [quantidadeParcelas, setQuantidadeParcelas] = useState("1");

  const [busca, setBusca] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState<
    "Todas" | SituacaoRecebimento
  >("Todas");

  useEffect(() => {
    const dadosSalvos = localStorage.getItem(
      CHAVE_CONTAS_RECEBER,
    );

    if (dadosSalvos) {
      try {
        const dados = JSON.parse(dadosSalvos);
        setContas(Array.isArray(dados) ? dados : []);
      } catch {
        localStorage.removeItem(CHAVE_CONTAS_RECEBER);
        setContas([]);
        setMensagem(
          "Os dados das contas a receber estavam inválidos e foram reiniciados.",
        );
      }
    }

    setDadosCarregados(true);
  }, []);


  useEffect(() => {
    const recarregarPorCentralVoz = () => {
      try {
        const bruto = localStorage.getItem(CHAVE_CONTAS_RECEBER);
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
    if (!dadosCarregados) return;

    localStorage.setItem(
      CHAVE_CONTAS_RECEBER,
      JSON.stringify(contas),
    );

    window.dispatchEvent(
      new CustomEvent("choqueseg-financeiro-atualizado"),
    );
  }, [contas, dadosCarregados]);

  function calcularSituacao(
    valor: number,
    recebido: number,
    vencimentoConta: string,
  ): SituacaoRecebimento {
    const hoje = hojeLocalISO();

    if (recebido >= valor) return "Recebido";
    if (recebido > 0) return "Parcial";
    if (vencimentoConta && vencimentoConta < hoje) {
      return "Atrasado";
    }

    return "Pendente";
  }

  const contasAtualizadas = useMemo(() => {
    return contas.map((conta) => ({
      ...conta,
      situacao: calcularSituacao(
        conta.valorTotal,
        conta.valorRecebido,
        conta.vencimento,
      ),
    }));
  }, [contas]);

  const contasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return contasAtualizadas
      .filter((conta) => {
        const atendeBusca =
          !termo ||
          conta.descricao.toLowerCase().includes(termo) ||
          conta.cliente.toLowerCase().includes(termo) ||
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
    let totalPrevisto = 0;
    let totalRecebido = 0;
    let totalPendente = 0;
    let totalAtrasado = 0;

    for (const conta of contasAtualizadas) {
      const restante = Math.max(
        0,
        conta.valorTotal - conta.valorRecebido,
      );

      totalPrevisto += conta.valorTotal;
      totalRecebido += conta.valorRecebido;

      if (conta.situacao === "Atrasado") {
        totalAtrasado += restante;
      } else if (
        conta.situacao === "Pendente" ||
        conta.situacao === "Parcial"
      ) {
        totalPendente += restante;
      }
    }

    return {
      totalPrevisto,
      totalRecebido,
      totalPendente,
      totalAtrasado,
    };
  }, [contasAtualizadas]);


  const lembretesCobranca = useMemo(() => {
    return contasAtualizadas
      .filter((conta) => {
        if (conta.situacao === "Recebido") return false;

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

    const total = converterValor(valorTotal);
    const recebido = converterValor(valorRecebido || "0");

    if (!descricao.trim()) {
      setMensagem("Informe a descrição do recebimento.");
      return;
    }

    if (!cliente.trim()) {
      setMensagem("Informe o cliente.");
      return;
    }

    if (!total || total <= 0) {
      setMensagem("Informe um valor total válido.");
      return;
    }

    if (recebido < 0 || recebido > total) {
      setMensagem(
        "O valor recebido deve estar entre zero e o valor total.",
      );
      return;
    }

    if (!vencimento) {
      setMensagem("Informe a data de vencimento.");
      return;
    }

    const quantidade =
      repeticao === "Mensal"
        ? Math.max(1, Math.min(120, Number(quantidadeParcelas) || 1))
        : 1;

    const recorrenciaId =
      quantidade > 1 ? crypto.randomUUID() : undefined;

    const novasContas: ContaReceber[] = Array.from(
      { length: quantidade },
      (_, indice) => ({
        id: crypto.randomUUID(),
        descricao: descricao.trim(),
        cliente: cliente.trim(),
        categoria,
        valorTotal: total,
        valorRecebido: indice === 0 ? recebido : 0,
        vencimento: adicionarMeses(vencimento, indice),
        formaRecebimento,
        contaFinanceira: contaFinanceira.trim(),
        situacao: calcularSituacao(
          total,
          indice === 0 ? recebido : 0,
          adicionarMeses(vencimento, indice),
        ),
        observacao: observacao.trim() || undefined,
        telefoneCliente: telefoneCliente.trim() || undefined,
        recorrenciaId,
        parcelaAtual: quantidade > 1 ? indice + 1 : undefined,
        totalParcelas: quantidade > 1 ? quantidade : undefined,
        criadoEm: new Date().toISOString(),
      }),
    );

    setContas((atuais) => [...novasContas, ...atuais]);

    setDescricao("");
    setCliente("");
    setValorTotal("");
    setValorRecebido("");
    setVencimento("");
    setContaFinanceira("");
    setObservacao("");
    setTelefoneCliente("");
    setRepeticao("Único");
    setQuantidadeParcelas("1");

    setMensagem(
      quantidade > 1
        ? `${quantidade} cobranças mensais cadastradas com sucesso.`
        : "Conta a receber cadastrada com sucesso.",
    );
  }

  function registrarRecebimento(conta: ContaReceber) {
    const valorInformado = window.prompt(
      `Informe o valor recebido. Restante: ${formatarMoeda(
        Math.max(
          0,
          conta.valorTotal - conta.valorRecebido,
        ),
      )}`,
    );

    if (valorInformado === null) return;

    const valor = converterValor(valorInformado);

    if (!valor || valor <= 0) {
      window.alert("Informe um valor válido.");
      return;
    }

    const novoTotalRecebido =
      conta.valorRecebido + valor;

    if (novoTotalRecebido > conta.valorTotal) {
      window.alert(
        "O recebimento ultrapassa o valor total da conta.",
      );
      return;
    }

    const contaAtualizada: ContaReceber = {
      ...conta,
      valorRecebido: novoTotalRecebido,
      situacao: calcularSituacao(
        conta.valorTotal,
        novoTotalRecebido,
        conta.vencimento,
      ),
    };

    setContas((atuais) =>
      atuais.map((item) =>
        item.id === conta.id ? contaAtualizada : item,
      ),
    );

    setMensagem("Recebimento registrado com sucesso.");

    if (
      window.confirm(
        "Pagamento registrado. Deseja gerar o recibo agora?",
      )
    ) {
      gerarRecibo(contaAtualizada, valor);
    }
  }

  function marcarRecebido(conta: ContaReceber) {
    const valorRecebidoAgora = Math.max(
      0,
      conta.valorTotal - conta.valorRecebido,
    );

    const contaAtualizada: ContaReceber = {
      ...conta,
      valorRecebido: conta.valorTotal,
      situacao: "Recebido",
    };

    setContas((atuais) =>
      atuais.map((item) =>
        item.id === conta.id ? contaAtualizada : item,
      ),
    );

    setMensagem("Recebimento concluído com sucesso.");

    if (
      window.confirm(
        "Pagamento concluído. Deseja gerar o recibo agora?",
      )
    ) {
      gerarRecibo(contaAtualizada, valorRecebidoAgora || conta.valorTotal);
    }
  }

  function gerarRecibo(
    conta: ContaReceber,
    valorDoRecibo = conta.valorRecebido,
  ) {
    const janela = window.open("", "_blank", "width=820,height=900");

    if (!janela) {
      window.alert(
        "O navegador bloqueou a abertura do recibo. Permita pop-ups para o CHOQUESEG PRO.",
      );
      return;
    }

    const numeroRecibo = `REC-${new Date()
      .toISOString()
      .replace(/\D/g, "")
      .slice(0, 14)}`;

    const valorExtensoInformativo = formatarMoeda(valorDoRecibo);
    const descricaoRecibo = conta.descricao || conta.categoria;
    const dataRecibo = new Intl.DateTimeFormat("pt-BR").format(new Date());

    const html = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Recibo CHOQUESEG - ${conta.cliente}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 32px;
              font-family: Arial, Helvetica, sans-serif;
              background: #f3f4f6;
              color: #111827;
            }
            .recibo {
              max-width: 760px;
              margin: 0 auto;
              background: #fff;
              border: 3px solid #facc15;
              border-radius: 20px;
              overflow: hidden;
            }
            .topo {
              background: #050505;
              color: white;
              padding: 24px 28px;
              border-bottom: 5px solid #facc15;
            }
            .empresa {
              color: #facc15;
              font-size: 28px;
              font-weight: 900;
              letter-spacing: .5px;
            }
            .sub {
              margin-top: 4px;
              font-weight: 700;
              font-size: 13px;
            }
            .conteudo { padding: 30px; }
            h1 {
              margin: 0 0 24px;
              font-size: 34px;
              text-align: center;
            }
            .valor {
              background: #facc15;
              color: #050505;
              padding: 20px;
              border-radius: 14px;
              text-align: center;
              margin: 22px 0;
            }
            .valor small {
              display: block;
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
            }
            .valor strong {
              display: block;
              margin-top: 5px;
              font-size: 36px;
            }
            .linha {
              padding: 11px 0;
              border-bottom: 1px solid #e5e7eb;
              font-size: 16px;
              line-height: 1.45;
            }
            .linha strong { display: inline-block; min-width: 150px; }
            .declaracao {
              margin-top: 24px;
              font-size: 17px;
              line-height: 1.6;
            }
            .rodape {
              margin-top: 34px;
              padding-top: 20px;
              border-top: 2px solid #111827;
              font-size: 13px;
              line-height: 1.6;
            }
            .acoes {
              max-width: 760px;
              margin: 18px auto;
              display: flex;
              gap: 10px;
              justify-content: center;
            }
            button {
              border: 0;
              border-radius: 10px;
              padding: 12px 18px;
              font-weight: 800;
              cursor: pointer;
            }
            .imprimir { background: #facc15; color: #050505; }
            @media print {
              body { background: white; padding: 0; }
              .acoes { display: none !important; }
              .recibo { border-radius: 0; }
            }
          </style>
        </head>
        <body>
          <div class="recibo">
            <div class="topo">
              <div class="empresa">CHOQUESEG</div>
              <div class="sub">Sistemas e Energia Solar</div>
            </div>

            <div class="conteudo">
              <h1>RECIBO DE PAGAMENTO</h1>

              <div class="valor">
                <small>Valor recebido</small>
                <strong>${valorExtensoInformativo}</strong>
              </div>

              <div class="linha"><strong>Recibo:</strong> ${numeroRecibo}</div>
              <div class="linha"><strong>Cliente:</strong> ${conta.cliente}</div>
              <div class="linha"><strong>Referente a:</strong> ${descricaoRecibo}</div>
              <div class="linha"><strong>Forma:</strong> ${conta.formaRecebimento}</div>
              <div class="linha"><strong>Data:</strong> ${dataRecibo}</div>

              <p class="declaracao">
                Declaramos, para os devidos fins, que recebemos de
                <strong>${conta.cliente}</strong> a importância de
                <strong>${valorExtensoInformativo}</strong>, referente a
                <strong>${descricaoRecibo}</strong>.
              </p>

              <div class="rodape">
                <strong>CHOQUESEG Sistemas e Energia Solar</strong><br />
                Telefone: (79) 9.9939-0653<br />
                Instagram: @CHOQUESEG<br />
                Rodovia dos Náufragos, Robalo, 710 - Aracaju/SE
              </div>
            </div>
          </div>

          <div class="acoes">
            <button class="imprimir" onclick="window.print()">
              Imprimir / Salvar PDF
            </button>
          </div>
        </body>
      </html>
    `;

    janela.document.open();
    janela.document.write(html);
    janela.document.close();
  }



  function abrirWhatsAppRecibo(conta: ContaReceber) {
    const telefone = String(conta.telefoneCliente || "").replace(/\D/g, "");

    if (!telefone) {
      window.alert("Informe o telefone/WhatsApp do cliente.");
      return;
    }

    const numero =
      telefone.startsWith("55") ? telefone : `55${telefone}`;

    const restante = Math.max(
      0,
      conta.valorTotal - conta.valorRecebido,
    );

    const mensagemRecibo = [
      `Olá, ${conta.cliente}.`,
      "",
      `Confirmamos o recebimento de ${formatarMoeda(conta.valorRecebido)} referente a ${conta.descricao}.`,
      restante > 0
        ? `Saldo restante: ${formatarMoeda(restante)}.`
        : "Pagamento quitado.",
      "",
      "CHOQUESEG Sistemas e Energia Solar",
    ].join("\n");

    window.open(
      `https://wa.me/${numero}?text=${encodeURIComponent(mensagemRecibo)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function mesmaRecorrencia(contaBase: ContaReceber, item: ContaReceber) {
    if (
      contaBase.recorrenciaId &&
      item.recorrenciaId &&
      contaBase.recorrenciaId === item.recorrenciaId
    ) {
      return true;
    }

    // Compatibilidade com recorrências antigas/geradas por outras rotas.
    const texto = (valor: string | undefined) =>
      String(valor ?? "").trim().toLowerCase();

    return Boolean(
      contaBase.totalParcelas &&
        item.totalParcelas &&
        contaBase.totalParcelas === item.totalParcelas &&
        texto(contaBase.descricao) === texto(item.descricao) &&
        texto(contaBase.cliente) === texto(item.cliente) &&
        texto(contaBase.categoria) === texto(item.categoria) &&
        Number(contaBase.valorTotal) === Number(item.valorTotal) &&
        texto(contaBase.formaRecebimento) === texto(item.formaRecebimento),
    );
  }

  function persistirContas(novasContas: ContaReceber[]) {
    setContas(novasContas);
    localStorage.setItem(CHAVE_CONTAS_RECEBER, JSON.stringify(novasContas));
    window.dispatchEvent(
      new CustomEvent("choqueseg-financeiro-atualizado"),
    );
  }

  function excluirConta(conta: ContaReceber) {
    const confirmar = window.confirm(
      "Deseja realmente excluir esta parcela/cobrança?",
    );

    if (!confirmar) return;

    const novasContas = contas.filter(
      (item) => item.id !== conta.id,
    );
    persistirContas(novasContas);

    if (contaExpandidaId === conta.id) {
      setContaExpandidaId(null);
    }

    setMensagem(
      conta.recorrenciaId
        ? "Parcela excluída. Os totais foram recalculados automaticamente."
        : "Conta a receber excluída. Os totais foram recalculados.",
    );
  }

  function excluirRecorrencia(conta: ContaReceber) {
    const grupo = contas.filter((item) =>
      mesmaRecorrencia(conta, item),
    );

    if (grupo.length <= 1 && !conta.recorrenciaId && !conta.totalParcelas) {
      excluirConta(conta);
      return;
    }

    const totalGrupo = grupo.reduce(
      (total, item) => total + Number(item.valorTotal || 0),
      0,
    );

    const confirmar = window.confirm(
      `Excluir TODAS as ${grupo.length} cobrança(s) deste lançamento?\n\n` +
        `${conta.descricao}\n` +
        `Valor previsto que será retirado: ${formatarMoeda(totalGrupo)}\n\n` +
        `Depois da exclusão, os totais serão recalculados imediatamente.`,
    );

    if (!confirmar) return;

    const ids = new Set(grupo.map((item) => item.id));
    const novasContas = contas.filter((item) => !ids.has(item.id));

    persistirContas(novasContas);
    setContaExpandidaId(null);

    const saldoPendente = novasContas.reduce((total, item) => {
      const restante = Math.max(
        0,
        Number(item.valorTotal || 0) - Number(item.valorRecebido || 0),
      );
      return item.situacao === "Recebido" ? total : total + restante;
    }, 0);

    setMensagem(
      `${grupo.length} cobrança(s) excluída(s). Total pendente atualizado: ${formatarMoeda(saldoPendente)}.`,
    );
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-black p-5">
      <div>
        <p className="text-xs font-black uppercase text-yellow-400">
          Recebimentos
        </p>

        <h3 className="mt-1 text-2xl font-black uppercase text-white">
          Contas a receber
        </h3>

        <p className="mt-2 text-sm text-zinc-400">
          Controle valores de clientes, recebimentos parciais,
          vencimentos e atrasos.
        </p>
      </div>

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      {lembretesCobranca.length > 0 && (
        <section className="mt-5 rounded-2xl border border-blue-400/50 bg-blue-400/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-blue-300">
                🔔 Lembretes de cobrança
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                Clientes para cobrar: vencidos ou com vencimento nos próximos 2 dias.
              </p>
            </div>
            <span className="rounded-full bg-blue-400 px-3 py-1 text-sm font-black text-black">
              {lembretesCobranca.length}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {lembretesCobranca.map((conta) => {
              const dias = diasAte(conta.vencimento);
              const restante = Math.max(
                0,
                conta.valorTotal - conta.valorRecebido,
              );

              return (
                <div
                  key={`lembrete-${conta.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-blue-400/25 bg-black/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-black text-white">
                      {conta.cliente}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {conta.descricao} · {formatarData(conta.vencimento)}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="font-black text-yellow-400">
                      Cobrar {formatarMoeda(restante)}
                    </p>
                    <p
                      className={`mt-1 text-xs font-black uppercase ${
                        dias < 0 ? "text-red-400" : "text-blue-300"
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardResumo
          titulo="Total previsto"
          valor={resumo.totalPrevisto}
        />

        <CardResumo
          titulo="Recebido"
          valor={resumo.totalRecebido}
        />

        <CardResumo
          titulo="Pendente"
          valor={resumo.totalPendente}
        />

        <CardResumo
          titulo="Atrasado"
          valor={resumo.totalAtrasado}
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
            placeholder="Ex.: Instalação solar"
          />

          <CampoTexto
            label="Cliente"
            valor={cliente}
            onChange={setCliente}
            placeholder="Nome do cliente"
          />

          <CampoTexto
            label="Telefone / WhatsApp"
            valor={telefoneCliente}
            onChange={setTelefoneCliente}
            placeholder="Ex.: 79999999999"
          />

          <CampoSelect
            label="Categoria"
            valor={categoria}
            onChange={setCategoria}
            opcoes={categorias}
          />

          <CampoTexto
            label="Valor total"
            valor={valorTotal}
            onChange={setValorTotal}
            placeholder="Ex.: 9200,00"
          />

          <CampoTexto
            label="Valor já recebido"
            valor={valorRecebido}
            onChange={setValorRecebido}
            placeholder="Ex.: 2000,00"
          />

          <CampoTexto
            label="Vencimento"
            valor={vencimento}
            onChange={setVencimento}
            tipo="date"
          />

          <CampoSelect
            label="Forma de recebimento"
            valor={formaRecebimento}
            onChange={setFormaRecebimento}
            opcoes={formasRecebimento}
          />

          <CampoTexto
            label="Conta financeira"
            valor={contaFinanceira}
            onChange={setContaFinanceira}
            placeholder="Ex.: Banco do Brasil"
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
            placeholder="Detalhes do recebimento ou parcelamento"
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
          />
        </div>

        <button
          type="submit"
          className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black"
        >
          Cadastrar recebimento
        </button>
      </form>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <CampoTexto
            label="Pesquisar"
            valor={busca}
            onChange={setBusca}
            placeholder="Descrição, cliente ou categoria"
          />

          <CampoSelect
            label="Situação"
            valor={filtroSituacao}
            onChange={(valor) =>
              setFiltroSituacao(
                valor as "Todas" | SituacaoRecebimento,
              )
            }
            opcoes={[
              "Todas",
              "Pendente",
              "Parcial",
              "Recebido",
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
              const restante = Math.max(
                0,
                conta.valorTotal - conta.valorRecebido,
              );
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
                        {conta.cliente}
                      </h4>

                      <p className="mt-1 truncate text-sm text-zinc-400">
                        {conta.descricao}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="font-black text-yellow-400">
                          Restante {formatarMoeda(restante)}
                        </span>
                        <span className="text-zinc-500">
                          📅 {formatarData(conta.vencimento)}
                        </span>
                        <span
                          className={`font-black uppercase ${
                            conta.situacao === "Recebido"
                              ? "text-emerald-400"
                              : conta.situacao === "Atrasado"
                                ? "text-red-400"
                                : conta.situacao === "Parcial"
                                  ? "text-blue-400"
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
                          titulo="Valor total"
                          valor={formatarMoeda(conta.valorTotal)}
                        />
                        <ResumoDetalhe
                          titulo="Já recebido"
                          valor={formatarMoeda(conta.valorRecebido)}
                        />
                        <ResumoDetalhe
                          titulo="Forma"
                          valor={conta.formaRecebimento}
                        />
                        <ResumoDetalhe
                          titulo="Conta financeira"
                          valor={conta.contaFinanceira || "Não informada"}
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
                        {conta.valorRecebido > 0 && (
                          <button
                            type="button"
                            onClick={() => gerarRecibo(conta)}
                            className="rounded-xl border border-yellow-400/60 px-4 py-2 text-sm font-black uppercase text-yellow-300"
                          >
                            Gerar recibo
                          </button>
                        )}

                        {conta.telefoneCliente && conta.valorRecebido > 0 && (
                          <button
                            type="button"
                            onClick={() => abrirWhatsAppRecibo(conta)}
                            className="rounded-xl border border-emerald-500/50 px-4 py-2 text-sm font-black uppercase text-emerald-400"
                          >
                            WhatsApp
                          </button>
                        )}

                        {conta.situacao !== "Recebido" && (
                          <>
                            <button
                              type="button"
                              onClick={() => registrarRecebimento(conta)}
                              className="rounded-xl border border-blue-500/50 px-4 py-2 text-sm font-black uppercase text-blue-400"
                            >
                              Receber parcial
                            </button>

                            <button
                              type="button"
                              onClick={() => marcarRecebido(conta)}
                              className="rounded-xl border border-emerald-500/50 px-4 py-2 text-sm font-black uppercase text-emerald-400"
                            >
                              Marcar recebido
                            </button>
                          </>
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
        onChange={(evento) => onChange(evento.target.value)}
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
        onChange={(evento) => onChange(evento.target.value)}
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

function converterValor(valor: string) {
  const numero = Number(
    valor.replace(/\./g, "").replace(",", "."),
  );

  return Number.isNaN(numero) ? 0 : numero;
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