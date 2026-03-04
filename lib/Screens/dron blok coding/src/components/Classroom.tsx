// Classroom component using Three.js primitives

const Desk = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
        {/* Table Top */}
        <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 0.05, 0.8]} />
            <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        {/* Legs */}
        {[[-0.5, -0.3], [0.5, -0.3], [0.5, 0.3], [-0.5, 0.3]].map((legPos, i) => (
            <mesh key={i} position={[legPos[0], 0.35, legPos[1]]} castShadow>
                <boxGeometry args={[0.05, 0.7, 0.05]} />
                <meshStandardMaterial color="#333" />
            </mesh>
        ))}
        {/* Chair */}
        <group position={[0, 0, -0.6]}>
            <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.5, 0.05, 0.5]} />
                <meshStandardMaterial color="#555" />
            </mesh>
            <mesh position={[0, 0.7, -0.25]} castShadow>
                <boxGeometry args={[0.5, 0.5, 0.05]} />
                <meshStandardMaterial color="#555" />
            </mesh>
            {[[-0.2, -0.2], [0.2, -0.2], [0.2, 0.2], [-0.2, 0.2]].map((legPos, i) => (
                <mesh key={i} position={[legPos[0], 0.225, legPos[1]]} castShadow>
                    <boxGeometry args={[0.04, 0.45, 0.04]} />
                    <meshStandardMaterial color="#222" />
                </mesh>
            ))}
        </group>
    </group>
);

const Classroom = () => {
    return (
        <group>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color="#d3d3d3" />
            </mesh>
            {/* Tile grid */}
            <gridHelper args={[20, 20, "#aaa", "#bbb"]} position={[0, 0.01, 0]} rotation={[0, 0, 0]} />

            {/* Walls */}
            {/* Back Wall (Whiteboard side) */}
            <mesh position={[0, 2.5, -10]} receiveShadow>
                <boxGeometry args={[20, 5, 0.1]} />
                <meshStandardMaterial color="#87CEEB" />
            </mesh>
            {/* Left Wall */}
            <mesh position={[-10, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <boxGeometry args={[20, 5, 0.1]} />
                <meshStandardMaterial color="#87CEEB" />
            </mesh>
            {/* Right Wall */}
            <mesh position={[10, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                <boxGeometry args={[20, 5, 0.1]} />
                <meshStandardMaterial color="#87CEEB" />
            </mesh>

            {/* Whiteboard */}
            <group position={[0, 2, -9.9]}>
                <mesh receiveShadow>
                    <boxGeometry args={[6, 3, 0.05]} />
                    <meshStandardMaterial color="#fff" roughness={0.1} />
                </mesh>
                {/* Frame */}
                <mesh position={[0, 0, -0.01]}>
                    <boxGeometry args={[6.2, 3.2, 0.02]} />
                    <meshStandardMaterial color="#666" />
                </mesh>
            </group>

            {/* Starting Desk */}
            <Desk position={[0, 0, 0]} />

            {/* Desks Rows */}
            {[-3, 0, 3].map((x) =>
                [-4, -1, 2, 5].map((z) => (
                    // Avoid overlapping with the starting desk at [0,0]
                    (x === 0 && (z === -1 || z === 2)) ? null :
                        <Desk key={`${x}-${z}`} position={[x, 0, z]} />
                )).flat()
            )}

            {/* Ceiling lights (visual only) */}
            {[[-5, 5], [5, 5], [-5, -5], [5, -5]].map((pos, i) => (
                <mesh key={i} position={[pos[0], 4.9, pos[1]]}>
                    <boxGeometry args={[2, 0.1, 1]} />
                    <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1.5} />
                </mesh>
            ))}
        </group>
    );
};

export default Classroom;
