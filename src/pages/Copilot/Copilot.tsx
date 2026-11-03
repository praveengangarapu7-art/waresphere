import React, { useState, useEffect } from 'react'
import { Send, Bot, Sparkles, Database, Brain, CheckCircle2, User } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { handleCopilotQuery, CopilotQueryResult } from '../../services/warehouseCopilotService'
import { warehouseService } from '../../services/warehouseService'
import { inventoryService } from '../../services/inventoryService'
import styles from './Copilot.module.css'

const SUGGESTED_QUESTIONS = [
  'Where is batch BAT-10001?',
  'Which products are expiring?',
  'What needs replenishment?',
  'What is out of stock?',
  'What should we pick first?',
  'Which cold storage zones have risks?',
]

export const Copilot: React.FC = () => {
  const [question, setQuestion] = useState('')
  const [lastAskedQuestion, setLastAskedQuestion] = useState('')
  const [result, setResult] = useState<CopilotQueryResult | null>(null)

  // Real, already-existing services (not invented) — purely for the
  // ambient "reasoning across N warehouses / M SKUs" context line. This
  // does not feed handleCopilotQuery in any way; that service continues to
  // read its own data independently, exactly as before.
  const [warehouseCount, setWarehouseCount] = useState<number | null>(null)
  const [skuCount, setSkuCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchContext = async () => {
      const [warehouses, skus] = await Promise.all([
        warehouseService.getWarehouses(),
        inventoryService.getSKUs()
      ])
      setWarehouseCount(warehouses.length)
      setSkuCount(skus.length)
    }
    fetchContext()
  }, [])

  const ask = (q: string) => {
    if (!q.trim()) return
    setLastAskedQuestion(q)
    setResult(handleCopilotQuery(q))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    ask(question)
  }

  const handleSuggestionClick = (q: string) => {
    setQuestion(q)
    ask(q)
  }

  return (
    <div className={styles.container}>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.iconBadge}>
          <Bot size={26} />
        </div>
        <span className={styles.eyebrow}>Intelligence Layer</span>
        <h1 className={styles.heroTitle}>Ask WareSphere AI anything.</h1>
        <p className={styles.heroSubtitle}>
          Questions about inventory, batches, expiry, replenishment, FEFO picking order,
          inbound/outbound priorities, and cold storage — answered directly from live warehouse data.
        </p>
        <div className={styles.contextLine}>
          <span className={styles.contextDot} />
          {warehouseCount !== null && skuCount !== null
            ? `Reasoning across ${warehouseCount} warehouses · ${skuCount} tracked SKUs`
            : 'Connecting to warehouse network…'}
        </div>
      </div>

      {/* ── Ask bar ────────────────────────────────────────────────────── */}
      <form className={styles.askBar} onSubmit={handleSubmit}>
        <Sparkles size={18} className={styles.askIcon} />
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder='Ask a warehouse question, e.g. "Where is batch BAT-10001?"'
          className={styles.input}
        />
        <button type="submit" className={styles.askButton}>
          <Send size={15} />
          Ask
        </button>
      </form>

      <div className={styles.suggestions}>
        {SUGGESTED_QUESTIONS.map(q => (
          <button
            key={q}
            type="button"
            className={styles.suggestionChip}
            onClick={() => handleSuggestionClick(q)}
          >
            {q}
          </button>
        ))}
      </div>

      {/* ── Conversation / response area ──────────────────────────────── */}
      {result ? (
        <div className={styles.exchange}>
          <div className={styles.questionRow}>
            <div className={styles.questionIcon}>
              <User size={14} />
            </div>
            <p className={styles.questionText}>{lastAskedQuestion}</p>
          </div>

          <div className={`${styles.responseCard} ${result.success ? styles.responseSuccess : styles.responseMuted}`}>
            <div className={styles.responseHeader}>
              <div className={styles.responseIcon}>
                <Bot size={16} />
              </div>
              <span className={styles.responseLabel}>WareSphere AI</span>
              <Badge variant={result.success ? 'success' : 'warning'}>
                {result.success ? 'Answered' : result.intent === 'unsupported' ? 'Unsupported' : 'No Result'}
              </Badge>
            </div>
            <p className={styles.responseMessage}>{result.message}</p>
          </div>
        </div>
      ) : (
        <div className={styles.pipeline}>
          <div className={styles.pipelineStep}>
            <div className={styles.pipelineIcon}><Database size={16} /></div>
            <span>Warehouse Data</span>
          </div>
          <div className={styles.pipelineConnector} />
          <div className={styles.pipelineStep}>
            <div className={styles.pipelineIcon}><Brain size={16} /></div>
            <span>AI Reasoning</span>
          </div>
          <div className={styles.pipelineConnector} />
          <div className={styles.pipelineStep}>
            <div className={styles.pipelineIcon}><CheckCircle2 size={16} /></div>
            <span>Operational Answer</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Copilot
