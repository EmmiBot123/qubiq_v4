import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as Blockly from 'blockly';
import { initDroneBlocks } from '../blocks/droneBlocks';
import { initGenerator } from '../blocks/generator';
import { javascriptGenerator } from 'blockly/javascript';

// Define the toolbox
const toolbox = {
    kind: 'categoryToolbox',
    contents: [
        {
            kind: 'category',
            name: '💠 Structure',
            colour: '120',
            contents: [
                { kind: 'block', type: 'takeoff' },
                { kind: 'block', type: 'land' },
            ],
        },
        {
            kind: 'category',
            name: '🔄 Rotation',
            colour: '290',
            contents: [
                { kind: 'block', type: 'rotate_left' },
                { kind: 'block', type: 'rotate_right' },
            ],
        },
        {
            kind: 'category',
            name: '🛸 Movement',
            colour: '230',
            contents: [
                { kind: 'block', type: 'move_forward' },
                { kind: 'block', type: 'move_backward' },
                { kind: 'block', type: 'move_left' },
                { kind: 'block', type: 'move_right' },
                { kind: 'block', type: 'circle_left' },
                { kind: 'block', type: 'circle_right' },
                { kind: 'block', type: 'go_to' },
                { kind: 'block', type: 'set_altitude' },
                { kind: 'block', type: 'set_speed' },
            ],
        },
        {
            kind: 'category',
            name: '⏱️ Timing',
            colour: '260',
            contents: [
                { kind: 'block', type: 'delay' },
            ],
        },
        {
            kind: 'category',
            name: '🧩 Control',
            colour: '210',
            contents: [
                { kind: 'block', type: 'controls_if' },
                { kind: 'block', type: 'controls_repeat_ext', inputs: { 'TIMES': { shadow: { type: 'math_number', fields: { 'NUM': 3 } } } } },
            ],
        },
        {
            kind: 'category',
            name: '🔢 Operators',
            colour: '230',
            contents: [
                { kind: 'block', type: 'logic_compare' },
                { kind: 'block', type: 'logic_operation' },
                { kind: 'block', type: 'logic_negate' },
                { kind: 'block', type: 'math_number' },
                { kind: 'block', type: 'math_arithmetic' },
            ],
        },
        {
            kind: 'category',
            name: '🔤 Text',
            colour: '160',
            contents: [
                { kind: 'block', type: 'text' },
                { kind: 'block', type: 'text_print' },
            ],
        },
        {
            kind: 'category',
            name: '📦 Variables',
            custom: 'VARIABLE',
            colour: '330',
        },
        {
            kind: 'category',
            name: '🤸 Stunts',
            colour: '180',
            contents: [
                { kind: 'block', type: 'flip_forward' },
                { kind: 'block', type: 'flip_backward' },
                { kind: 'block', type: 'flip_left' },
                { kind: 'block', type: 'flip_right' },
                { kind: 'block', type: 'spiral_up' },
            ],
        },
        {
            kind: 'category',
            name: '💡 Lights',
            colour: '200',
            contents: [
                { kind: 'block', type: 'set_led_color' },
            ],
        },
        {
            kind: 'category',
            name: '🏁 Navigation',
            colour: '0',
            contents: [
                { kind: 'block', type: 'hover' },
                { kind: 'block', type: 'emergency_stop' },
            ],
        },
    ],
};

export interface BlocklyWorkspaceHandle {
    clearWorkspace: () => void;
    getWorkspaceXml: () => string;
    loadWorkspaceXml: (xml: string) => void;
    undo: () => void;
    redo: () => void;
}

const BlocklyWorkspace = forwardRef<BlocklyWorkspaceHandle, { onCodeChange: (code: string) => void }>(
    ({ onCodeChange }, ref) => {
        const blocklyDiv = useRef<HTMLDivElement>(null);
        const workspace = useRef<Blockly.WorkspaceSvg | null>(null);

        useImperativeHandle(ref, () => ({
            clearWorkspace: () => {
                if (workspace.current) {
                    workspace.current.clear();
                }
            },
            getWorkspaceXml: () => {
                if (workspace.current) {
                    const xml = Blockly.Xml.workspaceToDom(workspace.current);
                    return Blockly.Xml.domToText(xml);
                }
                return '';
            },
            loadWorkspaceXml: (xmlText: string) => {
                if (workspace.current) {
                    workspace.current.clear();
                    try {
                        const xml = Blockly.utils.xml.textToDom(xmlText);
                        Blockly.Xml.domToWorkspace(xml, workspace.current);
                    } catch (e) {
                        console.error('Error loading workspace XML:', e);
                    }
                }
            },
            undo: () => {
                workspace.current?.undo(false);
            },
            redo: () => {
                workspace.current?.undo(true);
            },
        }));

        useEffect(() => {
            if (blocklyDiv.current) {
                initDroneBlocks();
                initGenerator();

                workspace.current = Blockly.inject(blocklyDiv.current, {
                    toolbox,
                    scrollbars: true,
                    trashcan: true,
                    move: {
                        scrollbars: true,
                        drag: true,
                        wheel: true,
                    },
                    theme: Blockly.Themes.Classic,
                });

                const observer = new ResizeObserver(() => {
                    if (workspace.current) {
                        Blockly.svgResize(workspace.current);
                    }
                });
                observer.observe(blocklyDiv.current);

                workspace.current.addChangeListener(() => {
                    if (workspace.current) {
                        const code = javascriptGenerator.workspaceToCode(workspace.current);
                        onCodeChange(code);
                    }
                });

                return () => {
                    observer.disconnect();
                    if (workspace.current) {
                        workspace.current.dispose();
                    }
                };
            }
        }, []);

        return <div ref={blocklyDiv} style={{ height: '100%', width: '100%' }} />;
    }
);

export default BlocklyWorkspace;
