"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import jsPDF from "jspdf";

const supabase = createClient();

type Cliente = {
  id: string;
  nome: string;
  telefone?: string | null;
  cidade?: string | null;
  endereco?: string | null;
  cpf_cnpj?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
};

type PropostaSalva = {
  id: string;
  cliente_id: string | null;
  cliente_nome: string;
  tipo_proposta: string;
  consumo_medio: number | null;
  potencia_sistema_kwp: number | null;
  quantidade_modulos: number | null;
  potencia_modulo: string | null;
  marca_modulo: string | null;
  modelo_modulo: string | null;
  quantidade_inversores: number | null;
  marca_inversor: string | null;
  modelo_inversor: string | null;
  potencia_inversor: string | null;
  valor_total: number | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  status: string | null;
  criada_em: string;
};

type ModeloContrato = {
  id: string;
  nome: string;
  tipo_contrato: string;
  titulo: string | null;
  conteudo: string;
  ativo: boolean;
};

type ContratoSalvo = {
  id: string;
  cliente_nome: string;
  tipo_contrato: string;
  data_contrato: string;
  valor_total: number | null;
  status: string | null;
};

type FormContrato = {
  clienteId: string;
  clienteNome: string;
  clienteCpfCnpj: string;
  clienteTelefone: string;
  clienteEndereco: string;
  clienteCidade: string;
  quantidadeModulos: string;
  potenciaModulo: string;
  marcaModulo: string;
  modeloModulo: string;
  potenciaSistemaKwp: string;
  marcaInversor: string;
  modeloInversor: string;
  potenciaInversor: string;
  tensaoInversor: string;
  valorTotal: string;
  formaPagamento: string;
  condicoesPagamento: string;
  dataContrato: string;
};

const formularioInicial: FormContrato = {
  clienteId: "",
  clienteNome: "",
  clienteCpfCnpj: "",
  clienteTelefone: "",
  clienteEndereco: "",
  clienteCidade: "",
  quantidadeModulos: "",
  potenciaModulo: "",
  marcaModulo: "",
  modeloModulo: "",
  potenciaSistemaKwp: "",
  marcaInversor: "",
  modeloInversor: "",
  potenciaInversor: "",
  tensaoInversor: "",
  valorTotal: "",
  formaPagamento: "",
  condicoesPagamento: "",
  dataContrato: new Date().toISOString().slice(0, 10),
};

export default function ContratosModule() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modelo, setModelo] = useState<ModeloContrato | null>(null);
  const [contratos, setContratos] = useState<ContratoSalvo[]>([]);
  const [form, setForm] = useState<FormContrato>(formularioInicial);
  const [conteudoEditado, setConteudoEditado] = useState("");
  const [secao, setSecao] = useState<"lista" | "novo" | "editor">("lista");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [propostasCliente, setPropostasCliente] = useState<PropostaSalva[]>([]);
  const [propostaIdSelecionada, setPropostaIdSelecionada] = useState("");
  const [carregandoPropostas, setCarregandoPropostas] = useState(false);

  useEffect(() => {
    void carregarDados();
  }, []);

  async function carregarDados() {
    setMensagem("");

    const [clientesResp, modeloResp, contratosResp] = await Promise.all([
      supabase.from("clientes").select("*").order("nome", { ascending: true }),
      supabase
        .from("modelos_contrato")
        .select("id,nome,tipo_contrato,titulo,conteudo,ativo")
        .eq("tipo_contrato", "energia_solar")
        .eq("ativo", true)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("contratos")
        .select("id,cliente_nome,tipo_contrato,data_contrato,valor_total,status")
        .order("criado_em", { ascending: false }),
    ]);

    if (clientesResp.error) {
      console.error(clientesResp.error);
      setMensagem(`Erro ao carregar clientes: ${clientesResp.error.message}`);
    } else {
      setClientes((clientesResp.data ?? []) as Cliente[]);
    }

    if (modeloResp.error) {
      console.error(modeloResp.error);
      setMensagem(`Erro ao carregar modelo: ${modeloResp.error.message}`);
    } else {
      setModelo((modeloResp.data as ModeloContrato | null) ?? null);
    }

    if (contratosResp.error) {
      console.error(contratosResp.error);
    } else {
      setContratos((contratosResp.data ?? []) as ContratoSalvo[]);
    }
  }

  async function selecionarCliente(clienteId: string) {
    const cliente = clientes.find((item) => String(item.id) === clienteId);

    setPropostasCliente([]);
    setPropostaIdSelecionada("");

    if (!cliente) {
      setForm({
        ...formularioInicial,
        dataContrato: new Date().toISOString().slice(0, 10),
      });
      return;
    }

    const cpfCnpj =
      cliente.cpf_cnpj?.trim() ||
      cliente.cpf?.trim() ||
      cliente.cnpj?.trim() ||
      "";

    setForm((atual) => ({
      ...atual,
      clienteId: String(cliente.id),
      clienteNome: cliente.nome ?? "",
      clienteCpfCnpj: cpfCnpj,
      clienteTelefone: cliente.telefone ?? "",
      clienteEndereco: cliente.endereco ?? "",
      clienteCidade: cliente.cidade ?? "",
      quantidadeModulos: "",
      potenciaModulo: "",
      marcaModulo: "",
      modeloModulo: "",
      potenciaSistemaKwp: "",
      marcaInversor: "",
      modeloInversor: "",
      potenciaInversor: "",
      valorTotal: "",
      formaPagamento: "",
      condicoesPagamento: "",
    }));

    setCarregandoPropostas(true);

    try {
      const { data, error } = await supabase
        .from("propostas")
        .select(
          "id,cliente_id,cliente_nome,tipo_proposta,consumo_medio,potencia_sistema_kwp,quantidade_modulos,potencia_modulo,marca_modulo,modelo_modulo,quantidade_inversores,marca_inversor,modelo_inversor,potencia_inversor,valor_total,forma_pagamento,observacoes,status,criada_em",
        )
        .eq("cliente_id", String(cliente.id))
        .eq("tipo_proposta", "energia_solar")
        .order("criada_em", { ascending: false });

      if (error) throw error;

      const propostas = (data ?? []) as PropostaSalva[];
      setPropostasCliente(propostas);

      if (propostas.length > 0) {
        aplicarProposta(propostas[0]);
        setMensagem(
          propostas.length === 1
            ? "Proposta do cliente carregada automaticamente no contrato."
            : "A proposta de Energia Solar mais recente foi carregada automaticamente. Você ainda pode escolher outra proposta abaixo.",
        );
      }
    } catch (erro) {
      console.error("Erro ao carregar propostas do cliente:", erro);
      setMensagem(
        erro instanceof Error
          ? `Erro ao carregar propostas do cliente: ${erro.message}`
          : "Não foi possível carregar as propostas deste cliente.",
      );
    } finally {
      setCarregandoPropostas(false);
    }
  }

  function aplicarProposta(proposta: PropostaSalva) {
    setPropostaIdSelecionada(proposta.id);

    setForm((atual) => ({
      ...atual,
      quantidadeModulos:
        proposta.quantidade_modulos != null
          ? String(proposta.quantidade_modulos)
          : "",
      potenciaModulo: proposta.potencia_modulo ?? "",
      marcaModulo: proposta.marca_modulo ?? "",
      modeloModulo: proposta.modelo_modulo ?? "",
      potenciaSistemaKwp:
        proposta.potencia_sistema_kwp != null
          ? String(proposta.potencia_sistema_kwp).replace(".", ",")
          : "",
      marcaInversor: proposta.marca_inversor ?? "",
      modeloInversor: proposta.modelo_inversor ?? "",
      potenciaInversor: proposta.potencia_inversor ?? "",
      valorTotal:
        proposta.valor_total != null
          ? formatarNumeroContrato(Number(proposta.valor_total))
          : "",
      formaPagamento: proposta.forma_pagamento ?? "",
      condicoesPagamento: proposta.forma_pagamento ?? "",
    }));

    setMensagem("Proposta do cliente carregada automaticamente no contrato.");
  }

  function selecionarProposta(propostaId: string) {
    if (!propostaId) {
      setPropostaIdSelecionada("");
      return;
    }

    const proposta = propostasCliente.find((item) => item.id === propostaId);
    if (proposta) aplicarProposta(proposta);
  }

  const valorNumero = useMemo(
    () => converterNumero(form.valorTotal),
    [form.valorTotal],
  );

  function gerarContrato() {
    setMensagem("");

    if (!modelo) {
      setMensagem("O modelo de contrato de Energia Solar não foi encontrado.");
      return;
    }

    if (!form.clienteNome.trim()) {
      setMensagem("Selecione um cliente.");
      return;
    }

    if (!form.clienteCpfCnpj.trim()) {
      setMensagem("Informe o CPF/CNPJ do cliente.");
      return;
    }

    const texto = substituirVariaveis(modelo.conteudo, form);
    setConteudoEditado(texto);
    setSecao("editor");
  }

  async function salvarContrato() {
    setMensagem("");
    setSalvando(true);

    try {
      const payload = {
        cliente_id: form.clienteId || null,
        cliente_nome: form.clienteNome.trim(),
        cliente_cpf_cnpj: form.clienteCpfCnpj.trim(),
        cliente_telefone: form.clienteTelefone.trim(),
        cliente_endereco: form.clienteEndereco.trim(),
        cliente_cidade: form.clienteCidade.trim(),
        tipo_contrato: "energia_solar",
        quantidade_modulos: form.quantidadeModulos
          ? Number(form.quantidadeModulos)
          : null,
        potencia_modulo: form.potenciaModulo.trim(),
        marca_modulo: form.marcaModulo.trim(),
        modelo_modulo: form.modeloModulo.trim(),
        potencia_sistema_kwp: form.potenciaSistemaKwp.trim(),
        marca_inversor: form.marcaInversor.trim(),
        modelo_inversor: form.modeloInversor.trim(),
        potencia_inversor: form.potenciaInversor.trim(),
        tensao_inversor: form.tensaoInversor.trim(),
        valor_total: valorNumero,
        forma_pagamento: form.formaPagamento.trim(),
        condicoes_pagamento: form.condicoesPagamento.trim(),
        data_contrato: form.dataContrato,
        conteudo_editado: conteudoEditado,
        assinatura_cliente: null,
        status: "Rascunho",
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      const { error } = await supabase.from("contratos").insert(payload);

      if (error) {
        console.error(error);
        setMensagem(`Erro ao salvar contrato na nuvem: ${error.message}`);
        return;
      }

      setMensagem("Contrato salvo e sincronizado com a nuvem.");
      await carregarDados();
      setSecao("lista");
    } finally {
      setSalvando(false);
    }
  }

  function criarPdfContrato() {
    if (!conteudoEditado.trim()) {
      throw new Error("O contrato ainda não foi montado.");
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const margemX = 18;
    const topo = 20;
    const rodape = 16;
    const larguraUtil = 210 - margemX * 2;
    const limiteY = 297 - rodape;
    let y = topo;
    let pagina = 1;

    function desenharCabecalho() {
      pdf.setFillColor(250, 204, 21);
      pdf.rect(0, 0, 210, 5, "F");

      pdf.setTextColor(20, 20, 20);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("CHOQUESEG SISTEMAS E ENERGIA SOLAR", margemX, 12);

      pdf.setDrawColor(180, 180, 180);
      pdf.line(margemX, 15, 210 - margemX, 15);

      y = topo;
    }

    function desenharRodape() {
      pdf.setDrawColor(210, 210, 210);
      pdf.line(margemX, 286, 210 - margemX, 286);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Contrato de Energia Solar · ${form.clienteNome || "Cliente"}`,
        margemX,
        291,
      );
      pdf.text(`Página ${pagina}`, 210 - margemX, 291, {
        align: "right",
      });
    }

    function novaPagina() {
      desenharRodape();
      pdf.addPage();
      pagina += 1;
      desenharCabecalho();
    }

    desenharCabecalho();

    const linhasOriginais = conteudoEditado.replace(/\r/g, "").split("\n");

    for (const linhaOriginal of linhasOriginais) {
      const linha = linhaOriginal.trimEnd();

      if (!linha.trim()) {
        y += 3.2;
        if (y > limiteY) novaPagina();
        continue;
      }

      const ehTitulo =
        linha.startsWith("CONTRATO DE PRESTAÇÃO") ||
        linha.startsWith("CLÁUSULA ");
      const ehAssinatura = linha.startsWith("___");

      pdf.setTextColor(20, 20, 20);
      pdf.setFont(
        "helvetica",
        ehTitulo || ehAssinatura ? "bold" : "normal",
      );
      pdf.setFontSize(ehTitulo ? 10.5 : 9.3);

      const larguraLinha = ehAssinatura ? 85 : larguraUtil;
      const linhasQuebradas = pdf.splitTextToSize(linha, larguraLinha);
      const alturaLinha = ehTitulo ? 5.2 : 4.5;
      const alturaNecessaria = linhasQuebradas.length * alturaLinha + 1;

      if (y + alturaNecessaria > limiteY) {
        novaPagina();
      }

      if (ehTitulo) {
        y += 1;
      }

      for (const trecho of linhasQuebradas) {
        pdf.text(trecho, margemX, y);
        y += alturaLinha;
      }

      if (ehTitulo) {
        y += 1.5;
      }
    }

    desenharRodape();
    return pdf;
  }

  function nomeArquivoContrato() {
    const nome =
      form.clienteNome
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "Cliente";

    return `Contrato-CHOQUESEG-Energia-Solar-${nome}.pdf`;
  }

  async function baixarPDF() {
    try {
      setGerandoPDF(true);
      const pdf = criarPdfContrato();
      pdf.save(nomeArquivoContrato());
    } catch (erro) {
      console.error("Erro ao gerar PDF do contrato:", erro);
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível gerar o PDF do contrato.",
      );
    } finally {
      setGerandoPDF(false);
    }
  }

  async function imprimirContrato() {
    try {
      setGerandoPDF(true);
      const pdf = criarPdfContrato();
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const janela = window.open(url, "_blank", "noopener,noreferrer");

      if (!janela) {
        pdf.save(nomeArquivoContrato());
        alert(
          "O navegador bloqueou a nova aba. O PDF do contrato foi baixado para você imprimir.",
        );
        URL.revokeObjectURL(url);
        return;
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (erro) {
      console.error("Erro ao abrir contrato para impressão:", erro);
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível preparar o contrato para impressão.",
      );
    } finally {
      setGerandoPDF(false);
    }
  }

  async function enviarWhatsAppPDF() {
    try {
      setGerandoPDF(true);

      const pdf = criarPdfContrato();
      const blob = pdf.output("blob");
      const arquivo = new File([blob], nomeArquivoContrato(), {
        type: "application/pdf",
      });

      const mensagem = `Olá, ${form.clienteNome || "cliente"}! Segue o contrato de Energia Solar da CHOQUESEG para sua conferência e assinatura.`;

      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [arquivo] })
      ) {
        await navigator.share({
          title: "Contrato CHOQUESEG",
          text: mensagem,
          files: [arquivo],
        });
        return;
      }

      // No computador, o WhatsApp Web não permite anexar um arquivo
      // automaticamente por segurança do navegador. Fazemos o melhor fluxo:
      // baixa o PDF e abre a conversa do cliente pronta.
      pdf.save(nomeArquivoContrato());

      const telefoneLimpo = form.clienteTelefone.replace(/\D/g, "");
      const destino =
        telefoneLimpo.length === 10 || telefoneLimpo.length === 11
          ? `55${telefoneLimpo}`
          : telefoneLimpo;

      const texto = encodeURIComponent(
        `${mensagem}\n\nO PDF do contrato foi gerado. Anexe o arquivo baixado nesta conversa.`,
      );

      window.open(
        `https://wa.me/${destino}?text=${texto}`,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (erro) {
      if (
        erro instanceof DOMException &&
        erro.name === "AbortError"
      ) {
        return;
      }

      console.error("Erro ao compartilhar contrato:", erro);
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível compartilhar o contrato.",
      );
    } finally {
      setGerandoPDF(false);
    }
  }

  function novoContrato() {
    setForm({
      ...formularioInicial,
      dataContrato: new Date().toISOString().slice(0, 10),
    });
    setConteudoEditado("");
    setPropostasCliente([]);
    setPropostaIdSelecionada("");
    setMensagem("");
    setSecao("novo");
  }

  return (
    <section className="p-4 md:p-7">
      <div>
        <p className="text-sm font-bold uppercase text-yellow-400">
          Gestão CHOQUESEG
        </p>
        <h2 className="mt-1 text-3xl font-black uppercase text-white">
          Contratos
        </h2>
        <p className="mt-2 text-zinc-400">
          Gere contratos de Energia Solar vinculados aos clientes cadastrados.
        </p>
      </div>

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="lg:sticky lg:top-24 lg:w-64 lg:shrink-0">
          <div className="rounded-2xl border border-zinc-800 bg-black p-2">
            <p className="px-3 py-2 text-xs font-black uppercase text-zinc-500">
              Menu de contratos
            </p>

            <nav className="flex flex-col gap-2">
              <BotaoMenu
                ativo={secao === "lista"}
                onClick={() => setSecao("lista")}
                icone="📄"
                titulo="Contratos"
              />
              <BotaoMenu
                ativo={secao === "novo"}
                onClick={novoContrato}
                icone="➕"
                titulo="Novo contrato"
              />
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {secao === "lista" && (
            <section className="rounded-3xl border border-zinc-800 bg-black p-5">
              <h3 className="text-xl font-black uppercase text-yellow-400">
                Contratos cadastrados
              </h3>

              <div className="mt-5 space-y-3">
                {contratos.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
                    Nenhum contrato cadastrado.
                  </div>
                ) : (
                  contratos.map((contrato) => (
                    <article
                      key={contrato.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase text-yellow-400">
                            Energia Solar
                          </p>
                          <h4 className="mt-1 text-lg font-black text-white">
                            {contrato.cliente_nome}
                          </h4>
                          <p className="mt-1 text-sm text-zinc-400">
                            {formatarData(contrato.data_contrato)}
                            {contrato.valor_total != null
                              ? ` · ${formatarMoeda(contrato.valor_total)}`
                              : ""}
                          </p>
                        </div>

                        <span className="w-fit rounded-lg bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase text-yellow-400">
                          {contrato.status || "Rascunho"}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

          {secao === "novo" && (
            <section className="rounded-3xl border border-yellow-400/30 bg-black p-5">
              <h3 className="text-xl font-black uppercase text-yellow-400">
                Novo contrato de Energia Solar
              </h3>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <CampoSelect
                  label="Cliente *"
                  valor={form.clienteId}
                  onChange={selecionarCliente}
                  opcoes={[
                    { valor: "", rotulo: "Selecione o cliente" },
                    ...clientes.map((cliente) => ({
                      valor: String(cliente.id),
                      rotulo: cliente.nome,
                    })),
                  ]}
                />

                <CampoTexto
                  label="CPF / CNPJ *"
                  valor={form.clienteCpfCnpj}
                  onChange={(valor) =>
                    setForm({ ...form, clienteCpfCnpj: valor })
                  }
                />

                <CampoTexto
                  label="Telefone"
                  valor={form.clienteTelefone}
                  onChange={(valor) =>
                    setForm({ ...form, clienteTelefone: valor })
                  }
                />

                <CampoTexto
                  label="Cidade"
                  valor={form.clienteCidade}
                  onChange={(valor) =>
                    setForm({ ...form, clienteCidade: valor })
                  }
                />

                <div className="md:col-span-2">
                  <CampoTexto
                    label="Endereço"
                    valor={form.clienteEndereco}
                    onChange={(valor) =>
                      setForm({ ...form, clienteEndereco: valor })
                    }
                  />
                </div>
              </div>

              {form.clienteId && (
                <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-zinc-950 p-4">
                  <p className="text-xs font-black uppercase text-yellow-400">
                    Proposta vinculada
                  </p>

                  {carregandoPropostas ? (
                    <p className="mt-3 text-sm text-zinc-400">
                      Buscando propostas deste cliente...
                    </p>
                  ) : propostasCliente.length === 0 ? (
                    <p className="mt-3 text-sm text-zinc-400">
                      Este cliente ainda não possui proposta de Energia Solar salva.
                      Os dados do sistema podem ser preenchidos manualmente.
                    </p>
                  ) : (
                    <>
                      <div className="mt-3">
                        <CampoSelect
                          label={
                            propostasCliente.length === 1
                              ? "Proposta encontrada"
                              : "Proposta mais recente carregada — escolha outra se necessário"
                          }
                          valor={propostaIdSelecionada}
                          onChange={selecionarProposta}
                          opcoes={[
                            ...(propostasCliente.length > 1
                              ? [{ valor: "", rotulo: "Selecione a proposta" }]
                              : []),
                            ...propostasCliente.map((proposta) => ({
                              valor: proposta.id,
                              rotulo: `${formatarDataHora(proposta.criada_em)} · ${
                                proposta.valor_total != null
                                  ? formatarMoeda(Number(proposta.valor_total))
                                  : "Sem valor"
                              } · ${proposta.status || "Sem status"}`,
                            })),
                          ]}
                        />
                      </div>

                      {propostaIdSelecionada && (
                        <p className="mt-3 text-xs font-bold text-green-400">
                          ✓ Equipamentos, potência, valor e pagamento carregados da proposta salva.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              <h4 className="mt-7 text-sm font-black uppercase text-yellow-400">
                Sistema fotovoltaico
              </h4>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <CampoTexto
                  label="Quantidade de módulos"
                  valor={form.quantidadeModulos}
                  onChange={(valor) =>
                    setForm({ ...form, quantidadeModulos: valor })
                  }
                />
                <CampoTexto
                  label="Potência do módulo"
                  valor={form.potenciaModulo}
                  onChange={(valor) =>
                    setForm({ ...form, potenciaModulo: valor })
                  }
                  placeholder="Ex.: 630W"
                />
                <CampoTexto
                  label="Marca do módulo"
                  valor={form.marcaModulo}
                  onChange={(valor) =>
                    setForm({ ...form, marcaModulo: valor })
                  }
                  placeholder="Ex.: Jinko"
                />
                <CampoTexto
                  label="Modelo do módulo"
                  valor={form.modeloModulo}
                  onChange={(valor) =>
                    setForm({ ...form, modeloModulo: valor })
                  }
                />
                <CampoTexto
                  label="Potência do sistema"
                  valor={form.potenciaSistemaKwp}
                  onChange={(valor) =>
                    setForm({ ...form, potenciaSistemaKwp: valor })
                  }
                  placeholder="Ex.: 4,41"
                />
                <CampoTexto
                  label="Marca do inversor"
                  valor={form.marcaInversor}
                  onChange={(valor) =>
                    setForm({ ...form, marcaInversor: valor })
                  }
                  placeholder="Ex.: Huawei"
                />
                <CampoTexto
                  label="Modelo do inversor"
                  valor={form.modeloInversor}
                  onChange={(valor) =>
                    setForm({ ...form, modeloInversor: valor })
                  }
                />
                <CampoTexto
                  label="Potência do inversor"
                  valor={form.potenciaInversor}
                  onChange={(valor) =>
                    setForm({ ...form, potenciaInversor: valor })
                  }
                  placeholder="Ex.: 6 kW"
                />
                <CampoTexto
                  label="Tensão do inversor"
                  valor={form.tensaoInversor}
                  onChange={(valor) =>
                    setForm({ ...form, tensaoInversor: valor })
                  }
                  placeholder="Ex.: Bifásico 220V"
                />
              </div>

              <h4 className="mt-7 text-sm font-black uppercase text-yellow-400">
                Valores e pagamento
              </h4>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <CampoTexto
                  label="Valor total"
                  valor={form.valorTotal}
                  onChange={(valor) =>
                    setForm({ ...form, valorTotal: valor })
                  }
                  placeholder="Ex.: 13.200,00"
                />
                <CampoTexto
                  label="Forma de pagamento"
                  valor={form.formaPagamento}
                  onChange={(valor) =>
                    setForm({ ...form, formaPagamento: valor })
                  }
                  placeholder="Ex.: Cartão / PIX / Financiamento"
                />
                <div className="md:col-span-2">
                  <CampoArea
                    label="Condições de pagamento"
                    valor={form.condicoesPagamento}
                    onChange={(valor) =>
                      setForm({ ...form, condicoesPagamento: valor })
                    }
                    placeholder="Ex.: 70% na assinatura e 30% no término da instalação."
                  />
                </div>
                <CampoData
                  label="Data do contrato"
                  valor={form.dataContrato}
                  onChange={(valor) =>
                    setForm({ ...form, dataContrato: valor })
                  }
                />
              </div>

              <button
                type="button"
                onClick={gerarContrato}
                className="mt-6 rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black"
              >
                Montar contrato
              </button>
            </section>
          )}

          {secao === "editor" && (
            <section className="rounded-3xl border border-yellow-400/30 bg-black p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-yellow-400">
                    Revisão final
                  </p>
                  <h3 className="mt-1 text-xl font-black uppercase text-white">
                    Contrato de {form.clienteNome}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSecao("novo")}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-black uppercase text-zinc-300"
                >
                  Voltar aos dados
                </button>
              </div>

              <p className="mt-4 text-sm text-zinc-400">
                O texto abaixo é editável antes de salvar o contrato.
              </p>

              <textarea
                value={conteudoEditado}
                onChange={(evento) => setConteudoEditado(evento.target.value)}
                rows={34}
                className="mt-4 w-full rounded-2xl border border-zinc-700 bg-zinc-950 p-5 font-mono text-sm leading-6 text-zinc-100 outline-none focus:border-yellow-400"
              />

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={salvarContrato}
                  disabled={salvando}
                  className="rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Salvar na nuvem"}
                </button>

                <button
                  type="button"
                  onClick={baixarPDF}
                  disabled={gerandoPDF}
                  className="rounded-xl border border-yellow-400 px-6 py-3 font-black uppercase text-yellow-400 disabled:opacity-60"
                >
                  {gerandoPDF ? "Gerando..." : "Gerar PDF"}
                </button>

                <button
                  type="button"
                  onClick={imprimirContrato}
                  disabled={gerandoPDF}
                  className="rounded-xl border border-zinc-600 px-6 py-3 font-black uppercase text-zinc-200 disabled:opacity-60"
                >
                  Imprimir contrato
                </button>

                <button
                  type="button"
                  onClick={enviarWhatsAppPDF}
                  disabled={gerandoPDF}
                  className="rounded-xl bg-green-600 px-6 py-3 font-black uppercase text-white disabled:opacity-60"
                >
                  Enviar PDF no WhatsApp
                </button>
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                No celular, o botão do WhatsApp compartilha o PDF diretamente quando o aparelho permite. No computador, o PDF é baixado e a conversa do cliente é aberta para anexar o arquivo.
              </p>
            </section>
          )}
        </main>
      </div>
    </section>
  );
}

function substituirVariaveis(modelo: string, form: FormContrato) {
  const mapa: Record<string, string> = {
    "{{CLIENTE_NOME}}": form.clienteNome || "________________",
    "{{CLIENTE_CPF_CNPJ}}": form.clienteCpfCnpj || "________________",
    "{{CLIENTE_TELEFONE}}": form.clienteTelefone || "________________",
    "{{CLIENTE_ENDERECO}}": form.clienteEndereco || "________________",
    "{{CLIENTE_CIDADE}}": form.clienteCidade || "________________",
    "{{QUANTIDADE_MODULOS}}": form.quantidadeModulos || "____",
    "{{POTENCIA_MODULO}}": form.potenciaModulo || "____",
    "{{MARCA_MODULO}}": form.marcaModulo || "________________",
    "{{MODELO_MODULO}}": form.modeloModulo || "",
    "{{POTENCIA_SISTEMA_KWP}}": form.potenciaSistemaKwp || "____",
    "{{MARCA_INVERSOR}}": form.marcaInversor || "________________",
    "{{MODELO_INVERSOR}}": form.modeloInversor || "",
    "{{POTENCIA_INVERSOR}}": form.potenciaInversor || "____",
    "{{TENSAO_INVERSOR}}": form.tensaoInversor || "",
    "{{VALOR_TOTAL}}": formatarNumeroContrato(converterNumero(form.valorTotal)),
    "{{VALOR_TOTAL_EXTENSO}}": valorPorExtensoSimples(
      converterNumero(form.valorTotal),
    ),
    "{{FORMA_PAGAMENTO}}": form.formaPagamento || "________________",
    "{{CONDICOES_PAGAMENTO}}":
      form.condicoesPagamento || "________________",
    "{{DATA_CONTRATO_EXTENSO}}": dataPorExtenso(form.dataContrato),
  };

  let resultado = modelo;

  for (const [chave, valor] of Object.entries(mapa)) {
    resultado = resultado.split(chave).join(valor);
  }

  return resultado;
}

function converterNumero(valor: string) {
  const limpo = valor
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : 0;
}

function formatarNumeroContrato(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(data: string) {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(data: string) {
  if (!data) return "";
  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return data;

  return valor.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dataPorExtenso(data: string) {
  if (!data) return "____ de __________ de ______";

  const [ano, mes, dia] = data.split("-").map(Number);
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return `${String(dia).padStart(2, "0")} de ${meses[mes - 1]} de ${ano}`;
}

function valorPorExtensoSimples(valor: number) {
  if (!valor) return "VALOR A DEFINIR";

  // Nesta primeira versão, o contrato permanece editável.
  // O valor numérico é preenchido automaticamente e o texto pode ser ajustado.
  return `${formatarNumeroContrato(valor)} REAIS`;
}

function BotaoMenu({
  ativo,
  onClick,
  icone,
  titulo,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: string;
  titulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black uppercase transition ${
        ativo
          ? "bg-yellow-400 text-black"
          : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400"
      }`}
    >
      <span>{icone}</span>
      <span>{titulo}</span>
    </button>
  );
}

function CampoTexto({
  label,
  valor,
  onChange,
  placeholder,
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>
      <input
        type="text"
        value={valor}
        placeholder={placeholder}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </div>
  );
}

function CampoArea({
  label,
  valor,
  onChange,
  placeholder,
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>
      <textarea
        value={valor}
        placeholder={placeholder}
        rows={4}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </div>
  );
}

function CampoData({
  label,
  valor,
  onChange,
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>
      <input
        type="date"
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
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
  opcoes: Array<{ valor: string; rotulo: string }>;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>
      <select
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      >
        {opcoes.map((item) => (
          <option key={item.valor || "vazio"} value={item.valor}>
            {item.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}