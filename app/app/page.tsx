'use client'

import { useState } from 'react'
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  ChevronRight, 
  ExternalLink,
  Twitter,
  Globe,
  Clock,
  DollarSign,
  Percent,
  Lock,
  BarChart3,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react'

// Mock data for bonds
const MOCK_BONDS = [
  {
    id: '1',
    name: 'Jupiter Exchange',
    symbol: 'JUP',
    image: '🪐',
    description: 'Jupiter is the key liquidity aggregator for Solana, offering the widest range of tokens and best route discovery.',
    website: 'https://jup.ag',
    twitter: '@JupiterExchange',
    price: 1000,
    yield: 8.5,
    yieldType: 'Fixed',
    collateral: 500000,
    collateralToken: 'SOL',
    volume24h: 2500000,
    maturity: '2025-12-31',
    totalSupply: 10000,
    outstanding: 7500,
    issuer: 'Jupiter DAO',
    paymentFrequency: 'Quarterly',
    minInvestment: 100,
    rating: 'AAA',
  },
  {
    id: '2',
    name: 'Marinade Finance',
    symbol: 'MNDE',
    image: '🥩',
    description: 'Marinade is the leading liquid staking protocol on Solana, enabling users to stake SOL while maintaining liquidity.',
    website: 'https://marinade.finance',
    twitter: '@MarinadeFinance',
    price: 500,
    yield: 12.0,
    yieldType: 'Variable',
    collateral: 250000,
    collateralToken: 'mSOL',
    volume24h: 1200000,
    maturity: '2026-06-30',
    totalSupply: 20000,
    outstanding: 15000,
    issuer: 'Marinade DAO',
    paymentFrequency: 'Monthly',
    minInvestment: 50,
    rating: 'AA',
  },
  {
    id: '3',
    name: 'Raydium Protocol',
    symbol: 'RAY',
    image: '☀️',
    description: 'Raydium is an automated market maker (AMM) built on Solana with concentrated liquidity features.',
    website: 'https://raydium.io',
    twitter: '@RaydiumProtocol',
    price: 750,
    yield: 10.25,
    yieldType: 'Fixed',
    collateral: 400000,
    collateralToken: 'RAY',
    volume24h: 890000,
    maturity: '2025-09-15',
    totalSupply: 15000,
    outstanding: 12000,
    issuer: 'Raydium Labs',
    paymentFrequency: 'Semi-Annual',
    minInvestment: 75,
    rating: 'A',
  },
  {
    id: '4',
    name: 'Drift Protocol',
    symbol: 'DRIFT',
    image: '🌊',
    description: 'Drift is a decentralized perpetual exchange on Solana with up to 10x leverage on various assets.',
    website: 'https://drift.trade',
    twitter: '@DriftProtocol',
    price: 250,
    yield: 15.0,
    yieldType: 'Variable',
    collateral: 150000,
    collateralToken: 'USDC',
    volume24h: 560000,
    maturity: '2026-03-01',
    totalSupply: 50000,
    outstanding: 35000,
    issuer: 'Drift Labs',
    paymentFrequency: 'Monthly',
    minInvestment: 25,
    rating: 'BBB',
  },
  {
    id: '5',
    name: 'Tensor',
    symbol: 'TNSR',
    image: '💎',
    description: 'Tensor is the leading NFT marketplace on Solana, offering advanced trading features and analytics.',
    website: 'https://tensor.trade',
    twitter: '@tensor_hq',
    price: 2000,
    yield: 6.5,
    yieldType: 'Fixed',
    collateral: 1000000,
    collateralToken: 'SOL',
    volume24h: 3200000,
    maturity: '2027-01-01',
    totalSupply: 5000,
    outstanding: 3000,
    issuer: 'Tensor Foundation',
    paymentFrequency: 'Quarterly',
    minInvestment: 200,
    rating: 'AAA',
  },
]

// Mock portfolio data
const MOCK_PORTFOLIO = [
  { bond: MOCK_BONDS[0], quantity: 5, avgPrice: 980, currentValue: 5000, pnl: 100, pnlPercent: 2.04, yieldEarned: 212.50 },
  { bond: MOCK_BONDS[2], quantity: 10, avgPrice: 720, currentValue: 7500, pnl: 300, pnlPercent: 4.17, yieldEarned: 384.38 },
]

type Tab = 'home' | 'trade' | 'deploy' | 'portfolio'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [selectedBond, setSelectedBond] = useState<typeof MOCK_BONDS[0] | null>(null)
  const [walletConnected, setWalletConnected] = useState(false)

  return (
    <div className="min-h-screen bg-btrust-darker bg-grid">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-btrust-accent to-btrust-accent2 flex items-center justify-center font-display font-bold text-xl">
              B
            </div>
            <span className="font-display text-2xl font-bold gradient-text">B Trust</span>
          </div>
          
          <div className="flex items-center gap-1 bg-btrust-dark/50 rounded-full p-1">
            {(['home', 'trade', 'deploy', 'portfolio'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-gradient-to-r from-btrust-accent to-btrust-accent2 text-btrust-darker' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setWalletConnected(!walletConnected)}
            className={`px-6 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 ${
              walletConnected 
                ? 'bg-btrust-green/20 text-btrust-green border border-btrust-green/30' 
                : 'btn-glow text-btrust-darker'
            }`}
          >
            <Wallet size={18} />
            {walletConnected ? '7xKp...3nMq' : 'Connect Wallet'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12">
        {activeTab === 'home' && (
          <HomePage 
            bonds={MOCK_BONDS} 
            onSelectBond={setSelectedBond}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'trade' && (
          <TradePage 
            bonds={MOCK_BONDS} 
            onSelectBond={setSelectedBond}
          />
        )}
        {activeTab === 'deploy' && <DeployPage />}
        {activeTab === 'portfolio' && (
          <PortfolioPage 
            portfolio={MOCK_PORTFOLIO}
            walletConnected={walletConnected}
          />
        )}
      </main>

      {/* Bond Detail Modal */}
      {selectedBond && (
        <BondModal bond={selectedBond} onClose={() => setSelectedBond(null)} />
      )}

      {/* Footer */}
      <footer className="border-t border-btrust-accent/10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-gray-500 text-sm">
          <p>© 2024 B Trust. Built on Solana.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-btrust-accent transition-colors">Docs</a>
            <a href="#" className="hover:text-btrust-accent transition-colors">Twitter</a>
            <a href="#" className="hover:text-btrust-accent transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Home Page Component
function HomePage({ 
  bonds, 
  onSelectBond,
  onNavigate 
}: { 
  bonds: typeof MOCK_BONDS
  onSelectBond: (bond: typeof MOCK_BONDS[0]) => void
  onNavigate: (tab: Tab) => void
}) {
  return (
    <>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-btrust-accent/10 border border-btrust-accent/20 text-btrust-accent text-sm mb-8">
          <Zap size={16} />
          <span>Live on Solana Mainnet</span>
        </div>
        
        <h1 className="font-display text-6xl md:text-7xl font-bold mb-6">
          <span className="gradient-text">On-Chain Bonds</span>
          <br />
          <span className="text-white">for the Future</span>
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
          Issue collateralized bonds, earn fixed yields, and trade seamlessly. 
          The traditional bond market, reimagined for DeFi.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={() => onNavigate('trade')}
            className="btn-glow px-8 py-4 rounded-full font-semibold text-btrust-darker flex items-center gap-2"
          >
            Start Trading <ChevronRight size={20} />
          </button>
          <button 
            onClick={() => onNavigate('deploy')}
            className="px-8 py-4 rounded-full font-semibold border border-btrust-accent/30 text-btrust-accent hover:bg-btrust-accent/10 transition-all"
          >
            Issue a Bond
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
          {[
            { label: 'Total Value Locked', value: '$12.5M' },
            { label: 'Bonds Issued', value: '47' },
            { label: 'Avg. Yield', value: '9.2%' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
              <div className="text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: 'Collateralized',
              description: 'Every bond can be backed by on-chain collateral, providing security for investors.',
            },
            {
              icon: TrendingUp,
              title: 'Real Yields',
              description: 'Earn fixed or variable yields paid directly to your wallet on a schedule.',
            },
            {
              icon: Zap,
              title: 'Instant Settlement',
              description: 'Trade bonds 24/7 with instant settlement on Solana.',
            },
          ].map((feature) => (
            <div key={feature.title} className="glass rounded-2xl p-8 bond-card">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-btrust-accent/20 to-btrust-accent2/20 flex items-center justify-center mb-6">
                <feature.icon className="text-btrust-accent" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Bonds */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold mb-2">Live Bond Offerings</h2>
            <p className="text-gray-400">Browse and invest in on-chain bonds from top protocols</p>
          </div>
          <button 
            onClick={() => onNavigate('trade')}
            className="text-btrust-accent hover:underline flex items-center gap-1"
          >
            View All <ChevronRight size={18} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500 text-sm border-b border-white/5">
                <th className="pb-4 font-medium">Bond</th>
                <th className="pb-4 font-medium">Price</th>
                <th className="pb-4 font-medium">Yield</th>
                <th className="pb-4 font-medium">Collateral</th>
                <th className="pb-4 font-medium">24h Volume</th>
                <th className="pb-4 font-medium">Maturity</th>
                <th className="pb-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {bonds.map((bond) => (
                <tr 
                  key={bond.id} 
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => onSelectBond(bond)}
                >
                  <td className="py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-btrust-dark flex items-center justify-center text-2xl">
                        {bond.image}
                      </div>
                      <div>
                        <div className="font-semibold">{bond.name}</div>
                        <div className="text-sm text-gray-500">{bond.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 font-mono">${bond.price.toLocaleString()}</td>
                  <td className="py-5">
                    <span className={`px-2 py-1 rounded text-sm ${
                      bond.yieldType === 'Fixed' 
                        ? 'bg-btrust-green/20 text-btrust-green' 
                        : 'bg-btrust-accent2/20 text-btrust-accent2'
                    }`}>
                      {bond.yield}% {bond.yieldType}
                    </span>
                  </td>
                  <td className="py-5 font-mono">
                    {(bond.collateral / 1000).toFixed(0)}K {bond.collateralToken}
                  </td>
                  <td className="py-5 font-mono">${(bond.volume24h / 1000000).toFixed(2)}M</td>
                  <td className="py-5 text-gray-400">{bond.maturity}</td>
                  <td className="py-5">
                    <button className="text-btrust-accent hover:text-white transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

// Trade Page Component
function TradePage({ 
  bonds, 
  onSelectBond 
}: { 
  bonds: typeof MOCK_BONDS
  onSelectBond: (bond: typeof MOCK_BONDS[0]) => void
}) {
  const [filter, setFilter] = useState<'all' | 'fixed' | 'variable'>('all')
  const [sortBy, setSortBy] = useState<'yield' | 'volume' | 'maturity'>('yield')

  const filteredBonds = bonds
    .filter(b => filter === 'all' || b.yieldType.toLowerCase() === filter)
    .sort((a, b) => {
      if (sortBy === 'yield') return b.yield - a.yield
      if (sortBy === 'volume') return b.volume24h - a.volume24h
      return new Date(a.maturity).getTime() - new Date(b.maturity).getTime()
    })

  return (
    <section className="max-w-7xl mx-auto px-6">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">Trade Bonds</h1>
        <p className="text-gray-400">Browse, analyze, and trade on-chain bonds</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-1 bg-btrust-dark/50 rounded-lg p-1">
          {(['all', 'fixed', 'variable'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f 
                  ? 'bg-btrust-accent text-btrust-darker' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-btrust-dark/50 border border-white/10 rounded-lg px-4 py-2 text-sm"
        >
          <option value="yield">Sort by Yield</option>
          <option value="volume">Sort by Volume</option>
          <option value="maturity">Sort by Maturity</option>
        </select>
      </div>

      {/* Bond Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBonds.map((bond) => (
          <div 
            key={bond.id}
            onClick={() => onSelectBond(bond)}
            className="glass rounded-2xl p-6 bond-card cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-btrust-dark flex items-center justify-center text-2xl">
                {bond.image}
              </div>
              <div>
                <div className="font-semibold">{bond.name}</div>
                <div className="text-sm text-gray-500">{bond.symbol}</div>
              </div>
              <span className={`ml-auto px-2 py-1 rounded text-xs ${
                bond.yieldType === 'Fixed' 
                  ? 'bg-btrust-green/20 text-btrust-green' 
                  : 'bg-btrust-accent2/20 text-btrust-accent2'
              }`}>
                {bond.yieldType}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-gray-500 text-sm">Price</div>
                <div className="font-mono font-semibold">${bond.price}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">Yield</div>
                <div className="font-mono font-semibold text-btrust-green">{bond.yield}%</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">Collateral</div>
                <div className="font-mono text-sm">{(bond.collateral / 1000).toFixed(0)}K</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">Maturity</div>
                <div className="font-mono text-sm">{bond.maturity}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="text-sm text-gray-500">
                {bond.outstanding.toLocaleString()} / {bond.totalSupply.toLocaleString()} issued
              </div>
              <div className="w-20 h-2 bg-btrust-dark rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-btrust-accent to-btrust-accent2"
                  style={{ width: `${(bond.outstanding / bond.totalSupply) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// Deploy Page Component
function DeployPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    website: '',
    twitter: '',
    principalAmount: '',
    couponRate: '',
    yieldType: 'fixed',
    paymentFrequency: 'quarterly',
    maturityDate: '',
    totalSupply: '',
    isCapped: true,
    collateralAmount: '',
    collateralToken: 'SOL',
  })

  return (
    <section className="max-w-3xl mx-auto px-6">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">Deploy a Bond</h1>
        <p className="text-gray-400">Issue on-chain bonds for your project or protocol</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-12">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= s 
                ? 'bg-gradient-to-r from-btrust-accent to-btrust-accent2 text-btrust-darker' 
                : 'bg-btrust-dark text-gray-500'
            }`}>
              {s}
            </div>
            <span className={step >= s ? 'text-white' : 'text-gray-500'}>
              {s === 1 ? 'Details' : s === 2 ? 'Terms' : 'Collateral'}
            </span>
            {s < 3 && <div className="w-12 h-0.5 bg-btrust-dark" />}
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-8">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-6">Bond Details</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Bond Name</label>
                <input
                  type="text"
                  placeholder="e.g., Jupiter Exchange Bond"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-btrust-dark border border-white/10 rounded-lg px-4 py-3 focus:border-btrust-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Symbol</label>
                <input
                  type="text"
                  placeholder="e.g., JUP-BOND"
                  value={formData.symbol}
                  onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                  className="w-full bg-btrust-dark border border-white/10 rounded-lg px-4 py-3 focus:border-btrust-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Description</label>
              <textarea
                placeholder="Describe your bond offering and how the funds will be used..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="w-full bg-btrust-dark border border-white/10 rounded-lg px-4 py-3 focus:border-btrust-accent focus:outline-none resize-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Website</label>
                <input
                  type="url"
                  placeholder="https://yourproject.com"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full bg-btrust-dark border border-white/10 rounded-lg px-4 py-3 focus:border-btrust-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Twitter</label>
                <input
                  type="text"
                  placeholder="@yourproject"
                  value={formData.twitter}
                  onChange={(e) => setFormData({...formData, twitter: e.target.value})}
                  className="w-full bg-btrust-dark border border-white/10 rounded-lg px-4 py-3 focus:border-btrust-accent focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-6">Bond Terms</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Principal Amount (USDC)</label>
                <input
                  type="number"
                  placeholder="1000"
                  value={formData.principalAmount}
                  onChange={(e) => setFormData({...formData, principalAmount: e.target.value})}
                  className="w-full bg-btrust-dark border border-white/10 rounded-lg px-4 py-3 focus:border-btrust-accent focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Face value of each bond</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Coupon Rate (%)</label>
                <input
                  type="number"
                  placeholder="8.5"
                  value={formData.couponRate}
                  onChange={(e) => setFormData({...formData, couponRate: e.target.value})}
                  className="w-full bg-btrust-dark border border-white/10 rounded-lg px-4 py-3 focus:border-btrust-accent focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Annual yield paid to holders</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Yield Type</label>
                <select
                  value={formData.yieldType}
                  onChange={(e) => setFormData({...formData, yieldType: e.target.value})}
                  className="w-full bg-btrust-dark border border-white/10 rounded-lg px-4 py-3 focus:border-btrust-accent focus:outline-none"
                >
                  <option value="fixed">Fixed Rate</option>
                  <option value="variable">Variable Rate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Payment Frequency</label>
                <select
                  value={formData.paymentFrequency}
                  onChange={(e) => setFormData({...formData, paymentFrequency: e.target.value})}
                  className="w-full bg-btrust-dark border border-white/10 rounded-lg px-4 py-3 focus:border-btrust-accent focus:outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="semiannual">Semi-Annual</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Maturity Date</label>
                <input
                  type="date"
                  value={formData.maturityDate}
                  onChange={(e) => setFormData({...formData, maturityDate: e.target.value})}
                  className="w-full bg-btrust-dark border border-white/10 rounded-lg px-4 py-3 focus:border-btrust-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Total Supply</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={formData.totalSupply}
                  onChange={(e) => setFormData({...formData, totalSupply: e.target.value})}
                  className="w-full bg-btrust-dark border border-white/10 rounded-lg px-4 py-3 focus:border-btrust-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="capped"
                checked={formData.isCapped}
                onChange={(e) => setFormData({...formData, isCapped: e.target.checked})}
                className="w-5 h-5 rounded bg-btrust-dark border border-white/10"
              />
              <label htmlFor="capped" className="text-sm">
                Capped offering (limit total bonds issued)
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-6">Collateral</h2>
            
            <div className="bg-btrust-accent/10 border border-btrust-accent/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="text-btrust-accent mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-btrust-accent">Collateral builds trust</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Bonds with collateral attract more investors. If the collateral ratio falls below 120%, 
                    the bond may be liquidated to protect investors.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Collateral Token</label>
                <select
                  value={formData.collateralToken}
                  onChange={(e) => setFormData({...formData, collateralToken: e.target.value})}
                  className="w-full bg-btrust-dark border border-white/10 rounded-lg px-4 py-3 focus:border-btrust-accent focus:outline-none"
                >
                  <option value="SOL">SOL</option>
                  <option value="USDC">USDC</option>
                  <option value="mSOL">mSOL</option>
                  <option value="JitoSOL">JitoSOL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Collateral Amount</label>
                <input
                  type="number"
                  placeholder="500"
                  value={formData.collateralAmount}
                  onChange={(e) => setFormData({...formData, collateralAmount: e.target.value})}
                  className="w-full bg-btrust-dark border border-white/10 rounded-lg px-4 py-3 focus:border-btrust-accent focus:outline-none"
                />
              </div>
            </div>

            {formData.collateralAmount && formData.principalAmount && formData.totalSupply && (
              <div className="bg-btrust-dark rounded-lg p-6">
                <h3 className="font-medium mb-4">Collateral Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Total Bond Value</div>
                    <div className="font-mono">${(Number(formData.principalAmount) * Number(formData.totalSupply)).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Collateral Value</div>
                    <div className="font-mono">{formData.collateralAmount} {formData.collateralToken}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Collateral Ratio</div>
                    <div className="font-mono text-btrust-green">~150%</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Liquidation Threshold</div>
                    <div className="font-mono text-btrust-gold">120%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="btn-glow px-8 py-3 rounded-lg font-semibold text-btrust-darker"
            >
              Continue
            </button>
          ) : (
            <button className="btn-glow px-8 py-3 rounded-lg font-semibold text-btrust-darker flex items-center gap-2">
              <Lock size={18} />
              Deploy Bond
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

// Portfolio Page Component
function PortfolioPage({ 
  portfolio, 
  walletConnected 
}: { 
  portfolio: typeof MOCK_PORTFOLIO
  walletConnected: boolean
}) {
  if (!walletConnected) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <Wallet size={64} className="mx-auto text-gray-600 mb-6" />
        <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="text-gray-400 mb-8">Connect your wallet to view your bond portfolio</p>
        <button className="btn-glow px-8 py-3 rounded-full font-semibold text-btrust-darker">
          Connect Wallet
        </button>
      </section>
    )
  }

  const totalValue = portfolio.reduce((sum, p) => sum + p.currentValue, 0)
  const totalPnl = portfolio.reduce((sum, p) => sum + p.pnl, 0)
  const totalYield = portfolio.reduce((sum, p) => sum + p.yieldEarned, 0)

  return (
    <section className="max-w-7xl mx-auto px-6">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">Portfolio</h1>
        <p className="text-gray-400">Track your bond holdings, yields, and performance</p>
      </div>

      {/* Portfolio Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Portfolio Value', value: `$${totalValue.toLocaleString()}`, icon: DollarSign },
          { label: 'Total P&L', value: `+$${totalPnl.toLocaleString()}`, icon: TrendingUp, isPositive: true },
          { label: 'Yield Earned', value: `$${totalYield.toFixed(2)}`, icon: Percent },
          { label: 'Positions', value: portfolio.length.toString(), icon: BarChart3 },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">{stat.label}</span>
              <stat.icon size={18} className="text-btrust-accent" />
            </div>
            <div className={`text-2xl font-bold font-mono ${stat.isPositive ? 'text-btrust-green' : ''}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Holdings */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6">Your Holdings</h2>
        
        <div className="space-y-4">
          {portfolio.map((position) => (
            <div key={position.bond.id} className="bg-btrust-dark rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-btrust-darker flex items-center justify-center text-2xl">
                    {position.bond.image}
                  </div>
                  <div>
                    <div className="font-semibold">{position.bond.name}</div>
                    <div className="text-sm text-gray-500">{position.quantity} bonds @ ${position.avgPrice}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold">${position.currentValue.toLocaleString()}</div>
                  <div className={`text-sm flex items-center gap-1 ${position.pnl >= 0 ? 'text-btrust-green' : 'text-btrust-red'}`}>
                    {position.pnl >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    ${Math.abs(position.pnl)} ({position.pnlPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-white/5">
                <div>
                  <div className="text-gray-500 text-xs">Yield Rate</div>
                  <div className="font-mono text-btrust-green">{position.bond.yield}%</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Yield Earned</div>
                  <div className="font-mono">${position.yieldEarned.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Maturity</div>
                  <div className="font-mono text-sm">{position.bond.maturity}</div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button className="px-4 py-2 rounded-lg bg-btrust-accent/20 text-btrust-accent text-sm hover:bg-btrust-accent/30 transition-colors">
                    Claim Yield
                  </button>
                  <button className="px-4 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition-colors">
                    Sell
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Bond Detail Modal
function BondModal({ 
  bond, 
  onClose 
}: { 
  bond: typeof MOCK_BONDS[0]
  onClose: () => void
}) {
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative glass rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-btrust-dark flex items-center justify-center text-4xl">
            {bond.image}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{bond.name}</h2>
            <div className="flex items-center gap-3 text-gray-400">
              <span>{bond.symbol}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                bond.yieldType === 'Fixed' 
                  ? 'bg-btrust-green/20 text-btrust-green' 
                  : 'bg-btrust-accent2/20 text-btrust-accent2'
              }`}>
                {bond.yieldType} Rate
              </span>
              <span>•</span>
              <span className="text-btrust-gold">{bond.rating}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-400 mb-6">{bond.description}</p>

        {/* Links */}
        <div className="flex items-center gap-4 mb-6">
          <a href={bond.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-btrust-accent hover:underline">
            <Globe size={16} /> Website <ExternalLink size={14} />
          </a>
          <a href={`https://twitter.com/${bond.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-btrust-accent hover:underline">
            <Twitter size={16} /> {bond.twitter}
          </a>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-btrust-dark rounded-lg p-4">
            <div className="text-gray-500 text-sm mb-1">Price</div>
            <div className="text-xl font-mono font-semibold">${bond.price}</div>
          </div>
          <div className="bg-btrust-dark rounded-lg p-4">
            <div className="text-gray-500 text-sm mb-1">Yield</div>
            <div className="text-xl font-mono font-semibold text-btrust-green">{bond.yield}% APY</div>
          </div>
          <div className="bg-btrust-dark rounded-lg p-4">
            <div className="text-gray-500 text-sm mb-1">Maturity</div>
            <div className="text-xl font-mono font-semibold">{bond.maturity}</div>
          </div>
        </div>

        {/* Detailed Info */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Issuer</span>
            <span>{bond.issuer}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Frequency</span>
            <span>{bond.paymentFrequency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Collateral</span>
            <span>{(bond.collateral / 1000).toFixed(0)}K {bond.collateralToken}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Min Investment</span>
            <span>${bond.minInvestment}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Outstanding</span>
            <span>{bond.outstanding.toLocaleString()} / {bond.totalSupply.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">24h Volume</span>
            <span>${(bond.volume24h / 1000000).toFixed(2)}M</span>
          </div>
        </div>

        {/* Purchase Section */}
        <div className="border-t border-white/10 pt-6">
          <h3 className="font-semibold mb-4">Purchase Bonds</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-btrust-dark border border-white/10 rounded-lg px-4 py-3 focus:border-btrust-accent focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-2">Total Cost</label>
              <div className="bg-btrust-dark border border-white/10 rounded-lg px-4 py-3 font-mono">
                ${(bond.price * quantity).toLocaleString()} USDC
              </div>
            </div>
          </div>
          <button className="w-full btn-glow mt-4 py-4 rounded-lg font-semibold text-btrust-darker">
            Buy {quantity} Bond{quantity > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

