import { useState } from "react";
import { api, BASE, useMachines, useTickets } from "../lib/api";
import { TicketCard } from "../components/TicketCard";
import type { AuthUser } from "../lib/types";

interface ClosedNotice {
  id: string;
  maquina: string;
}

export function EmAndamento({ user }: { user: AuthUser }) {
  const { tickets, refresh } = useTickets();
  const machines = useMachines();
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closedNotices, setClosedNotices] = useState<ClosedNotice[]>([]);

  const emAndamento = tickets
    .filter((t) => t.status === "em_andamento")
    .sort((a, b) => (a.assumidoEm && b.assumidoEm && a.assumidoEm < b.assumidoEm ? -1 : 1));

  async function handleClose(id: string) {
    setCloseError(null);
    const ticket = emAndamento.find((t) => t.id === id);
    try {
      await api.closeTicket(id);
      if (ticket) {
        setClosedNotices((current) => [{ id, maquina: ticket.maquina }, ...current]);
      }
      await refresh();
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : "Erro ao encerrar o chamado.");
      await refresh();
    }
  }

  function dismissNotice(id: string) {
    setClosedNotices((current) => current.filter((n) => n.id !== id));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-industrial text-2xl font-bold text-white">Manutenção em andamento</h1>
      <p className="mt-1 text-sm text-slate-400">
        Chamados já assumidos por um manutentor — evita que duas pessoas resolvam a mesma
        máquina ao mesmo tempo.
      </p>

      {closeError && (
        <p className="mt-4 rounded-lg border border-critical-600/40 bg-critical-600/10 px-3 py-2 text-sm text-critical-500">
          {closeError}
        </p>
      )}

      {closedNotices.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {closedNotices.map((notice) => (
            <div
              key={notice.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ok-600/40 bg-ok-600/10 px-3 py-2.5"
            >
              <p className="text-sm text-ok-500">
                <span className="font-semibold text-white">{notice.maquina}</span> — manutenção
                concluída.
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={`${BASE}/documents/relatorio-chamado/${notice.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ok-500/40 bg-base-900/60 px-2.5 py-1 text-xs font-semibold text-ok-500 transition hover:border-ok-500 hover:text-white"
                >
                  📄 Gerar relatório
                </a>
                <button
                  onClick={() => dismissNotice(notice.id)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-300"
                >
                  Dispensar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {emAndamento.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg font-semibold text-slate-300">Nenhum chamado em andamento</p>
          <p className="text-sm text-slate-500">
            Assim que alguém assumir um chamado no Painel, ele aparece aqui.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {emAndamento.map((ticket) => {
            const isOwner = ticket.assumidoPor?.id === user.id;
            const canClose = isOwner || user.role === "administrador";
            return (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                machine={machines.find((m) => m.nome === ticket.maquina)}
                onClose={canClose ? handleClose : undefined}
                disabledCloseReason={
                  !canClose && ticket.assumidoPor
                    ? `Em atendimento por ${ticket.assumidoPor.nome}`
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
