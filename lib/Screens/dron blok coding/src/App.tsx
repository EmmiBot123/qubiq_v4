import { useState, useCallback, useRef, useEffect } from 'react';
import BlocklyWorkspace from './components/BlocklyWorkspace';
import type { BlocklyWorkspaceHandle } from './components/BlocklyWorkspace';
import Simulator from './components/Simulator';
import { Play, Square, Save, Trash2, Settings, GripVertical, Maximize2, X, Cable, RotateCcw, RotateCw, FolderOpen, FilePlus, Usb } from 'lucide-react';
import { serialService } from './services/SerialService';
import './App.css';

const App = () => {
  const [code, setCode] = useState('');
  const [droneState, setDroneState] = useState<{
    position: [number, number, number];
    rotation: [number, number, number];
    ledColor: string;
    ledIntensity: number;
  }>({
    position: [0, 70, 0],
    rotation: [0, 0, 0],
    ledColor: '#00ff00',
    ledIntensity: 1,
  });
  const [flightPath, setFlightPath] = useState<[number, number, number][]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenTip, setShowFullscreenTip] = useState(false);
  // EMMI BOT Style Variables
  const [isConnected, setIsConnected] = useState(false);
  const [board, setBoard] = useState('MRTnode');
  const [projectName, setProjectName] = useState('My Drone Project');
  const [editorWidth, setEditorWidth] = useState(600);
  const [consoleHeight, setConsoleHeight] = useState(250);
  const isResizing = useRef(false);
  const isResizingConsole = useRef(false);
  const executionRef = useRef(false);
  const workspaceRef = useRef<BlocklyWorkspaceHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const simulatorSectionRef = useRef<HTMLDivElement>(null);

  // Load saved workspace on mount
  useEffect(() => {
    const savedXml = localStorage.getItem('blockly-drone-workspace');
    if (savedXml && workspaceRef.current) {
      // Wait a bit for Blockly to be ready
      setTimeout(() => workspaceRef.current?.loadWorkspaceXml(savedXml), 100);
    }
  }, []);

  const handleSave = () => {
    if (workspaceRef.current) {
      const xml = workspaceRef.current.getWorkspaceXml();
      // Save to localStorage as backup
      localStorage.setItem('blockly-drone-workspace', xml);

      // Also trigger a file download
      const blob = new Blob([xml], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName || 'drone_project'}.bloc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleFileOpen = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const xml = event.target?.result as string;
      if (xml && workspaceRef.current) {
        workspaceRef.current.loadWorkspaceXml(xml);
        // Also update project name from filename
        setProjectName(file.name.replace(/\.(xml|bloc)$/, ''));
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be opened again
    e.target.value = '';
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to clear the entire workspace?')) {
      stopCode();
      workspaceRef.current?.clearWorkspace();
      // Reset project name
      setProjectName('My Drone Project');
      // Reset drone state and flight path
      setDroneState({ position: [0, 70, 0], rotation: [0, 0, 0], ledColor: '#00ff00', ledIntensity: 1 });
      setFlightPath([[0, 70, 0]]);
    }
  };

  const handleUndo = () => {
    workspaceRef.current?.undo();
  };

  const handleRedo = () => {
    workspaceRef.current?.redo();
  };

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    isResizingConsole.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const startResizingConsole = useCallback(() => {
    isResizingConsole.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const resize = useCallback((e: MouseEvent | TouchEvent) => {
    if (isResizing.current || isResizingConsole.current) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      window.requestAnimationFrame(() => {
        if (isResizing.current) {
          if (window.innerWidth <= 768) {
            // Vertical resize on mobile
            const newHeight = clientY - 48; // Subtract header height
            if (newHeight > 100 && newHeight < window.innerHeight - 100) {
              setEditorWidth(newHeight); // Reusing state for mobile height
            }
          } else {
            // Horizontal resize on desktop
            const newWidth = clientX;
            if (newWidth > 300 && newWidth < window.innerWidth - 300) {
              setEditorWidth(newWidth);
            }
          }
        } else if (isResizingConsole.current) {
          const newHeight = window.innerHeight - clientY;
          if (newHeight > 100 && newHeight < window.innerHeight - 200) {
            setConsoleHeight(newHeight);
          }
        }
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    window.addEventListener('touchmove', resize);
    window.addEventListener('touchend', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', resize);
      window.removeEventListener('touchend', stopResizing);
    };
  }, [resize, stopResizing]);

  const handleConnect = async () => {
    if (isConnected) {
      await serialService.disconnect();
      setIsConnected(false);
    } else {
      const success = await serialService.connect();
      if (success) {
        setIsConnected(true);
      }
    }
  };

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      simulatorSectionRef.current?.requestFullscreen();
      setIsFullscreen(true);
      setShowFullscreenTip(true);
      setTimeout(() => setShowFullscreenTip(false), 3000);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const runCode = async () => {
    if (isExecuting) return;

    // Safety check - if no code, don't run
    if (!code.trim() || code.trim() === '') {
      alert('Please add some blocks first!');
      return;
    }

    setIsExecuting(true);
    executionRef.current = true;

    // Reset drone
    setDroneState({ position: [0, 70, 0], rotation: [0, 0, 0], ledColor: '#00ff00', ledIntensity: 1 });
    setFlightPath([[0, 70, 0]]);


    let currentPos: [number, number, number] = [0, 70, 0];
    let currentRot: [number, number, number] = [0, 0, 0];

    const updateState = () => {
      if (!executionRef.current) return;
      setDroneState(prev => ({
        ...prev,
        position: [...currentPos],
        rotation: [...currentRot],
      }));
      setFlightPath(prev => [...prev, [...currentPos]]);
    };

    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    const api = {
      takeoff: async () => {
        if (!executionRef.current) return;
        currentPos[1] = 100;
        updateState();
        if (isConnected) await serialService.send('takeoff');
        await wait(1000);
      },
      land: async () => {
        if (!executionRef.current) return;
        currentPos[1] = 0;
        updateState();
        if (isConnected) await serialService.send('land');
        await wait(1000);
      },
      moveForward: async (d: number) => {
        if (!executionRef.current) return;
        currentPos[2] += d * Math.cos(currentRot[1]);
        currentPos[0] += d * Math.sin(currentRot[1]);
        updateState();
        if (isConnected) await serialService.send(`forward ${d}`);
        await wait(800);
      },
      moveBackward: async (d: number) => {
        if (!executionRef.current) return;
        currentPos[2] -= d * Math.cos(currentRot[1]);
        currentPos[0] -= d * Math.sin(currentRot[1]);
        updateState();
        if (isConnected) await serialService.send(`back ${d}`);
        await wait(800);
      },
      moveLeft: async (d: number) => {
        if (!executionRef.current) return;
        currentPos[0] -= d * Math.cos(currentRot[1]);
        currentPos[2] += d * Math.sin(currentRot[1]);
        updateState();
        if (isConnected) await serialService.send(`left ${d}`);
        await wait(800);
      },
      moveRight: async (d: number) => {
        if (!executionRef.current) return;
        currentPos[0] += d * Math.cos(currentRot[1]);
        currentPos[2] -= d * Math.sin(currentRot[1]);
        updateState();
        if (isConnected) await serialService.send(`right ${d}`);
        await wait(800);
      },
      rotateLeft: async (deg: number) => {
        if (!executionRef.current) return;
        currentRot[1] += (deg * Math.PI) / 180;
        updateState();
        if (isConnected) await serialService.send(`cw ${deg}`); // Using cw/ccw for rotation
        await wait(800);
      },
      rotateRight: async (deg: number) => {
        if (!executionRef.current) return;
        currentRot[1] -= (deg * Math.PI) / 180;
        updateState();
        if (isConnected) await serialService.send(`ccw ${deg}`);
        await wait(800);
      },
      setAltitude: async (alt: number) => {
        if (!executionRef.current) return;
        currentPos[1] = alt;
        updateState();
        if (isConnected) await serialService.send(`up ${alt}`);
        await wait(800);
      },
      setSpeed: async (s: number) => {
        if (!executionRef.current) return;
        console.log('Speed set to:', s);
        if (isConnected) await serialService.send(`speed ${s}`);
        await wait(100);
      },
      delay: async (s: number) => {
        if (!executionRef.current) return;
        await wait(s * 1000);
      },
      flipForward: async () => {
        if (!executionRef.current) return;
        // Simulate flip animation in 3D
        currentRot[0] += Math.PI * 2;
        updateState();
        if (isConnected) await serialService.send('flip f');
        await wait(1000);
        currentRot[0] -= Math.PI * 2; // Reset for logic, but visually it did a 360
      },
      flipBackward: async () => {
        if (!executionRef.current) return;
        currentRot[0] -= Math.PI * 2;
        updateState();
        if (isConnected) await serialService.send('flip b');
        await wait(1000);
        currentRot[0] += Math.PI * 2;
      },
      flipLeft: async () => {
        if (!executionRef.current) return;
        currentRot[2] -= Math.PI * 2;
        updateState();
        if (isConnected) await serialService.send('flip l');
        await wait(1000);
        currentRot[2] += Math.PI * 2;
      },
      flipRight: async () => {
        if (!executionRef.current) return;
        currentRot[2] += Math.PI * 2;
        updateState();
        if (isConnected) await serialService.send('flip r');
        await wait(1000);
        currentRot[2] -= Math.PI * 2;
      },
      circleLeft: async (radius: number, angle: number) => {
        if (!executionRef.current) return;
        const steps = 36;
        const angleStep = (angle * Math.PI) / 180 / steps;
        for (let i = 0; i < steps; i++) {
          if (!executionRef.current) break;
          currentRot[1] += angleStep;
          currentPos[0] -= (radius / steps) * Math.sin(currentRot[1]);
          currentPos[2] += (radius / steps) * Math.cos(currentRot[1]);
          updateState();
          await wait(50);
        }
        if (isConnected) await serialService.send(`circle left ${radius} ${angle}`);
      },
      circleRight: async (radius: number, angle: number) => {
        if (!executionRef.current) return;
        const steps = 36;
        const angleStep = (angle * Math.PI) / 180 / steps;
        for (let i = 0; i < steps; i++) {
          if (!executionRef.current) break;
          currentRot[1] -= angleStep;
          currentPos[0] += (radius / steps) * Math.sin(currentRot[1]);
          currentPos[2] -= (radius / steps) * Math.cos(currentRot[1]);
          updateState();
          await wait(50);
        }
        if (isConnected) await serialService.send(`circle right ${radius} ${angle}`);
      },
      goTo: async (x: number, y: number, z: number) => {
        if (!executionRef.current) return;
        currentPos[0] = x;
        currentPos[1] = z; // Using Z for altitude in coordinate system usually
        currentPos[2] = y;
        updateState();
        if (isConnected) await serialService.send(`goto ${x} ${y} ${z}`);
        await wait(1000);
      },
      setLedColor: async (color: string) => {
        if (!executionRef.current) return;
        setDroneState(prev => ({ ...prev, ledColor: color }));
        if (isConnected) await serialService.send(`led color ${color}`);
        await wait(100);
      },
      spiralUp: async (radius: number, height: number) => {
        if (!executionRef.current) return;
        const steps = 72;
        const angleStep = (Math.PI * 4) / steps; // 2 full circles
        const heightStep = height / steps;
        for (let i = 0; i < steps; i++) {
          if (!executionRef.current) break;
          currentRot[1] += angleStep;
          currentPos[0] -= (radius / steps) * Math.sin(currentRot[1]);
          currentPos[2] += (radius / steps) * Math.cos(currentRot[1]);
          currentPos[1] += heightStep;
          updateState();
          await wait(50);
        }
        if (isConnected) await serialService.send(`spiral up ${radius} ${height}`);
      },
      emergencyStop: async () => {
        executionRef.current = false;
        setIsExecuting(false);
        setDroneState(prev => ({ ...prev, ledColor: '#ff0000', ledIntensity: 2 }));
        if (isConnected) await serialService.send('emergency');
        alert('EMERGENCY STOP TRIGGERED');
      }
    };

    try {
      const argNames = Object.keys(api);
      const argValues = Object.values(api);
      const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
      const runner = new AsyncFunction(...argNames, code);
      await runner(...argValues);
    } catch (e) {
      console.error('Drone Execution Error:', e);
    }

    setIsExecuting(false);
    executionRef.current = false;
    console.log('Execution finished.');
  };

  const stopCode = () => {
    setIsExecuting(false);
    executionRef.current = false;
  };

  return (
    <div className="app-container">
      <header className="app-header emmi-header">
        <div className="header-left">
          <div className="emmi-logo">
            <img src="/media/icon.png" alt="Drone" className="mini-logo" style={{ height: '32px', marginRight: '8px' }} />
            <span className="logo-text">AER<RotateCw size={14} className="spinning-o" /> <span>BL<RotateCw size={14} className="spinning-o" />CK</span></span>
          </div>

          <input
            className="emmi-input project-input"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name"
          />

          <button className="btn btn-tool" onClick={handleSave} title="Save Workspace"><Save size={18} /></button>
          <button className="btn btn-tool" onClick={handleDelete} title="New Workspace"><FilePlus size={18} /></button>
          <button className="btn btn-tool" onClick={handleFileOpen} title="Open Workspace">
            <FolderOpen size={18} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".xml,.bloc"
            onChange={onFileChange}
          />

          <button className="btn btn-tool" onClick={handleUndo} title="Undo"><RotateCcw size={18} /></button>
          <button className="btn btn-tool" onClick={handleRedo} title="Redo"><RotateCw size={18} /></button>

          <select className="emmi-select board-select" value={board} onChange={(e) => setBoard(e.target.value)}>
            <option value="MRTnode">AEROBLOCK V2</option>
            <option value="MRTnodev1">AEROBLOCK V1</option>
          </select>

          <button
            className={`btn ${isConnected ? 'btn-danger' : 'btn-secondary'}`}
            onClick={handleConnect}
          >
            {isConnected ? <Cable size={18} /> : <Usb size={18} />}
            {isConnected ? 'Disconnect' : 'Connect Drone'}
          </button>

          <button className="btn btn-action primary run-btn" onClick={runCode} title="Run Drone">
            <Play size={20} fill="currentColor" />
            <span className="btn-text">RUN</span>
          </button>
        </div>

        <div className="header-right">
          <button className="btn btn-tool"><Settings size={18} /></button>
        </div>
      </header>

      <main className="app-content">
        <div
          className="editor-section"
          style={{
            width: window.innerWidth > 768 ? editorWidth : '100%',
            height: window.innerWidth <= 768 ? editorWidth : 'auto',
            flex: 'none'
          }}
        >
          <div className="section-header">
            <h2>Blocks</h2>
            <div className="editor-controls">
              <button className="btn btn-icon" onClick={handleDelete} title="Delete All"><Trash2 size={18} /></button>
              <button className="btn btn-icon" onClick={handleSave} title="Save Workspace"><Save size={18} /></button>
              {isExecuting ? (
                <button className="btn btn-danger" onClick={stopCode}><Square size={18} /> Stop</button>
              ) : (
                <button className="btn btn-primary" onClick={runCode}><Play size={18} /> Run</button>
              )}
            </div>
          </div>
          <div className="blockly-wrapper">
            <BlocklyWorkspace ref={workspaceRef} onCodeChange={handleCodeChange} />
          </div>
        </div>

        <div className="resize-handle" onMouseDown={startResizing} onTouchStart={startResizing}>
          <div className="resize-handle-line"></div>
          <div className="resize-handle-icon"><GripVertical size={14} /></div>
        </div>

        <div className={`simulator-section ${isFullscreen ? 'is-fullscreen' : ''}`} ref={simulatorSectionRef}>
          <div className="section-header">
            <h2>Simulator</h2>
            <div className="telemetry-compact">
              <span>H: {Math.round(droneState.position[1])}cm</span>
              <span>X: {Math.round(droneState.position[0])}</span>
              <span>Y: {Math.round(droneState.position[2])}</span>
            </div>
            <div className="header-controls">
              <button className="btn btn-icon" onClick={toggleFullscreen} title="Full Screen">
                {isFullscreen ? <X size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>

          <div className="simulator-wrapper">
            <Simulator
              droneState={droneState}
              flightPath={flightPath}
              containerWidth={editorWidth}
              containerHeight={consoleHeight}
            />
          </div>

          {isFullscreen && (
            <div className="fullscreen-overlay">
              {showFullscreenTip && (
                <div className="fullscreen-tip">Press ESC to exit full screen</div>
              )}
              <div className="fullscreen-controls bottom-center">
                {isExecuting ? (
                  <button className="btn-action danger large" onClick={stopCode} title="Stop">
                    <Square size={24} fill="currentColor" />
                    <span>STOP DRONE</span>
                  </button>
                ) : (
                  <button className="btn-action primary large" onClick={runCode} title="Run Drone">
                    <Play size={24} fill="currentColor" />
                    <span>RUN DRONE</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {!isFullscreen && (
            <>
              <div className="console-resize-handle" onMouseDown={startResizingConsole} onTouchStart={startResizingConsole}>
                <div className="console-resize-line"></div>
              </div>

              <div className="console-section" style={{ height: consoleHeight, flex: 'none' }}>
                <div className="section-header"><h3>Console</h3></div>
                <div className="console-output">
                  <pre>{code || '// Blocks code will appear here...'}</pre>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

    </div >
  );
};

export default App;
