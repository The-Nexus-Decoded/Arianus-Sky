import { useState } from 'react'

interface Template {
  id: number
  name: string
  description: string
  category: string
  framework: string
  color: string
  stars: string
}

const templates: Template[] = [
  { id: 1, name: 'shadcn/ui', description: 'Beautiful, accessible components built with Radix UI and Tailwind', category: 'Components', framework: 'React', color: '#000000', stars: '95k' },
  { id: 2, name: 'Tailwind UI', description: 'Professionally designed, fully responsive UI components', category: 'Components', framework: 'React', color: '#06b6d4', stars: '78k' },
  { id: 3, name: 'Material UI', description: 'The most popular React UI framework in the world', category: 'Components', framework: 'React', color: '#007fff', stars: '95k' },
  { id: 4, name: 'Radix UI', description: 'Unstyled, accessible components for building high-quality design systems', category: 'Components', framework: 'React', color: '#d946ef', stars: '28k' },
  { id: 5, name: 'DaisyUI', description: 'The most popular, free and open-source Tailwind CSS component library', category: 'Components', framework: 'Tailwind', color: '#ff6b6b', stars: '24k' },
  { id: 6, name: 'Chakra UI', description: 'Simple, modular and accessible component library', category: 'Components', framework: 'React', color: '#5bc0a7', stars: '35k' },
  { id: 7, name: 'Next.js Templates', description: 'Official starter templates for Next.js applications', category: 'Framework', framework: 'Next.js', color: '#ffffff', stars: '120k' },
  { id: 8, name: 'Vercel Templates', description: 'Production-ready templates deployed on Vercel', category: 'Full Stack', framework: 'Next.js', color: '#000000', stars: '50k' },
  { id: 9, name: 'Headless UI', description: 'Completely unstyled, accessible UI components', category: 'Components', framework: 'React', color: '#3b82f6', stars: '32k' },
  { id: 10, name: 'React Bootstrap', description: 'The most popular front-end framework rebuilt for React', category: 'Components', framework: 'React', color: '#7952b3', stars: '22k' },
  { id: 11, name: 'Ant Design', description: 'A design system for enterprise-level products', category: 'Components', framework: 'React', color: '#1890ff', stars: '90k' },
  { id: 12, name: 'Blueprint JS', description: 'A React-based UI toolkit for the web', category: 'Components', framework: 'React', color: '#2c72e6', stars: '21k' },
  { id: 13, name: 'Mantine', description: 'A modern React component library', category: 'Components', framework: 'React', color: '#339af0', stars: '25k' },
  { id: 14, name: 'Arco Design', description: 'A comprehensive React component library by ByteDance', category: 'Components', framework: 'React', color: '#165dff', stars: '21k' },
  { id: 15, name: 'NextUI', description: "Beautiful, fast and modern React UI library", category: 'Components', framework: 'React', color: '#000000', stars: '20k' },
]

const categories = ['All', 'Components', 'Framework', 'Full Stack']
const frameworks = ['All', 'React', 'Next.js', 'Tailwind']

function App() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedFramework, setSelectedFramework] = useState('All')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [search, setSearch] = useState('')

  const filtered = templates.filter(t => {
    const matchCategory = selectedCategory === 'All' || t.category === selectedCategory
    const matchFramework = selectedFramework === 'All' || t.framework === selectedFramework
    const matchSearch = search === '' || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchFramework && matchSearch
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Design Templates</h1>
          <span className="text-zinc-500 text-sm">POC v0.1</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 tracking-tight">Popular Design Templates</h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-8">
            Browse the most used design templates and UI kits by development teams worldwide
          </p>
          {/* Search */}
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-5 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-12 justify-center">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {frameworks.map(fw => (
              <button
                key={fw}
                onClick={() => setSelectedFramework(fw)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedFramework === fw
                    ? 'bg-cyan-500 text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {fw}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(template => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="group bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-left hover:border-zinc-700 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: template.color + '20', color: template.color }}
                >
                  {template.name.charAt(0)}
                </div>
                <span className="text-zinc-500 text-sm">⭐ {template.stars}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                {template.name}
              </h3>
              <p className="text-zinc-400 text-sm line-clamp-2">{template.description}</p>
              <div className="flex gap-2 mt-4">
                <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">{template.category}</span>
                <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">{template.framework}</span>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-zinc-500 py-12">No templates match your filters</p>
        )}
      </main>

      {/* Modal */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTemplate(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: selectedTemplate.color + '20', color: selectedTemplate.color }}
                >
                  {selectedTemplate.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedTemplate.name}</h3>
                  <span className="text-zinc-500 text-sm">⭐ {selectedTemplate.stars} stars</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-zinc-300 mb-6">{selectedTemplate.description}</p>
            <div className="flex gap-2 mb-6">
              <span className="px-3 py-1.5 bg-zinc-800 rounded-lg text-sm">{selectedTemplate.category}</span>
              <span className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm">{selectedTemplate.framework}</span>
            </div>
            <button className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors">
              View Details →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
