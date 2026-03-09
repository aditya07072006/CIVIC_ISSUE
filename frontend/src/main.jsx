import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:'2rem',color:'#f87171',fontFamily:'monospace',background:'#050b14',minHeight:'100vh'}}>
          <h2 style={{marginBottom:'1rem'}}>⚠ App crashed — error details:</h2>
          <pre style={{whiteSpace:'pre-wrap',fontSize:'13px'}}>{String(this.state.error)}</pre>
          <pre style={{whiteSpace:'pre-wrap',fontSize:'11px',color:'#94a3b8',marginTop:'1rem'}}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
