/**
 * PyBlocks - Matplotlib Wrapper for Skulpt using Chart.js
 * Provides a subset of plt functionality for educational purposes.
 */

(function () {
    // Global state for plotting to allow access from stringified Skulpt modules
    window.__PYBLOCKS_PLT__ = {
        currentPlot: {
            type: 'line',
            title: '',
            xlabel: '',
            ylabel: '',
            labels: [],
            datasets: []
        },
        chartInstance: null,
        resetPlot: function () {
            this.currentPlot = {
                type: 'line',
                title: '',
                xlabel: '',
                ylabel: '',
                labels: [],
                datasets: []
            };
            if (this.chartInstance) {
                this.chartInstance.destroy();
                this.chartInstance = null;
            }
        },
        showModal: function () {
            const modal = document.getElementById('plotModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('active');
                // Handle close button
                const closeBtn = document.getElementById('closeModal');
                if (closeBtn) {
                    closeBtn.onclick = () => {
                        modal.classList.remove('active');
                        modal.classList.add('hidden');
                        this.resetPlot();
                    };
                }
                // Handle click outside modal
                window.onclick = (event) => {
                    if (event.target == modal) {
                        modal.classList.remove('active');
                        modal.classList.add('hidden');
                        this.resetPlot();
                    }
                };
            }
        },
        showImage: function (imgData) {
            const modal = document.getElementById('plotModal');
            const container = document.getElementById('modalCanvasContainer');
            if (modal && container) {
                this.showModal();

                // Check if it's a real image (DataURL starts with data:image)
                const isRealImage = typeof imgData === 'string' && imgData.startsWith('data:image');

                container.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 20px;">
                    <div style="font-weight: 500; font-size: 1.2rem; color: #333;">${isRealImage ? 'Image Output' : 'Processed Image Output'}</div>
                    <div style="max-width: 90%; max-height: 400px; display: flex; align-items: center; justify-content: center; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        ${isRealImage
                        ? `<img src="${imgData}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`
                        : `<div style="width: 300px; height: 300px; background: #eee; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; font-style: italic; color: #666;">
                                ${imgData === 'gray' ? '<span style="filter: grayscale(100%); font-size: 3rem;">🖼️</span>' : '<span style="font-size: 3rem;">🖼️</span>'}
                               </div>`
                    }
                    </div>
                    <div style="color: #666; font-size: 0.9rem;">${isRealImage ? '' : '(Mock Image Visualization)'}</div>
                </div>`;
            }
        }
    };

    // Injected into Skulpt
    if (typeof Sk !== 'undefined') {
        Sk.builtinFiles = Sk.builtinFiles || { "files": {} };

        const pltModuleCode = function (name) {
            var mod = { __name__: new Sk.builtin.str("pyplot") };
            var pltState = window.__PYBLOCKS_PLT__;

            // JS Implementation - simplified to accept validated positional args from Python wrapper
            mod.plot = new Sk.builtin.func(function (x, y, label) {
                console.log("DEBUG: JS plot called");
                // Sk.builtin.none.none$ check
                if (y === Sk.builtin.none.none$) y = null;
                if (label === Sk.builtin.none.none$) label = null;

                let xData = Sk.ffi.remapToJs(x);
                let yData = y ? Sk.ffi.remapToJs(y) : null;
                let labelStr = label ? Sk.ffi.remapToJs(label) : "Data";

                console.log("DEBUG: xData", JSON.stringify(xData));
                console.log("DEBUG: yData", JSON.stringify(yData));

                // Handle single argument plot(y) case
                if (!yData) {
                    yData = xData;
                    xData = yData.map((_, i) => i);
                }

                pltState.currentPlot.labels = xData;
                pltState.currentPlot.datasets.push({
                    label: labelStr,
                    data: yData,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: false
                });
                console.log("DEBUG: Current datasets", JSON.stringify(pltState.currentPlot.datasets));
            });
            mod.plot.co_varnames = ['x', 'y', 'label'];

            mod.scatter = new Sk.builtin.func(function (x, y, label) {
                if (label === Sk.builtin.none.none$) label = null;
                let xData = Sk.ffi.remapToJs(x);
                let yData = Sk.ffi.remapToJs(y);
                let labelStr = label ? Sk.ffi.remapToJs(label) : "Scatter";

                // Map to {x, y} format for Chart.js scatter
                let scatterData = xData.map((xv, i) => ({ x: xv, y: yData[i] }));

                pltState.currentPlot.type = 'scatter'; // Force scatter type if scatter is called
                pltState.currentPlot.datasets.push({
                    label: labelStr,
                    data: scatterData,
                    backgroundColor: 'rgba(153, 102, 255, 0.6)'
                });
            });
            mod.scatter.co_varnames = ['x', 'y', 'label'];

            mod.bar = new Sk.builtin.func(function (x, height, label) {
                if (label === Sk.builtin.none.none$) label = null;

                let xData = Sk.ffi.remapToJs(x);
                let yData = Sk.ffi.remapToJs(height);
                let labelStr = label ? Sk.ffi.remapToJs(label) : "Data";

                pltState.currentPlot.labels = xData;
                pltState.currentPlot.datasets.push({
                    label: labelStr,
                    data: yData,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                });
            });
            mod.bar.co_varnames = ['x', 'height', 'label'];

            mod.hist = new Sk.builtin.func(function (data, bins, label) {
                if (bins === Sk.builtin.none.none$) bins = 10;
                if (label === Sk.builtin.none.none$) label = null;

                let rawData = Sk.ffi.remapToJs(data);
                let numBins = Sk.ffi.remapToJs(bins) || 10;
                let labelStr = label ? Sk.ffi.remapToJs(label) : "Histogram";

                // Simple binning logic
                let min = Math.min(...rawData);
                let max = Math.max(...rawData);
                let range = max - min;
                let binWidth = range / numBins;
                let counts = new Array(numBins).fill(0);
                let labels = [];

                for (let i = 0; i < numBins; i++) {
                    let start = min + i * binWidth;
                    let end = start + binWidth;
                    labels.push(`${start.toFixed(2)}-${end.toFixed(2)}`);
                }

                rawData.forEach(val => {
                    let binIndex = Math.floor((val - min) / binWidth);
                    if (binIndex >= numBins) binIndex = numBins - 1;
                    if (binIndex < 0) binIndex = 0;
                    counts[binIndex]++;
                });

                pltState.currentPlot.labels = labels;
                pltState.currentPlot.type = 'bar'; // Hist is shown as bar chart
                pltState.currentPlot.datasets.push({
                    label: labelStr,
                    data: counts,
                    backgroundColor: 'rgba(255, 159, 64, 0.6)'
                });
            });
            mod.hist.co_varnames = ['data', 'bins', 'label'];

            mod.pie = new Sk.builtin.func(function (x, labels) {
                if (labels === Sk.builtin.none.none$) labels = null;

                let xData = Sk.ffi.remapToJs(x);
                let labelsList = labels ? Sk.ffi.remapToJs(labels) : xData.map((_, i) => `Part ${i + 1}`);

                pltState.currentPlot.labels = labelsList;
                pltState.currentPlot.datasets = [{
                    data: xData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)'
                    ]
                }];
            });
            mod.pie.co_varnames = ['x', 'labels'];

            mod.title = new Sk.builtin.func(function (t) {
                pltState.currentPlot.title = Sk.ffi.remapToJs(t);
            });
            mod.title.co_varnames = ['label'];

            mod.xlabel = new Sk.builtin.func(function (l) {
                pltState.currentPlot.xlabel = Sk.ffi.remapToJs(l);
            });
            mod.xlabel.co_varnames = ['xlabel'];

            mod.ylabel = new Sk.builtin.func(function (l) {
                pltState.currentPlot.ylabel = Sk.ffi.remapToJs(l);
            });
            mod.ylabel.co_varnames = ['ylabel'];

            mod.figure = new Sk.builtin.func(function (figsize) {
                pltState.resetPlot();
                return Sk.builtin.none.none$;
            });
            mod.figure.co_varnames = ['figsize'];
            mod.figure.co_flags = 0; // Disable kwargs

            mod.grid = new Sk.builtin.func(function (visible) {
                return Sk.builtin.none.none$;
            });
            mod.grid.co_varnames = ['visible'];

            mod.legend = new Sk.builtin.func(function () {
                // Chart.js handles legends automatically if datasets have labels
                return Sk.builtin.none.none$;
            });
            mod.legend.co_varnames = [];

            mod.subplot = new Sk.builtin.func(function (nrows, ncols, index) {
                console.log(`DEBUG: Subplot called (${nrows}, ${ncols}, ${index})`);
                return Sk.builtin.none.none$;
            });
            mod.subplot.co_varnames = ['nrows', 'ncols', 'index'];

            mod.imshow = new Sk.builtin.func(function (X) {
                let imgData = Sk.ffi.remapToJs(X);
                // If it's a numpy array (list of lists), we might need to process it
                // For now, assume it's a string from our mocks or handle raw data if possible
                console.log("DEBUG: imshow called with data", imgData);
                pltState.showImage(imgData);
                return Sk.builtin.none.none$;
            });
            mod.imshow.co_varnames = ['X'];

            mod.tight_layout = new Sk.builtin.func(function () {
                return Sk.builtin.none.none$;
            });
            mod.tight_layout.co_varnames = [];

            mod.show = new Sk.builtin.func(function () {
                const renderChart = () => {
                    try {
                        const canvasContainer = document.getElementById('modalCanvasContainer');
                        if (!canvasContainer) {
                            console.error("DEBUG: Modal container not found!");
                            return;
                        }

                        pltState.showModal();

                        // Destroy old chart if exists
                        if (pltState.chartInstance) {
                            console.log("DEBUG: Destroying old chart instance");
                            pltState.chartInstance.destroy();
                            pltState.chartInstance = null;
                        }

                        // Fresh canvas
                        canvasContainer.innerHTML = '<canvas id="myChart" style="width:100%; height:100%; max-height:500px;"></canvas>';

                        // Use explicit window.Chart to be safe
                        const ChartCtor = window.Chart;
                        if (!ChartCtor) {
                            throw new Error("Chart library is missing even after load attempt.");
                        }

                        const ctx = document.getElementById('myChart').getContext('2d');
                        console.log("DEBUG: Creating new Chart instance with type:", pltState.currentPlot.type);

                        pltState.chartInstance = new ChartCtor(ctx, {
                            type: pltState.currentPlot.type,
                            data: {
                                labels: pltState.currentPlot.labels,
                                datasets: pltState.currentPlot.datasets
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    title: {
                                        display: !!pltState.currentPlot.title,
                                        text: pltState.currentPlot.title,
                                        font: { size: 18 }
                                    },
                                    legend: {
                                        display: pltState.currentPlot.datasets.length > 0
                                    }
                                },
                                scales: pltState.currentPlot.type !== 'pie' ? {
                                    x: { title: { display: !!pltState.currentPlot.xlabel, text: pltState.currentPlot.xlabel, font: { size: 14 } } },
                                    y: { title: { display: !!pltState.currentPlot.ylabel, text: pltState.currentPlot.ylabel, font: { size: 14 } } }
                                } : {}
                            }
                        });
                        console.log("DEBUG: Chart created successfully");
                    } catch (e) {
                        console.error("Chart Render Error:", e);
                        window.alert("Error rendering chart: " + e.message);
                    }
                };

                if (typeof window.Chart === 'undefined') {
                    console.log("DEBUG: Chart.js not found in window, loading robust UMD build from CDN...");

                    // The "Define Trick": Monaco's loader (RequireJS) can capture UMD libraries.
                    // We temporarily hide 'define' to force the library to attach to 'window'.
                    const oldDefine = window.define;
                    window.define = undefined;

                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
                    script.onload = () => {
                        window.define = oldDefine; // Restore AMD loader
                        if (typeof window.Chart !== 'undefined' || (window.Chart && window.Chart.Chart)) {
                            console.log("DEBUG: Chart.js (UMD) loaded successfully from CDN");
                            if (!window.Chart && window.Chart.Chart) window.Chart = window.Chart.Chart;
                            renderChart();
                        } else {
                            console.error("DEBUG: Chart.js loaded but window.Chart is still undefined.");
                            window.alert("Chart.js loaded from CDN but failed to initialize correctly.");
                        }
                    };
                    script.onerror = () => {
                        window.define = oldDefine; // Restore even on error
                        window.alert("Failed to load Chart.js library from CDN. Please check your internet connection.");
                    };
                    document.head.appendChild(script);
                } else {
                    renderChart();
                }
            });

            return mod;
        };

        // Inject modules
        Sk.builtinFiles["files"]["src/lib/matplotlib/__init__.py"] = "pass";
        Sk.builtinFiles["files"]["src/lib/matplotlib/_pyplot.js"] = "var $builtinmodule = " + pltModuleCode.toString();

        const pyplotPy = `
import matplotlib._pyplot as _imp

def _ensure_list(obj):
    # Debug: Check what we are receiving
    # print(f"DEBUG: Processing object type: {type(obj)}")
    if hasattr(obj, 'tolist'):
        # print("DEBUG: Object has tolist, converting...")
        val = obj.tolist()
        # print(f"DEBUG: Converted to: {val[:5]}...") 
        return val
    return obj

class Axes:
    def __init__(self, index=0):
        self.index = index
    
    def plot(self, x, y=None, label=None, **kwargs):
        x = _ensure_list(x)
        y = _ensure_list(y)
        _imp.plot(x, y, label)
    
    def scatter(self, x, y, label=None, **kwargs):
        x = _ensure_list(x)
        y = _ensure_list(y)
        _imp.scatter(x, y, label)
    
    def bar(self, x, height, label=None, **kwargs):
        x = _ensure_list(x)
        height = _ensure_list(height)
        _imp.bar(x, height, label)
    
    def hist(self, x, bins=10, label=None, **kwargs):
        x = _ensure_list(x)
        _imp.hist(x, bins, label)
    
    def set_title(self, label, **kwargs):
        _imp.title(label)
    
    def set_xlabel(self, label, **kwargs):
        _imp.xlabel(label)
    
    def set_ylabel(self, label, **kwargs):
        _imp.ylabel(label)
    
    def grid(self, visible=True, **kwargs):
        _imp.grid(visible)
    
    def imshow(self, X, **kwargs):
        _imp.imshow(X)
    
    def axis(self, *args, **kwargs):
        pass # Mock implementation

class Figure:
    def __init__(self):
        pass
    def tight_layout(self, **kwargs):
        _imp.tight_layout()

def subplots(nrows=1, ncols=1, **kwargs):
    fig = Figure()
    if nrows == 1 and ncols == 1:
        return fig, Axes(0)
    
    count = nrows * ncols
    axes = [Axes(i) for i in range(count)]
    
    if nrows > 1 and ncols > 1:
        # Multi-row, multi-col returns 2D array
        grid = []
        for r in range(nrows):
            grid.append(axes[r*ncols : (r+1)*ncols])
        return fig, grid
    elif nrows > 1 or ncols > 1:
        # Single row or single col returns 1D array
        return fig, axes
    
    return fig, axes

def plot(x, y=None, label=None, **kwargs):
    Axes().plot(x, y, label)

def scatter(x, y, label=None, **kwargs):
    Axes().scatter(x, y, label)

def hist(x, bins=10, label=None, **kwargs):
    Axes().hist(x, bins, label)

def bar(x, height, label=None, **kwargs):
    Axes().bar(x, height, label)

def pie(x, labels=None, **kwargs):
    x = _ensure_list(x)
    labels = _ensure_list(labels)
    _imp.pie(x, labels)

def title(label, **kwargs):
    Axes().set_title(label)

def xlabel(label, **kwargs):
    Axes().set_xlabel(label)

def ylabel(label, **kwargs):
    Axes().set_ylabel(label)

def figure(figsize=None, **kwargs):
    _imp.figure(figsize)

def grid(visible=None, **kwargs):
    Axes().grid(visible)

def subplot(nrows, ncols=None, index=None, **kwargs):
    # Handle subplot(111) or subplot(1,1,1)
    if ncols is None and index is None:
        s = str(nrows)
        if len(s) == 3:
            nrows, ncols, index = int(s[0]), int(s[1]), int(s[2])
    _imp.subplot(nrows, ncols, index)
    return Axes(index)

def tight_layout(**kwargs):
    _imp.tight_layout()

def legend(*args, **kwargs):
    _imp.legend()

def imshow(X, **kwargs):
    Axes().imshow(X)

def axis(*args, **kwargs):
    Axes().axis(*args, **kwargs)

def show(*args, **kwargs):
    _imp.show()
`;
        Sk.builtinFiles["files"]["src/lib/matplotlib/pyplot.py"] = pyplotPy;

        // Short-hands for compatibility
        Sk.builtinFiles["files"]["matplotlib/__init__.py"] = "pass";
        Sk.builtinFiles["files"]["matplotlib/_pyplot.js"] = "var $builtinmodule = " + pltModuleCode.toString();
        Sk.builtinFiles["files"]["matplotlib/pyplot.py"] = pyplotPy;
    }

    // Global reset hook for the app
    window.resetMatplotlib = function () { window.__PYBLOCKS_PLT__.resetPlot(); };
})();
