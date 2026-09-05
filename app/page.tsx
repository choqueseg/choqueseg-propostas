"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import FormularioProposta from "@/components/FormularioProposta";
import SeletorTipoProposta from "@/components/SeletorTipoProposta";
import HistoricoPropostas from "@/components/HistoricoPropostas";
import AvaliacaoGoogleModule from "@/modules/avaliacoes/AvaliacaoGoogleModule";
import FormularioSeguranca from "@/components/FormularioSeguranca";
import FormularioEletrica from "@/components/FormularioEletrica";
import CadastroProdutos from "@/components/CadastroProdutos";
import ClientesModule from "@/modules/clientes/ClientesModule";
import FunilModule from "@/modules/funil/FunilModule";
import DashboardModule from "@/modules/dashboard/DashboardModule";
import AgendaModule from "@/modules/agenda/AgendaModule";
import FuncionariosModule from "@/modules/funcionarios/FuncionariosModule";
import FinanceiroModule from "@/modules/financeiro/FinanceiroModule";
import EstoqueModule from "@/modules/estoque/EstoqueModule";
import FormularioAutomacao from "@/components/FormularioAutomacao";

import ContratosModule from "@/modules/contratos/ContratosModule";
import EngenhariaModule from "@/modules/engenharia/EngenhariaModule";
import Projetos3DModule from "@/modules/projetos3d/Projetos3DModule";
import SalaIAModule from "@/modules/sala-ia/SalaIAModule";
import TreinamentosModule from "@/modules/treinamentos/TreinamentosModule";
import VistoriasModule from "@/modules/vistorias/VistoriasModule";

const supabase = createClient();

type PerfilUsuario =
  | "administrador"
  | "vendedor"
  | "tecnico"
  | "atendente"
  | "funcionario"; // compatibilidade com sessões antigas

type UsuarioLogado = {
  nome: string;
  perfil: PerfilUsuario;
};

type ConviteUsuario = {
  id: string;
  token: string;
  nome: string;
  email: string;
  funcao: string;
  permissoes: string[];
  status: "Pendente" | "Aceito" | "Cancelado" | "Expirado";
  expira_em: string;
};

const PERMISSOES_SISTEMA = [
  { id: "dashboard", nome: "Dashboard" },
  { id: "clientes", nome: "Clientes" },
  { id: "funil", nome: "Funil" },
  { id: "agenda", nome: "Agenda" },
  { id: "vistorias", nome: "Vistorias" },
  { id: "treinamentos", nome: "Treinamentos" },
  { id: "propostas", nome: "Propostas" },
  { id: "contratos", nome: "Contratos" },
  { id: "engenharia", nome: "Projetos / Engenharia" },
  { id: "financeiro", nome: "Financeiro" },
  { id: "estoque", nome: "Estoque" },
  { id: "funcionarios", nome: "Funcionários" },
] as const;

function perfilPorFuncao(funcao: string): PerfilUsuario {
  const valor = funcao.trim().toLowerCase();
  if (valor.includes("atendente")) return "atendente";
  if (valor.includes("vendedor") || valor.includes("gerente") || valor.includes("supervisor")) {
    return "vendedor";
  }
  return "tecnico";
}

type TelaSistema =
  | "dashboard"
  | "propostas"
  | "historico-propostas"
  | "avaliacoes"
  | "energia-solar"
  | "seguranca-eletronica"
  | "eletrica"
  | "automacao"
  | "cadastro-produtos"
  | "clientes"
  | "funil"
  | "agenda"
  | "financeiro"
  | "funcionarios"
  | "estoque"
  | "vistorias"
  | "engenharia"
  | "treinamentos"
  | "contratos"
  | "sala-ia"
  | "projetos3d"
  | "convidar"
  | "senhas";

type TipoProposta =
  | "energia-solar"
  | "seguranca-eletronica"
  | "eletrica"
  | "automacao"
  | "cadastro-produtos";

type PropostaHistorico = {
  id: string;
  cliente_id?: string | null;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  cliente_cidade: string | null;
  tipo_proposta: string | null;
  valor_total: number | null;
  status: string | null;
  criada_em: string | null;
  atualizada_em: string | null;
};

const CHAVE_SESSAO = "choqueseg-pro-sessao";
const CHAVE_ORDEM_MENU = "choqueseg-pro-ordem-menu";

const ORDEM_MENU_PADRAO: TelaSistema[] = [
  "dashboard",
  "clientes",
  "funil",
  "agenda",
  "financeiro",
  "propostas",
  "historico-propostas",
  "avaliacoes",
  "funcionarios",
  "convidar",
  "senhas",
  "estoque",
  "vistorias",
  "engenharia",
  "treinamentos",
  "contratos",
  "sala-ia",
  "projetos3d",
];

export default function Home() {
  const [carregando, setCarregando] = useState(false);
  const [usuarioLogado, setUsuarioLogado] =
    useState<UsuarioLogado | null>(null);

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erroLogin, setErroLogin] = useState("");

  const [conviteAberto, setConviteAberto] = useState<ConviteUsuario | null>(null);
  const [carregandoConvite, setCarregandoConvite] = useState(false);
  const [usuarioConvite, setUsuarioConvite] = useState("");
  const [senhaConvite, setSenhaConvite] = useState("");
  const [confirmarSenhaConvite, setConfirmarSenhaConvite] = useState("");
  const [erroConvite, setErroConvite] = useState("");
  const [trocaSenhaObrigatoria, setTrocaSenhaObrigatoria] = useState<{
    id: string;
    nome: string;
    perfil: PerfilUsuario;
  } | null>(null);
  const [novaSenhaObrigatoria, setNovaSenhaObrigatoria] = useState("");
  const [confirmarNovaSenhaObrigatoria, setConfirmarNovaSenhaObrigatoria] = useState("");
  const [erroTrocaObrigatoria, setErroTrocaObrigatoria] = useState("");
  const [salvandoTrocaObrigatoria, setSalvandoTrocaObrigatoria] = useState(false);


  const [telaAtual, setTelaAtual] =
    useState<TelaSistema>("dashboard");

  const [ordemMenu, setOrdemMenu] =
    useState<TelaSistema[]>(ORDEM_MENU_PADRAO);

  useEffect(() => {
    try {
      const ordemSalva = localStorage.getItem(CHAVE_ORDEM_MENU);
      if (!ordemSalva) return;

      const ordemLida = JSON.parse(ordemSalva) as TelaSistema[];
      if (!Array.isArray(ordemLida)) return;

      const validos = ordemLida.filter((item) =>
        ORDEM_MENU_PADRAO.includes(item),
      );

      const faltantes = ORDEM_MENU_PADRAO.filter(
        (item) => !validos.includes(item),
      );

      setOrdemMenu([...validos, ...faltantes]);
    } catch (erro) {
      console.error("Erro ao carregar a ordem do menu:", erro);
    }
  }, []);

  function salvarOrdemMenu(novaOrdem: TelaSistema[]) {
    setOrdemMenu(novaOrdem);
    localStorage.setItem(CHAVE_ORDEM_MENU, JSON.stringify(novaOrdem));
  }

  useEffect(() => {
    try {
      const sessaoSalva = localStorage.getItem(CHAVE_SESSAO);

      if (sessaoSalva) {
        try {
          const sessao = JSON.parse(sessaoSalva) as UsuarioLogado;

          const perfilRestaurado: PerfilUsuario =
            sessao.perfil === "administrador" ||
            sessao.perfil === "vendedor" ||
            sessao.perfil === "tecnico" ||
            sessao.perfil === "atendente" ||
            sessao.perfil === "funcionario"
              ? sessao.perfil
              : "funcionario";

          const sessaoNormalizada: UsuarioLogado = {
            ...sessao,
            perfil: perfilRestaurado,
          };

          setUsuarioLogado(sessaoNormalizada);

          if (perfilRestaurado === "administrador") {
            setTelaAtual("dashboard");
          } else if (perfilRestaurado === "vendedor") {
            setTelaAtual("clientes");
          } else if (perfilRestaurado === "atendente") {
            setTelaAtual("agenda");
          } else {
            setTelaAtual("agenda");
          }
        } catch {
          localStorage.removeItem(CHAVE_SESSAO);
          setUsuarioLogado(null);
        }
      }
    } catch (erro) {
      console.error("Erro ao carregar sessão:", erro);
      setUsuarioLogado(null);
    } finally {
      setCarregando(false);
    }
  }, []);


  useEffect(() => {
    async function carregarConviteDoLink() {
      if (typeof window === "undefined") return;

      const token = new URLSearchParams(window.location.search).get("convite");
      if (!token) return;

      try {
        setCarregandoConvite(true);
        setErroConvite("");

        const { data, error } = await supabase
          .from("convites_usuarios")
          .select("id,token,nome,email,funcao,permissoes,status,expira_em")
          .eq("token", token)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setErroConvite("Este convite não foi encontrado.");
          return;
        }

        const convite = data as ConviteUsuario;

        if (convite.status !== "Pendente") {
          setErroConvite(`Este convite está com status: ${convite.status}.`);
          return;
        }

        if (new Date(convite.expira_em).getTime() < Date.now()) {
          await supabase
            .from("convites_usuarios")
            .update({ status: "Expirado" })
            .eq("id", convite.id);

          setErroConvite("Este convite expirou. Solicite um novo convite.");
          return;
        }

        setConviteAberto(convite);
        setUsuarioConvite(convite.email);
        setUsuarioLogado(null);
      } catch (erro) {
        console.error("Erro ao abrir convite:", erro);
        setErroConvite("Não foi possível abrir este convite.");
      } finally {
        setCarregandoConvite(false);
      }
    }

    void carregarConviteDoLink();
  }, []);

  async function aceitarConvite(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!conviteAberto) {
      setErroConvite("Convite não localizado.");
      return;
    }

    const usuarioNovo = usuarioConvite.trim().toLowerCase();

    if (!usuarioNovo) {
      setErroConvite("Informe o usuário ou e-mail.");
      return;
    }

    if (senhaConvite.trim().length < 4) {
      setErroConvite("A senha precisa ter pelo menos 4 caracteres.");
      return;
    }

    if (senhaConvite !== confirmarSenhaConvite) {
      setErroConvite("A confirmação da senha não confere.");
      return;
    }

    try {
      setCarregandoConvite(true);
      setErroConvite("");

      const perfil = perfilPorFuncao(conviteAberto.funcao);

      const { data: existente, error: erroConsulta } = await supabase
        .from("funcionarios")
        .select("id")
        .or(
          `usuario.eq.${usuarioNovo},email.eq.${conviteAberto.email.trim().toLowerCase()}`,
        )
        .limit(1);

      if (erroConsulta) throw erroConsulta;

      if ((existente ?? []).length > 0) {
        setErroConvite("Já existe um usuário com este e-mail ou usuário.");
        return;
      }

      const { error: erroFuncionario } = await supabase
        .from("funcionarios")
        .insert({
          id: crypto.randomUUID(),
          nome: conviteAberto.nome.trim(),
          cargo: conviteAberto.funcao.trim(),
          telefone: "",
          cpf: "",
          email: conviteAberto.email.trim().toLowerCase(),
          usuario: usuarioNovo,
          senha: senhaConvite,
          senha_temporaria: false,
          perfil,
          especialidade: "Geral",
          status: "Ativo",
          data_admissao: new Date().toISOString().slice(0, 10),
        });

      if (erroFuncionario) throw erroFuncionario;

      const { error: erroAtualizar } = await supabase
        .from("convites_usuarios")
        .update({
          status: "Aceito",
          aceito_em: new Date().toISOString(),
        })
        .eq("id", conviteAberto.id);

      if (erroAtualizar) throw erroAtualizar;

      const sessao: UsuarioLogado = {
        nome: conviteAberto.nome.trim(),
        perfil,
      };

      localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
      setUsuarioLogado(sessao);
      setConviteAberto(null);
      setUsuarioConvite("");
      setSenhaConvite("");
      setConfirmarSenhaConvite("");
      setErroConvite("");

      if (perfil === "vendedor") setTelaAtual("clientes");
      else if (perfil === "atendente") setTelaAtual("agenda");
      else setTelaAtual("agenda");

      window.history.replaceState({}, "", window.location.pathname);
    } catch (erro) {
      console.error("Erro ao aceitar convite:", erro);
      setErroConvite(
        erro instanceof Error
          ? `Não foi possível ativar o convite: ${erro.message}`
          : "Não foi possível ativar o convite.",
      );
    } finally {
      setCarregandoConvite(false);
    }
  }

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroLogin("");

    const usuarioDigitado = usuario.trim().toLowerCase();

    // Administrador principal continua disponível como acesso de emergência.
    if (usuarioDigitado === "admin" && senha === "1234") {
      const sessao: UsuarioLogado = {
        nome: "Administrador CHOQUESEG",
        perfil: "administrador",
      };

      localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
      setUsuarioLogado(sessao);
      setTelaAtual("dashboard");
      setUsuario("");
      setSenha("");
      return;
    }

    // Primeiro consulta a nuvem. Assim a flag de senha temporária é respeitada.
    try {
      const { data: funcionarioNuvem, error } = await supabase
        .from("funcionarios")
        .select("id,nome,usuario,senha,perfil,status,senha_temporaria")
        .ilike("usuario", usuarioDigitado)
        .eq("senha", senha)
        .maybeSingle();

      if (error) throw error;

      if (funcionarioNuvem) {
        if (funcionarioNuvem.status !== "Ativo") {
          setErroLogin("Este funcionário está inativo.");
          return;
        }

        const perfilFuncionario: PerfilUsuario =
          funcionarioNuvem.perfil === "administrador" ||
          funcionarioNuvem.perfil === "vendedor" ||
          funcionarioNuvem.perfil === "tecnico" ||
          funcionarioNuvem.perfil === "atendente"
            ? funcionarioNuvem.perfil
            : "tecnico";

        if (funcionarioNuvem.senha_temporaria) {
          setTrocaSenhaObrigatoria({
            id: funcionarioNuvem.id,
            nome: funcionarioNuvem.nome,
            perfil: perfilFuncionario,
          });
          setNovaSenhaObrigatoria("");
          setConfirmarNovaSenhaObrigatoria("");
          setErroTrocaObrigatoria("");
          setUsuario("");
          setSenha("");
          return;
        }

        const sessao: UsuarioLogado = {
          nome: funcionarioNuvem.nome,
          perfil: perfilFuncionario,
        };

        localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
        setUsuarioLogado(sessao);

        if (perfilFuncionario === "administrador") setTelaAtual("dashboard");
        else if (perfilFuncionario === "vendedor") setTelaAtual("clientes");
        else setTelaAtual("agenda");

        setUsuario("");
        setSenha("");
        return;
      }
    } catch (erro) {
      console.error("Erro ao consultar usuário na nuvem:", erro);
    }

    // Compatibilidade com funcionários antigos ainda salvos localmente.
    const dadosFuncionarios = localStorage.getItem("choqueseg-funcionarios");

    if (dadosFuncionarios) {
      try {
        const funcionarios = JSON.parse(dadosFuncionarios);

        const funcionarioEncontrado = funcionarios.find(
          (funcionario: {
            nome: string;
            usuario: string;
            senha: string;
            perfil?: "administrador" | "vendedor" | "tecnico" | "atendente";
            status: "Ativo" | "Inativo";
          }) =>
            funcionario.usuario?.trim().toLowerCase() === usuarioDigitado &&
            funcionario.senha === senha,
        );

        if (funcionarioEncontrado) {
          if (funcionarioEncontrado.status !== "Ativo") {
            setErroLogin("Este funcionário está inativo.");
            return;
          }

          const perfilFuncionario: PerfilUsuario =
            funcionarioEncontrado.perfil === "administrador" ||
            funcionarioEncontrado.perfil === "vendedor" ||
            funcionarioEncontrado.perfil === "tecnico" ||
            funcionarioEncontrado.perfil === "atendente"
              ? funcionarioEncontrado.perfil
              : "tecnico";

          const sessao: UsuarioLogado = {
            nome: funcionarioEncontrado.nome,
            perfil: perfilFuncionario,
          };

          localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
          setUsuarioLogado(sessao);
          setTelaAtual(perfilFuncionario === "vendedor" ? "clientes" : "agenda");
          setUsuario("");
          setSenha("");
          return;
        }
      } catch (erro) {
        console.error("Erro ao ler funcionários locais:", erro);
      }
    }

    setErroLogin("Usuário ou senha inválidos.");
  }

  async function salvarNovaSenhaObrigatoria(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    if (!trocaSenhaObrigatoria) return;

    if (novaSenhaObrigatoria.trim().length < 4) {
      setErroTrocaObrigatoria("A nova senha precisa ter pelo menos 4 caracteres.");
      return;
    }

    if (novaSenhaObrigatoria !== confirmarNovaSenhaObrigatoria) {
      setErroTrocaObrigatoria("A confirmação da nova senha não confere.");
      return;
    }

    try {
      setSalvandoTrocaObrigatoria(true);
      setErroTrocaObrigatoria("");

      const { error } = await supabase
        .from("funcionarios")
        .update({
          senha: novaSenhaObrigatoria.trim(),
          senha_temporaria: false,
        })
        .eq("id", trocaSenhaObrigatoria.id);

      if (error) throw error;

      const sessao: UsuarioLogado = {
        nome: trocaSenhaObrigatoria.nome,
        perfil: trocaSenhaObrigatoria.perfil,
      };

      localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
      setUsuarioLogado(sessao);

      if (trocaSenhaObrigatoria.perfil === "administrador") {
        setTelaAtual("dashboard");
      } else if (trocaSenhaObrigatoria.perfil === "vendedor") {
        setTelaAtual("clientes");
      } else {
        setTelaAtual("agenda");
      }

      setTrocaSenhaObrigatoria(null);
      setNovaSenhaObrigatoria("");
      setConfirmarNovaSenhaObrigatoria("");
    } catch (erro) {
      console.error("Erro ao trocar senha temporária:", erro);
      setErroTrocaObrigatoria(
        erro instanceof Error
          ? `Não foi possível alterar a senha: ${erro.message}`
          : "Não foi possível alterar a senha.",
      );
    } finally {
      setSalvandoTrocaObrigatoria(false);
    }
  }

  function abrirPropostaDoHistorico(proposta: PropostaHistorico) {
    try {
      sessionStorage.setItem(
        "choqueseg-proposta-selecionada",
        JSON.stringify(proposta),
      );
    } catch (erro) {
      console.error("Não foi possível guardar a proposta selecionada:", erro);
    }

    const tipo = String(proposta.tipo_proposta ?? "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");

    if (tipo === "energia-solar") {
      setTelaAtual("energia-solar");
      return;
    }

    if (tipo === "seguranca-eletronica") {
      setTelaAtual("seguranca-eletronica");
      return;
    }

    if (tipo === "eletrica" || tipo === "instalacoes-eletricas") {
      setTelaAtual("eletrica");
      return;
    }

    if (tipo === "automacao") {
      setTelaAtual("automacao");
      return;
    }

    setTelaAtual("historico-propostas");
  }

  function sair() {
    localStorage.removeItem(CHAVE_SESSAO);
    setUsuarioLogado(null);
    setTelaAtual("dashboard");
    setUsuario("");
    setSenha("");
    setErroLogin("");
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-yellow-400">
        <p className="text-lg font-black uppercase">
          CHOQUESEG PRO...
        </p>
      </main>
    );
  }


  if (conviteAberto || carregandoConvite || erroConvite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-yellow-400/40 bg-black p-7 shadow-2xl">
          <img
            src="/imagens/logo/brasao-choqueseg.png"
            alt="Brasão oficial da CHOQUESEG"
            className="mx-auto h-28 w-28 object-contain"
          />

          <h1 className="mt-4 text-center text-2xl font-black uppercase text-yellow-400">
            Convite CHOQUESEG PRO
          </h1>

          {carregandoConvite && !conviteAberto ? (
            <p className="mt-6 text-center text-zinc-400">Carregando convite...</p>
          ) : conviteAberto ? (
            <>
              <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-lg font-black">{conviteAberto.nome}</p>
                <p className="mt-1 text-sm text-zinc-400">{conviteAberto.email}</p>
                <p className="mt-2 text-sm font-bold text-yellow-400">
                  Função: {conviteAberto.funcao}
                </p>
              </div>

              <form onSubmit={aceitarConvite} className="mt-6 space-y-4">
                <CampoConvite
                  titulo="Usuário ou e-mail"
                  valor={usuarioConvite}
                  aoAlterar={setUsuarioConvite}
                />

                <label className="block">
                  <span className="mb-2 block text-sm font-bold uppercase text-zinc-300">
                    Crie sua senha
                  </span>
                  <input
                    type="password"
                    value={senhaConvite}
                    onChange={(evento) => setSenhaConvite(evento.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-yellow-400"
                    placeholder="Mínimo 4 caracteres"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold uppercase text-zinc-300">
                    Confirmar senha
                  </span>
                  <input
                    type="password"
                    value={confirmarSenhaConvite}
                    onChange={(evento) => setConfirmarSenhaConvite(evento.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-yellow-400"
                    placeholder="Digite a mesma senha novamente"
                  />
                </label>

                {erroConvite && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
                    {erroConvite}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={carregandoConvite}
                  className="w-full rounded-xl bg-yellow-400 px-4 py-4 font-black uppercase text-black disabled:opacity-60"
                >
                  {carregandoConvite ? "Ativando..." : "Criar senha e entrar"}
                </button>
              </form>
            </>
          ) : (
            <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
              {erroConvite || "Convite inválido."}
            </div>
          )}
        </div>
      </main>
    );
  }


  if (trocaSenhaObrigatoria) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-yellow-400/40 bg-black p-7 shadow-2xl">
          <img
            src="/imagens/logo/brasao-choqueseg.png"
            alt="Brasão oficial da CHOQUESEG"
            className="mx-auto h-28 w-28 object-contain"
          />

          <p className="mt-4 text-center text-sm font-black uppercase tracking-[0.18em] text-yellow-400">
            Senha temporária
          </p>

          <h1 className="mt-2 text-center text-2xl font-black uppercase">
            Crie sua nova senha
          </h1>

          <p className="mt-3 text-center text-sm text-zinc-400">
            Olá, {trocaSenhaObrigatoria.nome}. Para continuar, escolha uma senha pessoal.
          </p>

          <form onSubmit={salvarNovaSenhaObrigatoria} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold uppercase text-zinc-300">
                Nova senha
              </span>
              <input
                type="password"
                value={novaSenhaObrigatoria}
                onChange={(evento) => setNovaSenhaObrigatoria(evento.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-yellow-400"
                placeholder="Mínimo 4 caracteres"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold uppercase text-zinc-300">
                Confirmar nova senha
              </span>
              <input
                type="password"
                value={confirmarNovaSenhaObrigatoria}
                onChange={(evento) =>
                  setConfirmarNovaSenhaObrigatoria(evento.target.value)
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-yellow-400"
                placeholder="Digite a mesma senha novamente"
              />
            </label>

            {erroTrocaObrigatoria && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
                {erroTrocaObrigatoria}
              </div>
            )}

            <button
              type="submit"
              disabled={salvandoTrocaObrigatoria}
              className="w-full rounded-xl bg-yellow-400 px-4 py-4 font-black uppercase text-black disabled:opacity-60"
            >
              {salvandoTrocaObrigatoria
                ? "Salvando..."
                : "Salvar nova senha e entrar"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (!usuarioLogado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-md rounded-3xl border border-yellow-400/40 bg-black p-7 shadow-2xl">
          <img
            src="/imagens/logo/brasao-choqueseg.png"
            alt="Brasão oficial da CHOQUESEG"
            className="mx-auto h-32 w-32 object-contain"
          />

          <div className="mt-4 text-center">
            <h1 className="text-3xl font-black uppercase text-yellow-400">
              CHOQUESEG PRO
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Gestão, propostas, clientes e serviços em um só lugar.
            </p>
          </div>

          <form onSubmit={entrar} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="usuario"
                className="mb-2 block text-sm font-bold uppercase text-zinc-300"
              >
                Usuário
              </label>

              <input
                id="usuario"
                type="text"
                value={usuario}
                onChange={(evento) => setUsuario(evento.target.value)}
                placeholder="Digite seu usuário"
                autoComplete="username"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
              />
            </div>

            <div>
              <label
                htmlFor="senha"
                className="mb-2 block text-sm font-bold uppercase text-zinc-300"
              >
                Senha
              </label>

              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
              />
            </div>

            {erroLogin && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
                {erroLogin}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-yellow-400 px-4 py-4 font-black uppercase text-black transition hover:bg-yellow-300"
            >
              Entrar no sistema
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-500">
            <p>
              Administrador: <strong>admin</strong> / senha{" "}
              <strong>1234</strong>
            </p>

            <p className="mt-1">
              Funcionários entram com o usuário e a senha cadastrados.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const ehAdministrador = usuarioLogado.perfil === "administrador";
  const ehVendedor = usuarioLogado.perfil === "vendedor";
  const ehAtendente = usuarioLogado.perfil === "atendente";
  const ehTecnico =
    usuarioLogado.perfil === "tecnico" ||
    usuarioLogado.perfil === "funcionario";

  const podeClientes = ehAdministrador || ehVendedor || ehAtendente;
  const podeFunil = ehAdministrador || ehVendedor || ehAtendente;
  const podePropostas = ehAdministrador || ehVendedor;
  const podeAvaliacoes = ehAdministrador || ehVendedor;
  const podeAgenda = ehAdministrador || ehVendedor || ehAtendente || ehTecnico;

  // AgendaModule ainda trabalha com administrador/funcionario.
  // Vendedor e atendente precisam poder criar e gerenciar agendamentos.
  const perfilAgenda: "administrador" | "funcionario" =
    ehAdministrador || ehVendedor || ehAtendente
      ? "administrador"
      : "funcionario";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-50 border-b border-yellow-400/30 bg-black/95 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/imagens/logo/brasao-choqueseg.png"
              alt="Brasão da CHOQUESEG"
              className="h-12 w-12 object-contain"
            />

            <div>
              <h1 className="font-black uppercase text-yellow-400">
                CHOQUESEG PRO
              </h1>

              <p className="text-xs text-zinc-400">
                {usuarioLogado.nome}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={sair}
            className="rounded-xl border border-red-500/60 px-4 py-2 text-sm font-black uppercase text-red-400 transition hover:bg-red-500 hover:text-white"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        <aside className="hidden h-full w-64 shrink-0 overflow-y-auto border-r border-zinc-800 bg-black p-4 md:block">
          <MenuLateral
            telaAtual={telaAtual}
            alterarTela={setTelaAtual}
            perfil={usuarioLogado.perfil}
            ordemMenu={ordemMenu}
            salvarOrdemMenu={salvarOrdemMenu}
          />
        </aside>

        <main className="h-full min-w-0 flex-1 overflow-y-auto">
          <div className="border-b border-zinc-800 bg-black px-3 py-3 md:hidden">
            <MenuMobile
              telaAtual={telaAtual}
              alterarTela={setTelaAtual}
              perfil={usuarioLogado.perfil}
              ordemMenu={ordemMenu}
              salvarOrdemMenu={salvarOrdemMenu}
            />
          </div>

          {telaAtual === "dashboard" && ehAdministrador && (
            <DashboardModule alterarTela={setTelaAtual} />
          )}

          {telaAtual === "clientes" && podeClientes && (
            <ClientesModule />
          )}

          {telaAtual === "funil" && podeFunil && (
            <FunilModule />
          )}

          {telaAtual === "agenda" && podeAgenda && (
            <AgendaModule
              perfil={perfilAgenda}
              usuarioNome={usuarioLogado.nome}
              podeVerContatoCliente={ehAdministrador}
            />
          )}

          {telaAtual === "financeiro" && ehAdministrador && (
            <FinanceiroModule usuarioNome={usuarioLogado.nome} />
          )}

          {telaAtual === "estoque" && ehAdministrador && (
            <EstoqueModule />
          )}

          {telaAtual === "funcionarios" && ehAdministrador && (
            <FuncionariosModule />
          )}

          {telaAtual === "convidar" && ehAdministrador && (
            <ConvidarUsuariosModule />
          )}

          {telaAtual === "senhas" && ehAdministrador && (
            <SenhasModule />
          )}

          {telaAtual === "vistorias" && ehAdministrador && (
            <VistoriasModule
              usuarioNome={usuarioLogado.nome}
              perfil={usuarioLogado.perfil}
            />
          )}

          {telaAtual === "engenharia" && ehAdministrador && (
            <EngenhariaModule />
          )}

          {telaAtual === "treinamentos" && ehAdministrador && (
            <TreinamentosModule
              usuarioNome={usuarioLogado.nome}
              perfil={usuarioLogado.perfil}
            />
          )}

          {telaAtual === "contratos" && ehAdministrador && (
            <ContratosModule />
          )}

          {telaAtual === "sala-ia" && ehAdministrador && (
            <SalaIAModule />
          )}

          {telaAtual === "projetos3d" && ehAdministrador && (
            <Projetos3DModule
              aoSair={() => setTelaAtual("dashboard")}
            />
          )}

          {telaAtual === "avaliacoes" && podeAvaliacoes && (
            <AvaliacaoGoogleModule />
          )}

          {telaAtual === "propostas" && podePropostas && (
            <>
              <div className="border-b border-yellow-400/30 bg-black px-4 py-4">
                <button
                  type="button"
                  onClick={() => setTelaAtual("historico-propostas")}
                  className="w-full rounded-xl border border-yellow-400 bg-zinc-950 px-4 py-4 text-left font-black uppercase text-yellow-400 transition hover:bg-yellow-400 hover:text-black md:w-auto"
                >
                  📁 Histórico de Propostas
                </button>
              </div>

              <SeletorTipoProposta
                aoSelecionar={(tipo) => {
                  setTelaAtual(tipo as TipoProposta);
                }}
              />
            </>
          )}

          {telaAtual === "historico-propostas" && podePropostas && (
            <ModuloComVoltar voltar={() => setTelaAtual("propostas")}>
              <HistoricoPropostas aoAbrirProposta={abrirPropostaDoHistorico} />
            </ModuloComVoltar>
          )}

          {telaAtual === "energia-solar" && podePropostas && (
            <ModuloComVoltar
              voltar={() => setTelaAtual("propostas")}
            >
              <FormularioProposta />
            </ModuloComVoltar>
          )}

          {telaAtual === "seguranca-eletronica" &&
            podePropostas && (
              <ModuloComVoltar
                voltar={() => setTelaAtual("propostas")}
              >
                <FormularioSeguranca />
              </ModuloComVoltar>
            )}

          {telaAtual === "eletrica" && podePropostas && (
            <ModuloComVoltar
              voltar={() => setTelaAtual("propostas")}
            >
              <FormularioEletrica />
            </ModuloComVoltar>
          )}

          {telaAtual === "cadastro-produtos" &&
            ehAdministrador && (
              <ModuloComVoltar
                voltar={() => setTelaAtual("propostas")}
              >
                <CadastroProdutos />
              </ModuloComVoltar>
            )}

          {telaAtual === "automacao" && podePropostas && (
            <ModuloComVoltar
              voltar={() => setTelaAtual("propostas")}
            >
              <FormularioAutomacao />
            </ModuloComVoltar>
          )}
        </main>
      </div>
    </div>
  );
}

type ItemMenu = {
  tela: TelaSistema;
  nome: string;
  icone: string;
};

const ITENS_ADMINISTRADOR: ItemMenu[] = [
  { tela: "dashboard", nome: "Dashboard", icone: "🏠" },
  { tela: "clientes", nome: "Clientes", icone: "👥" },
  { tela: "funil", nome: "Funil", icone: "📊" },
  { tela: "agenda", nome: "Agenda", icone: "📅" },
  { tela: "financeiro", nome: "Financeiro", icone: "💰" },
  { tela: "propostas", nome: "Propostas", icone: "📄" },
  { tela: "historico-propostas", nome: "Histórico de Propostas", icone: "📁" },
  { tela: "avaliacoes", nome: "Avaliações Google", icone: "⭐" },
  { tela: "funcionarios", nome: "Funcionários", icone: "👷" },
  { tela: "convidar", nome: "Convidar", icone: "✉️" },
  { tela: "senhas", nome: "Senhas", icone: "🔐" },
  { tela: "estoque", nome: "Estoque", icone: "📦" },
  { tela: "vistorias", nome: "Vistorias", icone: "🔎" },
  { tela: "engenharia", nome: "Projetos / Engenharia", icone: "📐" },
  { tela: "treinamentos", nome: "Treinamentos", icone: "🎓" },
  { tela: "contratos", nome: "Contratos", icone: "📑" },
  { tela: "sala-ia", nome: "Sala IA", icone: "🤖" },
  { tela: "projetos3d", nome: "Projeto 3D", icone: "🏠" },
];

const ITENS_VENDEDOR: ItemMenu[] = [
  { tela: "clientes", nome: "Clientes", icone: "👥" },
  { tela: "funil", nome: "Funil", icone: "📊" },
  { tela: "propostas", nome: "Propostas", icone: "📄" },
  { tela: "historico-propostas", nome: "Histórico de Propostas", icone: "📁" },
  { tela: "avaliacoes", nome: "Avaliações Google", icone: "⭐" },
  { tela: "agenda", nome: "Agenda", icone: "📅" },
];

const ITENS_ATENDENTE: ItemMenu[] = [
  { tela: "clientes", nome: "Clientes", icone: "👥" },
  { tela: "funil", nome: "Funil", icone: "📊" },
  { tela: "agenda", nome: "Agenda", icone: "📅" },
];

const ITENS_TECNICO: ItemMenu[] = [
  { tela: "agenda", nome: "Minha agenda", icone: "📅" },
];

function itensMenuDoPerfil(
  perfil: PerfilUsuario,
  ordemMenu: TelaSistema[],
): ItemMenu[] {
  const base =
    perfil === "administrador"
      ? ITENS_ADMINISTRADOR
      : perfil === "vendedor"
        ? ITENS_VENDEDOR
        : perfil === "atendente"
          ? ITENS_ATENDENTE
          : ITENS_TECNICO;

  const mapa = new Map(base.map((item) => [item.tela, item]));

  const ordenados = ordemMenu
    .map((tela) => mapa.get(tela))
    .filter((item): item is ItemMenu => Boolean(item));

  const faltantes = base.filter(
    (item) => !ordenados.some((existente) => existente.tela === item.tela),
  );

  return [...ordenados, ...faltantes];
}

function moverItemMenu(
  ordemMenu: TelaSistema[],
  tela: TelaSistema,
  direcao: "cima" | "baixo",
) {
  const indice = ordemMenu.indexOf(tela);
  if (indice < 0) return ordemMenu;

  const destino = direcao === "cima" ? indice - 1 : indice + 1;
  if (destino < 0 || destino >= ordemMenu.length) return ordemMenu;

  const novaOrdem = [...ordemMenu];
  const [movido] = novaOrdem.splice(indice, 1);
  novaOrdem.splice(destino, 0, movido);
  return novaOrdem;
}

function MenuLateral({
  telaAtual,
  alterarTela,
  perfil,
  ordemMenu,
  salvarOrdemMenu,
}: {
  telaAtual: TelaSistema;
  alterarTela: (tela: TelaSistema) => void;
  perfil: PerfilUsuario;
  ordemMenu: TelaSistema[];
  salvarOrdemMenu: (ordem: TelaSistema[]) => void;
}) {
  const [organizando, setOrganizando] = useState(false);
  const itens = itensMenuDoPerfil(perfil, ordemMenu);
  const podeOrganizar = perfil === "administrador";

  return (
    <div>
      {podeOrganizar && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setOrganizando((atual) => !atual)}
            className={`w-full rounded-xl border px-3 py-2 text-xs font-black uppercase transition ${
              organizando
                ? "border-yellow-400 bg-yellow-400 text-black"
                : "border-yellow-400/50 bg-zinc-950 text-yellow-400 hover:bg-yellow-400/10"
            }`}
          >
            {organizando ? "✓ Concluir organização" : "☰ Organizar menu"}
          </button>

          {organizando && (
            <p className="mt-2 text-center text-[11px] leading-relaxed text-zinc-500">
              Use ↑ ↓ para mudar a ordem. Ela é salva automaticamente.
            </p>
          )}
        </div>
      )}

      <nav className="space-y-2">
        {itens.map((item, indice) => (
          <div key={item.tela} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => !organizando && alterarTela(item.tela)}
              className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left font-bold transition ${
                telaAtual === item.tela
                  ? "bg-yellow-400 text-black"
                  : "text-zinc-300 hover:bg-zinc-900 hover:text-yellow-400"
              } ${organizando ? "cursor-default" : ""}`}
            >
              <span>{item.icone}</span>
              <span className="min-w-0 truncate">{item.nome}</span>
            </button>

            {podeOrganizar && organizando && (
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  disabled={indice === 0}
                  onClick={() =>
                    salvarOrdemMenu(
                      moverItemMenu(ordemMenu, item.tela, "cima"),
                    )
                  }
                  className="rounded-md border border-zinc-700 px-2 py-1 text-xs font-black text-yellow-400 disabled:opacity-20"
                  aria-label={`Subir ${item.nome}`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={indice === itens.length - 1}
                  onClick={() =>
                    salvarOrdemMenu(
                      moverItemMenu(ordemMenu, item.tela, "baixo"),
                    )
                  }
                  className="rounded-md border border-zinc-700 px-2 py-1 text-xs font-black text-yellow-400 disabled:opacity-20"
                  aria-label={`Descer ${item.nome}`}
                >
                  ↓
                </button>
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}

function MenuMobile({
  telaAtual,
  alterarTela,
  perfil,
  ordemMenu,
  salvarOrdemMenu,
}: {
  telaAtual: TelaSistema;
  alterarTela: (tela: TelaSistema) => void;
  perfil: PerfilUsuario;
  ordemMenu: TelaSistema[];
  salvarOrdemMenu: (ordem: TelaSistema[]) => void;
}) {
  const [organizando, setOrganizando] = useState(false);
  const itens = itensMenuDoPerfil(perfil, ordemMenu);
  const podeOrganizar = perfil === "administrador";

  if (organizando && podeOrganizar) {
    return (
      <div className="fixed inset-0 z-[120] overflow-y-auto bg-zinc-950 p-4 pb-10 text-white">
        <div className="mx-auto max-w-lg">
          <div className="sticky top-0 z-10 -mx-4 border-b border-zinc-800 bg-zinc-950 px-4 pb-3 pt-1">
            <button
              type="button"
              onClick={() => setOrganizando(false)}
              className="w-full rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black"
            >
              ✓ Concluir organização
            </button>
            <p className="mt-2 text-center text-xs text-zinc-500">
              Use ↑ ↓ para organizar. A ordem é salva automaticamente.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {itens.map((item, indice) => (
              <div
                key={item.tela}
                className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-black p-2"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2">
                  <span>{item.icone}</span>
                  <span className="truncate font-bold">{item.nome}</span>
                </div>

                <button
                  type="button"
                  disabled={indice === 0}
                  onClick={() =>
                    salvarOrdemMenu(
                      moverItemMenu(ordemMenu, item.tela, "cima"),
                    )
                  }
                  className="rounded-lg border border-yellow-400/50 px-3 py-2 font-black text-yellow-400 disabled:opacity-20"
                  aria-label={`Subir ${item.nome}`}
                >
                  ↑
                </button>

                <button
                  type="button"
                  disabled={indice === itens.length - 1}
                  onClick={() =>
                    salvarOrdemMenu(
                      moverItemMenu(ordemMenu, item.tela, "baixo"),
                    )
                  }
                  className="rounded-lg border border-yellow-400/50 px-3 py-2 font-black text-yellow-400 disabled:opacity-20"
                  aria-label={`Descer ${item.nome}`}
                >
                  ↓
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <select
        value={telaAtual}
        onChange={(evento) =>
          alterarTela(evento.target.value as TelaSistema)
        }
        className="min-w-0 flex-1 rounded-xl border border-yellow-400/40 bg-zinc-950 px-4 py-3 font-bold text-yellow-400"
      >
        {itens.map((item) => (
          <option key={item.tela} value={item.tela}>
            {item.nome}
          </option>
        ))}
      </select>

      {podeOrganizar && (
        <button
          type="button"
          onClick={() => setOrganizando(true)}
          className="shrink-0 rounded-xl border border-yellow-400/60 bg-black px-3 py-3 text-xs font-black uppercase text-yellow-400"
          title="Organizar menu"
        >
          ☰
        </button>
      )}
    </div>
  );
}

function CampoConvite({
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
      <span className="mb-2 block text-sm font-bold uppercase text-zinc-300">
        {titulo}
      </span>
      <input
        type="text"
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </label>
  );
}


type FuncionarioSenha = {
  id: string;
  nome: string;
  usuario: string | null;
  perfil: string | null;
  status: string | null;
  senha_temporaria?: boolean | null;
};

function SenhasModule() {
  const [funcionarios, setFuncionarios] = useState<FuncionarioSenha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    void carregarFuncionarios();
  }, []);

  async function carregarFuncionarios() {
    try {
      setCarregando(true);
      setMensagem("");

      const { data, error } = await supabase
        .from("funcionarios")
        .select("id,nome,usuario,perfil,status,senha_temporaria")
        .order("nome", { ascending: true });

      if (error) throw error;

      setFuncionarios(
        ((data ?? []) as FuncionarioSenha[]).filter(
          (item) => String(item.usuario ?? "").trim().toLowerCase() !== "admin",
        ),
      );
    } catch (erro) {
      console.error("Erro ao carregar funcionários para senhas:", erro);
      setMensagem("Não foi possível carregar os funcionários.");
    } finally {
      setCarregando(false);
    }
  }

  async function redefinirSenha(funcionario: FuncionarioSenha) {
    const novaSenha = window.prompt(
      `Digite a SENHA TEMPORÁRIA para ${funcionario.nome}:`,
    );

    if (novaSenha === null) return;

    const senhaLimpa = novaSenha.trim();

    if (senhaLimpa.length < 4) {
      alert("A senha temporária precisa ter pelo menos 4 caracteres.");
      return;
    }

    const confirmacao = window.prompt(
      `Confirme a senha temporária de ${funcionario.nome}:`,
    );

    if (confirmacao === null) return;

    if (senhaLimpa !== confirmacao.trim()) {
      alert("As duas senhas não conferem.");
      return;
    }

    try {
      setMensagem("");

      const { error } = await supabase
        .from("funcionarios")
        .update({
          senha: senhaLimpa,
          senha_temporaria: true,
        })
        .eq("id", funcionario.id);

      if (error) throw error;

      setMensagem(
        `Senha temporária de ${funcionario.nome} criada. No próximo login ele será obrigado a escolher uma nova senha.`,
      );

      await carregarFuncionarios();
    } catch (erro) {
      console.error("Erro ao redefinir senha:", erro);
      setMensagem(
        erro instanceof Error
          ? `Erro ao redefinir a senha: ${erro.message}`
          : "Não foi possível redefinir a senha.",
      );
    }
  }

  return (
    <section className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="rounded-3xl border border-yellow-400/30 bg-black p-5 shadow-2xl md:p-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
          🔐 Segurança de acesso
        </p>

        <h2 className="mt-2 text-2xl font-black uppercase text-white">
          Gerenciar senhas
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Área exclusiva do administrador. A senha redefinida aqui é sempre temporária.
        </p>

        {mensagem && (
          <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-300">
            {mensagem}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {carregando ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-400">
              Carregando funcionários...
            </div>
          ) : funcionarios.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-400">
              Nenhum funcionário encontrado.
            </div>
          ) : (
            funcionarios.map((funcionario) => (
              <div
                key={funcionario.id}
                className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-black uppercase text-white">
                    {funcionario.nome}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Usuário: {funcionario.usuario || "Não informado"}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase text-zinc-500">
                    {funcionario.senha_temporaria
                      ? "⚠ Senha temporária pendente"
                      : "Senha definitiva"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void redefinirSenha(funcionario)}
                  className="rounded-xl border border-yellow-400 px-4 py-3 text-sm font-black uppercase text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
                >
                  Gerar senha temporária
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function ConvidarUsuariosModule() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [funcao, setFuncao] = useState("Técnico");
  const [permissoes, setPermissoes] = useState<string[]>([
    "agenda",
    "vistorias",
    "treinamentos",
  ]);
  const [linkGerado, setLinkGerado] = useState("");
  const [mensagemGerada, setMensagemGerada] = useState("");
  const [salvando, setSalvando] = useState(false);

  function alternarPermissao(permissao: string) {
    setPermissoes((atuais) =>
      atuais.includes(permissao)
        ? atuais.filter((item) => item !== permissao)
        : [...atuais, permissao],
    );
  }

  function aplicarFuncao(novaFuncao: string) {
    setFuncao(novaFuncao);
    const valor = novaFuncao.toLowerCase();

    if (valor.includes("técnico") || valor.includes("tecnico")) {
      setPermissoes(["agenda", "vistorias", "treinamentos"]);
    } else if (valor.includes("supervisor")) {
      setPermissoes([
        "clientes", "funil", "agenda", "vistorias",
        "treinamentos", "propostas", "estoque",
      ]);
    } else if (valor.includes("gerente")) {
      setPermissoes([
        "dashboard", "clientes", "funil", "agenda", "vistorias",
        "treinamentos", "propostas", "contratos", "estoque",
      ]);
    } else if (valor.includes("vendedor")) {
      setPermissoes(["clientes", "funil", "propostas", "agenda", "treinamentos"]);
    } else if (valor.includes("atendente")) {
      setPermissoes(["clientes", "funil", "agenda", "treinamentos"]);
    }
  }

  async function gerarConvite() {
    if (!nome.trim() || !email.trim() || !funcao.trim()) {
      alert("Preencha nome, e-mail e função.");
      return;
    }

    if (permissoes.length === 0) {
      alert("Selecione pelo menos uma permissão.");
      return;
    }

    try {
      setSalvando(true);

      const { data, error } = await supabase
        .from("convites_usuarios")
        .insert({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          funcao: funcao.trim(),
          permissoes,
          status: "Pendente",
        })
        .select("token")
        .single();

      if (error) throw error;

      const link =
        `${window.location.origin}${window.location.pathname}?convite=${data.token}`;

      const mensagem =
        `Olá, ${nome.trim()}! Você foi convidado para acessar o CHOQUESEG PRO como ${funcao.trim()}.\n\n` +
        `Acesse o link abaixo e crie sua senha:\n${link}`;

      setLinkGerado(link);
      setMensagemGerada(mensagem);
      alert("Convite criado com sucesso.");
    } catch (erro) {
      console.error("Erro ao criar convite:", erro);
      alert(
        erro instanceof Error
          ? `Erro ao criar convite: ${erro.message}`
          : "Não foi possível criar o convite.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function copiarConvite() {
    if (!mensagemGerada) return;
    await navigator.clipboard.writeText(mensagemGerada);
    alert("Convite copiado.");
  }

  function enviarWhatsApp() {
    if (!mensagemGerada) return;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(mensagemGerada)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <section className="p-4 md:p-7">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-black uppercase text-yellow-400">
          Controle de acesso
        </p>

        <h2 className="mt-1 text-3xl font-black uppercase">
          Convidar usuário
        </h2>

        <p className="mt-2 text-zinc-400">
          Gere um convite individual e escolha as áreas que a pessoa poderá acessar.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4 rounded-3xl border border-zinc-800 bg-black p-5">
            <CampoConvite titulo="Nome" valor={nome} aoAlterar={setNome} />

            <label className="block">
              <span className="mb-2 block text-sm font-bold uppercase text-zinc-300">
                E-mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold uppercase text-zinc-300">
                Função
              </span>
              <select
                value={funcao}
                onChange={(evento) => aplicarFuncao(evento.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
              >
                <option>Técnico</option>
                <option>Supervisor</option>
                <option>Gerente</option>
                <option>Vendedor</option>
                <option>Atendente</option>
              </select>
            </label>

            <button
              type="button"
              onClick={gerarConvite}
              disabled={salvando}
              className="w-full rounded-xl bg-yellow-400 px-4 py-4 font-black uppercase text-black disabled:opacity-60"
            >
              {salvando ? "Gerando..." : "✉️ Gerar convite"}
            </button>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-black p-5">
            <h3 className="font-black uppercase text-yellow-400">
              Permissões
            </h3>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {PERMISSOES_SISTEMA.map((item) => (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 ${
                    permissoes.includes(item.id)
                      ? "border-yellow-400 bg-yellow-400/10"
                      : "border-zinc-800 bg-zinc-950"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={permissoes.includes(item.id)}
                    onChange={() => alternarPermissao(item.id)}
                    className="h-5 w-5 accent-yellow-400"
                  />
                  <span className="font-bold">{item.nome}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {linkGerado && (
          <div className="mt-5 rounded-3xl border border-green-500/40 bg-green-500/5 p-5">
            <p className="font-black uppercase text-green-400">
              Convite pronto
            </p>

            <p className="mt-3 break-all rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300">
              {linkGerado}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copiarConvite}
                className="rounded-xl border border-yellow-400 px-4 py-3 font-black uppercase text-yellow-400"
              >
                Copiar convite
              </button>

              <button
                type="button"
                onClick={enviarWhatsApp}
                className="rounded-xl bg-green-600 px-4 py-3 font-black uppercase text-white"
              >
                Enviar pelo WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Dashboard({
  alterarTela,
}: {
  alterarTela: (tela: TelaSistema) => void;
}) {
  const cards = [
    {
      titulo: "Clientes para retorno",
      valor: "0",
      detalhe: "Retorno em até 2 dias",
      tela: "clientes" as TelaSistema,
    },
    {
      titulo: "Orçamentos pendentes",
      valor: "0",
      detalhe: "Aguardando envio",
      tela: "funil" as TelaSistema,
    },
    {
      titulo: "Serviços de hoje",
      valor: "0",
      detalhe: "Agenda operacional",
      tela: "agenda" as TelaSistema,
    },
    {
      titulo: "Serviços concluídos",
      valor: "0",
      detalhe: "Neste mês",
      tela: "agenda" as TelaSistema,
    },
  ];

  return (
    <section className="p-4 md:p-7">
      <div>
        <p className="text-sm font-bold uppercase text-yellow-400">
          Painel administrativo
        </p>

        <h2 className="mt-1 text-3xl font-black uppercase">
          Bem-vindo ao CHOQUESEG PRO
        </h2>

        <p className="mt-2 text-zinc-400">
          Gerencie clientes, propostas, serviços e equipes em um único
          sistema.
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.titulo}
            type="button"
            onClick={() => alterarTela(card.tela)}
            className="rounded-2xl border border-zinc-800 bg-black p-5 text-left transition hover:border-yellow-400/70"
          >
            <p className="text-sm font-bold uppercase text-zinc-400">
              {card.titulo}
            </p>

            <p className="mt-3 text-4xl font-black text-yellow-400">
              {card.valor}
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              {card.detalhe}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-7 rounded-2xl border border-zinc-800 bg-black p-5">
        <h3 className="text-xl font-black uppercase text-yellow-400">
          Acessos rápidos
        </h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Atalho
            nome="Nova proposta"
            icone="📄"
            onClick={() => alterarTela("propostas")}
          />

          <Atalho
            nome="Cadastrar cliente"
            icone="👤"
            onClick={() => alterarTela("clientes")}
          />

          <Atalho
            nome="Abrir funil"
            icone="📊"
            onClick={() => alterarTela("funil")}
          />

          <Atalho
            nome="Agendar serviço"
            icone="📅"
            onClick={() => alterarTela("agenda")}
          />
        </div>
      </div>
    </section>
  );
}

function Atalho({
  nome,
  icone,
  onClick,
}: {
  nome: string;
  icone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-yellow-400/30 bg-zinc-950 px-4 py-4 font-black uppercase text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
    >
      <span className="text-xl">{icone}</span>
      <span>{nome}</span>
    </button>
  );
}

function AgendaInicial({
  perfil,
}: {
  perfil: PerfilUsuario;
}) {
  return (
    <section className="p-4 md:p-7">
      <div className="rounded-3xl border border-yellow-400/30 bg-black p-6">
        <p className="text-sm font-bold uppercase text-yellow-400">
          Agenda operacional
        </p>

        <h2 className="mt-2 text-3xl font-black uppercase">
          {perfil === "administrador"
            ? "Agenda da equipe"
            : "Meus serviços"}
        </h2>

        <p className="mt-3 max-w-2xl text-zinc-400">
          Nesta área serão exibidos os serviços agendados, endereço para
          abrir no Maps, checklist, fotos do antes e depois e andamento
          da execução.
        </p>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
          <p className="text-5xl">📅</p>

          <p className="mt-4 font-black uppercase text-white">
            Nenhum serviço agendado
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            A agenda completa será construída na próxima etapa.
          </p>
        </div>
      </div>
    </section>
  );
}

function ModuloComVoltar({
  voltar,
  children,
}: {
  voltar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="border-b border-yellow-400/30 bg-black px-4 py-3">
        <button
          type="button"
          onClick={voltar}
          className="rounded-xl border border-yellow-400 px-4 py-2 text-sm font-black uppercase text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
        >
          ← Voltar às propostas
        </button>
      </div>

      {children}
    </div>
  );
}

function ModuloEmConstrucao({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <section className="flex min-h-[calc(100vh-130px)] items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-yellow-400/40 bg-black p-8 text-center">
        <img
          src="/imagens/logo/brasao-choqueseg.png"
          alt="Brasão oficial da CHOQUESEG"
          className="mx-auto h-28 w-28 object-contain"
        />

        <h2 className="mt-5 text-3xl font-black uppercase text-yellow-400">
          {titulo}
        </h2>

        <p className="mt-4 leading-relaxed text-zinc-300">
          {descricao}
        </p>

        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-500">
          Módulo preparado para a próxima etapa do desenvolvimento.
        </div>
      </div>
    </section>
  );
}