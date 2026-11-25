import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #FECACA',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.08)',
            padding: '32px',
            maxWidth: '540px',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 16px'
            }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
              Component Render Notice
            </h3>
            <p style={{ margin: '0 0 16px', color: '#64748B', fontSize: '13.5px', lineHeight: '1.5' }}>
              An unexpected display issue occurred in this section. The campus platform recovered gracefully to keep your session secure.
            </p>
            {this.state.error?.message && (
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#DC2626',
                textAlign: 'left',
                marginBottom: '20px',
                overflowX: 'auto'
              }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-rotate-right" style={{ marginRight: '8px' }}></i> Reload View
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
