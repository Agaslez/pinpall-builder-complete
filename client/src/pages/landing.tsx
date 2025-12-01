import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <i className="fas fa-code text-xl"></i>
              </div>
              <span className="text-xl font-bold">PINpall</span>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/app">
                <button className="text-foreground hover:text-primary transition-colors">
                  App
                </button>
              </Link>
              <Link href="/settings">
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                  Pricing
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">
              <i className="fas fa-arrows-rotate mr-3 text-primary"></i>Convert AI chat into a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                complete project
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Paste a transcript from ChatGPT, Grok, DeepSeek or Claude.
              Get a 1:1 project structure with code, folders and a ready ZIP download.
            </p>
          </div>

          <div className="flex justify-center gap-4 pt-8">
            <Link href="/app">
              <button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg hover:bg-primary/90 transition-colors text-lg font-semibold flex items-center gap-2">
                <i className="fas fa-rocket"></i>
                Get Started Now
              </button>
            </Link>
            <button className="border-2 border-primary text-primary px-8 py-4 rounded-lg hover:bg-primary/10 transition-colors text-lg font-semibold flex items-center gap-2">
              <i className="fas fa-play"></i>
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold flex items-center gap-2"><i className="fas fa-circle-xmark text-destructive"></i>The Problem</h2>
            <ul className="space-y-3 text-lg text-muted-foreground">
              <li><i className="fas fa-hourglass-end text-amber-500 mr-2"></i>You spend 2-4 hours copying code from ChatGPT</li>
              <li><i className="fas fa-folder text-blue-500 mr-2"></i>Manually organizing files in folders</li>
              <li><i className="fas fa-circle-question text-yellow-500 mr-2"></i>You don't know if all files are there</li>
              <li><i className="fas fa-triangle-exclamation text-orange-500 mr-2"></i>Code doesn't run without fixes</li>
              <li><i className="fas fa-face-frown text-red-500 mr-2"></i>Frustrating and error-prone</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold flex items-center gap-2"><i className="fas fa-circle-check text-green-500"></i>The Solution</h2>
            <ul className="space-y-3 text-lg text-muted-foreground">
              <li><i className="fas fa-bolt text-yellow-500 mr-2"></i>30 seconds - paste, parse, download</li>
              <li><i className="fas fa-bullseye text-primary mr-2"></i>Automatic folder structure</li>
              <li><i className="fas fa-magnifying-glass text-blue-500 mr-2"></i>Report of missing files</li>
              <li><i className="fas fa-check text-green-500 mr-2"></i>Code ready to run</li>
              <li><i className="fas fa-rocket text-primary mr-2"></i>Save hours per project</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-card/50 rounded-2xl my-12 border border-border">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { num: "1", icon: "fa-copy", title: "Copy Chat", desc: "Export transcript as JSON or paste a link" },
            { num: "2", icon: "fa-brain", title: "AI Parses", desc: "System analyzes structure and identifies files" },
            { num: "3", icon: "fa-folder-tree", title: "Build Tree", desc: "Automatically organizes folders and files" },
            { num: "4", icon: "fa-download", title: "Download ZIP", desc: "Ready project - extract and run" },
          ].map((step) => (
            <div key={step.num} className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                {step.num}
              </div>
              <i className={`fas ${step.icon} text-3xl text-primary`}></i>
              <h3 className="font-semibold text-lg">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 flex items-center justify-center gap-2"><i className="fas fa-wand-magic-sparkles text-primary"></i>Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "fa-file-code", title: "Multi-format", desc: "Supports: ChatGPT, Grok, DeepSeek, Claude" },
            { icon: "fa-code-branch", title: "Merge Projects", desc: "Merge multiple chats into one project" },
            { icon: "fa-search", title: "Tech Detection", desc: "Auto-detects project type (React, Node, Python)" },
            { icon: "fa-warning", title: "Unrecognized Elements", desc: "Report on code that doesn't fit" },
            { icon: "fa-edit", title: "Edit Panel", desc: "Edit files directly in the app" },
            { icon: "fa-api", title: "API Access (Pro)", desc: "Integrate with your app via REST API" },
          ].map((feature, idx) => (
            <div key={idx} className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors">
              <i className={`fas ${feature.icon} text-3xl text-primary mb-3`}></i>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 flex items-center justify-center gap-2"><i className="fas fa-coins text-primary"></i>Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Free", price: "€0", limit: "5 parses/month", color: "border-border" },
            { name: "Pro", price: "€29", limit: "500 parses/month + API", color: "border-primary ring-2 ring-primary", recommended: true },
            { name: "Enterprise", price: "€99", limit: "Unlimited + White-label", color: "border-border" },
          ].map((plan, idx) => (
            <div key={idx} className={`border-2 ${plan.color} rounded-lg p-8 text-center space-y-4 ${plan.recommended ? "bg-primary/5" : ""}`}>
              {plan.recommended && (
                <div className="text-xs font-semibold text-primary flex items-center justify-center gap-1"><i className="fas fa-star"></i>MOST POPULAR</div>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="text-3xl font-bold">{plan.price}</div>
              <div className="text-sm text-muted-foreground">{plan.limit}</div>
              <button className={`w-full py-2 rounded-lg transition-colors font-semibold ${
                plan.recommended 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-accent hover:bg-accent/80"
              }`}>
                Choose
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Coming Soon */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 flex items-center justify-center gap-2"><i className="fas fa-wand-magic-sparkles text-primary"></i>Coming Soon</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: "fa-brain", label: "AI Assistant - help with code that AI didn't generate" },
            { icon: "fa-box", label: "Package.json auto-fixer - install missing dependencies" },
            { icon: "fa-link", label: "Multi-chat merge - merge multiple chats into one project" },
            { icon: "fa-chart-line", label: "Analytics - see what works and what doesn't" },
            { icon: "fa-floppy-disk", label: "Version History - track all project versions" },
            { icon: "fa-robot", label: "Smart Suggestions - AI suggests how to fill missing files" },
          ].map((feature, idx) => (
            <div key={idx} className="bg-card rounded-lg border border-border/50 p-4 hover:border-primary/50 transition-colors flex items-center gap-3">
              <i className={`fas ${feature.icon} text-primary text-xl flex-shrink-0`}></i>
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to save 10+ hours per project?</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Start for free. No credit card, no strings attached.
        </p>
        <Link href="/app">
          <button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg hover:bg-primary/90 transition-colors text-lg font-semibold flex items-center justify-center gap-2">
            <i className="fas fa-rocket"></i>
            Launch Now
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 PINpall - Convert AI chats to projects. Fast. Easy. Now.</p>
        </div>
      </footer>
    </div>
  );
}
