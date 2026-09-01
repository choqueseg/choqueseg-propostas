"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type PerfilUsuario =
  | "administrador"
  | "vendedor"
  | "tecnico"
  | "engenheiro"
  | "atendente"
  | "funcionario";

type Funcionario = {
  id: string;
  nome: string;
  usuario?: string;
  perfil?: PerfilUsuario;
  nivelAcesso?: string;
  status: "Ativo" | "Inativo";
};

type FotoVistoria = {
  id: string;
  categoria:
    | "Telhado"
    | "Padrão de entrada"
    | "Quadro elétrico"
    | "Local do inversor"
    | "Sombreamento"
    | "Acesso"
    | "Outros";
  nome: string;
  dados: string;
  criadaEm: string;
};

type VistoriaSolar = {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  cidade: string;
  endereco: string;
  data: string;
  responsavel: string;
  status: "Em andamento" | "Concluída" | "Enviada para Engenharia";

  tipoImovel: string;
  tipoTelhado: string;
  estadoTelhado: string;
  estruturaTelhado: string;
  acessoTelhado: string;
  alturaAproximadaMetros: string;
  necessitaEscadaEspecial: boolean;
  necessitaAndaime: boolean;

  existeSombreamento: string;
  origemSombreamento: string;
  areaDisponivel: string;
  orientacaoTelhado: string;

  tipoLigacao: string;
  tensaoRede: string;
  marcaDisjuntor: string;
  polosDisjuntor: string;
  amperagemDisjuntor: string;
  bitolaCaboEntrada: string;
  materialCaboEntrada: string;
  padraoEntrada: string;
  estadoPadraoEntrada: string;
  aterramentoExistente: string;
  hasteAterramento: string;
  quadroPossuiEspaco: string;
  drExistente: string;
  dpsExistente: string;

  localInversor: string;
  localInversorObservacao: string;
  distanciaModulosInversorMetros: string;
  distanciaInversorQuadroMetros: string;
  rotaCabos: string;
  tipoCaboCC: string;
  metragemCaboCCPositivo: string;
  metragemCaboCCNegativo: string;
  quantidadeMC4: string;
  dpsCC: string;
  seccionadoraCC: string;

  tipoCaboCA: string;
  metragemCaboCA: string;
  marcaDisjuntorCA: string;
  polosDisjuntorCA: string;
  amperagemDisjuntorCA: string;
  dpsCA: string;

  bitolaCaboTerra: string;
  quantidadeHastesAterramento: string;
  condicaoAterramento: string;

  tipoCaminhamento: string;
  metragemCaminhamento: string;

  quantidadeModulosPrevista: string;
  potenciaModuloPrevista: string;
  potenciaInversorPrevista: string;

  observacoes: string;
  fotos: FotoVistoria[];

  criadaEm: string;
  criadaPor: string;
  atualizadaEm?: string;
  atualizadaPor?: string;
};


const vistoriaInicial: Omit<
  VistoriaSolar,
  "id" | "criadaEm" | "criadaPor" | "fotos"
> = {
  clienteNome: "",
  clienteTelefone: "",
  cidade: "",
  endereco: "",
  data: new Date().toISOString().slice(0, 10),
  responsavel: "",
  status: "Em andamento",

  tipoImovel: "Térreo",
  tipoTelhado: "Cerâmico",
  estadoTelhado: "Bom",
  estruturaTelhado: "Madeira",
  acessoTelhado: "Fácil",
  alturaAproximadaMetros: "",
  necessitaEscadaEspecial: false,
  necessitaAndaime: false,

  existeSombreamento: "Não",
  origemSombreamento: "",
  areaDisponivel: "Suficiente",
  orientacaoTelhado: "Não verificada",

  tipoLigacao: "Bifásica",
  tensaoRede: "220 V",
  marcaDisjuntor: "Soprano",
  polosDisjuntor: "Bipolar",
  amperagemDisjuntor: "40 A",
  bitolaCaboEntrada: "6 mm² flexível 750 V",
  materialCaboEntrada: "Cobre",
  padraoEntrada: "Muro",
  estadoPadraoEntrada: "Bom",
  aterramentoExistente: "Não verificado",
  hasteAterramento: "Não verificado",
  quadroPossuiEspaco: "Sim",
  drExistente: "Não verificado",
  dpsExistente: "Não verificado",

  localInversor: "Garagem",
  localInversorObservacao: "",
  distanciaModulosInversorMetros: "",
  distanciaInversorQuadroMetros: "",
  rotaCabos: "Não definida",
  tipoCaboCC: "6 mm² cabo solar 1,8 kV CC",
  metragemCaboCCPositivo: "",
  metragemCaboCCNegativo: "",
  quantidadeMC4: "",
  dpsCC: "Não verificado",
  seccionadoraCC: "Não verificado",

  tipoCaboCA: "6 mm² flexível 750 V",
  metragemCaboCA: "",
  marcaDisjuntorCA: "Soprano",
  polosDisjuntorCA: "Bipolar",
  amperagemDisjuntorCA: "40 A",
  dpsCA: "Não verificado",

  bitolaCaboTerra: "6 mm²",
  quantidadeHastesAterramento: "",
  condicaoAterramento: "Não verificado",

  tipoCaminhamento: "Eletroduto PVC",
  metragemCaminhamento: "",

  quantidadeModulosPrevista: "",
  potenciaModuloPrevista: "",
  potenciaInversorPrevista: "",

  observacoes: "",
};

async function arquivoParaDataUrl(arquivo: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result ?? ""));
    leitor.onerror = () => reject(new Error("Não foi possível carregar a foto."));
    leitor.readAsDataURL(arquivo);
  });
}


const marcasDisjuntor = [
  "Soprano",
  "Schneider",
  "Siemens",
  "WEG",
  "Steck",
  "Tramontina",
  "ABB",
  "Legrand",
  "Outra marca",
];

const polosDisjuntor = [
  "Monopolar",
  "Bipolar",
  "Tripolar",
];

const amperagensDisjuntor = [
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

const bitolasCabosEntrada = [
  "2,5 mm² flexível 750 V",
  "4 mm² flexível 750 V",
  "6 mm² flexível 750 V",
  "6 mm² 0,6/1 kV",
  "10 mm² flexível 750 V",
  "10 mm² 0,6/1 kV",
  "16 mm² flexível 750 V",
  "16 mm² 0,6/1 kV",
  "25 mm² flexível 750 V",
  "25 mm² 0,6/1 kV",
  "35 mm² flexível 750 V",
  "35 mm² 0,6/1 kV",
  "50 mm² flexível 750 V",
  "50 mm² 0,6/1 kV",
  "70 mm² 0,6/1 kV",
  "95 mm² 0,6/1 kV",
  "120 mm² 0,6/1 kV",
  "Não identificado",
  "Outro",
];


const cabosCC = [
  "4 mm² cabo solar 1,8 kV CC",
  "6 mm² cabo solar 1,8 kV CC",
  "10 mm² cabo solar 1,8 kV CC",
  "Não identificado",
  "Outro",
];

const cabosCA = [
  "2,5 mm² flexível 750 V",
  "4 mm² flexível 750 V",
  "6 mm² flexível 750 V",
  "6 mm² 0,6/1 kV",
  "10 mm² flexível 750 V",
  "10 mm² 0,6/1 kV",
  "16 mm² flexível 750 V",
  "16 mm² 0,6/1 kV",
  "25 mm² flexível 750 V",
  "25 mm² 0,6/1 kV",
  "35 mm² flexível 750 V",
  "35 mm² 0,6/1 kV",
  "50 mm² flexível 750 V",
  "50 mm² 0,6/1 kV",
  "Não identificado",
  "Outro",
];

const bitolasTerra = [
  "2,5 mm²",
  "4 mm²",
  "6 mm²",
  "10 mm²",
  "16 mm²",
  "25 mm²",
  "35 mm²",
  "50 mm²",
  "Não identificado",
  "Outro",
];

const tiposCaminhamento = [
  "Eletroduto PVC",
  "Eletroduto corrugado",
  "Eletroduto galvanizado",
  "Canaleta",
  "Eletrocalha",
  "Aparente",
  "Embutido",
  "Outro",
];

export default function VistoriasModule({
  usuarioNome,
  perfil,
}: {
  usuarioNome: string;
  perfil: PerfilUsuario;
}) {
  const [secaoAtiva, setSecaoAtiva] = useState<"nova" | "realizadas">("realizadas");
  const [vistoria, setVistoria] = useState<VistoriaSolar>(() => ({
    ...vistoriaInicial,
    id: "",
    fotos: [],
    criadaEm: "",
    criadaPor: usuarioNome,
    responsavel: usuarioNome,
  }));
  const [vistoriaEditandoId, setVistoriaEditandoId] = useState<string | null>(null);
  const [vistoriaLista, setVistoriaLista] = useState<VistoriaSolar[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");

  const ehAdministrador = perfil === "administrador";

  useEffect(() => {
    void carregarDados();
  }, []);

  async function carregarDados() {
    setMensagem("");

    const [vistoriasResposta, funcionariosResposta] = await Promise.all([
      supabase
        .from("vistorias")
        .select(
          "id,cliente_nome,cliente_telefone,cidade,endereco,data,responsavel,status,dados,criada_por,criada_em,atualizada_em",
        )
        .order("criada_em", { ascending: false }),
      supabase
        .from("funcionarios")
        .select("id,nome,usuario,perfil,status")
        .eq("status", "Ativo")
        .order("nome", { ascending: true }),
    ]);

    if (vistoriasResposta.error) {
      console.error("Erro ao carregar vistorias:", vistoriasResposta.error);
      setMensagem(
        `Erro ao carregar vistorias da nuvem: ${vistoriasResposta.error.message}`,
      );
      setVistoriaLista([]);
    } else {
      const lista: VistoriaSolar[] = (vistoriasResposta.data ?? []).map(
        (item) => {
          const dados = (item.dados ?? {}) as Partial<VistoriaSolar>;

          return {
            ...vistoriaInicial,
            ...dados,
            id: item.id,
            clienteNome: item.cliente_nome ?? dados.clienteNome ?? "",
            clienteTelefone:
              item.cliente_telefone ?? dados.clienteTelefone ?? "",
            cidade: item.cidade ?? dados.cidade ?? "",
            endereco: item.endereco ?? dados.endereco ?? "",
            data: item.data ?? dados.data ?? "",
            responsavel: item.responsavel ?? dados.responsavel ?? "",
            status:
              (item.status ?? dados.status ?? "Em andamento") as VistoriaSolar["status"],
            fotos: dados.fotos ?? [],
            criadaEm: item.criada_em ?? dados.criadaEm ?? "",
            criadaPor: item.criada_por ?? dados.criadaPor ?? "",
            atualizadaEm: item.atualizada_em ?? dados.atualizadaEm,
            atualizadaPor: dados.atualizadaPor,
          };
        },
      );

      setVistoriaLista(lista);
    }

    if (funcionariosResposta.error) {
      console.error(
        "Erro ao carregar funcionários:",
        funcionariosResposta.error,
      );
      setMensagem(
        `Erro ao carregar funcionários da nuvem: ${funcionariosResposta.error.message}`,
      );
      setFuncionarios([]);
    } else {
      setFuncionarios(
        (funcionariosResposta.data ?? []).map((item) => ({
          id: item.id,
          nome: item.nome ?? "",
          usuario: item.usuario ?? "",
          perfil: item.perfil as PerfilUsuario | undefined,
          nivelAcesso: "",
          status: (item.status ?? "Ativo") as Funcionario["status"],
        })),
      );
    }
  }

  function vistoriaParaBanco(item: VistoriaSolar) {
    return {
      id: item.id,
      cliente_nome: item.clienteNome,
      cliente_telefone: item.clienteTelefone,
      cidade: item.cidade,
      endereco: item.endereco,
      data: item.data,
      responsavel: item.responsavel,
      status: item.status,
      dados: item,
      criada_por: item.criadaPor,
      criada_em: item.criadaEm || new Date().toISOString(),
      atualizada_em: item.atualizadaEm || new Date().toISOString(),
    };
  }

  const vistoriasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return vistoriaLista.filter((item) => {
      if (!termo) return true;
      return (
        item.clienteNome.toLowerCase().includes(termo) ||
        item.cidade.toLowerCase().includes(termo) ||
        item.responsavel.toLowerCase().includes(termo) ||
        item.status.toLowerCase().includes(termo)
      );
    });
  }, [vistoriaLista, busca]);

  function atualizarCampo<K extends keyof VistoriaSolar>(
    campo: K,
    valor: VistoriaSolar[K],
  ) {
    setVistoria((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function novaVistoria() {
    setVistoria({
      ...vistoriaInicial,
      id: "",
      fotos: [],
      criadaEm: "",
      criadaPor: usuarioNome,
      responsavel: usuarioNome,
    });
    setVistoriaEditandoId(null);
    setMensagem("");
    setSecaoAtiva("nova");
  }

  function limparVistoria() {
    const confirmar = window.confirm(
      "Deseja limpar todos os dados preenchidos desta vistoria? As vistorias já salvas não serão apagadas.",
    );

    if (!confirmar) return;

    setVistoria({
      ...vistoriaInicial,
      id: "",
      fotos: [],
      criadaEm: "",
      criadaPor: usuarioNome,
      responsavel: usuarioNome,
    });

    setVistoriaEditandoId(null);
    setMensagem("Formulário da vistoria limpo.");
    setSecaoAtiva("nova");
  }


  async function salvarVistoria() {
    if (!vistoria.clienteNome.trim()) {
      alert("Informe o nome do cliente.");
      return;
    }

    if (!vistoria.responsavel.trim()) {
      alert("Informe quem realizou a vistoria.");
      return;
    }

    const agora = new Date().toISOString();

    const final: VistoriaSolar = {
      ...vistoria,
      id: vistoriaEditandoId || crypto.randomUUID(),
      clienteNome: vistoria.clienteNome.trim(),
      clienteTelefone: vistoria.clienteTelefone.trim(),
      cidade: vistoria.cidade.trim(),
      endereco: vistoria.endereco.trim(),
      responsavel: ehAdministrador
        ? vistoria.responsavel.trim()
        : usuarioNome,
      criadaEm: vistoriaEditandoId ? vistoria.criadaEm : agora,
      criadaPor: vistoriaEditandoId ? vistoria.criadaPor : usuarioNome,
      atualizadaEm: agora,
      atualizadaPor: usuarioNome,
    };

    if (vistoriaEditandoId) {
      const { error } = await supabase
        .from("vistorias")
        .update(vistoriaParaBanco(final))
        .eq("id", vistoriaEditandoId);

      if (error) {
        console.error("Erro ao atualizar vistoria:", error);
        setMensagem(`Erro ao atualizar vistoria na nuvem: ${error.message}`);
        return;
      }

      setVistoriaLista((atuais) =>
        atuais.map((item) =>
          item.id === vistoriaEditandoId ? final : item,
        ),
      );
      setMensagem("Vistoria atualizada e sincronizada com a nuvem.");
    } else {
      const { error } = await supabase
        .from("vistorias")
        .insert(vistoriaParaBanco(final));

      if (error) {
        console.error("Erro ao salvar vistoria:", error);
        setMensagem(`Erro ao salvar vistoria na nuvem: ${error.message}`);
        return;
      }

      setVistoriaLista((atuais) => [final, ...atuais]);
      setMensagem("Vistoria salva e sincronizada com a nuvem.");
    }

    setSecaoAtiva("realizadas");
    setVistoriaEditandoId(null);
  }

  function editarVistoria(item: VistoriaSolar) {
    setVistoria({
      ...item,
      responsavel: ehAdministrador ? item.responsavel : usuarioNome,
    });
    setVistoriaEditandoId(item.id);
    setMensagem("");
    setSecaoAtiva("nova");
  }

  async function excluirVistoria(id: string) {
    if (!ehAdministrador) return;
    if (!window.confirm("Deseja realmente excluir esta vistoria?")) return;

    const { error } = await supabase
      .from("vistorias")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir vistoria:", error);
      setMensagem(`Erro ao excluir vistoria da nuvem: ${error.message}`);
      return;
    }

    setVistoriaLista((atuais) =>
      atuais.filter((item) => item.id !== id),
    );
    setMensagem("Vistoria excluída da nuvem.");
  }

  async function adicionarFoto(
    categoria: FotoVistoria["categoria"],
    arquivo?: File,
  ) {
    if (!arquivo) return;

    try {
      const dados = await arquivoParaDataUrl(arquivo);
      const novaFoto: FotoVistoria = {
        id: crypto.randomUUID(),
        categoria,
        nome: arquivo.name,
        dados,
        criadaEm: new Date().toISOString(),
      };

      setVistoria((anterior) => ({
        ...anterior,
        fotos: [...anterior.fotos, novaFoto],
      }));
    } catch (erro) {
      console.error("Erro ao carregar foto:", erro);
      alert("Não foi possível carregar a foto.");
    }
  }

  function removerFoto(id: string) {
    setVistoria((anterior) => ({
      ...anterior,
      fotos: anterior.fotos.filter((foto) => foto.id !== id),
    }));
  }

  return (
    <section className="p-4 md:p-7">
      <div>
        <p className="text-sm font-bold uppercase text-yellow-400">
          Operação CHOQUESEG
        </p>
        <h2 className="mt-1 text-3xl font-black uppercase">Vistorias</h2>
        <p className="mt-2 text-zinc-400">
          Registre vistorias técnicas de energia solar com dados, responsável e fotos.
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
              Menu de vistorias
            </p>

            <nav className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setSecaoAtiva("realizadas")}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black uppercase transition ${
                  secaoAtiva === "realizadas"
                    ? "bg-yellow-400 text-black"
                    : "border border-zinc-800 bg-zinc-950 text-zinc-300"
                }`}
              >
                <span className="text-lg">📋</span>
                <span>Vistorias realizadas</span>
              </button>

              <button
                type="button"
                onClick={novaVistoria}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black uppercase transition ${
                  secaoAtiva === "nova"
                    ? "bg-yellow-400 text-black"
                    : "border border-zinc-800 bg-zinc-950 text-zinc-300"
                }`}
              >
                <span className="text-lg">➕</span>
                <span>Nova vistoria</span>
              </button>
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {secaoAtiva === "realizadas" && (
            <section className="rounded-3xl border border-zinc-800 bg-black p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase text-yellow-400">
                    Vistorias realizadas
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Consulte por cliente, cidade, responsável ou status.
                  </p>
                </div>

                <input
                  type="text"
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  placeholder="Pesquisar vistoria..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400 md:max-w-sm"
                />
              </div>

              <div className="mt-5 space-y-3">
                {vistoriasFiltradas.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-700 p-10 text-center text-zinc-500">
                    Nenhuma vistoria encontrada.
                  </div>
                ) : (
                  vistoriasFiltradas.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-black text-white">
                              {item.clienteNome}
                            </h4>
                            <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase text-yellow-400">
                              {item.status}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-zinc-400">
                            {item.cidade || "Cidade não informada"} · {item.data}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500">
                            Responsável: {item.responsavel}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500">
                            Fotos: {item.fotos.length}
                          </p>
                          <p className="mt-1 text-xs text-zinc-600">
                            Criada por: {item.criadaPor || item.responsavel}
                            {item.atualizadaPor
                              ? ` · Última alteração: ${item.atualizadaPor}`
                              : ""}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => editarVistoria(item)}
                            className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black uppercase text-black"
                          >
                            Abrir
                          </button>

                          {ehAdministrador && (
                            <button
                              type="button"
                              onClick={() => excluirVistoria(item.id)}
                              className="rounded-xl bg-red-700 px-4 py-2 text-xs font-black uppercase text-white"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

          {secaoAtiva === "nova" && (
            <section className="space-y-5">
              <Bloco titulo="Cliente e responsável">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Campo
                    titulo="Nome do cliente"
                    valor={vistoria.clienteNome}
                    aoAlterar={(valor) => atualizarCampo("clienteNome", valor)}
                  />
                  <Campo
                    titulo="Telefone"
                    valor={vistoria.clienteTelefone}
                    aoAlterar={(valor) => atualizarCampo("clienteTelefone", valor)}
                  />
                  <Campo
                    titulo="Cidade"
                    valor={vistoria.cidade}
                    aoAlterar={(valor) => atualizarCampo("cidade", valor)}
                  />
                  <Campo
                    titulo="Endereço"
                    valor={vistoria.endereco}
                    aoAlterar={(valor) => atualizarCampo("endereco", valor)}
                  />
                  <Campo
                    titulo="Data"
                    valor={vistoria.data}
                    tipo="date"
                    aoAlterar={(valor) => atualizarCampo("data", valor)}
                  />
                  {ehAdministrador ? (
                    <Select
                      titulo="Responsável pela vistoria"
                      valor={vistoria.responsavel}
                      opcoes={[
                        usuarioNome,
                        ...funcionarios
                          .map((funcionario) => funcionario.nome)
                          .filter((nome) => nome !== usuarioNome),
                      ]}
                      aoAlterar={(valor) =>
                        atualizarCampo("responsavel", valor)
                      }
                    />
                  ) : (
                    <CampoBloqueado
                      titulo="Responsável pela vistoria"
                      valor={usuarioNome}
                    />
                  )}
                  <Select
                    titulo="Status"
                    valor={vistoria.status}
                    opcoes={[
                      "Em andamento",
                      "Concluída",
                      "Enviada para Engenharia",
                    ]}
                    aoAlterar={(valor) =>
                      atualizarCampo(
                        "status",
                        valor as VistoriaSolar["status"],
                      )
                    }
                  />
                </div>
              </Bloco>

              <Bloco titulo="Telhado e acesso">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Select titulo="Tipo de imóvel" valor={vistoria.tipoImovel} opcoes={["Térreo","1º andar","2º andar ou mais","Comercial","Outro"]} aoAlterar={(v)=>atualizarCampo("tipoImovel",v)} />
                  <Select titulo="Tipo de telhado" valor={vistoria.tipoTelhado} opcoes={["Cerâmico","Fibrocimento","Metálico","Laje","Colonial","Sanduíche","Outro"]} aoAlterar={(v)=>atualizarCampo("tipoTelhado",v)} />
                  <Select titulo="Estado do telhado" valor={vistoria.estadoTelhado} opcoes={["Bom","Regular","Necessita reparo"]} aoAlterar={(v)=>atualizarCampo("estadoTelhado",v)} />
                  <Select titulo="Estrutura do telhado" valor={vistoria.estruturaTelhado} opcoes={["Madeira","Metálica","Concreto","Não verificado","Outro"]} aoAlterar={(v)=>atualizarCampo("estruturaTelhado",v)} />
                  <Select titulo="Acesso ao telhado" valor={vistoria.acessoTelhado} opcoes={["Fácil","Médio","Difícil"]} aoAlterar={(v)=>atualizarCampo("acessoTelhado",v)} />
                  <Campo titulo="Altura aproximada (m)" valor={vistoria.alturaAproximadaMetros} aoAlterar={(v)=>atualizarCampo("alturaAproximadaMetros",v)} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Checkbox titulo="Necessita escada especial" marcado={vistoria.necessitaEscadaEspecial} aoAlterar={(v)=>atualizarCampo("necessitaEscadaEspecial",v)} />
                  <Checkbox titulo="Necessita andaime" marcado={vistoria.necessitaAndaime} aoAlterar={(v)=>atualizarCampo("necessitaAndaime",v)} />
                </div>
              </Bloco>

              <Bloco titulo="Sombreamento e área disponível">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Select titulo="Sombreamento" valor={vistoria.existeSombreamento} opcoes={["Não","Parcial","Sim"]} aoAlterar={(v)=>atualizarCampo("existeSombreamento",v)} />
                  <Campo titulo="Origem do sombreamento" valor={vistoria.origemSombreamento} aoAlterar={(v)=>atualizarCampo("origemSombreamento",v)} />
                  <Select titulo="Área disponível" valor={vistoria.areaDisponivel} opcoes={["Suficiente","Limitada","Não verificada"]} aoAlterar={(v)=>atualizarCampo("areaDisponivel",v)} />
                  <Select titulo="Orientação do telhado" valor={vistoria.orientacaoTelhado} opcoes={["Norte","Nordeste","Noroeste","Leste","Oeste","Sul","Múltiplas águas","Não verificada"]} aoAlterar={(v)=>atualizarCampo("orientacaoTelhado",v)} />
                </div>
              </Bloco>

              <Bloco titulo="Padrão elétrico">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Select titulo="Ligação" valor={vistoria.tipoLigacao} opcoes={["Monofásica","Bifásica","Trifásica","Não identificado"]} aoAlterar={(v)=>atualizarCampo("tipoLigacao",v)} />
                  <Select titulo="Tensão da rede" valor={vistoria.tensaoRede} opcoes={["127 V","220 V","127/220 V","380 V","Não identificado"]} aoAlterar={(v)=>atualizarCampo("tensaoRede",v)} />
                  <Select
                    titulo="Marca do disjuntor"
                    valor={vistoria.marcaDisjuntor ?? "Soprano"}
                    opcoes={marcasDisjuntor}
                    aoAlterar={(v)=>atualizarCampo("marcaDisjuntor",v)}
                  />
                  <Select
                    titulo="Polos do disjuntor"
                    valor={vistoria.polosDisjuntor ?? "Bipolar"}
                    opcoes={polosDisjuntor}
                    aoAlterar={(v)=>atualizarCampo("polosDisjuntor",v)}
                  />
                  <Select
                    titulo="Amperagem do disjuntor"
                    valor={vistoria.amperagemDisjuntor ?? "40 A"}
                    opcoes={amperagensDisjuntor}
                    aoAlterar={(v)=>atualizarCampo("amperagemDisjuntor",v)}
                  />
                  <Select
                    titulo="Bitola / tipo do cabo de entrada"
                    valor={vistoria.bitolaCaboEntrada ?? "6 mm² flexível 750 V"}
                    opcoes={bitolasCabosEntrada}
                    aoAlterar={(v)=>atualizarCampo("bitolaCaboEntrada",v)}
                  />
                  <Select titulo="Material do cabo" valor={vistoria.materialCaboEntrada} opcoes={["Cobre","Alumínio","Não identificado"]} aoAlterar={(v)=>atualizarCampo("materialCaboEntrada",v)} />
                  <Select titulo="Padrão de entrada" valor={vistoria.padraoEntrada} opcoes={["Interno","Externo","Poste","Muro","Outro"]} aoAlterar={(v)=>atualizarCampo("padraoEntrada",v)} />
                  <Select titulo="Estado do padrão" valor={vistoria.estadoPadraoEntrada} opcoes={["Bom","Regular","Necessita adequação"]} aoAlterar={(v)=>atualizarCampo("estadoPadraoEntrada",v)} />
                  <Select titulo="Aterramento existente" valor={vistoria.aterramentoExistente} opcoes={["Sim","Não","Não verificado"]} aoAlterar={(v)=>atualizarCampo("aterramentoExistente",v)} />
                  <Select titulo="Haste de aterramento" valor={vistoria.hasteAterramento} opcoes={["Sim","Não","Não verificado"]} aoAlterar={(v)=>atualizarCampo("hasteAterramento",v)} />
                  <Select titulo="Espaço no quadro" valor={vistoria.quadroPossuiEspaco} opcoes={["Sim","Não","Limitado"]} aoAlterar={(v)=>atualizarCampo("quadroPossuiEspaco",v)} />
                  <Select titulo="DR existente" valor={vistoria.drExistente} opcoes={["Sim","Não","Não verificado"]} aoAlterar={(v)=>atualizarCampo("drExistente",v)} />
                  <Select titulo="DPS existente" valor={vistoria.dpsExistente} opcoes={["Sim","Não","Não verificado"]} aoAlterar={(v)=>atualizarCampo("dpsExistente",v)} />
                </div>
              </Bloco>

              <Bloco titulo="Inversor e rota de cabos">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Select titulo="Local do inversor" valor={vistoria.localInversor} opcoes={["Garagem","Área de serviço","Corredor","Parede externa coberta","Outro"]} aoAlterar={(v)=>atualizarCampo("localInversor",v)} />
                  <Campo titulo="Observação local inversor" valor={vistoria.localInversorObservacao} aoAlterar={(v)=>atualizarCampo("localInversorObservacao",v)} />
                  <Campo titulo="Módulos → inversor (m)" valor={vistoria.distanciaModulosInversorMetros} aoAlterar={(v)=>atualizarCampo("distanciaModulosInversorMetros",v)} />
                  <Campo titulo="Inversor → quadro (m)" valor={vistoria.distanciaInversorQuadroMetros} aoAlterar={(v)=>atualizarCampo("distanciaInversorQuadroMetros",v)} />
                  <Select titulo="Rota dos cabos" valor={vistoria.rotaCabos} opcoes={["Fácil","Média","Difícil","Não definida"]} aoAlterar={(v)=>atualizarCampo("rotaCabos",v)} />
                </div>
              </Bloco>

              <Bloco titulo="Lado CC — módulos até o inversor">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Select titulo="Cabo solar CC" valor={vistoria.tipoCaboCC ?? "6 mm² cabo solar 1,8 kV CC"} opcoes={cabosCC} aoAlterar={(v)=>atualizarCampo("tipoCaboCC",v)} />
                  <Campo titulo="Metragem positivo (m)" valor={vistoria.metragemCaboCCPositivo ?? ""} aoAlterar={(v)=>atualizarCampo("metragemCaboCCPositivo",v)} />
                  <Campo titulo="Metragem negativo (m)" valor={vistoria.metragemCaboCCNegativo ?? ""} aoAlterar={(v)=>atualizarCampo("metragemCaboCCNegativo",v)} />
                  <Campo titulo="Quantidade de conectores MC4" valor={vistoria.quantidadeMC4 ?? ""} aoAlterar={(v)=>atualizarCampo("quantidadeMC4",v)} />
                  <Select titulo="DPS CC" valor={vistoria.dpsCC ?? "Não verificado"} opcoes={["Sim","Não","Não verificado"]} aoAlterar={(v)=>atualizarCampo("dpsCC",v)} />
                  <Select titulo="Chave / seccionadora CC" valor={vistoria.seccionadoraCC ?? "Não verificado"} opcoes={["Sim","Não","Integrada ao inversor","Não verificado"]} aoAlterar={(v)=>atualizarCampo("seccionadoraCC",v)} />
                </div>
              </Bloco>

              <Bloco titulo="Lado CA — inversor até o quadro">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Select titulo="Cabo do lado CA" valor={vistoria.tipoCaboCA ?? "6 mm² flexível 750 V"} opcoes={cabosCA} aoAlterar={(v)=>atualizarCampo("tipoCaboCA",v)} />
                  <Campo titulo="Metragem do cabo CA (m)" valor={vistoria.metragemCaboCA ?? ""} aoAlterar={(v)=>atualizarCampo("metragemCaboCA",v)} />
                  <Select titulo="Marca disjuntor CA" valor={vistoria.marcaDisjuntorCA ?? "Soprano"} opcoes={marcasDisjuntor} aoAlterar={(v)=>atualizarCampo("marcaDisjuntorCA",v)} />
                  <Select titulo="Polos disjuntor CA" valor={vistoria.polosDisjuntorCA ?? "Bipolar"} opcoes={polosDisjuntor} aoAlterar={(v)=>atualizarCampo("polosDisjuntorCA",v)} />
                  <Select titulo="Amperagem disjuntor CA" valor={vistoria.amperagemDisjuntorCA ?? "40 A"} opcoes={amperagensDisjuntor} aoAlterar={(v)=>atualizarCampo("amperagemDisjuntorCA",v)} />
                  <Select titulo="DPS CA" valor={vistoria.dpsCA ?? "Não verificado"} opcoes={["Sim","Não","Não verificado"]} aoAlterar={(v)=>atualizarCampo("dpsCA",v)} />
                </div>
              </Bloco>

              <Bloco titulo="Aterramento do sistema">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Select titulo="Bitola do cabo terra" valor={vistoria.bitolaCaboTerra ?? "6 mm²"} opcoes={bitolasTerra} aoAlterar={(v)=>atualizarCampo("bitolaCaboTerra",v)} />
                  <Campo titulo="Quantidade de hastes" valor={vistoria.quantidadeHastesAterramento ?? ""} aoAlterar={(v)=>atualizarCampo("quantidadeHastesAterramento",v)} />
                  <Select titulo="Condição do aterramento" valor={vistoria.condicaoAterramento ?? "Não verificado"} opcoes={["Bom","Regular","Necessita adequação","Não existe","Não verificado"]} aoAlterar={(v)=>atualizarCampo("condicaoAterramento",v)} />
                </div>
              </Bloco>

              <Bloco titulo="Caminhamento dos cabos">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Select titulo="Tipo de caminhamento" valor={vistoria.tipoCaminhamento ?? "Eletroduto PVC"} opcoes={tiposCaminhamento} aoAlterar={(v)=>atualizarCampo("tipoCaminhamento",v)} />
                  <Campo titulo="Metragem aproximada (m)" valor={vistoria.metragemCaminhamento ?? ""} aoAlterar={(v)=>atualizarCampo("metragemCaminhamento",v)} />
                </div>
              </Bloco>

              <Bloco titulo="Dimensionamento previsto">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Campo titulo="Quantidade de módulos" valor={vistoria.quantidadeModulosPrevista} aoAlterar={(v)=>atualizarCampo("quantidadeModulosPrevista",v)} />
                  <Campo titulo="Potência do módulo" valor={vistoria.potenciaModuloPrevista} aoAlterar={(v)=>atualizarCampo("potenciaModuloPrevista",v)} />
                  <Campo titulo="Potência do inversor" valor={vistoria.potenciaInversorPrevista} aoAlterar={(v)=>atualizarCampo("potenciaInversorPrevista",v)} />
                </div>
              </Bloco>

              <Bloco titulo="Fotos da vistoria">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(["Telhado","Padrão de entrada","Quadro elétrico","Local do inversor","Sombreamento","Acesso","Outros"] as FotoVistoria["categoria"][]).map((categoria) => (
                    <label key={categoria} className="cursor-pointer rounded-xl border border-dashed border-yellow-400/50 bg-yellow-400/5 px-3 py-3 text-center text-xs font-black uppercase text-yellow-400">
                      + {categoria}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(evento) => {
                          const arquivo = evento.target.files?.[0];
                          void adicionarFoto(categoria, arquivo);
                          evento.currentTarget.value = "";
                        }}
                      />
                    </label>
                  ))}
                </div>

                {vistoria.fotos.length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {vistoria.fotos.map((foto) => (
                      <figure key={foto.id} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                        <img src={foto.dados} alt={foto.categoria} className="aspect-video w-full object-cover" />
                        <figcaption className="p-3">
                          <p className="text-xs font-black uppercase text-yellow-400">{foto.categoria}</p>
                          <p className="mt-1 truncate text-xs text-zinc-500">{foto.nome}</p>
                          <button type="button" onClick={()=>removerFoto(foto.id)} className="mt-2 rounded-lg bg-red-700 px-3 py-2 text-xs font-black uppercase text-white">
                            Remover
                          </button>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </Bloco>

              <Bloco titulo="Observações">
                <textarea
                  value={vistoria.observacoes}
                  onChange={(evento)=>atualizarCampo("observacoes",evento.target.value)}
                  rows={5}
                  placeholder="Pendências, adequações, riscos e detalhes importantes."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
                />
              </Bloco>

              <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-black p-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={limparVistoria}
                  className="rounded-xl border border-red-500/60 px-5 py-3 font-black uppercase text-red-400 transition hover:bg-red-500 hover:text-white"
                >
                  🧹 Limpar vistoria
                </button>

                <button
                  type="button"
                  onClick={() => setSecaoAtiva("realizadas")}
                  className="rounded-xl border border-zinc-700 px-5 py-3 font-black uppercase text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={salvarVistoria}
                  className="rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black"
                >
                  Salvar vistoria
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </section>
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


function CampoBloqueado({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {titulo}
      </span>
      <div className="w-full rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-4 py-3 font-bold text-yellow-300">
        {valor}
      </div>
      <p className="mt-1 text-xs text-zinc-600">
        Identificado automaticamente pelo login.
      </p>
    </label>
  );
}

function Select({
  titulo,
  valor,
  opcoes,
  aoAlterar,
}: {
  titulo: string;
  valor: string;
  opcoes: string[];
  aoAlterar: (valor: string) => void;
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
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checkbox({
  titulo,
  marcado,
  aoAlterar,
}: {
  titulo: string;
  marcado: boolean;
  aoAlterar: (valor: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
      <input
        type="checkbox"
        checked={marcado}
        onChange={(evento) => aoAlterar(evento.target.checked)}
        className="h-5 w-5 accent-yellow-400"
      />
      <span className="text-sm font-bold text-zinc-200">{titulo}</span>
    </label>
  );
}