import { Suspense, memo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Line, GizmoHelper, GizmoViewport } from '@react-three/drei';
import Drone from './Drone';
import Classroom from './Classroom';

interface SimulatorProps {
    droneState: {
        position: [number, number, number];
        rotation: [number, number, number];
        ledColor: string;
        ledIntensity: number;
    };
    flightPath: [number, number, number][];
    containerWidth?: number;
    containerHeight?: number;
}

const Simulator = ({ droneState, flightPath, containerWidth, containerHeight }: SimulatorProps) => {
    // Force 3D canvas to update when container size changes
    useEffect(() => {
        // This is handled by react-three-fiber internally using ResizeObserver,
        // but passing the props ensures our memoized component doesn't block updates.
    }, [containerWidth, containerHeight]);
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0a0c' }}>
            <Canvas shadows camera={{ position: [8, 5, 8], fov: 45 }}>
                <ambientLight intensity={0.8} />
                <hemisphereLight intensity={0.4} groundColor="#444" />
                <pointLight position={[0, 4.5, 0]} intensity={2.0} castShadow />
                <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={1.5} castShadow />

                <Suspense fallback={null}>
                    <Classroom />

                    {/* Render flight path line */}
                    {flightPath.length > 1 && (
                        <Line
                            points={flightPath.map(p => [p[0] / 100, p[1] / 100, p[2] / 100])}
                            color="#3b82f6"
                            lineWidth={2}
                            dashed={false}
                        />
                    )}

                    <Drone
                        position={[droneState.position[0] / 100, (droneState.position[1] / 100) + 0.03, droneState.position[2] / 100]}
                        rotation={droneState.rotation}
                        ledColor={droneState.ledColor}
                        ledIntensity={droneState.ledIntensity}
                    />
                    <ContactShadows position={[0, 0.01, 0]} opacity={0.6} scale={20} blur={2} far={4.5} />
                </Suspense>

                <GizmoHelper
                    alignment="bottom-right"
                    margin={[80, 80]}
                >
                    <GizmoViewport axisColors={['#ff3e00', '#2ecc71', '#3b82f6']} labelColor="white" />
                </GizmoHelper>

                <OrbitControls makeDefault minDistance={2} maxDistance={15} maxPolarAngle={Math.PI / 2.1} />
            </Canvas>
        </div>
    );
};

export default memo(Simulator);
