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
                modal.classList.add('active');
                // Handle close button
                const closeBtn = document.getElementById('closeModal');
                if (closeBtn) {
                    closeBtn.onclick = () => {
                        modal.classList.remove('active');
                        this.resetPlot();
                    };
                }
                // Handle click outside modal
                window.onclick = (event) => {
                    if (event.target == modal) {
                        modal.classList.remove('active');
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

            mod.plot = new Sk.builtin.func(function (x, y, label) {
                Sk.builtin.pyCheckArgs("plot", arguments, 1, 3);

                let xData = Sk.ffi.remapToJs(x);
                let yData = y ? Sk.ffi.remapToJs(y) : xData;
                let labelStr = label ? Sk.ffi.remapToJs(label) : "Data";

                if (!y) xData = yData.map((_, i) => i); // If only one arg, it's Y

                pltState.currentPlot.labels = xData;
                pltState.currentPlot.datasets.push({
                    label: labelStr,
                    data: yData,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: false
                });
            });

            mod.bar = new Sk.builtin.func(function (x, height, label) {
                Sk.builtin.pyCheckArgs("bar", arguments, 2, 3);
                pltState.currentPlot.type = 'bar';
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

            mod.pie = new Sk.builtin.func(function (x, labels) {
                Sk.builtin.pyCheckArgs("pie", arguments, 1, 2);
                pltState.currentPlot.type = 'pie';
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

            mod.title = new Sk.builtin.func(function (t) {
                pltState.currentPlot.title = Sk.ffi.remapToJs(t);
            });

            mod.xlabel = new Sk.builtin.func(function (l) {
                pltState.currentPlot.xlabel = Sk.ffi.remapToJs(l);
            });

            mod.ylabel = new Sk.builtin.func(function (l) {
                pltState.currentPlot.ylabel = Sk.ffi.remapToJs(l);
            });

            mod.show = new Sk.builtin.func(function () {
                const canvasContainer = document.getElementById('modalCanvasContainer');
                if (!canvasContainer) return;

                pltState.showModal();
                canvasContainer.innerHTML = '<canvas id="myChart" style="width:100\%; max-height:500px;"></canvas>';

                const ctx = document.getElementById('myChart').getContext('2d');
                pltState.chartInstance = new Chart(ctx, {
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
            });

            return mod;
        };

        // Inject modules
        Sk.builtinFiles["files"]["src/lib/matplotlib/__init__.py"] = "pass";
        Sk.builtinFiles["files"]["src/lib/matplotlib/pyplot.js"] = "var $builtinmodule = " + pltModuleCode.toString();

        // Short-hands for compatibility
        Sk.builtinFiles["files"]["matplotlib/__init__.py"] = "pass";
        Sk.builtinFiles["files"]["matplotlib/pyplot.js"] = "var $builtinmodule = " + pltModuleCode.toString();
    }

    // Global reset hook for the app
    window.resetMatplotlib = function () { window.__PYBLOCKS_PLT__.resetPlot(); };
})();
