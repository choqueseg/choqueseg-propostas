"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();
export type Funcionario = {
  id: string;
  nome: string;
  cargo: string;
  telefone: string;
  cpf: string;
  email: string;

  usuario: string;
  senha: string;

  perfil:
    | "administrador"
    | "vendedor"
    | "tecnico"
    | "engenheiro"
    | "atendente";

  especialidade:
    | "Energia Solar"
    | "Segurança Eletrônica"
    | "Instalações Elétricas"
    | "Automação"
    | "Engenharia"
    | "Administrativo"
    | "Outros";

  status: "Ativo" | "Inativo";
  dataAdmissao: string;
};
const CHAVE_STORAGE = "choqueseg-funcionarios";

const formularioVazio: Omit<Funcionario, "id"> = {
  nome: "",
  cargo: "",
  telefone: "",
  cpf: "",
  email: "",

  usuario: "",
  senha: "",
  perfil: "tecnico",

  especialidade: "Energia Solar",
  status: "Ativo",
  dataAdmissao: "",
};

function criarId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function FuncionariosModule() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [formulario, setFormulario] = useState(formularioVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [secaoAtiva, setSecaoAtiva] = useState<"lista" | "cadastro">("lista");

  useEffect(() => {
    void carregarFuncionarios();
  }, []);

  async function carregarFuncionarios() {
    const { data, error } = await supabase
      .from("funcionarios")
      .select(
        "id,nome,cargo,telefone,cpf,email,usuario,senha,perfil,especialidade,status,data_admissao",
      )
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar funcionários do Supabase:", error);
      alert(`Erro ao carregar funcionários: ${error.message}`);
      return;
    }

    let listaNuvem: Funcionario[] = (data ?? []).map((item) => ({
      id: item.id,
      nome: item.nome ?? "",
      cargo: item.cargo ?? "",
      telefone: item.telefone ?? "",
      cpf: item.cpf ?? "",
      email: item.email ?? "",
      usuario: item.usuario ?? "",
      senha: item.senha ?? "",
      perfil: (item.perfil ?? "tecnico") as Funcionario["perfil"],
      especialidade: (item.especialidade ?? "Energia Solar") as Funcionario["especialidade"],
      status: (item.status ?? "Ativo") as Funcionario["status"],
      dataAdmissao: item.data_admissao ?? "",
    }));

    // Se a nuvem ainda estiver vazia, migra os funcionários já salvos
    // neste navegador para o Supabase, evitando perda de dados.
    if (listaNuvem.length === 0) {
      const dadosLocais = localStorage.getItem(CHAVE_STORAGE);

      if (dadosLocais) {
        try {
          const antigos = JSON.parse(dadosLocais) as Funcionario[];

          if (antigos.length > 0) {
            const paraMigrar = antigos.map((f) => ({
              id: crypto.randomUUID(),
              nome: f.nome,
              cargo: f.cargo,
              telefone: f.telefone,
              cpf: f.cpf || "",
              email: f.email || "",
              usuario: f.usuario,
              senha: f.senha,
              perfil: f.perfil,
              especialidade: f.especialidade,
              status: f.status,
              data_admissao: f.dataAdmissao || "",
            }));

            const { error: erroMigracao } = await supabase
              .from("funcionarios")
              .insert(paraMigrar);

            if (erroMigracao) {
              console.error("Erro ao migrar funcionários:", erroMigracao);
              alert(`Erro ao migrar funcionários antigos: ${erroMigracao.message}`);
            } else {
              const { data: recarregados, error: erroRecarregar } = await supabase
                .from("funcionarios")
                .select(
                  "id,nome,cargo,telefone,cpf,email,usuario,senha,perfil,especialidade,status,data_admissao",
                )
                .order("nome", { ascending: true });

              if (!erroRecarregar) {
                listaNuvem = (recarregados ?? []).map((item) => ({
                  id: item.id,
                  nome: item.nome ?? "",
                  cargo: item.cargo ?? "",
                  telefone: item.telefone ?? "",
                  cpf: item.cpf ?? "",
                  email: item.email ?? "",
                  usuario: item.usuario ?? "",
                  senha: item.senha ?? "",
                  perfil: (item.perfil ?? "tecnico") as Funcionario["perfil"],
                  especialidade: (item.especialidade ?? "Energia Solar") as Funcionario["especialidade"],
                  status: (item.status ?? "Ativo") as Funcionario["status"],
                  dataAdmissao: item.data_admissao ?? "",
                }));
              }
            }
          }
        } catch (erro) {
          console.error("Erro ao ler funcionários locais:", erro);
        }
      }
    }

    setFuncionarios(listaNuvem);

    // Mantém uma cópia local temporária para módulos do sistema
    // que ainda utilizem o cadastro de funcionários pelo navegador.
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(listaNuvem));
  }

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return funcionarios;
    return funcionarios.filter((f) =>
      [f.nome, f.cargo, f.telefone, f.email, f.especialidade, f.status]
        .join(" ")
        .toLowerCase()
        .includes(termo),
    );
  }, [busca, funcionarios]);

  function limpar() {
    setFormulario(formularioVazio);
    setEditandoId(null);
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (
      !formulario.nome.trim() ||
      !formulario.cargo.trim() ||
      !formulario.telefone.trim() ||
      !formulario.usuario.trim() ||
      !formulario.senha.trim()
    ) {
      alert("Preencha nome, cargo, telefone, usuário e senha.");
      return;
    }

    const dadosBanco = {
      nome: formulario.nome.trim(),
      cargo: formulario.cargo.trim(),
      telefone: formulario.telefone.trim(),
      cpf: formulario.cpf.trim(),
      email: formulario.email.trim(),
      usuario: formulario.usuario.trim(),
      senha: formulario.senha,
      perfil: formulario.perfil,
      especialidade: formulario.especialidade,
      status: formulario.status,
      data_admissao: formulario.dataAdmissao,
    };

    if (editandoId) {
      const { error } = await supabase
        .from("funcionarios")
        .update(dadosBanco)
        .eq("id", editandoId);

      if (error) {
        console.error("Erro ao atualizar funcionário:", error);
        alert(`Erro ao atualizar funcionário: ${error.message}`);
        return;
      }

      alert("Funcionário atualizado e sincronizado com a nuvem!");
    } else {
      const { error } = await supabase
        .from("funcionarios")
        .insert({
          id: criarId(),
          ...dadosBanco,
        });

      if (error) {
        console.error("Erro ao cadastrar funcionário:", error);
        alert(`Erro ao cadastrar funcionário: ${error.message}`);
        return;
      }

      alert("Funcionário cadastrado e sincronizado com a nuvem!");
    }

    await carregarFuncionarios();
    limpar();
    setSecaoAtiva("lista");
  }

  function editar(funcionario: Funcionario) {
    const { id, ...dados } = funcionario;
    setFormulario(dados);
    setEditandoId(id);
    setSecaoAtiva("cadastro");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluir(funcionario: Funcionario) {
    if (!confirm(`Excluir ${funcionario.nome}?`)) return;

    const { error } = await supabase
      .from("funcionarios")
      .delete()
      .eq("id", funcionario.id);

    if (error) {
      console.error("Erro ao excluir funcionário:", error);
      alert(`Erro ao excluir funcionário: ${error.message}`);
      return;
    }

    await carregarFuncionarios();
    if (editandoId === funcionario.id) limpar();
  }

  async function alternarStatus(id: string) {
    const funcionario = funcionarios.find((f) => f.id === id);
    if (!funcionario) return;

    const novoStatus: Funcionario["status"] =
      funcionario.status === "Ativo" ? "Inativo" : "Ativo";

    const { error } = await supabase
      .from("funcionarios")
      .update({ status: novoStatus })
      .eq("id", id);

    if (error) {
      console.error("Erro ao alterar status do funcionário:", error);
      alert(`Erro ao alterar status: ${error.message}`);
      return;
    }

    await carregarFuncionarios();
  }

  return (
    <main className="min-h-screen bg-[#07090c] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[28px] border border-yellow-400 bg-black p-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-yellow-400">
            CHOQUESEG PRO
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black uppercase sm:text-4xl">
                Funcionários
              </h1>
              <p className="mt-2 text-zinc-400">
                Consulte a equipe ou cadastre um novo funcionário.
              </p>
            </div>
            <div className="rounded-2xl bg-yellow-400 px-5 py-3 text-center text-black">
              <span className="block text-xs font-black uppercase">Ativos</span>
              <strong className="block text-3xl font-black">
                {funcionarios.filter((f) => f.status === "Ativo").length}
              </strong>
            </div>
          </div>
        </header>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start">
          <aside className="lg:sticky lg:top-4 lg:w-64 lg:shrink-0">
            <div className="rounded-2xl border border-zinc-800 bg-black p-2">
              <p className="px-3 py-2 text-xs font-black uppercase text-zinc-500">
                Menu de funcionários
              </p>

              <nav className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    limpar();
                    setSecaoAtiva("lista");
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black uppercase transition ${
                    secaoAtiva === "lista"
                      ? "bg-yellow-400 text-black"
                      : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400"
                  }`}
                >
                  <span className="text-lg">👷</span>
                  <span>Funcionários cadastrados</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    limpar();
                    setSecaoAtiva("cadastro");
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black uppercase transition ${
                    secaoAtiva === "cadastro"
                      ? "bg-yellow-400 text-black"
                      : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400"
                  }`}
                >
                  <span className="text-lg">➕</span>
                  <span>Novo funcionário</span>
                </button>
              </nav>
            </div>
          </aside>

          <section className="min-w-0 flex-1">
            {secaoAtiva === "cadastro" && (
              <form onSubmit={salvar} className="rounded-[28px] border border-yellow-400 bg-black p-5 sm:p-6">
  <div className="flex items-center justify-between gap-3">
    <h2 className="text-2xl font-black uppercase text-yellow-400">
      {editandoId ? "Editar funcionário" : "Novo funcionário"}
    </h2>
    {editandoId && (
      <button type="button" onClick={limpar} className="rounded-xl border border-zinc-600 px-3 py-2 text-xs font-black uppercase text-zinc-300">
        Cancelar
      </button>
    )}
  </div>

  <div className="mt-5 grid gap-4">
    <Campo rotulo="Nome completo *" valor={formulario.nome} onChange={(v) => setFormulario({ ...formulario, nome: v })} placeholder="Ex.: Carlos Silva" />
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo rotulo="Cargo *" valor={formulario.cargo} onChange={(v) => setFormulario({ ...formulario, cargo: v })} placeholder="Ex.: Técnico instalador" />
      <Campo rotulo="Telefone *" tipo="tel" valor={formulario.telefone} onChange={(v) => setFormulario({ ...formulario, telefone: v })} placeholder="(79) 9.9999-9999" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo rotulo="CPF" valor={formulario.cpf} onChange={(v) => setFormulario({ ...formulario, cpf: v })} placeholder="000.000.000-00" />
      <Campo rotulo="E-mail" tipo="email" valor={formulario.email} onChange={(v) => setFormulario({ ...formulario, email: v })} placeholder="funcionario@email.com" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
  <Campo
    rotulo="Usuário de acesso *"
    valor={formulario.usuario}
    onChange={(v) =>
      setFormulario({ ...formulario, usuario: v })
    }
    placeholder="Ex.: carlos"
  />

  <Campo
    rotulo="Senha de acesso *"
    tipo="password"
    valor={formulario.senha}
    onChange={(v) =>
      setFormulario({ ...formulario, senha: v })
    }
    placeholder="Digite uma senha"
  />
</div>

<label>
  <span className="mb-2 block text-xs font-black uppercase text-zinc-300">
    Perfil de acesso
  </span>

  <select
    value={formulario.perfil}
    onChange={(e) =>
      setFormulario({
        ...formulario,
        perfil: e.target.value as Funcionario["perfil"],
      })
    }
    className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3.5 font-bold outline-none focus:border-yellow-400"
  >
    <option value="administrador">Administrador</option>
    <option value="vendedor">Vendedor</option>
    <option value="tecnico">Técnico</option>
    <option value="engenheiro">Engenheiro</option>
    <option value="atendente">Atendente</option>
  </select>
</label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label>
        <span className="mb-2 block text-xs font-black uppercase text-zinc-300">Especialidade</span>
        <select value={formulario.especialidade} onChange={(e) => setFormulario({ ...formulario, especialidade: e.target.value as Funcionario["especialidade"] })} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3.5 font-bold outline-none focus:border-yellow-400">
          <option>Energia Solar</option>
          <option>Segurança Eletrônica</option>
          <option>Instalações Elétricas</option>
          <option>Automação</option>
          <option>Engenharia</option>
          <option>Administrativo</option>
          <option>Outros</option>
        </select>
      </label>
      <label>
        <span className="mb-2 block text-xs font-black uppercase text-zinc-300">Status</span>
        <select value={formulario.status} onChange={(e) => setFormulario({ ...formulario, status: e.target.value as Funcionario["status"] })} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3.5 font-bold outline-none focus:border-yellow-400">
          <option>Ativo</option>
          <option>Inativo</option>
        </select>
      </label>
    </div>
    <Campo rotulo="Data de admissão" tipo="date" valor={formulario.dataAdmissao} onChange={(v) => setFormulario({ ...formulario, dataAdmissao: v })} />
  </div>

  <button type="submit" className="mt-6 w-full rounded-2xl bg-yellow-400 px-5 py-4 font-black uppercase text-black hover:bg-yellow-300">
    {editandoId ? "Salvar alterações" : "Cadastrar funcionário"}
  </button>
</form>
            )}

            {secaoAtiva === "lista" && (
              <section className="rounded-[28px] border border-zinc-800 bg-black p-5 sm:p-6">
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">Equipe cadastrada</p>
      <h2 className="mt-1 text-2xl font-black uppercase">Funcionários</h2>
    </div>
    <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar funcionário..." className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-bold outline-none focus:border-yellow-400 sm:max-w-xs" />
  </div>

  <div className="mt-5 space-y-3">
    {lista.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-zinc-700 px-5 py-12 text-center text-zinc-500">
        Nenhum funcionário cadastrado.
      </div>
    ) : (
      lista.map((f) => (
        <article key={f.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black">{f.nome}</h3>
                <button type="button" onClick={() => alternarStatus(f.id)} className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${f.status === "Ativo" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                  {f.status}
                </button>
              </div>
              <p className="mt-1 font-bold text-yellow-400">{f.cargo}</p>
              <div className="mt-3 grid gap-1 text-sm text-zinc-400 sm:grid-cols-2">
                <p>{f.especialidade}</p>
                <p>{f.telefone}</p>
                {f.email && <p>{f.email}</p>}
                {f.dataAdmissao && <p>Admissão: {f.dataAdmissao}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => editar(f)} className="rounded-xl border border-yellow-400 px-3 py-2 text-xs font-black uppercase text-yellow-400 hover:bg-yellow-400 hover:text-black">Editar</button>
              <button type="button" onClick={() => excluir(f)} className="rounded-xl border border-red-500 px-3 py-2 text-xs font-black uppercase text-red-400 hover:bg-red-500 hover:text-white">Excluir</button>
            </div>
          </div>
        </article>
      ))
    )}
  </div>
</section>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Campo({
  rotulo,
  valor,
  onChange,
  placeholder,
  tipo = "text",
}: {
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  tipo?: "text" | "tel" | "email" | "date" | "password";
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase text-zinc-300">
        {rotulo}
      </span>

      <input
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3.5 font-bold outline-none placeholder:text-zinc-600 focus:border-yellow-400"
      />
    </label>
  );
}