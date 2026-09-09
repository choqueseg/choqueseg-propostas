"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type StatusFuncionario = "Ativo" | "Inativo";

type Funcionario = {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  usuario: string;
  cargo: string;
  perfil: string;
  status: StatusFuncionario;
  permissoes: string[];
};

type Cargo = {
  id: string;
  nome: string;
  ativo: boolean;
};

const PERMISSOES = [
  { id: "dashboard", nome: "Dashboard" },
  { id: "clientes", nome: "Clientes" },
  { id: "funil", nome: "Funil" },
  { id: "agenda", nome: "Agenda" },
  { id: "vistorias", nome: "Vistorias" },
  { id: "treinamentos", nome: "Treinamentos" },
  { id: "propostas", nome: "Propostas" },
  { id: "orcamento-rapido", nome: "Orçamentos Rápidos" },
  { id: "historico-propostas", nome: "Histórico de Propostas" },
  { id: "avaliacoes", nome: "Avaliações Google" },
  { id: "recibos", nome: "Recibos" },
  { id: "contratos", nome: "Contratos" },
  { id: "engenharia", nome: "Projetos / Engenharia" },
  { id: "financeiro", nome: "Financeiro" },
  { id: "estoque", nome: "Estoque" },
  { id: "funcionarios", nome: "Funcionários" },
  { id: "convidar", nome: "Convidar Usuários" },
  { id: "senhas", nome: "Senhas" },
  { id: "sala-ia", nome: "Sala IA" },
  { id: "projetos3d", nome: "Projeto 3D" },
  { id: "configuracoes", nome: "Configurações da Empresa" },
];

const vazio = {
  nome: "",
  telefone: "",
  email: "",
  usuario: "",
  senha: "",
  cargo: "",
  status: "Ativo" as StatusFuncionario,
  permissoes: [] as string[],
};

export default function FuncionariosModule() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [form, setForm] = useState(vazio);
  const [novoCargo, setNovoCargo] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const formularioRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    void carregarTudo();
  }, []);

  async function carregarTudo() {
    setCarregando(true);
    setMensagem("");

    const [{ data: dadosFuncionarios, error: erroFuncionarios }, { data: dadosCargos, error: erroCargos }] =
      await Promise.all([
        supabase
          .from("funcionarios")
          .select("id,nome,telefone,email,usuario,cargo,perfil,status,permissoes")
          .order("nome"),
        supabase
          .from("cargos_funcionarios")
          .select("id,nome,ativo")
          .eq("ativo", true)
          .order("nome"),
      ]);

    if (erroFuncionarios) setMensagem(`Erro ao carregar funcionários: ${erroFuncionarios.message}`);
    if (erroCargos) setMensagem(`Erro ao carregar cargos: ${erroCargos.message}`);

    setFuncionarios(
      (dadosFuncionarios ?? []).map((item: any) => ({
        id: String(item.id),
        nome: String(item.nome ?? ""),
        telefone: String(item.telefone ?? ""),
        email: String(item.email ?? ""),
        usuario: String(item.usuario ?? ""),
        cargo: String(item.cargo ?? ""),
        perfil: String(item.perfil ?? "funcionario"),
        status: item.status === "Inativo" ? "Inativo" : "Ativo",
        permissoes: Array.isArray(item.permissoes) ? item.permissoes.map(String) : [],
      })),
    );

    setCargos(
      (dadosCargos ?? []).map((item: any) => ({
        id: String(item.id),
        nome: String(item.nome ?? ""),
        ativo: Boolean(item.ativo),
      })),
    );

    setCarregando(false);
  }

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return funcionarios;
    return funcionarios.filter((f) =>
      [f.nome, f.telefone, f.email, f.usuario, f.cargo, f.status]
        .join(" ")
        .toLowerCase()
        .includes(termo),
    );
  }, [busca, funcionarios]);

  function alternarPermissao(id: string) {
    setForm((atual) => ({
      ...atual,
      permissoes: atual.permissoes.includes(id)
        ? atual.permissoes.filter((item) => item !== id)
        : [...atual.permissoes, id],
    }));
  }

  async function criarCargo() {
    const nome = novoCargo.trim();
    if (!nome) return;

    const existe = cargos.some((cargo) => cargo.nome.toLowerCase() === nome.toLowerCase());
    if (existe) {
      setMensagem("Esse cargo já existe.");
      return;
    }

    const { data, error } = await supabase
      .from("cargos_funcionarios")
      .insert({ nome, ativo: true })
      .select("id,nome,ativo")
      .single();

    if (error) {
      setMensagem(`Erro ao criar cargo: ${error.message}`);
      return;
    }

    setCargos((atuais) => [...atuais, data as Cargo].sort((a, b) => a.nome.localeCompare(b.nome)));
    setForm((atual) => ({ ...atual, cargo: nome }));
    setNovoCargo("");
    setMensagem(`Cargo "${nome}" criado.`);
  }

  async function excluirCargo(cargo: Cargo) {
    const emUso = funcionarios.filter(
      (f) => f.cargo.trim().toLowerCase() === cargo.nome.trim().toLowerCase(),
    );

    if (emUso.length > 0) {
      setMensagem(
        `Não é possível excluir "${cargo.nome}". ${emUso.length} funcionário(s) ainda usam esse cargo. Troque o cargo deles primeiro.`,
      );
      return;
    }

    if (!window.confirm(`Excluir o cargo "${cargo.nome}"?`)) return;

    const { error } = await supabase
      .from("cargos_funcionarios")
      .delete()
      .eq("id", cargo.id);

    if (error) {
      setMensagem(`Erro ao excluir cargo: ${error.message}`);
      return;
    }

    setCargos((atuais) => atuais.filter((item) => item.id !== cargo.id));
    if (form.cargo === cargo.nome) setForm((atual) => ({ ...atual, cargo: "" }));
    setMensagem("Cargo excluído.");
  }

  function editarFuncionario(funcionario: Funcionario) {
    setEditandoId(funcionario.id);
    setForm({
      nome: funcionario.nome,
      telefone: funcionario.telefone,
      email: funcionario.email,
      usuario: funcionario.usuario,
      senha: "",
      cargo: funcionario.cargo,
      status: funcionario.status,
      permissoes: [...funcionario.permissoes],
    });

    requestAnimationFrame(() => {
      formularioRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function limpar() {
    setEditandoId(null);
    setForm(vazio);
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    if (!form.nome.trim() || !form.usuario.trim() || !form.cargo.trim()) {
      setMensagem("Preencha nome, usuário e cargo.");
      return;
    }

    if (!editandoId && form.senha.trim().length < 4) {
      setMensagem("A senha inicial precisa ter pelo menos 4 caracteres.");
      return;
    }

    const perfil =
      form.cargo.toLowerCase().includes("administrador")
        ? "administrador"
        : "funcionario";

    const dados: Record<string, any> = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      email: form.email.trim().toLowerCase(),
      usuario: form.usuario.trim().toLowerCase(),
      cargo: form.cargo.trim(),
      perfil,
      status: form.status,
      permissoes: form.permissoes,
    };

    if (!editandoId) {
      dados.id = crypto.randomUUID();
      dados.senha = form.senha.trim();
      dados.senha_temporaria = true;
      dados.especialidade = "Geral";
      dados.data_admissao = new Date().toISOString().slice(0, 10);
      dados.cpf = "";

      const { error } = await supabase.from("funcionarios").insert(dados);
      if (error) {
        setMensagem(`Erro ao cadastrar funcionário: ${error.message}`);
        return;
      }

      setMensagem("Funcionário cadastrado. Ele já ficará disponível para seleção na Agenda.");
    } else {
      if (form.senha.trim()) {
        if (form.senha.trim().length < 4) {
          setMensagem("A nova senha precisa ter pelo menos 4 caracteres.");
          return;
        }
        dados.senha = form.senha.trim();
        dados.senha_temporaria = true;
      }

      const { error } = await supabase
        .from("funcionarios")
        .update(dados)
        .eq("id", editandoId);

      if (error) {
        setMensagem(`Erro ao atualizar funcionário: ${error.message}`);
        return;
      }

      setMensagem("Funcionário atualizado.");
    }

    limpar();
    await carregarTudo();
  }

  async function alterarStatus(funcionario: Funcionario) {
    const novoStatus: StatusFuncionario =
      funcionario.status === "Ativo" ? "Inativo" : "Ativo";

    const { error } = await supabase
      .from("funcionarios")
      .update({ status: novoStatus })
      .eq("id", funcionario.id);

    if (error) {
      setMensagem(`Erro ao alterar status: ${error.message}`);
      return;
    }

    setFuncionarios((atuais) =>
      atuais.map((item) =>
        item.id === funcionario.id ? { ...item, status: novoStatus } : item,
      ),
    );
  }

  async function excluirFuncionario(funcionario: Funcionario) {
    if (
      !window.confirm(
        `Excluir definitivamente ${funcionario.nome}?\n\nPara preservar histórico, prefira deixar Inativo quando a pessoa sair da empresa.`,
      )
    ) {
      return;
    }

    const { error } = await supabase.from("funcionarios").delete().eq("id", funcionario.id);

    if (error) {
      setMensagem(`Erro ao excluir funcionário: ${error.message}`);
      return;
    }

    setFuncionarios((atuais) => atuais.filter((item) => item.id !== funcionario.id));
    setMensagem("Funcionário excluído.");
  }

  return (
    <section className="p-4 md:p-7">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-black uppercase text-yellow-400">Equipe CHOQUESEG</p>
        <h2 className="mt-1 text-3xl font-black uppercase">Funcionários e permissões</h2>
        <p className="mt-2 text-sm text-zinc-400">
          O cargo identifica a função. As permissões definem exatamente o que cada pessoa pode acessar.
        </p>

        {mensagem && (
          <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
            {mensagem}
          </div>
        )}

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
          <form ref={formularioRef} onSubmit={salvar} className="scroll-mt-24 rounded-2xl border border-zinc-800 bg-black p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-black uppercase text-yellow-400">
                {editandoId ? "Editar funcionário" : "Novo funcionário"}
              </h3>
              {editandoId && (
                <button type="button" onClick={limpar} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-black uppercase text-zinc-300">
                  Cancelar edição
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Campo titulo="Nome completo *" valor={form.nome} aoAlterar={(v) => setForm({ ...form, nome: v })} />
              <Campo titulo="Telefone / WhatsApp" valor={form.telefone} aoAlterar={(v) => setForm({ ...form, telefone: v })} />
              <Campo titulo="E-mail" tipo="email" valor={form.email} aoAlterar={(v) => setForm({ ...form, email: v })} />
              <Campo titulo="Usuário *" valor={form.usuario} aoAlterar={(v) => setForm({ ...form, usuario: v })} />

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase text-zinc-500">Cargo *</span>
                <select
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
                >
                  <option value="">Selecione o cargo</option>
                  {cargos.map((cargo) => (
                    <option key={cargo.id} value={cargo.nome}>{cargo.nome}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase text-zinc-500">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as StatusFuncionario })}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
                >
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </label>

              <div className="md:col-span-2">
                <Campo
                  titulo={editandoId ? "Nova senha (deixe vazio para manter)" : "Senha inicial *"}
                  tipo="password"
                  valor={form.senha}
                  aoAlterar={(v) => setForm({ ...form, senha: v })}
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-black uppercase text-yellow-400">Permissões de acesso</h4>
                  <p className="mt-1 text-xs text-zinc-500">Tudo que estiver marcado será liberado para este funcionário.</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm({ ...form, permissoes: PERMISSOES.map((p) => p.id) })} className="rounded-lg border border-yellow-400/50 px-3 py-2 text-xs font-black uppercase text-yellow-400">
                    Selecionar tudo
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, permissoes: [] })} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-black uppercase text-zinc-300">
                    Limpar
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {PERMISSOES.map((p) => (
                  <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 ${form.permissoes.includes(p.id) ? "border-yellow-400 bg-yellow-400/10" : "border-zinc-800 bg-black"}`}>
                    <input type="checkbox" checked={form.permissoes.includes(p.id)} onChange={() => alternarPermissao(p.id)} className="h-5 w-5 accent-yellow-400" />
                    <span className="text-sm font-bold">{p.nome}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="mt-5 w-full rounded-xl bg-yellow-400 px-5 py-4 font-black uppercase text-black">
              {editandoId ? "Salvar alterações" : "Cadastrar funcionário"}
            </button>
          </form>

          <section className="rounded-2xl border border-zinc-800 bg-black p-5">
            <h3 className="text-xl font-black uppercase text-yellow-400">Cargos personalizados</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Crie Sócio-Gerente, Vendedor Externo ou qualquer outra função.
            </p>

            <div className="mt-4 flex gap-2">
              <input
                value={novoCargo}
                onChange={(e) => setNovoCargo(e.target.value)}
                placeholder="Nome do novo cargo"
                className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
              />
              <button type="button" onClick={() => void criarCargo()} className="rounded-xl bg-yellow-400 px-4 py-3 font-black uppercase text-black">
                + Criar
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {cargos.map((cargo) => (
                <div key={cargo.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                  <span className="font-bold text-zinc-200">{cargo.nome}</span>
                  <button type="button" onClick={() => void excluirCargo(cargo)} className="rounded-lg border border-red-500/50 px-3 py-2 text-xs font-black uppercase text-red-400">
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-black p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-black uppercase text-yellow-400">Equipe cadastrada</h3>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar funcionário..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white sm:max-w-sm"
            />
          </div>

          {carregando ? (
            <p className="mt-5 text-zinc-500">Carregando...</p>
          ) : (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {lista.map((f) => (
                <article key={f.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate text-lg font-black uppercase text-white">{f.nome}</h4>
                      <p className="mt-1 text-sm font-bold text-yellow-400">{f.cargo || "Sem cargo"}</p>
                      <p className="mt-1 text-xs text-zinc-500">{f.usuario} · {f.telefone || "Sem telefone"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${f.status === "Ativo" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                      {f.status}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {f.permissoes.length === 0 ? (
                      <span className="text-xs text-zinc-600">Sem módulos liberados</span>
                    ) : (
                      f.permissoes.map((p) => (
                        <span key={p} className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] font-bold uppercase text-zinc-400">
                          {PERMISSOES.find((item) => item.id === p)?.nome ?? p}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => editarFuncionario(f)}
                      className={`rounded-lg border px-3 py-2 text-xs font-black uppercase ${
                        editandoId === f.id
                          ? "border-yellow-400 bg-yellow-400 text-black"
                          : "border-yellow-400/50 text-yellow-400"
                      }`}
                    >
                      {editandoId === f.id ? "Editando" : "Editar"}
                    </button>
                    <button type="button" onClick={() => void alterarStatus(f)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-black uppercase text-zinc-300">
                      {f.status === "Ativo" ? "Inativar" : "Ativar"}
                    </button>
                    <button type="button" onClick={() => void excluirFuncionario(f)} className="rounded-lg border border-red-500/50 px-3 py-2 text-xs font-black uppercase text-red-400">
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
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
  tipo?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-zinc-500">{titulo}</span>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => aoAlterar(e.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
      />
    </label>
  );
}