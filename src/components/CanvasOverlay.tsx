import { useRef, useEffect, useState } from 'react';

type Tool = 'pen' | 'highlight' | 'eraser';

export type Stroke = {
  tool: Tool;
  color: string;
  width: number;
  points: { x: number; y: number }[];
};

type Props = {
  strokes: Stroke[];
  setStrokes: (strokes: Stroke[]) => void;
  currentTool: Tool;
};

export default function CanvasOverlay({ strokes, setStrokes, currentTool }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  // Adjust canvas size and redraw on every stroke update
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.globalAlpha = stroke.tool === 'highlight' ? 0.3 : 1.0;
      ctx.beginPath();
      stroke.points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0; // reset
  }, [strokes]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const stroke: Stroke = {
      tool: currentTool,
      color: currentTool === 'eraser' ? '#FFFFFF' : currentTool === 'highlight' ? 'yellow' : 'black',
      width: currentTool === 'highlight' ? 20 : currentTool === 'eraser' ? 30 : 4,
      points: [pos],
    };
    setCurrentStroke(stroke);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;
    const pos = getMousePos(e);
    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, pos],
    });
  };

  const endDrawing = () => {
    if (currentStroke) {
      setStrokes([...strokes, currentStroke]);
    }
    setIsDrawing(false);
    setCurrentStroke(null);
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full z-0"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={endDrawing}
      onMouseLeave={endDrawing}
    />
  );
}
