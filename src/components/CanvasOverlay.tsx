import { useRef, useEffect, useState } from 'react';

type Tool = 'none' | 'pen' | 'highlight' | 'eraser';

//type to store the different strokes
export type Stroke = {
  tool: Tool;
  color: string;
  width: number;
  points: { x: number; y: number }[];
};

//component properties that come from court
type Props = {
  strokes: Stroke[];
  setStrokes: (strokes: Stroke[]) => void;
  currentTool: Tool;
};

//canvas component to sit on top of court
export default function CanvasOverlay({ strokes, setStrokes, currentTool }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);                          //grabs canvas DOM element
  const [isDrawing, setIsDrawing] = useState(false);                          //is the user currently holding down the mouse to drag
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);    //track active line being drawn

  //function to draw a stroke
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
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

    ctx.globalAlpha = 1.0;
  };

  //listener to redraw all strokes when strokes changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach(stroke => drawStroke(ctx, stroke));
  }, [strokes]);

  //helper to work for both mouse and touch
  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  //function to start drawing when mouse down
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // important for touch events
    if (currentTool === 'none') return;

    const pos = getCanvasPos(e);
    const stroke: Stroke = {
      tool: currentTool,
      color: currentTool === 'eraser' ? '#FFFFFF' : currentTool === 'highlight' ? 'yellow' : 'black',
      width: currentTool === 'highlight' ? 20 : currentTool === 'eraser' ? 30 : 4,
      points: [pos],
    };
    setCurrentStroke(stroke);
    setIsDrawing(true);
  };

  //adds new points to the current stroke
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (currentTool == 'none' || !isDrawing || !currentStroke) return;

    const pos = getCanvasPos(e);
    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, pos],
    };
    setCurrentStroke(updatedStroke);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      strokes.forEach(stroke => drawStroke(ctx, stroke));
      drawStroke(ctx, updatedStroke); // draw current stroke live
    }
  };

  //function for when the stroke is done
  const endDrawing = () => {
    if (currentTool == 'none') return;
    if (currentStroke) {
      if (currentTool === 'eraser') {
        const eraserPoints = currentStroke.points;

        //remove any stroke where any point is near an eraser point
        const filtered = strokes.filter(stroke =>
          !stroke.points.some(sp =>
            eraserPoints.some(ep =>
              Math.hypot(sp.x - ep.x, sp.y - ep.y) < stroke.width + 10 // collision radius
            )
          )
        );

        setStrokes(filtered);
      } else {
        setStrokes([...strokes, currentStroke]);  //adds the stroke to the list if its not erasing
      }
    }

    //resets states
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
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={endDrawing}
    />
  );
}
