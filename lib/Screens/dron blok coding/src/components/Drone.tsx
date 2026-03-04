import { useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Drone = ({ position, rotation, ledColor = '#00ff00', ledIntensity = 1 }: {
    position: [number, number, number],
    rotation: [number, number, number],
    ledColor?: string,
    ledIntensity?: number
}) => {
    const mesh = useRef<THREE.Group>(null);
    const rotors = useRef<THREE.Group[]>([]);
    const ledRef = useRef<THREE.MeshStandardMaterial>(null);

    useFrame((state, delta) => {
        if (rotors.current) {
            rotors.current.forEach((rotor) => {
                if (rotor) rotor.rotation.y += delta * 20;
            });
        }
        // Smoothly interpolate rotation and position for stunts
        if (mesh.current) {
            mesh.current.rotation.x = THREE.MathUtils.lerp(mesh.current.rotation.x, rotation[0], 0.1);
            mesh.current.rotation.y = THREE.MathUtils.lerp(mesh.current.rotation.y, rotation[1], 0.1);
            mesh.current.rotation.z = THREE.MathUtils.lerp(mesh.current.rotation.z, rotation[2], 0.1);

            mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, position[0], 0.1);
            mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, position[1], 0.1);
            mesh.current.position.z = THREE.MathUtils.lerp(mesh.current.position.z, position[2], 0.1);
        }

        // Dynamic LED effect
        if (ledRef.current) {
            const pulse = (Math.sin(state.clock.elapsedTime * 8) + 1) / 2;
            const intensity = 0.5 + (pulse * 0.5 * ledIntensity);
            const color = new THREE.Color(ledColor);
            ledRef.current.emissive.copy(color).multiplyScalar(intensity);
            ledRef.current.color.copy(color);
        }
    });

    return (
        <group ref={mesh} scale={[0.3, 0.3, 0.3]}>
            {/* Main Carbon Fiber Frame */}
            <mesh castShadow>
                <boxGeometry args={[0.8, 0.05, 0.8]} />
                <meshStandardMaterial color="#222" roughness={0.2} metalness={0.8} />
            </mesh>

            {/* Central Control Hub */}
            <mesh position={[0, 0.08, 0]} castShadow>
                <cylinderGeometry args={[0.3, 0.35, 0.15, 16]} />
                <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Top Logo Panel */}
            <mesh position={[0, 0.16, 0]}>
                <boxGeometry args={[0.2, 0.02, 0.2]} />
                <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
            </mesh>

            {/* Arms - Slim and Rounded */}
            {[[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]].map((pos, i) => (
                <group key={i} position={[pos[0], 0, pos[1]]}>
                    {/* Arm Tube */}
                    <mesh rotation={[Math.PI / 2, 0, Math.atan2(pos[1], pos[0]) + Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
                        <meshStandardMaterial color="#444" metalness={0.7} />
                    </mesh>

                    {/* Motor Housing */}
                    <mesh position={[0, 0.05, 0]} castShadow>
                        <cylinderGeometry args={[0.15, 0.15, 0.15, 16]} />
                        <meshStandardMaterial color="#333" metalness={0.8} />
                    </mesh>

                    {/* Rotor Blades - More Aerodynamic look */}
                    <group ref={(el) => (rotors.current[i] = el!)} position={[0, 0.13, 0]}>
                        <mesh castShadow>
                            <boxGeometry args={[0.9, 0.01, 0.08]} />
                            <meshStandardMaterial color="#fff" transparent opacity={0.6} />
                        </mesh>
                        {/* Hub cap */}
                        <mesh position={[0, 0.01, 0]}>
                            <sphereGeometry args={[0.05, 8, 8]} />
                            <meshStandardMaterial color="#000" />
                        </mesh>
                    </group>

                    {/* Bottom Status LEDs */}
                    <mesh position={[0, -0.05, 0]}>
                        <sphereGeometry args={[0.04, 8, 8]} />
                        {i < 2 ? (
                            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1} />
                        ) : (
                            <meshStandardMaterial ref={ledRef} color="#00ff00" emissive="#00ff00" emissiveIntensity={1} />
                        )}
                    </mesh>
                </group>
            ))}

            {/* Aerodynamic Sharp Nose/Canopy */}
            <mesh position={[0, 0.05, 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <coneGeometry args={[0.25, 0.6, 4]} />
                <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Sharp Integrated Front Lights */}
            <group position={[0, 0.05, 0.85]}>
                <mesh position={[-0.08, 0, 0]}>
                    <boxGeometry args={[0.02, 0.06, 0.02]} />
                    <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} />
                </mesh>
                <mesh position={[0.08, 0, 0]}>
                    <boxGeometry args={[0.02, 0.06, 0.02]} />
                    <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} />
                </mesh>
            </group>
        </group>
    );
};

export default memo(Drone);
