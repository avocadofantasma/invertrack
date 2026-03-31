"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  CreditCard as CreditCardIcon,
  Car,
  Edit3,
  Upload,
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  DollarSign,
  Undo2,
  Pencil,
  AlertCircle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMoney, formatDate, generateId } from "@/lib/utils";
import { toast } from "sonner";
import type {
  CreditCard,
  CreditCardStatement,
  CreditCardTransaction,
  Loan,
  LoanPayment,
} from "@/lib/types";

export function DebtsTab() {
  const [activeSection, setActiveSection] = useState<"cards" | "loans">("cards");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Section toggle */}
      <div className="flex gap-1 p-1 bg-surface-200/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveSection("cards")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === "cards"
              ? "bg-brand-500/20 text-brand-400"
              : "text-surface-500 hover:text-surface-700"
          }`}
        >
          <CreditCardIcon className="w-4 h-4" />
          Tarjetas de crédito
        </button>
        <button
          onClick={() => setActiveSection("loans")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === "loans"
              ? "bg-brand-500/20 text-brand-400"
              : "text-surface-500 hover:text-surface-700"
          }`}
        >
          <Car className="w-4 h-4" />
          Préstamos
        </button>
      </div>

      {activeSection === "cards" ? <CreditCardsSection /> : <LoansSection />}
    </motion.div>
  );
}

// ── Credit Cards Section ──────────────────────────────────────

function CreditCardsSection() {
  const store = useStore();
  const { creditCards, creditCardStatements, financeSettings, accounts } = store;
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showImport, setShowImport] = useState<string | null>(null);
  const [showStatementForm, setShowStatementForm] = useState<string | null>(null);

  const totalDebt = creditCardStatements
    .filter((s) => !s.paid)
    .reduce((sum, s) => sum + s.totalBalance, 0);

  return (
    <div className="space-y-6">
      {/* Total debt card */}
      <div className="glass-card p-5 bg-gradient-to-br from-rose-500/10 to-orange-500/5">
        <p className="stat-label">Deuda total en tarjetas</p>
        <p className="stat-value text-surface-950 mt-2">{formatMoney(totalDebt)}</p>
      </div>

      {/* Cards list */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-300/30 flex items-center justify-between">
          <h3 className="section-title">Tarjetas</h3>
          <button
            onClick={() => {
              setEditingCard(null);
              setShowCardForm(true);
            }}
            className="btn-primary text-sm py-2"
          >
            <Plus className="w-4 h-4" />
            Agregar tarjeta
          </button>
        </div>

        {creditCards.length === 0 ? (
          <div className="p-8 text-center text-surface-500 text-sm">
            No hay tarjetas configuradas
          </div>
        ) : (
          <div className="divide-y divide-surface-200/50">
            {creditCards.map((card) => {
              const statements = creditCardStatements
                .filter((s) => s.cardId === card.id)
                .sort((a, b) => b.month.localeCompare(a.month));
              const latestStatement = statements[0];
              const isExpanded = expandedCard === card.id;

              return (
                <div key={card.id}>
                  <div className="flex items-center gap-4 px-4 py-3 hover:bg-surface-200/30 transition-colors">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: card.color + "20" }}
                    >
                      <CreditCardIcon className="w-5 h-5" style={{ color: card.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900">{card.name}</p>
                      <p className="text-xs text-surface-500">
                        {card.bank} · Corte: día {card.cutDay} · Pago: día {card.paymentDueDay} · Límite: {formatMoney(card.creditLimit)}
                      </p>
                    </div>
                    {latestStatement && (
                      <div className="text-right">
                        <p className="font-mono text-sm font-medium text-surface-900">
                          {formatMoney(latestStatement.totalBalance)}
                        </p>
                        <p className="text-xs">
                          {latestStatement.paid ? (
                            <span className="text-emerald-400">Pagado</span>
                          ) : (
                            <span className="text-amber-400">Pendiente</span>
                          )}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowImport(card.id)}
                        className="p-1.5 rounded-lg hover:bg-violet-500/10 transition-colors"
                        title="Importar estado de cuenta con IA"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      </button>
                      <button
                        onClick={() => setShowStatementForm(card.id)}
                        className="p-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors"
                        title="Agregar estado de cuenta manual"
                      >
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingCard(card);
                          setShowCardForm(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-surface-300/50 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-surface-500" />
                      </button>
                      <button
                        onClick={() => {
                          store.deleteCreditCard(card.id);
                          toast.success("Tarjeta eliminada");
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                      <button
                        onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                        className="p-1.5 rounded-lg hover:bg-surface-300/50 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-surface-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-surface-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded: show statements */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pl-14 space-y-3">
                          {statements.length === 0 ? (
                            <p className="text-xs text-surface-500 py-2">
                              Sin estados de cuenta
                            </p>
                          ) : (
                            statements.map((stmt) => (
                              <StatementCard
                                key={stmt.id}
                                statement={stmt}
                                card={card}
                                accounts={accounts}
                                onDelete={() => {
                                  store.deleteCreditCardStatement(stmt.id);
                                  toast.success("Estado de cuenta eliminado");
                                }}
                              />
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card Form Modal */}
      {showCardForm && (
        <CreditCardForm
          card={editingCard}
          onClose={() => setShowCardForm(false)}
          onSave={(data) => {
            if (editingCard) {
              store.updateCreditCard(editingCard.id, data);
              toast.success("Tarjeta actualizada");
            } else {
              store.addCreditCard(data);
              toast.success("Tarjeta agregada");
            }
            setShowCardForm(false);
          }}
        />
      )}

      {/* Manual Statement Form */}
      {showStatementForm && (
        <ManualStatementForm
          cardId={showStatementForm}
          onClose={() => setShowStatementForm(null)}
          onSave={(statement) => {
            store.addCreditCardStatement(statement);
            toast.success("Estado de cuenta agregado");
            setShowStatementForm(null);
          }}
        />
      )}

      {/* AI Import Modal */}
      {showImport && (
        <AIImportModal
          cardId={showImport}
          apiKey={financeSettings.openaiApiKey}
          onClose={() => setShowImport(null)}
          onImport={(statement) => {
            store.addCreditCardStatement(statement);
            toast.success("Estado de cuenta importado");
            setShowImport(null);
          }}
        />
      )}
    </div>
  );
}

function StatementCard({
  statement,
  card,
  accounts,
  onDelete,
}: {
  statement: CreditCardStatement;
  card: CreditCard;
  accounts: import("@/lib/types").Account[];
  onDelete: () => void;
}) {
  const store = useStore();
  const [showTxns, setShowTxns] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);

  const isPartial =
    statement.paid &&
    statement.paidAmount !== undefined &&
    statement.paidAmount < statement.totalBalance;
  const remaining = statement.totalBalance - (statement.paidAmount ?? 0);
  const paidAccount = accounts.find((a) => a.id === statement.paidFromAccountId);

  const handleCancelPayment = () => {
    if (statement.paymentMovementId) {
      store.deleteMovement(statement.paymentMovementId);
    }
    store.updateCreditCardStatement(statement.id, {
      paid: false,
      paidAmount: undefined,
      paidDate: undefined,
      paidFromAccountId: undefined,
      paymentMovementId: undefined,
    });
    toast.success("Pago cancelado y movimiento revertido");
  };

  return (
    <div className="bg-surface-200/30 rounded-xl p-3 space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-surface-900">{statement.month}</p>
          <p className="text-xs text-surface-500">
            Corte: {formatDate(statement.cutDate)} · Vence: {formatDate(statement.dueDate)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-medium text-surface-900">
            {formatMoney(statement.totalBalance)}
          </p>
          <p className="text-xs text-surface-500">
            Min: {formatMoney(statement.minimumPayment)}
          </p>
        </div>
      </div>

      {/* Partial payment warning */}
      {isPartial && (
        <div className="flex items-center gap-2 bg-amber-500/10 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs text-amber-300">
            Pago parcial: {formatMoney(statement.paidAmount!)} pagado · Restante: {formatMoney(remaining)}
          </span>
        </div>
      )}

      {/* Payment details when paid */}
      {statement.paid && (
        <div className="bg-emerald-500/10 rounded-lg px-3 py-2 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                Pagado {statement.paidDate ? formatDate(statement.paidDate) : ""}
              </span>
            </div>
            <span className="font-mono text-xs text-emerald-300">
              {formatMoney(statement.paidAmount ?? statement.totalBalance)}
            </span>
          </div>
          {paidAccount && (
            <p className="text-[11px] text-surface-500 pl-5">
              Desde: {paidAccount.institution} — {paidAccount.subAccount}
            </p>
          )}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => setShowPayForm(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-surface-300/30 text-surface-400 hover:text-surface-200 transition-colors"
            >
              <Pencil className="w-2.5 h-2.5" />
              Editar pago
            </button>
            <button
              onClick={handleCancelPayment}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              <Undo2 className="w-2.5 h-2.5" />
              Cancelar pago
            </button>
          </div>
        </div>
      )}

      {/* Pay form */}
      {showPayForm && (
        <CCPaymentForm
          statement={statement}
          accounts={accounts}
          cardName={card.name}
          onClose={() => setShowPayForm(false)}
          onSave={(amount, date, accountId, notes) => {
            // If editing an existing payment, delete old movement first
            if (statement.paymentMovementId) {
              store.deleteMovement(statement.paymentMovementId);
            }
            const movementId = generateId();
            store.addMovement({
              id: movementId,
              accountId,
              date,
              type: "withdrawal",
              amount: -amount,
              notes: notes || `Pago TDC: ${card.name} (${statement.month})`,
            });
            store.updateCreditCardStatement(statement.id, {
              paid: true,
              paidAmount: amount,
              paidDate: date,
              paidFromAccountId: accountId,
              paymentMovementId: movementId,
            });
            toast.success("Pago registrado");
            setShowPayForm(false);
          }}
        />
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2">
        {!statement.paid && !showPayForm && (
          <button
            onClick={() => setShowPayForm(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <DollarSign className="w-3 h-3" />
            Registrar pago
          </button>
        )}
        {statement.transactions.length > 0 && (
          <button
            onClick={() => setShowTxns(!showTxns)}
            className="text-xs text-surface-500 hover:text-surface-700 transition-colors"
          >
            {statement.transactions.length} cargos {showTxns ? "▲" : "▼"}
          </button>
        )}
        <button onClick={onDelete} className="ml-auto p-1 rounded-lg hover:bg-rose-500/10 transition-colors">
          <Trash2 className="w-3 h-3 text-rose-400" />
        </button>
      </div>

      {/* Transactions list */}
      {showTxns && (
        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
          {statement.transactions.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-surface-100/50 text-xs">
              <div className="flex-1 min-w-0">
                <span className="text-surface-700 truncate block">{txn.description}</span>
                <span className="text-surface-500">{formatDate(txn.date)}</span>
                {txn.installment && (
                  <span className="text-amber-400 block">
                    {txn.installment.current}/{txn.installment.total} · Restante: {formatMoney(txn.installment.remainingBalance)}
                  </span>
                )}
              </div>
              <span className="font-mono text-surface-900 ml-2">{formatMoney(txn.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CCPaymentForm({
  statement,
  accounts,
  cardName,
  onClose,
  onSave,
}: {
  statement: CreditCardStatement;
  accounts: import("@/lib/types").Account[];
  cardName: string;
  onClose: () => void;
  onSave: (amount: number, date: string, accountId: string, notes: string) => void;
}) {
  const [amount, setAmount] = useState(
    (statement.paidAmount ?? statement.totalBalance).toString()
  );
  const [date, setDate] = useState(
    statement.paidDate ?? new Date().toISOString().split("T")[0]
  );
  const [accountId, setAccountId] = useState(
    statement.paidFromAccountId ?? accounts[0]?.id ?? ""
  );
  const [notes, setNotes] = useState("");

  const parsedAmount = parseFloat(amount) || 0;
  const isPartial = parsedAmount < statement.totalBalance;
  const isOver = parsedAmount > statement.totalBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      toast.error("Selecciona una cuenta de origen");
      return;
    }
    if (parsedAmount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }
    onSave(parsedAmount, date, accountId, notes);
  };

  return (
    <div className="bg-surface-100/50 rounded-xl p-3 border border-surface-300/30 space-y-3">
      <p className="text-xs font-semibold text-surface-700">
        {statement.paidAmount !== undefined ? "Editar pago" : "Registrar pago"} — {statement.month}
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-surface-500 mb-1 block">Monto pagado</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field py-1.5 text-xs"
              min="0.01"
              step="0.01"
              required
            />
            {isPartial && (
              <p className="text-[10px] text-amber-400 mt-0.5">
                Pago parcial · Restante: {formatMoney(statement.totalBalance - parsedAmount)}
              </p>
            )}
            {isOver && (
              <p className="text-[10px] text-cyan-400 mt-0.5">
                Pago excedente: +{formatMoney(parsedAmount - statement.totalBalance)}
              </p>
            )}
          </div>
          <div>
            <label className="text-[11px] text-surface-500 mb-1 block">Fecha de pago</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field py-1.5 text-xs"
              required
            />
          </div>
        </div>
        <div>
          <label className="text-[11px] text-surface-500 mb-1 block">
            Pagar desde cuenta <span className="text-rose-400">*</span>
          </label>
          {accounts.length === 0 ? (
            <p className="text-[11px] text-amber-400">No hay cuentas configuradas</p>
          ) : (
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="input-field py-1.5 text-xs"
              required
            >
              <option value="">— Selecciona cuenta —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.institution} — {a.subAccount}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="text-[11px] text-surface-500 mb-1 block">Notas (opcional)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field py-1.5 text-xs"
            placeholder={`Pago TDC: ${cardName} (${statement.month})`}
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 py-1.5 text-xs">
            Cancelar
          </button>
          <button type="submit" className="btn-primary flex-1 py-1.5 text-xs">
            <Check className="w-3 h-3" />
            Confirmar pago
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Loans Section ─────────────────────────────────────────────

function LoansSection() {
  const store = useStore();
  const { loans, loanPayments, accounts } = store;
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);

  const totalDebt = loans
    .filter((l) => l.enabled)
    .reduce((sum, l) => sum + l.remainingBalance, 0);
  const totalMonthlyPayment = loans
    .filter((l) => l.enabled)
    .reduce((sum, l) => sum + l.monthlyPayment, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 bg-gradient-to-br from-orange-500/10 to-amber-500/5">
          <p className="stat-label">Deuda total préstamos</p>
          <p className="stat-value text-surface-950 mt-2">{formatMoney(totalDebt)}</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-amber-500/10 to-rose-500/5">
          <p className="stat-label">Pago mensual total</p>
          <p className="stat-value text-surface-950 mt-2">{formatMoney(totalMonthlyPayment)}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-300/30 flex items-center justify-between">
          <h3 className="section-title">Préstamos</h3>
          <button
            onClick={() => {
              setEditingLoan(null);
              setShowLoanForm(true);
            }}
            className="btn-primary text-sm py-2"
          >
            <Plus className="w-4 h-4" />
            Agregar préstamo
          </button>
        </div>

        {loans.length === 0 ? (
          <div className="p-8 text-center text-surface-500 text-sm">
            No hay préstamos configurados
          </div>
        ) : (
          <div className="divide-y divide-surface-200/50">
            {loans.map((loan) => {
              const payments = loanPayments
                .filter((p) => p.loanId === loan.id)
                .sort((a, b) => b.date.localeCompare(a.date));
              const progress = loan.totalInstallments > 0
                ? (loan.paidInstallments / loan.totalInstallments) * 100
                : 0;
              const isExpanded = expandedLoan === loan.id;

              return (
                <div key={loan.id}>
                  <div className="flex items-center gap-4 px-4 py-3 hover:bg-surface-200/30 transition-colors">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: loan.color + "20" }}
                    >
                      <Car className="w-5 h-5" style={{ color: loan.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900">{loan.name}</p>
                      <p className="text-xs text-surface-500">
                        {loan.institution} · Día {loan.paymentDueDay} · {loan.paidInstallments}/{loan.totalInstallments} pagos
                      </p>
                      {/* Progress bar */}
                      <div className="mt-1.5 w-full h-1.5 bg-surface-300/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-cyan transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-medium text-surface-900">
                        {formatMoney(loan.remainingBalance)}
                      </p>
                      <p className="text-xs text-surface-500">
                        {formatMoney(loan.monthlyPayment)}/mes
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowPaymentForm(loan.id)}
                        className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                        title="Registrar pago"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingLoan(loan);
                          setShowLoanForm(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-surface-300/50 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-surface-500" />
                      </button>
                      <button
                        onClick={() => {
                          store.deleteLoan(loan.id);
                          toast.success("Préstamo eliminado");
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                      <button
                        onClick={() => setExpandedLoan(isExpanded ? null : loan.id)}
                        className="p-1.5 rounded-lg hover:bg-surface-300/50 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-surface-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-surface-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pl-14 space-y-2">
                          {payments.length === 0 ? (
                            <p className="text-xs text-surface-500 py-2">Sin pagos registrados</p>
                          ) : (
                            payments.map((p) => (
                              <div key={p.id} className="flex items-center justify-between bg-surface-200/30 rounded-lg px-3 py-2 text-xs">
                                <div>
                                  <span className="text-surface-700">{formatDate(p.date)}</span>
                                  {p.notes && <span className="text-surface-500 ml-2">· {p.notes}</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-surface-900">{formatMoney(p.amount)}</span>
                                  <span className="text-surface-500">Restante: {formatMoney(p.remainingAfter)}</span>
                                  <button
                                    onClick={() => {
                                      store.deleteLoanPayment(p.id);
                                      toast.success("Pago eliminado");
                                    }}
                                    className="p-1 rounded hover:bg-rose-500/10"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-400" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showLoanForm && (
        <LoanForm
          loan={editingLoan}
          onClose={() => setShowLoanForm(false)}
          onSave={(data) => {
            if (editingLoan) {
              store.updateLoan(editingLoan.id, data);
              toast.success("Préstamo actualizado");
            } else {
              store.addLoan(data);
              toast.success("Préstamo agregado");
            }
            setShowLoanForm(false);
          }}
        />
      )}

      {showPaymentForm && (
        <LoanPaymentForm
          loan={loans.find((l) => l.id === showPaymentForm)!}
          accounts={accounts}
          onClose={() => setShowPaymentForm(null)}
          onSave={(payment, fromAccountId) => {
            store.addLoanPayment(payment);
            if (fromAccountId) {
              store.addMovement({
                accountId: fromAccountId,
                date: payment.date,
                type: "withdrawal",
                amount: -payment.amount,
                notes: `Pago préstamo: ${loans.find((l) => l.id === showPaymentForm)?.name ?? ""}`,
              });
            }
            toast.success("Pago registrado");
            setShowPaymentForm(null);
          }}
        />
      )}
    </div>
  );
}

// ── Forms ─────────────────────────────────────────────────────

function CreditCardForm({
  card,
  onClose,
  onSave,
}: {
  card: CreditCard | null;
  onClose: () => void;
  onSave: (data: Omit<CreditCard, "id">) => void;
}) {
  const [name, setName] = useState(card?.name ?? "");
  const [bank, setBank] = useState(card?.bank ?? "");
  const [creditLimit, setCreditLimit] = useState(card?.creditLimit?.toString() ?? "");
  const [cutDay, setCutDay] = useState(card?.cutDay?.toString() ?? "");
  const [paymentDueDay, setPaymentDueDay] = useState(card?.paymentDueDay?.toString() ?? "");
  const [color, setColor] = useState(card?.color ?? "#8B5CF6");
  const [notes, setNotes] = useState(card?.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !bank || !creditLimit || !cutDay || !paymentDueDay) return;
    onSave({
      name,
      bank,
      creditLimit: parseFloat(creditLimit),
      cutDay: parseInt(cutDay),
      paymentDueDay: parseInt(paymentDueDay),
      color,
      notes,
      enabled: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-elevated p-6 w-full max-w-md"
      >
        <h3 className="section-title mb-4">{card ? "Editar tarjeta" : "Nueva tarjeta"}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Nombre</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Ej: Oro BBVA" required />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Banco</label>
              <input value={bank} onChange={(e) => setBank(e.target.value)} className="input-field" placeholder="Ej: BBVA" required />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Límite de crédito</label>
            <input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} className="input-field" placeholder="50000" min="0" step="0.01" required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Día de corte</label>
              <input type="number" value={cutDay} onChange={(e) => setCutDay(e.target.value)} className="input-field" min="1" max="31" required />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Día de pago</label>
              <input type="number" value={paymentDueDay} onChange={(e) => setPaymentDueDay(e.target.value)} className="input-field" min="1" max="31" required />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Color</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="input-field h-[42px] p-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Notas</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" placeholder="Opcional" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Guardar</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ManualStatementForm({
  cardId,
  onClose,
  onSave,
}: {
  cardId: string;
  onClose: () => void;
  onSave: (statement: Omit<CreditCardStatement, "id">) => void;
}) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [totalBalance, setTotalBalance] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");
  const [cutDate, setCutDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalBalance || !minimumPayment) return;
    onSave({
      cardId,
      month,
      totalBalance: parseFloat(totalBalance),
      minimumPayment: parseFloat(minimumPayment),
      cutDate: cutDate || `${month}-01`,
      dueDate: dueDate || `${month}-20`,
      transactions: [],
      paid: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-elevated p-6 w-full max-w-md"
      >
        <h3 className="section-title mb-4">Estado de cuenta manual</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Mes</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Saldo total</label>
              <input type="number" value={totalBalance} onChange={(e) => setTotalBalance(e.target.value)} className="input-field" min="0" step="0.01" required />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Pago mínimo</label>
              <input type="number" value={minimumPayment} onChange={(e) => setMinimumPayment(e.target.value)} className="input-field" min="0" step="0.01" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Fecha de corte</label>
              <input type="date" value={cutDate} onChange={(e) => setCutDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Fecha límite de pago</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Guardar</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AIImportModal({
  cardId,
  apiKey,
  onClose,
  onImport,
}: {
  cardId: string;
  apiKey: string;
  onClose: () => void;
  onImport: (statement: Omit<CreditCardStatement, "id">) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jsonPaste, setJsonPaste] = useState("");
  const [preview, setPreview] = useState<{
    statementDate: string;
    cutDate: string;
    dueDate: string;
    totalBalance: number;
    minimumPayment: number;
    transactions: Array<{
      date: string;
      description: string;
      amount: number;
      category: string;
      installment?: { current: number; total: number; remainingBalance: number };
    }>;
  } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!apiKey) {
      setError("Configura tu API Key de OpenAI en la pestaña de Datos primero.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("apiKey", apiKey);

      const res = await fetch("/api/parse-statement", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al procesar el archivo");
      }

      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleJsonImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Accept either the raw parsed format or a wrapped { statement: ... } format
        const payload = data.statement ?? data;
        if (typeof payload.totalBalance !== "number") {
          throw new Error("El JSON no tiene el formato esperado (falta totalBalance)");
        }
        setPreview(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "JSON inválido");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleJsonPaste = () => {
    setError("");
    try {
      const data = JSON.parse(jsonPaste);
      const payload = data.statement ?? data;
      if (typeof payload.totalBalance !== "number") {
        throw new Error("El JSON no tiene el formato esperado (falta totalBalance)");
      }
      setPreview(payload);
      setJsonPaste("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "JSON inválido");
    }
  };

  const handleConfirm = () => {
    if (!preview) return;

    const month = preview.statementDate
      ? preview.statementDate.slice(0, 7)
      : new Date().toISOString().slice(0, 7);

    const transactions: CreditCardTransaction[] = (preview.transactions || []).map((t) => ({
      id: generateId(),
      date: t.date,
      description: t.description,
      amount: t.amount,
      category: t.category,
      ...(t.installment ? { installment: t.installment } : {}),
    }));

    onImport({
      cardId,
      month,
      totalBalance: preview.totalBalance || 0,
      minimumPayment: preview.minimumPayment || 0,
      cutDate: preview.cutDate || `${month}-01`,
      dueDate: preview.dueDate || `${month}-20`,
      transactions,
      paid: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-elevated p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto scrollbar-thin"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <h3 className="section-title">Importar con IA</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-300/50 transition-colors">
            <X className="w-4 h-4 text-surface-500" />
          </button>
        </div>

        {!apiKey && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400 mb-4">
            Necesitas configurar tu API Key de OpenAI en la pestaña de Datos antes de usar esta función.
          </div>
        )}

        {!preview ? (
          <div className="space-y-4">
            {/* AI import */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-widest text-surface-500">
                Con IA
              </p>
              <p className="text-sm text-surface-600">
                Sube una foto o PDF de tu estado de cuenta. La IA extraerá
                el saldo, fecha de corte, pago mínimo y todas las transacciones.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || !apiKey}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando con IA...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Subir imagen / PDF
                  </>
                )}
              </button>
              {!apiKey && (
                <p className="text-xs text-amber-400">
                  Configura tu API Key de OpenAI en Datos → Configuración.
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-surface-300/40" />
              <span className="text-xs text-surface-500">o</span>
              <div className="flex-1 h-px bg-surface-300/40" />
            </div>

            {/* JSON import */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-widest text-surface-500">
                Desde JSON
              </p>
              <p className="text-sm text-surface-600">
                Importa un JSON generado con el skill{" "}
                <code className="text-violet-400 text-xs">/parse-statement</code> de Claude Code.
              </p>
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleJsonImport}
              />
              <button
                onClick={() => jsonInputRef.current?.click()}
                className="btn-secondary w-full justify-center"
              >
                <FileText className="w-4 h-4" />
                Cargar archivo JSON
              </button>
              <textarea
                value={jsonPaste}
                onChange={(e) => setJsonPaste(e.target.value)}
                placeholder="O pega el JSON aquí..."
                rows={4}
                className="input-field font-mono text-xs resize-none w-full"
              />
              {jsonPaste.trim() && (
                <button
                  onClick={handleJsonPaste}
                  className="btn-secondary w-full justify-center"
                >
                  <Check className="w-4 h-4" />
                  Usar JSON pegado
                </button>
              )}
            </div>

            {error && (
              <p className="text-sm text-rose-400 bg-rose-500/10 rounded-xl p-3">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-surface-600">
              Revisa los datos extraídos antes de confirmar:
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-surface-200/30 rounded-lg p-3">
                <p className="text-xs text-surface-500">Saldo total</p>
                <p className="font-mono font-medium text-surface-900">
                  {formatMoney(preview.totalBalance || 0)}
                </p>
              </div>
              <div className="bg-surface-200/30 rounded-lg p-3">
                <p className="text-xs text-surface-500">Pago mínimo</p>
                <p className="font-mono font-medium text-surface-900">
                  {formatMoney(preview.minimumPayment || 0)}
                </p>
              </div>
              <div className="bg-surface-200/30 rounded-lg p-3">
                <p className="text-xs text-surface-500">Fecha de corte</p>
                <p className="font-medium text-surface-900">{preview.cutDate || "—"}</p>
              </div>
              <div className="bg-surface-200/30 rounded-lg p-3">
                <p className="text-xs text-surface-500">Fecha límite</p>
                <p className="font-medium text-surface-900">{preview.dueDate || "—"}</p>
              </div>
            </div>

            {preview.transactions && preview.transactions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-surface-600 mb-2">
                  {preview.transactions.length} transacciones encontradas
                </p>
                <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1">
                  {preview.transactions.map((txn, i) => (
                    <div key={i} className="flex items-center justify-between bg-surface-200/30 rounded-lg px-3 py-2 text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="text-surface-700 truncate">{txn.description}</p>
                        <p className="text-surface-500">{txn.date} · {txn.category}</p>
                        {txn.installment && (
                          <p className="text-amber-400 mt-0.5">
                            Cargo {txn.installment.current}/{txn.installment.total} · Saldo restante: {formatMoney(txn.installment.remainingBalance)}
                          </p>
                        )}
                      </div>
                      <span className="font-mono text-surface-900 ml-2">
                        {formatMoney(txn.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPreview(null)}
                className="btn-secondary flex-1"
              >
                Reintentar
              </button>
              <button onClick={handleConfirm} className="btn-primary flex-1">
                <Check className="w-4 h-4" />
                Confirmar e importar
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function LoanForm({
  loan,
  onClose,
  onSave,
}: {
  loan: Loan | null;
  onClose: () => void;
  onSave: (data: Omit<Loan, "id">) => void;
}) {
  const [name, setName] = useState(loan?.name ?? "");
  const [institution, setInstitution] = useState(loan?.institution ?? "");
  const [type, setType] = useState<"car" | "personal" | "other">(loan?.type ?? "car");
  const [totalAmount, setTotalAmount] = useState(loan?.totalAmount?.toString() ?? "");
  const [remainingBalance, setRemainingBalance] = useState(loan?.remainingBalance?.toString() ?? "");
  const [monthlyPayment, setMonthlyPayment] = useState(loan?.monthlyPayment?.toString() ?? "");
  const [interestRate, setInterestRate] = useState(loan?.interestRate?.toString() ?? "");
  const [paymentDueDay, setPaymentDueDay] = useState(loan?.paymentDueDay?.toString() ?? "");
  const [startDate, setStartDate] = useState(loan?.startDate ?? "");
  const [totalInstallments, setTotalInstallments] = useState(loan?.totalInstallments?.toString() ?? "");
  const [paidInstallments, setPaidInstallments] = useState(loan?.paidInstallments?.toString() ?? "0");
  const [color, setColor] = useState(loan?.color ?? "#FB923C");
  const [notes, setNotes] = useState(loan?.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !totalAmount || !monthlyPayment || !paymentDueDay) return;
    onSave({
      name,
      institution,
      type,
      totalAmount: parseFloat(totalAmount),
      remainingBalance: parseFloat(remainingBalance || totalAmount),
      monthlyPayment: parseFloat(monthlyPayment),
      interestRate: parseFloat(interestRate || "0"),
      paymentDueDay: parseInt(paymentDueDay),
      startDate: startDate || new Date().toISOString().split("T")[0],
      totalInstallments: parseInt(totalInstallments || "0"),
      paidInstallments: parseInt(paidInstallments || "0"),
      color,
      notes,
      enabled: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-elevated p-6 w-full max-w-md max-h-[80vh] overflow-y-auto scrollbar-thin"
      >
        <h3 className="section-title mb-4">{loan ? "Editar préstamo" : "Nuevo préstamo"}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Nombre</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Ej: Auto Nissan" required />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Institución</label>
              <input value={institution} onChange={(e) => setInstitution(e.target.value)} className="input-field" placeholder="Ej: BBVA" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="input-field">
                <option value="car">Auto</option>
                <option value="personal">Personal</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Monto total</label>
              <input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} className="input-field" min="0" step="0.01" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Saldo restante</label>
              <input type="number" value={remainingBalance} onChange={(e) => setRemainingBalance(e.target.value)} className="input-field" min="0" step="0.01" placeholder={totalAmount} />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Pago mensual</label>
              <input type="number" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} className="input-field" min="0" step="0.01" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Tasa anual %</label>
              <input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="input-field" min="0" step="0.01" />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Día de pago</label>
              <input type="number" value={paymentDueDay} onChange={(e) => setPaymentDueDay(e.target.value)} className="input-field" min="1" max="31" required />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Color</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="input-field h-[42px] p-1" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Inicio</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Total pagos</label>
              <input type="number" value={totalInstallments} onChange={(e) => setTotalInstallments(e.target.value)} className="input-field" min="0" />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Pagos hechos</label>
              <input type="number" value={paidInstallments} onChange={(e) => setPaidInstallments(e.target.value)} className="input-field" min="0" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Notas</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" placeholder="Opcional" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Guardar</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function LoanPaymentForm({
  loan,
  accounts,
  onClose,
  onSave,
}: {
  loan: Loan;
  accounts: import("@/lib/types").Account[];
  onClose: () => void;
  onSave: (payment: Omit<LoanPayment, "id">, fromAccountId?: string) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState(loan.monthlyPayment.toString());
  const [notes, setNotes] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");

  // Rough estimate of principal vs interest
  const monthlyRate = loan.interestRate / 100 / 12;
  const interestPortion = loan.remainingBalance * monthlyRate;
  const principalPortion = parseFloat(amount || "0") - interestPortion;
  const remainingAfter = Math.max(0, loan.remainingBalance - Math.max(0, principalPortion));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    onSave(
      {
        loanId: loan.id,
        fromAccountId: fromAccountId || undefined,
        date,
        amount: parseFloat(amount),
        principal: Math.max(0, principalPortion),
        interest: Math.max(0, interestPortion),
        remainingAfter,
        notes,
      },
      fromAccountId || undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-elevated p-6 w-full max-w-md"
      >
        <h3 className="section-title mb-4">Registrar pago — {loan.name}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Fecha</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Monto</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" min="0" step="0.01" required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-surface-200/30 rounded-lg p-2.5">
              <p className="text-surface-500">Capital</p>
              <p className="font-mono text-surface-900">{formatMoney(Math.max(0, principalPortion))}</p>
            </div>
            <div className="bg-surface-200/30 rounded-lg p-2.5">
              <p className="text-surface-500">Interés</p>
              <p className="font-mono text-surface-900">{formatMoney(Math.max(0, interestPortion))}</p>
            </div>
            <div className="bg-surface-200/30 rounded-lg p-2.5">
              <p className="text-surface-500">Queda</p>
              <p className="font-mono text-surface-900">{formatMoney(remainingAfter)}</p>
            </div>
          </div>

          {accounts.length > 0 && (
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Pagar desde cuenta</label>
              <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} className="input-field">
                <option value="">— No asignar —</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.institution} — {a.subAccount}</option>
                ))}
              </select>
              {fromAccountId && (
                <p className="text-[11px] text-amber-400 mt-1">Se registrará un retiro en la cuenta seleccionada.</p>
              )}
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Notas</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" placeholder="Opcional" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Registrar pago</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
