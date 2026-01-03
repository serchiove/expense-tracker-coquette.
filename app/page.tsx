"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingBag, UtensilsCrossed, Car, Home, Sparkles, Plus, Calendar, TrendingUp, Loader2 } from "lucide-react"

// 1. Mejoramos el tipo de dato para incluir el timestamp (para cálculos)
type Transaction = {
  id: string
  title: string
  amount: number
  category: "shopping" | "food" | "transport" | "home" | "other"
  dateLabel: string // Lo que se ve: "02 Ene, 4:00 PM"
  timestamp: number // Lo que usa la lógica: 17042342...
}

const categoryIcons = {
  shopping: ShoppingBag,
  food: UtensilsCrossed,
  transport: Car,
  home: Home,
  other: Sparkles,
}

export default function ExpenseTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true) // Estado para la pantalla de carga
  
  // Estados del formulario
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<Transaction["category"]>("shopping")

  // --- EFECTO DE CARGA Y RECUPERACIÓN DE DATOS ---
  useEffect(() => {
    // Simulamos una carga estética de 1.5 segundos
    setTimeout(() => {
      const saved = localStorage.getItem("transactions")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setTransactions(parsed)
        } catch (e) {
          console.error("Error al leer datos", e)
        }
      }
      setLoading(false) // Quitamos la pantalla de carga
    }, 1500)
  }, [])

  // --- GUARDAR DATOS ---
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("transactions", JSON.stringify(transactions))
    }
  }, [transactions, loading])

  // --- LÓGICA DE RESÚMENES ---
  const now = new Date()
  
  // 1. Balance Total
  const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0)

  // 2. Gastos de este Mes (mismo mes y año)
  const monthlyExpenses = transactions
    .filter(t => {
      const tDate = new Date(t.timestamp || 0) // Fallback si es antiguo
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, t) => sum + t.amount, 0)

  // 3. Gastos de la Semana (últimos 7 días)
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(now.getDate() - 7)
  const weeklyExpenses = transactions
    .filter(t => (t.timestamp || 0) > oneWeekAgo.getTime())
    .reduce((sum, t) => sum + t.amount, 0)

  // 4. Categoría Mayoritaria (El "plus" de inteligencia)
  const categoryTotals = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount
    return acc
  }, {} as Record<string, number>)
  
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]

  // --- MANEJADORES ---
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount) return

    const dateNow = new Date()
    // Formato bonito para ver
    const formattedDate = new Intl.DateTimeFormat('es-PE', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
    }).format(dateNow)

    const newTransaction: Transaction = {
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      title,
      amount: Number.parseFloat(amount),
      category,
      dateLabel: formattedDate,
      timestamp: dateNow.getTime(), // Guardamos el tiempo real
    }

    setTransactions(prev => [newTransaction, ...prev])
    setTitle("")
    setAmount("")
    setCategory("shopping")
  }

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  // --- PANTALLA DE CARGA ---
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-pink-50 text-rose-500">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500"></div>
          <Sparkles className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-pulse text-rose-400" />
        </div>
        <p className="mt-4 animate-pulse font-sans text-lg font-medium tracking-widest text-rose-900">CARGANDO</p>
      </div>
    )
  }

  // --- APP PRINCIPAL ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50/30 to-purple-50/20 px-4 py-8 pb-20 animate-in fade-in duration-700">
      <div className="mx-auto max-w-md space-y-6">
        
        {/* Header: Fecha y Saludo */}
        <div className="flex items-center justify-between px-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">Hoy</p>
            <h2 className="font-sans text-2xl font-bold text-rose-950 capitalize">
              {new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)}
            </h2>
          </div>
          <div className="h-10 w-10 rounded-full bg-rose-200 p-0.5">
             {/* Avatar placeholder o icono */}
             <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-rose-300">
                <Sparkles size={18} />
             </div>
          </div>
        </div>

        {/* Hero Section - Total Balance */}
        <Card className="overflow-hidden border-0 shadow-lg shadow-pink-100/50 relative">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <Sparkles size={100} />
          </div>
          <div className="bg-gradient-to-br from-pink-200 via-rose-200 to-pink-300 p-8 text-center">
            <p className="text-sm font-medium tracking-wide text-rose-800/70">Gasto Total Histórico</p>
            <h1 className="mt-2 font-sans text-5xl font-bold tracking-tight text-rose-900">
              S/ {totalBalance.toFixed(2)}
            </h1>
          </div>
        </Card>

        {/* --- NUEVO: Resumen Semanal y Mensual --- */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 bg-white p-4 shadow-md shadow-pink-100/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-rose-400 font-medium">Esta Semana</p>
                <p className="text-xl font-bold text-rose-900 mt-1">S/ {weeklyExpenses.toFixed(0)}</p>
              </div>
              <div className="bg-pink-50 p-2 rounded-xl">
                <Calendar className="h-4 w-4 text-rose-400" />
              </div>
            </div>
          </Card>
          
          <Card className="border-0 bg-white p-4 shadow-md shadow-pink-100/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-rose-400 font-medium">Este Mes</p>
                <p className="text-xl font-bold text-rose-900 mt-1">S/ {monthlyExpenses.toFixed(0)}</p>
              </div>
              <div className="bg-pink-50 p-2 rounded-xl">
                <TrendingUp className="h-4 w-4 text-rose-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Insight Rápido (Top Category) */}
        {topCategory && (
           <div className="px-4 py-2 bg-rose-100/50 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              <span>Tu mayor gasto es en <span className="font-bold capitalize">{topCategory[0]}</span> (S/ {topCategory[1].toFixed(0)})</span>
           </div>
        )}

        {/* Formulario Add Expense */}
        <Card className="rounded-3xl border-0 bg-white p-6 shadow-xl shadow-pink-100/40">
          <h2 className="mb-5 flex items-center gap-2 font-sans text-xl font-semibold text-rose-900">
            <Plus className="h-5 w-5 text-rose-400" />
            Nuevo Gasto
          </h2>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <Input
                placeholder="Ej: Menú universitario"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 rounded-2xl border-2 border-pink-100 bg-pink-50/30 text-rose-900 placeholder:text-rose-300 focus-visible:border-rose-300 focus-visible:ring-rose-200"
              />
            </div>
            <div>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 rounded-2xl border-2 border-pink-100 bg-pink-50/30 text-rose-900 placeholder:text-rose-300 focus-visible:border-rose-300 focus-visible:ring-rose-200"
              />
            </div>

            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(categoryIcons) as Array<keyof typeof categoryIcons>).map((cat) => {
                const Icon = categoryIcons[cat]
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex h-14 flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all ${
                      category === cat
                        ? "border-rose-300 bg-gradient-to-br from-pink-100 to-rose-100 shadow-md scale-105"
                        : "border-pink-100 bg-white hover:border-pink-200 hover:bg-pink-50/50"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${category === cat ? "text-rose-500" : "text-rose-300"}`} />
                    <span className={`text-[9px] font-medium capitalize ${category === cat ? "text-rose-900" : "text-rose-300"}`}>{cat}</span>
                  </button>
                )
              })}
            </div>

            <Button
              type="submit"
              className="h-14 w-full rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 font-semibold text-white shadow-lg shadow-pink-300/50 hover:shadow-xl hover:shadow-pink-400/50 hover:scale-[1.02] transition-transform"
            >
              Agregar Gasto
            </Button>
          </form>
        </Card>

        {/* Lista de Transacciones */}
        <div className="space-y-3">
            <h3 className="px-2 text-sm font-semibold text-rose-900/50">Historial Reciente</h3>
            {transactions.length === 0 && (
                <div className="text-center py-8 text-rose-300 text-sm">
                    No hay gastos registrados aún.
                </div>
            )}
            {transactions.map((transaction) => {
              const Icon = categoryIcons[transaction.category]
              return (
                <Card
                  key={transaction.id}
                  className="group relative rounded-3xl border-0 bg-white p-4 shadow-lg shadow-pink-100/40 transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-rose-100">
                      <Icon className="h-6 w-6 text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-rose-900 truncate">{transaction.title}</h3>
                      {/* Usamos dateLabel si existe, sino un fallback */}
                      <p className="text-xs text-rose-400">{transaction.dateLabel || "Fecha desconocida"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-rose-900">S/ {transaction.amount.toFixed(2)}</p>
                      <button 
                        onClick={() => handleDelete(transaction.id)}
                        className="text-[10px] text-rose-300 hover:text-red-400 transition-colors uppercase tracking-wide font-medium mt-1"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
        </div>
      </div>
    </div>
  )
}