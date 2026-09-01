"use client";

import { useEffect, useMemo, useState } from "react";


type ClienteCRM = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  endereco: string;
  tipoServico: string;
};

type VistoriaSolarImportada = {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  cidade: string;
  endereco: string;
  data: string;
  responsavel: string;
  status: string;

  tipoTelhado?: string;
  tipoLigacao?: string;
  tensaoRede?: string;

  marcaDisjuntor?: string;
  polosDisjuntor?: string;
  amperagemDisjuntor?: string;
  bitolaCaboEntrada?: string;

  tipoCaboCA?: string;
  tipoCaboCC?: string;
  bitolaCaboTerra?: string;

  quantidadeModulosPrevista?: string;
  potenciaModuloPrevista?: string;
  potenciaInversorPrevista?: string;

  observacoes?: string;
  atualizadaEm?: string;
  criadaEm?: string;
};


type StatusProjeto =
  | "Documentação pendente"
  | "Documentação completa"
  | "Projeto iniciado"
  | "Projeto enviado à Energisa"
  | "Em análise"
  | "Aprovado"
  | "Obra da concessionária"
  | "Instalação realizada"
  | "Vistoria solicitada"
  | "Aguardando vistoria / troca do medidor"
  | "Medidor substituído"
  | "Sistema funcionando / gerando";

type DocumentoProjeto = {
  id: string;
  titulo: string;
  concluido: boolean;
};

type ArquivoProjeto = {
  id: string;
  nome: string;
  tipo: string;
  dados: string;
  criadoEm: string;
};

type ProjetoEngenharia = {
  id: string;
  clienteId: string;
  vistoriaOrigemId: string;
  clienteNome: string;
  telefone: string;
  cidade: string;
  endereco: string;

  responsavelEngenharia: string;
  dataInicio: string;
  status: StatusProjeto;

  quantidadeModulos: string;
  marcaModulo: string;
  potenciaModulo: string;

  marcaInversor: string;
  potenciaInversor: string;
  quantidadeInversores: string;

  tipoTelhado: string;

  tipoLigacao: string;
  tensaoRede: string;

  marcaDisjuntorPadrao: string;
  polosDisjuntorPadrao: string;
  amperagemDisjuntorPadrao: string;

  bitolaCaboEntrada: string;
  bitolaCaboCA: string;
  bitolaCaboCC: string;
  bitolaCaboTerra: string;

  observacaoObraConcessionaria: string;

  observacoes: string;
  documentos: DocumentoProjeto[];
  arquivos: ArquivoProjeto[];

  criadoEm: string;
  atualizadoEm: string;
};

const CHAVE_PROJETOS = "choqueseg-projetos-engenharia";
const CHAVE_CLIENTES = "choqueseg-pro-clientes";
const CHAVE_VISTORIAS = "choqueseg-vistorias";

const STATUS_PROJETO: StatusProjeto[] = [
  "Documentação pendente",
  "Documentação completa",
  "Projeto iniciado",
  "Projeto enviado à Energisa",
  "Em análise",
  "Aprovado",
  "Obra da concessionária",
  "Instalação realizada",
  "Vistoria solicitada",
  "Aguardando vistoria / troca do medidor",
  "Medidor substituído",
  "Sistema funcionando / gerando",
];

const DOCUMENTOS_PADRAO = [
  "Documento do cliente (RG / CNH)",
  "CPF do cliente",
  "Conta de energia atualizada",
  "Número da unidade consumidora",
  "Endereço completo",
  "Localização / coordenadas",
  "Foto do padrão de entrada",
  "Tipo do padrão de entrada",
  "Disjuntor do padrão",
  "Bitola do cabo de entrada",
  "Tipo de ligação (mono / bi / trifásica)",
  "Tipo de telhado",
  "Fotos do telhado",
  "Quantidade de módulos",
  "Potência dos módulos",
  "Potência do inversor",
  "Dados da vistoria técnica",
];

function criarChecklistDocumentos(): DocumentoProjeto[] {
  return DOCUMENTOS_PADRAO.map((titulo, indice) => ({
    id: `doc-${indice + 1}`,
    titulo,
    concluido: false,
  }));
}

function projetoInicial(): ProjetoEngenharia {
  const agora = new Date().toISOString();

  return {
    id: "",
    clienteId: "",
    vistoriaOrigemId: "",
    clienteNome: "",
    telefone: "",
    cidade: "",
    endereco: "",
    responsavelEngenharia: "",
    dataInicio: agora.slice(0, 10),
    status: "Documentação pendente",
    quantidadeModulos: "",
    marcaModulo: "Jinko",
    potenciaModulo: "630 W",

    marcaInversor: "Huawei",
    potenciaInversor: "5 kW",
    quantidadeInversores: "1",

    tipoTelhado: "Cerâmico",

    tipoLigacao: "Bifásica",
    tensaoRede: "220 V",

    marcaDisjuntorPadrao: "Soprano",
    polosDisjuntorPadrao: "Bipolar",
    amperagemDisjuntorPadrao: "40 A",

    bitolaCaboEntrada: "10 mm² 0,6/1 kV",
    bitolaCaboCA: "6 mm² flexível 750 V",
    bitolaCaboCC: "6 mm² cabo solar 1,8 kV CC",
    bitolaCaboTerra: "6 mm²",

    observacaoObraConcessionaria: "",
    observacoes: "",
    documentos: criarChecklistDocumentos(),
    arquivos: [],
    criadoEm: "",
    atualizadoEm: "",
  };
}

async function arquivoParaDataUrl(arquivo: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result ?? ""));
    leitor.onerror = () => reject(new Error("Não foi possível carregar o arquivo."));
    leitor.readAsDataURL(arquivo);
  });
}


const MARCAS_MODULOS = [
  "Jinko",
  "Canadian Solar",
  "Trina Solar",
  "JA Solar",
  "Astronergy",
  "Longi",
  "Outra",
];

const POTENCIAS_MODULOS = [
  "550 W",
  "555 W",
  "570 W",
  "580 W",
  "590 W",
  "600 W",
  "610 W",
  "620 W",
  "625 W",
  "630 W",
  "650 W",
  "700 W",
  "710 W",
  "Outra",
];

const MARCAS_INVERSORES = [
  "Huawei",
  "Solplanet",
  "Growatt",
  "SAJ",
  "Fox ESS",
  "Deye",
  "GoodWe",
  "Solis",
  "Outra",
];

const POTENCIAS_INVERSORES = [
  "2 kW",
  "3 kW",
  "3,6 kW",
  "4 kW",
  "5 kW",
  "6 kW",
  "7,5 kW",
  "8 kW",
  "10 kW",
  "12 kW",
  "15 kW",
  "20 kW",
  "25 kW",
  "30 kW",
  "40 kW",
  "50 kW",
  "Outra",
];

const TIPOS_TELHADO = [
  "Cerâmico",
  "Fibrocimento",
  "Metálico",
  "Laje",
  "Colonial",
  "Sanduíche",
  "Outro",
];

const TIPOS_LIGACAO = [
  "Monofásica",
  "Bifásica",
  "Trifásica",
];

const TENSOES_REDE = [
  "127 V",
  "220 V",
  "127/220 V",
  "380 V",
  "Outra",
];

const MARCAS_DISJUNTORES = [
  "Soprano",
  "Schneider",
  "Siemens",
  "WEG",
  "Steck",
  "Tramontina",
  "ABB",
  "Legrand",
  "Outra",
];

const POLOS_DISJUNTORES = [
  "Monopolar",
  "Bipolar",
  "Tripolar",
];

const AMPERAGENS_DISJUNTORES = [
  "10 A",
  "16 A",
  "20 A",
  "25 A",
  "32 A",
  "40 A",
  "50 A",
  "63 A",
  "70 A",
  "80 A",
  "100 A",
  "125 A",
];

const BITOLAS_CABO_ENTRADA = [
  "4 mm² flexível 750 V",
  "6 mm² flexível 750 V",
  "6 mm² 0,6/1 kV",
  "10 mm² flexível 750 V",
  "10 mm² 0,6/1 kV",
  "16 mm² flexível 750 V",
  "16 mm² 0,6/1 kV",
  "25 mm² flexível 750 V",
  "25 mm² 0,6/1 kV",
  "35 mm² 0,6/1 kV",
  "50 mm² 0,6/1 kV",
  "Outro",
];

const BITOLAS_CABO_CA = [
  "4 mm² flexível 750 V",
  "6 mm² flexível 750 V",
  "10 mm² flexível 750 V",
  "16 mm² flexível 750 V",
  "25 mm² flexível 750 V",
  "35 mm² flexível 750 V",
  "50 mm² flexível 750 V",
  "Outro",
];

const BITOLAS_CABO_CC = [
  "4 mm² cabo solar 1,8 kV CC",
  "6 mm² cabo solar 1,8 kV CC",
  "10 mm² cabo solar 1,8 kV CC",
  "Outro",
];

const BITOLAS_CABO_TERRA = [
  "4 mm²",
  "6 mm²",
  "10 mm²",
  "16 mm²",
  "25 mm²",
  "35 mm²",
  "Outro",
];

export default function EngenhariaModule() {
  const [secaoAtiva, setSecaoAtiva] = useState<
    "projetos" | "novo" | "documentacao" | "pendencias" | "arquivos"
  >("projetos");

  const [projetos, setProjetos] = useState<ProjetoEngenharia[]>([]);
  const [clientes, setClientes] = useState<ClienteCRM[]>([]);
  const [vistorias, setVistorias] = useState<VistoriaSolarImportada[]>([]);
  const [projeto, setProjeto] = useState<ProjetoEngenharia>(projetoInicial());
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    try {
      const salvos = localStorage.getItem(CHAVE_PROJETOS);
      if (salvos) {
        const lista = JSON.parse(salvos) as ProjetoEngenharia[];
        if (Array.isArray(lista)) {
          setProjetos(
            lista.map((item) => ({
              ...item,
              clienteId: item.clienteId ?? "",
              vistoriaOrigemId: item.vistoriaOrigemId ?? "",
            })),
          );
        }
      }
    } catch (erro) {
      console.error("Erro ao carregar projetos de engenharia:", erro);
    }

    try {
      const salvos = localStorage.getItem(CHAVE_CLIENTES);
      if (salvos) {
        const lista = JSON.parse(salvos) as ClienteCRM[];
        if (Array.isArray(lista)) {
          setClientes(lista);
        }
      }
    } catch (erro) {
      console.error("Erro ao carregar clientes:", erro);
    }

    try {
      const salvas = localStorage.getItem(CHAVE_VISTORIAS);
      if (salvas) {
        const lista = JSON.parse(salvas) as VistoriaSolarImportada[];
        if (Array.isArray(lista)) {
          setVistorias(lista);
        }
      }
    } catch (erro) {
      console.error("Erro ao carregar vistorias:", erro);
    }
  }, []);

  const projetosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return projetos.filter((item) => {
      if (!termo) return true;

      return (
        item.clienteNome.toLowerCase().includes(termo) ||
        item.cidade.toLowerCase().includes(termo) ||
        item.status.toLowerCase().includes(termo)
      );
    });
  }, [projetos, busca]);

  const projetosPendentes = useMemo(
    () =>
      projetos.filter(
        (item) =>
          item.status !== "Sistema funcionando / gerando" &&
          (item.documentos.some((doc) => !doc.concluido) ||
            item.status === "Documentação pendente" ||
            item.status === "Em análise" ||
            item.status === "Vistoria solicitada" ||
            item.status === "Obra da concessionária" ||
            item.status === "Aguardando vistoria / troca do medidor"),
      ),
    [projetos],
  );

  function salvarLista(novaLista: ProjetoEngenharia[]) {
    setProjetos(novaLista);
    localStorage.setItem(CHAVE_PROJETOS, JSON.stringify(novaLista));
  }

  function atualizarCampo<K extends keyof ProjetoEngenharia>(
    campo: K,
    valor: ProjetoEngenharia[K],
  ) {
    setProjeto((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }


  function normalizarTexto(valor?: string) {
    return (valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function encontrarVistoriaDoCliente(cliente: ClienteCRM) {
    const telefoneCliente = cliente.telefone.replace(/\D/g, "");
    const nomeCliente = normalizarTexto(cliente.nome);

    const candidatas = vistorias.filter((vistoria) => {
      const telefoneVistoria = (vistoria.clienteTelefone ?? "").replace(/\D/g, "");
      const nomeVistoria = normalizarTexto(vistoria.clienteNome);

      const mesmoTelefone =
        telefoneCliente.length >= 8 &&
        telefoneVistoria.length >= 8 &&
        telefoneCliente === telefoneVistoria;

      const mesmoNome = nomeCliente && nomeCliente === nomeVistoria;

      return mesmoTelefone || mesmoNome;
    });

    if (candidatas.length === 0) return null;

    return [...candidatas].sort((a, b) => {
      const dataA = new Date(a.atualizadaEm || a.criadaEm || a.data).getTime();
      const dataB = new Date(b.atualizadaEm || b.criadaEm || b.data).getTime();
      return dataB - dataA;
    })[0];
  }

  function aplicarDadosDaVistoria(
    base: ProjetoEngenharia,
    vistoria: VistoriaSolarImportada,
  ): ProjetoEngenharia {
    return {
      ...base,
      vistoriaOrigemId: vistoria.id,
      tipoTelhado: vistoria.tipoTelhado || base.tipoTelhado,
      tipoLigacao: vistoria.tipoLigacao || base.tipoLigacao,
      tensaoRede: vistoria.tensaoRede || base.tensaoRede,
      marcaDisjuntorPadrao:
        vistoria.marcaDisjuntor || base.marcaDisjuntorPadrao,
      polosDisjuntorPadrao:
        vistoria.polosDisjuntor || base.polosDisjuntorPadrao,
      amperagemDisjuntorPadrao:
        vistoria.amperagemDisjuntor || base.amperagemDisjuntorPadrao,
      bitolaCaboEntrada:
        vistoria.bitolaCaboEntrada || base.bitolaCaboEntrada,
      bitolaCaboCA: vistoria.tipoCaboCA || base.bitolaCaboCA,
      bitolaCaboCC: vistoria.tipoCaboCC || base.bitolaCaboCC,
      bitolaCaboTerra:
        vistoria.bitolaCaboTerra || base.bitolaCaboTerra,
      quantidadeModulos:
        vistoria.quantidadeModulosPrevista || base.quantidadeModulos,
      potenciaModulo:
        vistoria.potenciaModuloPrevista || base.potenciaModulo,
      potenciaInversor:
        vistoria.potenciaInversorPrevista || base.potenciaInversor,
      observacoes:
        vistoria.observacoes?.trim()
          ? `${base.observacoes ? `${base.observacoes}\n\n` : ""}Dados importados da vistoria (${vistoria.data}): ${vistoria.observacoes}`
          : base.observacoes,
    };
  }

  function selecionarCliente(clienteId: string) {
    if (!clienteId) {
      setProjeto((atual) => ({
        ...atual,
        clienteId: "",
        vistoriaOrigemId: "",
      }));
      return;
    }

    const cliente = clientes.find((item) => item.id === clienteId);
    if (!cliente) return;

    let atualizado: ProjetoEngenharia = {
      ...projeto,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      telefone: cliente.telefone,
      cidade: cliente.cidade,
      endereco: cliente.endereco,
      vistoriaOrigemId: "",
    };

    const vistoria = encontrarVistoriaDoCliente(cliente);

    if (vistoria) {
      atualizado = aplicarDadosDaVistoria(atualizado, vistoria);
      setMensagem(
        `Cliente carregado. A última vistoria encontrada foi importada automaticamente (${vistoria.data}).`,
      );
    } else {
      setMensagem(
        "Cliente carregado. Nenhuma vistoria salva foi encontrada para este cliente.",
      );
    }

    setProjeto(atualizado);
  }

  function importarVistoriaNovamente() {
    if (!projeto.clienteId) {
      alert("Selecione primeiro um cliente cadastrado.");
      return;
    }

    const cliente = clientes.find((item) => item.id === projeto.clienteId);
    if (!cliente) {
      alert("Cliente cadastrado não encontrado.");
      return;
    }

    const vistoria = encontrarVistoriaDoCliente(cliente);

    if (!vistoria) {
      alert("Nenhuma vistoria salva foi encontrada para este cliente.");
      return;
    }

    const confirmar = window.confirm(
      "Deseja importar novamente os dados da vistoria? Os campos técnicos correspondentes do projeto serão atualizados.",
    );

    if (!confirmar) return;

    setProjeto((atual) => aplicarDadosDaVistoria(atual, vistoria));
    setMensagem(`Dados da vistoria de ${vistoria.data} importados novamente.`);
  }

  function novoProjeto() {
    setProjeto(projetoInicial());
    setEditandoId(null);
    setMensagem("");
    setSecaoAtiva("novo");
  }

  function salvarProjeto() {
    if (!projeto.clienteNome.trim()) {
      alert("Informe o nome do cliente.");
      return;
    }

    const agora = new Date().toISOString();

    const final: ProjetoEngenharia = {
      ...projeto,
      id: editandoId || crypto.randomUUID(),
      clienteNome: projeto.clienteNome.trim(),
      telefone: projeto.telefone.trim(),
      cidade: projeto.cidade.trim(),
      endereco: projeto.endereco.trim(),
      criadoEm: editandoId ? projeto.criadoEm : agora,
      atualizadoEm: agora,
    };

    const novaLista = editandoId
      ? projetos.map((item) => (item.id === editandoId ? final : item))
      : [final, ...projetos];

    salvarLista(novaLista);
    setProjeto(final);
    setEditandoId(final.id);
    setMensagem("Projeto salvo com sucesso.");
    setSecaoAtiva("projetos");
  }

  function abrirProjeto(item: ProjetoEngenharia) {
    setProjeto({
      ...item,
      clienteId: item.clienteId ?? "",
      vistoriaOrigemId: item.vistoriaOrigemId ?? "",
      documentos:
        item.documentos?.length > 0
          ? item.documentos
          : criarChecklistDocumentos(),
      arquivos: item.arquivos ?? [],
    });
    setEditandoId(item.id);
    setMensagem("");
    setSecaoAtiva("novo");
  }

  function moverProjetoStatus(id: string, novoStatus: StatusProjeto) {
    const agora = new Date().toISOString();

    salvarLista(
      projetos.map((item) =>
        item.id === id
          ? {
              ...item,
              status: novoStatus,
              atualizadoEm: agora,
            }
          : item,
      ),
    );

    setMensagem(`Projeto movido para: ${novoStatus}.`);
  }


  function excluirProjeto(id: string) {
    if (!window.confirm("Deseja realmente excluir este projeto?")) return;
    salvarLista(projetos.filter((item) => item.id !== id));
  }

  function alternarDocumento(id: string) {
    setProjeto((anterior) => ({
      ...anterior,
      documentos: anterior.documentos.map((documento) =>
        documento.id === id
          ? { ...documento, concluido: !documento.concluido }
          : documento,
      ),
    }));
  }

  async function adicionarArquivo(arquivo?: File) {
    if (!arquivo) return;

    try {
      const dados = await arquivoParaDataUrl(arquivo);

      const novoArquivo: ArquivoProjeto = {
        id: crypto.randomUUID(),
        nome: arquivo.name,
        tipo: arquivo.type || "application/octet-stream",
        dados,
        criadoEm: new Date().toISOString(),
      };

      setProjeto((anterior) => ({
        ...anterior,
        arquivos: [...anterior.arquivos, novoArquivo],
      }));
    } catch (erro) {
      console.error("Erro ao adicionar arquivo:", erro);
      alert("Não foi possível adicionar o arquivo.");
    }
  }

  function removerArquivo(id: string) {
    setProjeto((anterior) => ({
      ...anterior,
      arquivos: anterior.arquivos.filter((arquivo) => arquivo.id !== id),
    }));
  }

  function salvarAlteracoesProjetoAtual() {
    if (!editandoId) {
      salvarProjeto();
      return;
    }

    const agora = new Date().toISOString();
    const atualizado = {
      ...projeto,
      atualizadoEm: agora,
    };

    salvarLista(
      projetos.map((item) => (item.id === editandoId ? atualizado : item)),
    );

    setProjeto(atualizado);
    setMensagem("Alterações salvas.");
  }

  return (
    <section className="p-4 md:p-7">
      <div>
        <p className="text-sm font-bold uppercase text-yellow-400">
          CHOQUESEG PRO
        </p>
        <h2 className="mt-1 text-3xl font-black uppercase">
          Engenharia e Projetos
        </h2>
        <p className="mt-2 text-zinc-400">
          Acompanhe documentação, aprovação, instalação, vistoria e liberação do sistema.
        </p>
      </div>

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="lg:sticky lg:top-4 lg:w-64 lg:shrink-0">
          <div className="rounded-2xl border border-zinc-800 bg-black p-2">
            <p className="px-3 py-2 text-xs font-black uppercase text-zinc-500">
              Menu de engenharia
            </p>

            <nav className="flex flex-col gap-2">
              <BotaoMenu
                ativo={secaoAtiva === "projetos"}
                icone="📋"
                titulo="Projetos"
                onClick={() => setSecaoAtiva("projetos")}
              />
              <BotaoMenu
                ativo={secaoAtiva === "novo"}
                icone="➕"
                titulo="Novo projeto"
                onClick={novoProjeto}
              />
              <BotaoMenu
                ativo={secaoAtiva === "documentacao"}
                icone="📑"
                titulo="Documentação"
                onClick={() => setSecaoAtiva("documentacao")}
              />
              <BotaoMenu
                ativo={secaoAtiva === "pendencias"}
                icone="⚠️"
                titulo="Pendências"
                onClick={() => setSecaoAtiva("pendencias")}
              />
              <BotaoMenu
                ativo={secaoAtiva === "arquivos"}
                icone="📁"
                titulo="Arquivos"
                onClick={() => setSecaoAtiva("arquivos")}
              />
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {secaoAtiva === "projetos" && (
            <section className="rounded-3xl border border-zinc-800 bg-black p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase text-yellow-400">
                    Andamento dos projetos
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Arraste o projeto para outra etapa ou use a seta do próprio card.
                  </p>
                </div>

                <input
                  type="text"
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  placeholder="Pesquisar cliente..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400 md:max-w-sm"
                />
              </div>

              {projetosFiltrados.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-zinc-700 p-10 text-center text-zinc-500">
                  Nenhum projeto cadastrado.
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto pb-3">
                  <div className="flex min-w-max gap-4">
                    {STATUS_PROJETO.map((status) => {
                      const itens = projetosFiltrados.filter(
                        (item) => item.status === status,
                      );

                      return (
                        <section
                          key={status}
                          onDragOver={(evento) => evento.preventDefault()}
                          onDrop={(evento) => {
                            const id = evento.dataTransfer.getData("text/plain");
                            if (id) moverProjetoStatus(id, status);
                          }}
                          className="w-[300px] shrink-0 rounded-2xl border border-zinc-800 bg-zinc-950 p-3"
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <h4 className="text-sm font-black uppercase text-yellow-400">
                              {status}
                            </h4>
                            <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs font-black text-zinc-300">
                              {itens.length}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {itens.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-zinc-800 p-5 text-center text-xs text-zinc-600">
                                Sem projetos
                              </div>
                            ) : (
                              itens.map((item) => {
                                const indiceStatus = STATUS_PROJETO.indexOf(
                                  item.status,
                                );
                                const anterior =
                                  indiceStatus > 0
                                    ? STATUS_PROJETO[indiceStatus - 1]
                                    : null;
                                const proximo =
                                  indiceStatus < STATUS_PROJETO.length - 1
                                    ? STATUS_PROJETO[indiceStatus + 1]
                                    : null;

                                return (
                                  <article
                                    key={item.id}
                                    draggable
                                    onDragStart={(evento) =>
                                      evento.dataTransfer.setData(
                                        "text/plain",
                                        item.id,
                                      )
                                    }
                                    className="cursor-grab rounded-xl border border-zinc-700 bg-black p-4 active:cursor-grabbing"
                                  >
                                    <h5 className="font-black text-white">
                                      {item.clienteNome}
                                    </h5>
                                    <p className="mt-1 text-xs text-zinc-500">
                                      {item.cidade || "Cidade não informada"}
                                    </p>
                                    <p className="mt-2 text-xs text-zinc-400">
                                      {item.quantidadeModulos || "—"} módulos ·{" "}
                                      {item.potenciaInversor || "Inversor não informado"}
                                    </p>

                                    {item.status === "Obra da concessionária" &&
                                      item.observacaoObraConcessionaria && (
                                        <p className="mt-2 rounded-lg border border-orange-500/30 bg-orange-500/5 p-2 text-xs text-orange-300">
                                          {item.observacaoObraConcessionaria}
                                        </p>
                                      )}

                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {anterior && (
                                        <button
                                          type="button"
                                          title={`Mover para ${anterior}`}
                                          onClick={() =>
                                            moverProjetoStatus(item.id, anterior)
                                          }
                                          className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-black text-zinc-300"
                                        >
                                          ←
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => abrirProjeto(item)}
                                        className="flex-1 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-black uppercase text-black"
                                      >
                                        Abrir
                                      </button>

                                      {proximo && (
                                        <button
                                          type="button"
                                          title={`Mover para ${proximo}`}
                                          onClick={() =>
                                            moverProjetoStatus(item.id, proximo)
                                          }
                                          className="rounded-lg border border-yellow-400 px-3 py-2 text-xs font-black text-yellow-400"
                                        >
                                          →
                                        </button>
                                      )}
                                    </div>
                                  </article>
                                );
                              })
                            )}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {secaoAtiva === "novo" && (
            <section className="space-y-5">
              <Bloco titulo={editandoId ? "Editar projeto" : "Novo projeto"}>
                <div className="mb-5 rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-4">
                  <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                    <Select
                      titulo="Selecionar cliente cadastrado"
                      valor={projeto.clienteId ?? ""}
                      opcoes={[
                        "",
                        ...clientes
                          .filter(
                            (cliente) =>
                              cliente.tipoServico === "Energia Solar",
                          )
                          .sort((a, b) => a.nome.localeCompare(b.nome))
                          .map((cliente) => `${cliente.id}|||${cliente.nome}`),
                      ]}
                      aoAlterar={(valor) => {
                        const clienteId = valor.includes("|||")
                          ? valor.split("|||")[0]
                          : valor;
                        selecionarCliente(clienteId);
                      }}
                      formatarOpcao={(opcao) => {
                        if (!opcao) return "Selecione um cliente";
                        return opcao.includes("|||")
                          ? opcao.split("|||")[1]
                          : opcao;
                      }}
                    />

                    <button
                      type="button"
                      onClick={importarVistoriaNovamente}
                      disabled={!projeto.clienteId}
                      className="rounded-xl border border-yellow-400 px-4 py-3 text-sm font-black uppercase text-yellow-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      🔄 Importar vistoria
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-zinc-500">
                    Ao selecionar um cliente de Energia Solar, nome, telefone,
                    cidade e endereço são preenchidos automaticamente. Se houver
                    vistoria salva, os dados técnicos compatíveis também são
                    importados.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Campo
                    titulo="Cliente"
                    valor={projeto.clienteNome}
                    aoAlterar={(v) => atualizarCampo("clienteNome", v)}
                  />
                  <Campo
                    titulo="Telefone"
                    valor={projeto.telefone}
                    aoAlterar={(v) => atualizarCampo("telefone", v)}
                  />
                  <Campo
                    titulo="Cidade"
                    valor={projeto.cidade}
                    aoAlterar={(v) => atualizarCampo("cidade", v)}
                  />
                  <Campo
                    titulo="Endereço"
                    valor={projeto.endereco}
                    aoAlterar={(v) => atualizarCampo("endereco", v)}
                  />
                  <Campo
                    titulo="Responsável da engenharia"
                    valor={projeto.responsavelEngenharia}
                    aoAlterar={(v) =>
                      atualizarCampo("responsavelEngenharia", v)
                    }
                  />
                  <Campo
                    titulo="Data de início"
                    valor={projeto.dataInicio}
                    tipo="date"
                    aoAlterar={(v) => atualizarCampo("dataInicio", v)}
                  />
                  <Select
                    titulo="Status do projeto"
                    valor={projeto.status}
                    opcoes={STATUS_PROJETO}
                    aoAlterar={(v) =>
                      atualizarCampo("status", v as StatusProjeto)
                    }
                  />
                </div>

                {projeto.vistoriaOrigemId && (
                  <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-300">
                    ✓ Este projeto possui dados importados de uma vistoria técnica salva.
                  </div>
                )}
              </Bloco>

              <Bloco titulo="Dimensionamento técnico">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Campo
                    titulo="Quantidade de módulos"
                    valor={projeto.quantidadeModulos}
                    aoAlterar={(v) => atualizarCampo("quantidadeModulos", v)}
                  />

                  <Select
                    titulo="Marca dos módulos"
                    valor={projeto.marcaModulo ?? "Jinko"}
                    opcoes={MARCAS_MODULOS}
                    aoAlterar={(v) => atualizarCampo("marcaModulo", v)}
                  />

                  <Select
                    titulo="Potência dos módulos"
                    valor={projeto.potenciaModulo ?? "630 W"}
                    opcoes={POTENCIAS_MODULOS}
                    aoAlterar={(v) => atualizarCampo("potenciaModulo", v)}
                  />

                  <Select
                    titulo="Marca do inversor"
                    valor={projeto.marcaInversor ?? "Huawei"}
                    opcoes={MARCAS_INVERSORES}
                    aoAlterar={(v) => atualizarCampo("marcaInversor", v)}
                  />

                  <Select
                    titulo="Potência do inversor"
                    valor={projeto.potenciaInversor ?? "5 kW"}
                    opcoes={POTENCIAS_INVERSORES}
                    aoAlterar={(v) => atualizarCampo("potenciaInversor", v)}
                  />

                  <Campo
                    titulo="Quantidade de inversores"
                    valor={projeto.quantidadeInversores ?? "1"}
                    aoAlterar={(v) => atualizarCampo("quantidadeInversores", v)}
                  />

                  <Select
                    titulo="Tipo de telhado"
                    valor={projeto.tipoTelhado ?? "Cerâmico"}
                    opcoes={TIPOS_TELHADO}
                    aoAlterar={(v) => atualizarCampo("tipoTelhado", v)}
                  />

                  <Select
                    titulo="Tipo de ligação"
                    valor={projeto.tipoLigacao ?? "Bifásica"}
                    opcoes={TIPOS_LIGACAO}
                    aoAlterar={(v) => atualizarCampo("tipoLigacao", v)}
                  />

                  <Select
                    titulo="Tensão da rede"
                    valor={projeto.tensaoRede ?? "220 V"}
                    opcoes={TENSOES_REDE}
                    aoAlterar={(v) => atualizarCampo("tensaoRede", v)}
                  />

                  <Select
                    titulo="Marca do disjuntor do padrão"
                    valor={projeto.marcaDisjuntorPadrao ?? "Soprano"}
                    opcoes={MARCAS_DISJUNTORES}
                    aoAlterar={(v) =>
                      atualizarCampo("marcaDisjuntorPadrao", v)
                    }
                  />

                  <Select
                    titulo="Polos do disjuntor"
                    valor={projeto.polosDisjuntorPadrao ?? "Bipolar"}
                    opcoes={POLOS_DISJUNTORES}
                    aoAlterar={(v) =>
                      atualizarCampo("polosDisjuntorPadrao", v)
                    }
                  />

                  <Select
                    titulo="Amperagem do disjuntor"
                    valor={projeto.amperagemDisjuntorPadrao ?? "40 A"}
                    opcoes={AMPERAGENS_DISJUNTORES}
                    aoAlterar={(v) =>
                      atualizarCampo("amperagemDisjuntorPadrao", v)
                    }
                  />

                  <Select
                    titulo="Cabo de entrada"
                    valor={projeto.bitolaCaboEntrada ?? "10 mm² 0,6/1 kV"}
                    opcoes={BITOLAS_CABO_ENTRADA}
                    aoAlterar={(v) => atualizarCampo("bitolaCaboEntrada", v)}
                  />

                  <Select
                    titulo="Cabo CA — inversor até quadro"
                    valor={projeto.bitolaCaboCA ?? "6 mm² flexível 750 V"}
                    opcoes={BITOLAS_CABO_CA}
                    aoAlterar={(v) => atualizarCampo("bitolaCaboCA", v)}
                  />

                  <Select
                    titulo="Cabo CC — módulos até inversor"
                    valor={projeto.bitolaCaboCC ?? "6 mm² cabo solar 1,8 kV CC"}
                    opcoes={BITOLAS_CABO_CC}
                    aoAlterar={(v) => atualizarCampo("bitolaCaboCC", v)}
                  />

                  <Select
                    titulo="Cabo de aterramento"
                    valor={projeto.bitolaCaboTerra ?? "6 mm²"}
                    opcoes={BITOLAS_CABO_TERRA}
                    aoAlterar={(v) => atualizarCampo("bitolaCaboTerra", v)}
                  />
                </div>
              </Bloco>

              {projeto.status === "Obra da concessionária" && (
                <Bloco titulo="Obra da concessionária">
                  <textarea
                    value={projeto.observacaoObraConcessionaria ?? ""}
                    onChange={(evento) =>
                      atualizarCampo(
                        "observacaoObraConcessionaria",
                        evento.target.value,
                      )
                    }
                    rows={4}
                    placeholder="Ex.: substituição de transformador, reforço de rede, adequação no poste, extensão de rede, prazo informado pela Energisa..."
                    className="w-full rounded-xl border border-orange-500/40 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-orange-400"
                  />
                </Bloco>
              )}

              <Bloco titulo="Observações">
                <textarea
                  value={projeto.observacoes}
                  onChange={(evento) =>
                    atualizarCampo("observacoes", evento.target.value)
                  }
                  rows={5}
                  placeholder="Pendências, observações do engenheiro, exigências da concessionária..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
                />
              </Bloco>

              <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-black p-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSecaoAtiva("projetos")}
                  className="rounded-xl border border-zinc-700 px-5 py-3 font-black uppercase text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={salvarProjeto}
                  className="rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black"
                >
                  Salvar projeto
                </button>
              </div>
            </section>
          )}

          {secaoAtiva === "documentacao" && (
            <section className="rounded-3xl border border-zinc-800 bg-black p-5">
              <h3 className="text-xl font-black uppercase text-yellow-400">
                Checklist de documentação
              </h3>

              {!editandoId ? (
                <Aviso texto="Abra um projeto na lista para conferir ou atualizar a documentação." />
              ) : (
                <>
                  <p className="mt-2 text-zinc-400">
                    Cliente: <strong className="text-white">{projeto.clienteNome}</strong>
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {projeto.documentos.map((documento) => (
                      <label
                        key={documento.id}
                        className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                      >
                        <input
                          type="checkbox"
                          checked={documento.concluido}
                          onChange={() => alternarDocumento(documento.id)}
                          className="h-5 w-5 accent-yellow-400"
                        />
                        <span className="font-bold text-zinc-200">
                          {documento.titulo}
                        </span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={salvarAlteracoesProjetoAtual}
                    className="mt-5 rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black"
                  >
                    Salvar documentação
                  </button>
                </>
              )}
            </section>
          )}

          {secaoAtiva === "pendencias" && (
            <section className="rounded-3xl border border-zinc-800 bg-black p-5">
              <h3 className="text-xl font-black uppercase text-yellow-400">
                Pendências
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Projetos que ainda precisam de atenção.
              </p>

              <div className="mt-5 space-y-3">
                {projetosPendentes.length === 0 ? (
                  <Aviso texto="Nenhuma pendência encontrada." />
                ) : (
                  projetosPendentes.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h4 className="font-black text-white">
                            {item.clienteNome}
                          </h4>
                          <p className="mt-1 text-sm text-orange-300">
                            {item.status}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {item.documentos.filter((doc) => !doc.concluido).length} documento(s) pendente(s)
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => abrirProjeto(item)}
                          className="rounded-xl border border-yellow-400 px-4 py-2 text-xs font-black uppercase text-yellow-400"
                        >
                          Abrir projeto
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

          {secaoAtiva === "arquivos" && (
            <section className="rounded-3xl border border-zinc-800 bg-black p-5">
              <h3 className="text-xl font-black uppercase text-yellow-400">
                Arquivos do projeto
              </h3>

              {!editandoId ? (
                <Aviso texto="Abra um projeto antes de anexar arquivos." />
              ) : (
                <>
                  <p className="mt-2 text-zinc-400">
                    Cliente: <strong className="text-white">{projeto.clienteNome}</strong>
                  </p>

                  <label className="mt-5 inline-flex cursor-pointer rounded-xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase text-black">
                    + Adicionar arquivo
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                      className="hidden"
                      onChange={(evento) => {
                        const arquivo = evento.target.files?.[0];
                        void adicionarArquivo(arquivo);
                        evento.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <div className="mt-5 space-y-3">
                    {projeto.arquivos.length === 0 ? (
                      <Aviso texto="Nenhum arquivo anexado." />
                    ) : (
                      projeto.arquivos.map((arquivo) => (
                        <div
                          key={arquivo.id}
                          className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-bold text-white">{arquivo.nome}</p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {new Date(arquivo.criadoEm).toLocaleString("pt-BR")}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <a
                              href={arquivo.dados}
                              download={arquivo.nome}
                              className="rounded-lg border border-yellow-400 px-3 py-2 text-xs font-black uppercase text-yellow-400"
                            >
                              Abrir / baixar
                            </a>
                            <button
                              type="button"
                              onClick={() => removerArquivo(arquivo.id)}
                              className="rounded-lg bg-red-700 px-3 py-2 text-xs font-black uppercase text-white"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={salvarAlteracoesProjetoAtual}
                    className="mt-5 rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black"
                  >
                    Salvar arquivos
                  </button>
                </>
              )}
            </section>
          )}
        </main>
      </div>
    </section>
  );
}

function BotaoMenu({
  ativo,
  icone,
  titulo,
  onClick,
}: {
  ativo: boolean;
  icone: string;
  titulo: string;
  onClick: () => void;
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
      <span className="text-lg">{icone}</span>
      <span>{titulo}</span>
    </button>
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
    <section className="rounded-3xl border border-zinc-800 bg-black p-5">
      <h3 className="text-lg font-black uppercase text-yellow-400">{titulo}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Campo({
  titulo,
  valor,
  aoAlterar,
  tipo = "text",
}: {
  titulo: string;
  valor: string;
  aoAlterar: (valor: string) => void;
  tipo?: "text" | "date";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {titulo}
      </span>
      <input
        type={tipo}
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </label>
  );
}

function Select({
  titulo,
  valor,
  opcoes,
  aoAlterar,
  formatarOpcao,
}: {
  titulo: string;
  valor: string;
  opcoes: string[];
  aoAlterar: (valor: string) => void;
  formatarOpcao?: (opcao: string) => string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {titulo}
      </span>
      <select
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      >
        {opcoes.map((opcao) => (
          <option
            key={opcao || "__vazio__"}
            value={opcao.includes("|||") ? opcao.split("|||")[0] : opcao}
          >
            {formatarOpcao ? formatarOpcao(opcao) : opcao}
          </option>
        ))}
      </select>
    </label>
  );
}

function Aviso({ texto }: { texto: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
      {texto}
    </div>
  );
}