"use client";

import { FormEvent, useEffect, useState } from "react";
import FormularioProposta from "@/components/FormularioProposta";
import SeletorTipoProposta from "@/components/SeletorTipoProposta";
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

type TelaSistema =
  | "dashboard"
  | "propostas"
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
  | "projetos3d";

type TipoProposta =
  | "energia-solar"
  | "seguranca-eletronica"
  | "eletrica"
  | "automacao"
  | "cadastro-produtos";

const CHAVE_SESSAO = "choqueseg-pro-sessao";

export default function Home() {
  const [carregando, setCarregando] = useState(false);
  const [usuarioLogado, setUsuarioLogado] =
    useState<UsuarioLogado | null>(null);

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erroLogin, setErroLogin] = useState("");

  const [telaAtual, setTelaAtual] =
    useState<TelaSistema>("dashboard");

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

  function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroLogin("");

    const usuarioDigitado = usuario.trim().toLowerCase();

    // Login principal do administrador
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

    // Login dos funcionários cadastrados
    const dadosFuncionarios = localStorage.getItem(
      "choqueseg-funcionarios"
    );

    if (dadosFuncionarios) {
      try {
        const funcionarios = JSON.parse(dadosFuncionarios);

        const funcionarioEncontrado = funcionarios.find(
          (funcionario: {
            nome: string;
            usuario: string;
            senha: string;
            perfil?: "administrador" | "vendedor" | "tecnico" | "atendente";
            nivelAcesso?: string;
            status: "Ativo" | "Inativo";
          }) =>
            funcionario.usuario?.trim().toLowerCase() ===
              usuarioDigitado &&
            funcionario.senha === senha
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

          localStorage.setItem(
            CHAVE_SESSAO,
            JSON.stringify(sessao)
          );

          setUsuarioLogado(sessao);
          setTelaAtual("agenda");
          setUsuario("");
          setSenha("");
          return;
        }
      } catch {
        setErroLogin(
          "Não foi possível acessar os funcionários cadastrados."
        );
        return;
      }
    }

    setErroLogin("Usuário ou senha inválidos.");
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

      <div className="flex min-h-[calc(100vh-73px)]">
        <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-black p-4 md:block">
          <MenuLateral
            telaAtual={telaAtual}
            alterarTela={setTelaAtual}
            perfil={usuarioLogado.perfil}
          />
        </aside>

        <main className="min-w-0 flex-1">
          <div className="border-b border-zinc-800 bg-black px-3 py-3 md:hidden">
            <MenuMobile
              telaAtual={telaAtual}
              alterarTela={setTelaAtual}
              perfil={usuarioLogado.perfil}
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

          {telaAtual === "propostas" && podePropostas && (
            <SeletorTipoProposta
              aoSelecionar={(tipo) => {
                setTelaAtual(tipo as TipoProposta);
              }}
            />
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

function MenuLateral({
  telaAtual,
  alterarTela,
  perfil,
}: {
  telaAtual: TelaSistema;
  alterarTela: (tela: TelaSistema) => void;
  perfil: PerfilUsuario;
}) {
  const itensAdministrador: Array<{
    tela: TelaSistema;
    nome: string;
    icone: string;
  }> = [
    { tela: "dashboard", nome: "Dashboard", icone: "🏠" },
    { tela: "clientes", nome: "Clientes", icone: "👥" },
    { tela: "funil", nome: "Funil", icone: "📊" },
    { tela: "agenda", nome: "Agenda", icone: "📅" },
    { tela: "financeiro", nome: "Financeiro", icone: "💰" },
    { tela: "propostas", nome: "Propostas", icone: "📄" },
    { tela: "funcionarios", nome: "Funcionários", icone: "👷" },
    { tela: "estoque", nome: "Estoque", icone: "📦" },
    { tela: "vistorias", nome: "Vistorias", icone: "🔎" },
    { tela: "engenharia", nome: "Projetos / Engenharia", icone: "📐" },
    { tela: "treinamentos", nome: "Treinamentos", icone: "🎓" },
    { tela: "contratos", nome: "Contratos", icone: "📑" },
    { tela: "sala-ia", nome: "Sala IA", icone: "🤖" },
    { tela: "projetos3d", nome: "Projeto 3D", icone: "🏠" },
  ];

  const itensVendedor: Array<{
    tela: TelaSistema;
    nome: string;
    icone: string;
  }> = [
    { tela: "clientes", nome: "Clientes", icone: "👥" },
    { tela: "funil", nome: "Funil", icone: "📊" },
    { tela: "propostas", nome: "Propostas", icone: "📄" },
    { tela: "agenda", nome: "Agenda", icone: "📅" },
  ];

  const itensAtendente: Array<{
    tela: TelaSistema;
    nome: string;
    icone: string;
  }> = [
    { tela: "clientes", nome: "Clientes", icone: "👥" },
    { tela: "funil", nome: "Funil", icone: "📊" },
    { tela: "agenda", nome: "Agenda", icone: "📅" },
  ];

  const itensTecnico: Array<{
    tela: TelaSistema;
    nome: string;
    icone: string;
  }> = [{ tela: "agenda", nome: "Minha agenda", icone: "📅" }];

  const itens =
    perfil === "administrador"
      ? itensAdministrador
      : perfil === "vendedor"
        ? itensVendedor
        : perfil === "atendente"
          ? itensAtendente
          : itensTecnico;

  return (
    <nav className="space-y-2">
      {itens.map((item) => (
        <button
          key={item.tela}
          type="button"
          onClick={() => alterarTela(item.tela)}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-bold transition ${
            telaAtual === item.tela
              ? "bg-yellow-400 text-black"
              : "text-zinc-300 hover:bg-zinc-900 hover:text-yellow-400"
          }`}
        >
          <span>{item.icone}</span>
          <span>{item.nome}</span>
        </button>
      ))}
    </nav>
  );
}

function MenuMobile({
  telaAtual,
  alterarTela,
  perfil,
}: {
  telaAtual: TelaSistema;
  alterarTela: (tela: TelaSistema) => void;
  perfil: PerfilUsuario;
}) {
  const opcoes: Array<[TelaSistema, string]> =
    perfil === "administrador"
      ? [
          ["dashboard", "Dashboard"],
          ["clientes", "Clientes"],
          ["funil", "Funil"],
          ["agenda", "Agenda"],
          ["financeiro", "Financeiro"],
          ["estoque", "Estoque"],
          ["propostas", "Propostas"],
          ["funcionarios", "Funcionários"],
          ["vistorias", "Vistorias"],
          ["engenharia", "Projetos / Engenharia"],
          ["treinamentos", "Treinamentos"],
          ["contratos", "Contratos"],
          ["sala-ia", "Sala IA"],
          ["projetos3d", "Projeto 3D"],
        ]
      : perfil === "vendedor"
        ? [
            ["clientes", "Clientes"],
            ["funil", "Funil"],
            ["propostas", "Propostas"],
            ["agenda", "Agenda"],
          ]
        : perfil === "atendente"
          ? [
              ["clientes", "Clientes"],
              ["funil", "Funil"],
              ["agenda", "Agenda"],
            ]
          : [["agenda", "Minha agenda"]];

  return (
    <select
      value={telaAtual}
      onChange={(evento) =>
        alterarTela(evento.target.value as TelaSistema)
      }
      className="w-full rounded-xl border border-yellow-400/40 bg-zinc-950 px-4 py-3 font-bold text-yellow-400"
    >
      {opcoes.map(([valor, nome]) => (
        <option key={valor} value={valor}>
          {nome}
        </option>
      ))}
    </select>
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
