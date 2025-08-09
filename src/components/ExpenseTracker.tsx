import { useState, useEffect } from 'react'
import { Plus, DollarSign, Receipt, Trash2, Edit3, PieChart } from 'lucide-react'
import { Expense } from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'

interface ExpenseTrackerProps {
  tripId: string
}

export function ExpenseTracker({ tripId }: ExpenseTrackerProps) {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('travel-expenses', [])
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'other' as Expense['category'],
    description: '',
    incurred_on: new Date().toISOString().split('T')[0]
  })

  const tripExpenses = expenses.filter(expense => expense.trip_id === tripId)
  const totalExpenses = tripExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const categoryTotals = tripExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const categoryColors: Record<string, string> = {
    accommodation: '#3b82f6',
    transport: '#10b981',
    food: '#f59e0b',
    activities: '#8b5cf6',
    shopping: '#ec4899',
    other: '#6b7280'
  }

  const categoryIcons: Record<string, string> = {
    accommodation: '🏨',
    transport: '🚗',
    food: '🍽️',
    activities: '🎯',
    shopping: '🛍️',
    other: '📝'
  }

  const addExpense = () => {
    if (!newExpense.title || !newExpense.amount) return

    const expense: Expense = {
      id: crypto.randomUUID(),
      trip_id: tripId,
      user_id: 'local-user',
      title: newExpense.title,
      amount: parseFloat(newExpense.amount),
      currency: 'USD',
      category: newExpense.category,
      description: newExpense.description,
      incurred_on: newExpense.incurred_on,
      is_shared: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setExpenses([...expenses, expense])
    setNewExpense({
      title: '',
      amount: '',
      category: 'other',
      description: '',
      incurred_on: new Date().toISOString().split('T')[0]
    })
    setShowAddExpense(false)
  }

  const updateExpense = () => {
    if (!editingExpense || !newExpense.title || !newExpense.amount) return

    const updatedExpenses = expenses.map(expense =>
      expense.id === editingExpense.id
        ? {
            ...expense,
            title: newExpense.title,
            amount: parseFloat(newExpense.amount),
            category: newExpense.category,
            description: newExpense.description,
            incurred_on: newExpense.incurred_on,
            updated_at: new Date().toISOString()
          }
        : expense
    )

    setExpenses(updatedExpenses)
    setEditingExpense(null)
    setNewExpense({
      title: '',
      amount: '',
      category: 'other',
      description: '',
      incurred_on: new Date().toISOString().split('T')[0]
    })
  }

  const deleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter(expense => expense.id !== expenseId))
  }

  const startEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setNewExpense({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description || '',
      incurred_on: expense.incurred_on
    })
    setShowAddExpense(true)
  }

  const cancelEdit = () => {
    setEditingExpense(null)
    setShowAddExpense(false)
    setNewExpense({
      title: '',
      amount: '',
      category: 'other',
      description: '',
      incurred_on: new Date().toISOString().split('T')[0]
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <DollarSign className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Expense Tracker</h2>
        </div>
        <button
          onClick={() => setShowAddExpense(true)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Total and Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">By Category</h3>
          <div className="space-y-2">
            {Object.entries(categoryTotals).map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{categoryIcons[category]}</span>
                  <span className="capitalize text-sm text-gray-600">{category}</span>
                </div>
                <span className="font-medium">${amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Expense Form */}
      {showAddExpense && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Expense title"
              value={newExpense.title}
              onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Amount"
              step="0.01"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <select
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as Expense['category'] })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="accommodation">🏨 Accommodation</option>
              <option value="transport">🚗 Transport</option>
              <option value="food">🍽️ Food & Dining</option>
              <option value="activities">🎯 Activities</option>
              <option value="shopping">🛍️ Shopping</option>
              <option value="other">📝 Other</option>
            </select>
            <input
              type="date"
              value={newExpense.incurred_on}
              onChange={(e) => setNewExpense({ ...newExpense, incurred_on: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <textarea
            placeholder="Description (optional)"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
            rows={2}
          />

          <div className="flex items-center space-x-3">
            <button
              onClick={editingExpense ? updateExpense : addExpense}
              disabled={!newExpense.title || !newExpense.amount}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingExpense ? 'Update Expense' : 'Add Expense'}
            </button>
            <button
              onClick={cancelEdit}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="space-y-3">
        {tripExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No expenses recorded yet</p>
            <p className="text-sm">Start tracking your trip expenses</p>
          </div>
        ) : (
          tripExpenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{categoryIcons[expense.category]}</div>
                <div>
                  <h4 className="font-medium text-gray-900">{expense.title}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="capitalize">{expense.category}</span>
                    <span>•</span>
                    <span>{expense.incurred_on}</span>
                  </div>
                  {expense.description && (
                    <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-lg font-semibold text-gray-900">
                  ${expense.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => startEdit(expense)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteExpense(expense.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}