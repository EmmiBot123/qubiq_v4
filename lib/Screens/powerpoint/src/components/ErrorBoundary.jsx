import React, { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', background: '#450a0a', color: 'white', height: '100vh', width: '100vw' }}>
                    <h1>Something went wrong.</h1>
                    <pre>{this.state.error && this.state.error.toString()}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
