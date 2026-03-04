import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:provider/provider.dart';

// ✅ CORRECT IMPORTS (Matches your pubspec.yaml)
import 'package:little_emmi/Models/BlockModels.dart';
import 'package:little_emmi/Providers/block_provider.dart';

class BlockCanvas extends StatefulWidget {
  const BlockCanvas({super.key});

  @override
  State<BlockCanvas> createState() => _BlockCanvasState();
}

class _BlockCanvasState extends State<BlockCanvas> {
  // ✅ 1. KEY FIX: Connects visual drag to logical drop
  final GlobalKey _canvasKey = GlobalKey();
  final TransformationController _transformationController = TransformationController();

  @override
  void initState() {
    super.initState();
    // Start centered on the large workspace
    _transformationController.value = Matrix4.identity()..translate(-2100.0, -2200.0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        color: const Color(0xFFF5F5F5), // Light grey background
        child: Stack(
          children: [
            // -----------------------------------------------------------
            // 1. ZOOMABLE WORKSPACE
            // -----------------------------------------------------------
            Consumer<BlockProvider>(
              builder: (context, provider, _) => DragTarget<BlockModels>(
                // ✅ FIX: Must return true to allow the drop
                onWillAcceptWithDetails: (_) => true,

                onAcceptWithDetails: (details) {
                  final renderBox = _canvasKey.currentContext?.findRenderObject() as RenderBox?;
                  if (renderBox == null) return;

                  // Calculate Drop Position
                  final localOffset = renderBox.globalToLocal(details.offset);
                  final sceneOffset = _transformationController.toScene(localOffset);

                  // Create the new block
                  final data = details.data;
                  provider.addBlock(BlockModels(
                    id: DateTime.now().millisecondsSinceEpoch.toString(),
                    position: sceneOffset,
                    label: data.label,
                    bleData: data.bleData,
                    block: data.block,
                    type: data.type,
                    // ✅ FIX: Use dynamic size to support expansion animations
                    size: Size(data.size.width, data.size.height),
                    child: provider.parentId,
                    leftSnapId: data.leftSnapId,
                    rightSnapId: data.rightSnapId,
                    animationType: data.animationType,
                    animationSide: data.animationSide,
                    innerLoopLeftSnapId: data.innerLoopLeftSnapId,
                    innerLoopRightSnapId: data.innerLoopRightSnapId,
                    children: List.from(data.children),
                    value: data.value,
                  ));

                  // Trigger snap check immediately after drop
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    provider.trySnapAnimation(data.id);
                  });
                },
                builder: (_, __, ___) => InteractiveViewer(
                  // ✅ FIX: Key attached here
                  key: _canvasKey,
                  transformationController: _transformationController,
                  boundaryMargin: const EdgeInsets.all(double.infinity),
                  minScale: 0.5,
                  maxScale: 3.0,
                  constrained: false,
                  child: SizedBox(
                    width: 5000,
                    height: 5000,
                    child: Stack(
                      children: [
                        // Grid Background
                        CustomPaint(
                            size: const Size(5000, 5000),
                            painter: _GridPainter()
                        ),
                        // Render Blocks
                        for (var block in provider.blocks)
                          _CanvasBlock(
                            key: ValueKey(block.id),
                            id: block.id,
                            controller: _transformationController,
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // -----------------------------------------------------------
            // 2. UI CONTROLS
            // -----------------------------------------------------------
            Positioned(
              bottom: 100,
              right: 16,
              child: FloatingActionButton(
                mini: true,
                heroTag: "reset_view",
                backgroundColor: Colors.white,
                onPressed: () {
                  setState(() {
                    _transformationController.value = Matrix4.identity()
                      ..translate(-2100.0, -2200.0);
                  });
                },
                child: const Icon(Icons.center_focus_strong, color: Colors.blueAccent),
              ),
            ),

            Positioned(
              bottom: 16,
              right: 16,
              child: FloatingActionButton(
                mini: true,
                heroTag: 'reset_canvas_btn',
                backgroundColor: Colors.redAccent,
                onPressed: () {
                  context.read<BlockProvider>().resetAll();
                },
                child: const Icon(Icons.delete_outline, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CanvasBlock extends StatefulWidget {
  final String id;
  final TransformationController controller;
  const _CanvasBlock({super.key, required this.id, required this.controller});

  @override
  State<_CanvasBlock> createState() => _CanvasBlockState();
}

class _CanvasBlockState extends State<_CanvasBlock> {
  late TextEditingController _loopController;

  @override
  void initState() {
    super.initState();
    _loopController = TextEditingController();
  }

  @override
  void dispose() {
    _loopController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // ✅ Watch provider for changes (position updates, highlighting, etc.)
    final provider = context.watch<BlockProvider>();

    // Safely find the block
    final blockIndex = provider.blocks.indexWhere((b) => b.id == widget.id);
    if (blockIndex == -1) return const SizedBox.shrink();
    final block = provider.blocks[blockIndex];

    // Sync Text Controller for Loop Blocks
    if (block.type == 'loop' && _loopController.text != block.value.toString()) {
      _loopController.text = block.value.toString();
    }

    // Check Highlight State
    final isHighlighted = provider.highlightedBlockId == widget.id;

    return Positioned(
      left: block.position.dx,
      // ✅ FIX: Restored Bottom-Left Anchor Logic
      // This ensures the visual block aligns with the Provider's math
      top: block.position.dy - block.size.height,

      child: GestureDetector(
        // ✅ FIX: Tap to Highlight
        onTap: () {
          provider.animateChainHighlight(widget.id);
        },
        onPanStart: (d) {
          provider.bringToFront(widget.id);
          provider.bringChainToFront(block.rightSnapId);
          provider.detachBlockFromLoopWidth(widget.id);
          provider.removeLeftSnapId(widget.id);
        },
        onPanUpdate: (d) {
          final double scale = widget.controller.value.getMaxScaleOnAxis();
          provider.updatePositionById(widget.id, block.position + (d.delta / scale));
        },
        onPanEnd: (d) => provider.trySnapAnimation(widget.id),
        child: Container(
          // ✅ FIX: Visual Glow when Highlighted
          decoration: isHighlighted
              ? BoxDecoration(
              boxShadow: [const BoxShadow(color: Colors.yellowAccent, blurRadius: 10, spreadRadius: 2)],
              border: Border.all(color: Colors.yellow, width: 3),
              borderRadius: BorderRadius.circular(8)
          )
              : null,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // 1. Loop Block Background
              if (block.type == 'loop')
                Container(
                  width: block.size.width,
                  height: block.size.height,
                  decoration: BoxDecoration(
                    image: DecorationImage(
                      image: AssetImage(block.block),
                      fit: BoxFit.fill,
                      // Preserves corners while stretching width
                      centerSlice: const Rect.fromLTWH(70, 21, 7, 7),
                    ),
                  ),
                ),

              // 2. Movement Block Background
              if (block.type == 'movement')
                SvgPicture.asset(
                    block.block,
                    width: block.size.width,
                    height: block.size.height
                ),

              // 3. Icon Label (Arrows, Repeat Icon)
              Positioned(
                left: block.type == 'movement' ? 6 : null,
                right: block.type == 'loop' ? 5 : null,
                top: 5,
                child: SvgPicture.asset(block.label, width: 50, height: 50),
              ),

              // 4. ✅ FIX: Loop Input Field (Restored)
              if (block.type == 'loop')
                Positioned(
                  left: 28,
                  top: 22,
                  child: SizedBox(
                    width: 30,
                    height: 30,
                    child: TextField(
                      controller: _loopController,
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                      style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.white
                      ),
                      onChanged: (val) {
                        final newVal = int.tryParse(val);
                        if (newVal != null) {
                          provider.updateBlockValue(block.id, newVal);
                        }
                      },
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.grey.shade300;
    const step = 40.0;
    for (double x = 0; x <= size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y <= size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }
  @override
  bool shouldRepaint(_) => false;
}