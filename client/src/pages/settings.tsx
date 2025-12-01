import { Link } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [selectedTier, setSelectedTier] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [email, setEmail] = useState('user@example.com');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async (tier: 'pro' | 'enterprise') => {
    setIsCheckingOut(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, email }),
      });

      if (!response.ok) throw new Error('Checkout failed');
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to proceed to checkout',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const pricingTiers = [
    {
      id: 'free',
      name: 'Free',
      price: '€0',
      period: '/month',
      description: 'Perfect for testing',
      features: [
        '✅ 5 parses/month',
        '✅ File parsing (.md, .txt)',
        '❌ URL import',
        '❌ Multi-chat merge',
        '❌ Priority support',
      ],
      cta: 'Currently Using',
      color: 'bg-gray-100 text-gray-900',
      icon: 'fa-star'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '€29',
      period: '/month',
      description: 'For professional developers',
      features: [
        '✅ 500 parses/month',
        '✅ File parsing (.md, .txt)',
        '✅ URL import (ChatGPT, Grok, DeepSeek, Claude)',
        '✅ Multi-chat merge with auto tech detection',
        '✅ Priority support',
        '✅ API access',
      ],
      cta: 'Upgrade to Pro',
      color: 'bg-primary text-primary-foreground',
      recommended: true,
      icon: 'fa-rocket'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '€99',
      period: '/month',
      description: 'For agencies and companies',
      features: [
        '✅ Unlimited parses',
        '✅ File parsing (.md, .txt)',
        '✅ URL import (all sources)',
        '✅ Multi-chat merge + Advanced Analytics',
        '✅ 24/7 dedicated support',
        '✅ Full API + webhooks',
        '✅ White-label solution',
        '✅ Custom integrations',
      ],
      cta: 'Contact - Enterprise',
      color: 'bg-amber-100 text-amber-900',
      icon: 'fa-crown'
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/app" className="hover:opacity-80 transition-opacity">
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                  <i className="fas fa-arrow-left text-xl"></i>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">Pricing Plans</h1>
                  <p className="text-xs text-muted-foreground">Choose your plan</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="space-y-6">
            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="fas fa-user-circle text-primary text-xl"></i>
                Profile
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-border/50 rounded-md bg-background text-foreground focus:border-primary/50 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Current Plan</label>
                  <div className="px-3 py-2 border border-border/50 rounded-md bg-accent/50 text-foreground flex items-center gap-2">
                    <i className="fas fa-badge-check text-green-500"></i>
                    Free
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="fas fa-chart-line text-primary text-xl"></i>
                Usage
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Parses this month</span>
                    <span className="text-sm text-muted-foreground font-semibold">2 / 5</span>
                  </div>
                  <div className="w-full bg-border/30 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-blue-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Multi-chat merges</span>
                    <span className="text-sm text-muted-foreground font-semibold">0 / ∞</span>
                  </div>
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-md text-sm text-muted-foreground flex items-center gap-2">
                    <i className="fas fa-lock text-primary"></i>
                    Available in Pro plan
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="fas fa-key text-primary text-xl"></i>
                API Key
              </h2>
              <div className="space-y-3">
                <input
                  type="password"
                  value="pinpall_sk_1234567890"
                  disabled
                  className="w-full px-3 py-2 border border-border/50 rounded-md bg-background text-foreground font-mono text-sm"
                />
                <button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  <i className="fas fa-copy"></i>
                  Copy Key
                </button>
                <button className="w-full bg-destructive/10 text-destructive px-4 py-2 rounded-md hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2">
                  <i className="fas fa-rotate-right"></i>
                  Regenerate
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <i className="fas fa-credit-card text-primary"></i>
              Choose Your Plan
            </h2>
            <div className="space-y-4">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`rounded-lg border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
                    selectedTier === tier.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:border-primary/50 bg-card/50 backdrop-blur-sm'
                  } ${tier.recommended ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedTier(tier.id as any)}
                >
                  {tier.recommended && (
                    <div className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium mb-3">
                      <i className="fas fa-fire"></i>
                      Most Popular
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <i className={`fas ${tier.icon} text-2xl text-primary`}></i>
                        <h3 className="text-lg font-semibold">{tier.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{tier.price}</div>
                      <div className="text-xs text-muted-foreground">{tier.period}</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 pt-4 border-t border-border/30">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="text-sm text-foreground flex items-center gap-2">
                        <i className={`fas ${feature.includes('✅') ? 'fa-check text-green-600' : 'fa-times text-muted-foreground'} text-xs`}></i>
                        {feature.replace('✅', '').replace('❌', '').trim()}
                      </div>
                    ))}
                  </div>

                  <button
                    className={`w-full px-4 py-2 rounded-md transition-colors font-semibold flex items-center justify-center gap-2 ${
                      tier.id === 'free'
                        ? 'bg-gray-300 text-gray-800 cursor-default'
                        : tier.recommended
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    } disabled:opacity-50`}
                    disabled={tier.id === 'free' || isCheckingOut}
                    onClick={() => handleCheckout(tier.id as 'pro' | 'enterprise')}
                  >
                    {isCheckingOut ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Processing...
                      </>
                    ) : tier.id === 'free' ? (
                      <>
                        <i className="fas fa-check"></i>
                        {tier.cta}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-arrow-right"></i>
                        {tier.cta}
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-blue-600/10 border border-primary/20 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2 flex items-center gap-2">
                <i className="fas fa-lightbulb text-primary"></i>
                Need something custom?
              </p>
              <p className="text-muted-foreground mb-3">
                Contact our sales team to discuss custom solutions for your organization.
              </p>
              <button className="text-primary font-medium hover:underline flex items-center gap-1">
                <i className="fas fa-envelope"></i>
                Send us a message →
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>© 2024 PINpall - Builder</span>
            <Link href="/app" className="hover:text-primary transition-colors flex items-center gap-1">
              <i className="fas fa-arrow-left"></i>
              Back to App
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
