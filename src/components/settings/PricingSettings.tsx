'use client'

import { useState } from 'react'

interface PricingSettingsProps {
  currentPricingModel: 'free' | 'paid' | 'both'
  currentSessionPrice: number | null
  currentFreeDuration: number
  currentPaidDuration: number
  paymentTitle?: string
  paymentDescription?: string
  onChange?: (data: PricingData) => void
  showPreview?: boolean
}

export interface PricingData {
  pricing_model: 'free' | 'paid' | 'both'
  session_price: number | null
  free_session_duration: number
  session_duration: number
  payment_title: string
  payment_description: string
}

export function PricingSettings({
  currentPricingModel = 'free',
  currentSessionPrice = null,
  currentFreeDuration = 30,
  currentPaidDuration = 45,
  paymentTitle = '',
  paymentDescription = '',
  onChange,
  showPreview = true
}: PricingSettingsProps) {
  const [pricingModel, setPricingModel] = useState<'free' | 'paid' | 'both'>(currentPricingModel)
  const [sessionPrice, setSessionPrice] = useState(currentSessionPrice || 25)
  const [freeDuration, setFreeDuration] = useState(currentFreeDuration)
  const [paidDuration, setPaidDuration] = useState(currentPaidDuration)
  const [title, setTitle] = useState(paymentTitle)
  const [description, setDescription] = useState(paymentDescription)

  const handleChange = (updates: Partial<{
    pricingModel: 'free' | 'paid' | 'both'
    sessionPrice: number
    freeDuration: number
    paidDuration: number
    title: string
    description: string
  }>) => {
    const newPricingModel = updates.pricingModel ?? pricingModel
    const newSessionPrice = updates.sessionPrice ?? sessionPrice
    const newFreeDuration = updates.freeDuration ?? freeDuration
    const newPaidDuration = updates.paidDuration ?? paidDuration
    const newTitle = updates.title ?? title
    const newDescription = updates.description ?? description

    if (updates.pricingModel !== undefined) setPricingModel(updates.pricingModel)
    if (updates.sessionPrice !== undefined) setSessionPrice(updates.sessionPrice)
    if (updates.freeDuration !== undefined) setFreeDuration(updates.freeDuration)
    if (updates.paidDuration !== undefined) setPaidDuration(updates.paidDuration)
    if (updates.title !== undefined) setTitle(updates.title)
    if (updates.description !== undefined) setDescription(updates.description)

    if (onChange) {
      onChange({
        pricing_model: newPricingModel,
        session_price: newPricingModel === 'free' ? null : newSessionPrice,
        free_session_duration: newFreeDuration,
        session_duration: newPaidDuration,
        payment_title: newTitle,
        payment_description: newDescription
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-[#333333] dark:text-white mb-2">Session Pricing</h3>
        <p className="text-sm text-[#333333]/70 dark:text-[#F5F5F5]/70">
          Choose how you want to offer your coaching sessions
        </p>
      </div>

      {/* Pricing Model Selection */}
      <div className="space-y-4">
        {/* Option 1: Free */}
        <label className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-green-300 bg-white dark:bg-gray-800 ${pricingModel === 'free' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
          <input
            type="radio"
            name="pricing"
            value="free"
            checked={pricingModel === 'free'}
            onChange={() => handleChange({ pricingModel: 'free' })}
            className="mt-1 w-5 h-5 text-green-600 focus:ring-green-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🎁</span>
              <span className="font-semibold text-lg text-[#333333] dark:text-white">All Sessions Free</span>
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                Recommended
              </span>
            </div>
            <p className="text-sm text-[#333333]/70 dark:text-[#F5F5F5]/70">
              Give back to the community that helped you. Build your reputation and help others land their dream PM role.
            </p>
            {pricingModel === 'free' && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <label className="block text-sm font-medium text-[#333333] dark:text-white mb-2">
                  Session Duration
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={freeDuration}
                    onChange={(e) => handleChange({ freeDuration: parseInt(e.target.value) || 30 })}
                    min="15"
                    max="90"
                    step="15"
                    className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-[#333333]/70 dark:text-[#F5F5F5]/70">minutes</span>
                </div>
                <p className="text-xs text-[#333333]/50 dark:text-[#F5F5F5]/50 mt-1">
                  Typical: 30-45 minutes
                </p>
              </div>
            )}
          </div>
        </label>

        {/* Option 2: Paid */}
        <label className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-orange-300 bg-white dark:bg-gray-800 ${pricingModel === 'paid' ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
          <input
            type="radio"
            name="pricing"
            value="paid"
            checked={pricingModel === 'paid'}
            onChange={() => handleChange({ pricingModel: 'paid' })}
            className="mt-1 w-5 h-5 text-orange-600 focus:ring-orange-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">💰</span>
              <span className="font-semibold text-lg text-[#333333] dark:text-white">Paid Sessions Only</span>
            </div>
            <p className="text-sm text-[#333333]/70 dark:text-[#F5F5F5]/70">
              Charge for your time and expertise. Recommended: $20-40 per session.
            </p>
            {pricingModel === 'paid' && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <label className="block text-sm font-medium text-[#333333] dark:text-white mb-2">
                    Price per Session
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[#333333]/70 dark:text-[#F5F5F5]/70">$</span>
                    <input
                      type="number"
                      value={sessionPrice}
                      onChange={(e) => handleChange({ sessionPrice: parseInt(e.target.value) || 0 })}
                      min="5"
                      max="200"
                      step="5"
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <p className="text-xs text-[#333333]/50 dark:text-[#F5F5F5]/50 mt-1">
                    Most coaches charge $20-40
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <label className="block text-sm font-medium text-[#333333] dark:text-white mb-2">
                    Session Duration
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={paidDuration}
                      onChange={(e) => handleChange({ paidDuration: parseInt(e.target.value) || 45 })}
                      min="30"
                      max="120"
                      step="15"
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="text-[#333333]/70 dark:text-[#F5F5F5]/70">minutes</span>
                  </div>
                  <p className="text-xs text-[#333333]/50 dark:text-[#F5F5F5]/50 mt-1">
                    Typical: 45-60 minutes
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <label className="block text-sm font-medium text-[#333333] dark:text-white mb-2">
                    Payment Title <span className="text-[#333333]/50 dark:text-[#F5F5F5]/50 font-normal">(what the payment is for)</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleChange({ title: e.target.value })}
                    maxLength={100}
                    placeholder="e.g., 1:1 PM Interview Coaching Session"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <label className="block text-sm font-medium text-[#333333] dark:text-white mb-2">
                    Payment Description <span className="text-[#333333]/50 dark:text-[#F5F5F5]/50 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => handleChange({ description: e.target.value })}
                    maxLength={500}
                    rows={3}
                    placeholder="Describe what the student will get from this paid session..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                  <p className="text-xs text-[#333333]/50 dark:text-[#F5F5F5]/50 mt-1">
                    {description.length}/500 characters
                  </p>
                </div>
              </div>
            )}
          </div>
        </label>

        {/* Option 3: Both */}
        <label className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-purple-300 bg-white dark:bg-gray-800 ${pricingModel === 'both' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
          <input
            type="radio"
            name="pricing"
            value="both"
            checked={pricingModel === 'both'}
            onChange={() => handleChange({ pricingModel: 'both' })}
            className="mt-1 w-5 h-5 text-purple-600 focus:ring-purple-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🎁💰</span>
              <span className="font-semibold text-lg text-[#333333] dark:text-white">Free + Paid Options</span>
            </div>
            <p className="text-sm text-[#333333]/70 dark:text-[#F5F5F5]/70">
              Offer a free intro call and paid deep-dive sessions. Best of both worlds!
            </p>
            {pricingModel === 'both' && (
              <div className="mt-4 space-y-4">
                {/* Free Option */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🎁</span>
                    <span className="font-semibold text-[#333333] dark:text-white">Free Introduction Call</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={freeDuration}
                      onChange={(e) => handleChange({ freeDuration: parseInt(e.target.value) || 30 })}
                      min="15"
                      max="45"
                      step="15"
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-[#333333]/70 dark:text-[#F5F5F5]/70">minutes</span>
                  </div>
                  <p className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60 mt-2">
                    Quick intro, questions, fit check
                  </p>
                </div>

                {/* Paid Option */}
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">💰</span>
                    <span className="font-semibold text-[#333333] dark:text-white">Paid Deep-Dive Session</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[#333333]/70 dark:text-[#F5F5F5]/70">$</span>
                      <input
                        type="number"
                        value={sessionPrice}
                        onChange={(e) => handleChange({ sessionPrice: parseInt(e.target.value) || 0 })}
                        min="5"
                        max="200"
                        step="5"
                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="text-[#333333]/70 dark:text-[#F5F5F5]/70">for</span>
                      <input
                        type="number"
                        value={paidDuration}
                        onChange={(e) => handleChange({ paidDuration: parseInt(e.target.value) || 45 })}
                        min="30"
                        max="120"
                        step="15"
                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="text-[#333333]/70 dark:text-[#F5F5F5]/70">min</span>
                    </div>
                    <p className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60">
                      Mock interview, resume review, detailed prep
                    </p>
                  </div>
                </div>

                {/* Payment Details for Both */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <label className="block text-sm font-medium text-[#333333] dark:text-white mb-2">
                    Payment Title <span className="text-[#333333]/50 dark:text-[#F5F5F5]/50 font-normal">(for paid sessions)</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleChange({ title: e.target.value })}
                    maxLength={100}
                    placeholder="e.g., Deep-Dive PM Interview Prep"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <label className="block text-sm font-medium text-[#333333] dark:text-white mb-2">
                    Payment Description <span className="text-[#333333]/50 dark:text-[#F5F5F5]/50 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => handleChange({ description: e.target.value })}
                    maxLength={500}
                    rows={3}
                    placeholder="Describe what the student will get from the paid deep-dive session..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                  <p className="text-xs text-[#333333]/50 dark:text-[#F5F5F5]/50 mt-1">
                    {description.length}/500 characters
                  </p>
                </div>
              </div>
            )}
          </div>
        </label>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-[#333333] dark:text-white mb-4">Preview - How it will appear:</h4>
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4 max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] rounded-full flex items-center justify-center text-white font-bold text-lg">
                YN
              </div>
              <div>
                <div className="font-semibold text-[#333333] dark:text-white">Your Name</div>
                <div className="text-sm text-[#333333]/70 dark:text-[#F5F5F5]/70">PM @ Company</div>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
              {pricingModel === 'free' && (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-lg">
                  <span className="text-xl">🎁</span>
                  <div>
                    <div className="font-bold text-green-600 dark:text-green-400">FREE</div>
                    <div className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60">{freeDuration} min sessions</div>
                  </div>
                </div>
              )}
              {pricingModel === 'paid' && (
                <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 px-3 py-2 rounded-lg">
                  <span className="text-xl">💰</span>
                  <div>
                    <div className="font-bold text-orange-600 dark:text-orange-400">${sessionPrice}</div>
                    <div className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60">{paidDuration} min</div>
                  </div>
                </div>
              )}
              {pricingModel === 'both' && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#333333]/60 dark:text-[#F5F5F5]/60 uppercase">Session Options:</div>
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 px-2 py-1.5 rounded text-sm">
                    <span>🎁</span>
                    <span className="font-medium text-[#333333] dark:text-white">FREE intro ({freeDuration} min)</span>
                  </div>
                  <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 px-2 py-1.5 rounded text-sm">
                    <span>💰</span>
                    <span className="font-medium text-[#333333] dark:text-white">${sessionPrice} deep-dive ({paidDuration} min)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
