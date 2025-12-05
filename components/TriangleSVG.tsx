
import React, { useMemo } from 'react';
import { TriangleData } from '../types';
import { COLORS } from '../constants';

interface Props {
  data: TriangleData;
  width?: number | string;
  height?: number | string;
  rotation?: number; // Additional visual rotation (from tool)
  flip?: boolean; // Additional visual flip (from tool)
  labels?: string[]; // The pool of labels to pick from (e.g. ['A','B','C'])
  showLabels?: boolean;
}

const TriangleSVG: React.FC<Props> = ({ 
  data, 
  width = '100%', 
  height = '100%', 
  rotation = 0, 
  flip = false,
  labels = ['A', 'B', 'C'],
  showLabels = false
}) => {
  const points = data.points;
  const viewBoxSize = 180;
  const halfView = viewBoxSize / 2;

  const generateArc = (idx: number) => {
     const p = points[idx];
     const prev = points[(idx + 2) % 3];
     const next = points[(idx + 1) % 3];
     
     const v1x = prev.x - p.x;
     const v1y = prev.y - p.y;
     const v2x = next.x - p.x;
     const v2y = next.y - p.y;
     
     const r = 30; // Slightly larger for visibility
     
     const startAngle = Math.atan2(v1y, v1x);
     const endAngle = Math.atan2(v2y, v2x);
     
     let diff = endAngle - startAngle;
     while (diff <= -Math.PI) diff += 2*Math.PI;
     while (diff > Math.PI) diff -= 2*Math.PI;
     
     const x1 = p.x + r * Math.cos(startAngle);
     const y1 = p.y + r * Math.sin(startAngle);
     const x2 = p.x + r * Math.cos(endAngle);
     const y2 = p.y + r * Math.sin(endAngle);
     
     return `M ${p.x} ${p.y} L ${x1} ${y1} A ${r} ${r} 0 0 ${diff < 0 ? 0 : 1} ${x2} ${y2} Z`;
  };

  const transformStyle = useMemo(() => {
    const r = data.rotation + rotation;
    const sx = (data.isFlipped ? -1 : 1) * (flip ? -1 : 1);
    return `translate(${halfView}, ${halfView}) rotate(${r}) scale(${sx}, 1)`;
  }, [data.rotation, data.isFlipped, rotation, flip, halfView]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="overflow-visible pointer-events-none">
       <g transform={transformStyle}>
        {/* Angles */}
        {points.map((_, i) => (
          data.style.visibleAngles[i] && (
            <path 
              key={`angle-${i}`} 
              d={generateArc(i)} 
              fill={data.style.angleColors[i] || 'none'} 
              stroke="none"
            />
          )
        ))}

        {/* Right Angle Marker */}
        {data.style.rightAngleIndex !== undefined && (() => {
           const i = data.style.rightAngleIndex;
           const p = points[i];
           const prev = points[(i + 2) % 3];
           const next = points[(i + 1) % 3];
           const len = 15;
           const dx1 = prev.x - p.x; const dy1 = prev.y - p.y;
           const d1 = Math.sqrt(dx1*dx1 + dy1*dy1);
           const dx2 = next.x - p.x; const dy2 = next.y - p.y;
           const d2 = Math.sqrt(dx2*dx2 + dy2*dy2);
           
           const px1 = p.x + (dx1/d1) * len;
           const py1 = p.y + (dy1/d1) * len;
           const px2 = p.x + (dx2/d2) * len;
           const py2 = p.y + (dy2/d2) * len;
           const px3 = px1 + (dx2/d2) * len;
           const py3 = py1 + (dy2/d2) * len;

           return <path d={`M ${p.x} ${p.y} L ${px1} ${py1} L ${px3} ${py3} L ${px2} ${py2} Z`} fill="none" stroke={COLORS.bold[0]} strokeWidth="2" vectorEffect="non-scaling-stroke"/>;
        })()}

        {/* Sides */}
        {points.map((p, i) => {
           const nextP = points[(i + 1) % 3];
           const isVisible = data.style.visibleSides[i];
           const color = data.style.sideColors[i] || COLORS.subdued;
           return (
             <line 
               key={`side-${i}`}
               x1={p.x} y1={p.y} 
               x2={nextP.x} y2={nextP.y} 
               stroke={isVisible ? color : COLORS.subdued} 
               strokeWidth={isVisible ? 4 : 2}
               strokeLinecap="round"
               vectorEffect="non-scaling-stroke"
             />
           );
        })}

        {/* Vertices */}
        {points.map((p, i) => (
           <circle key={`v-${i}`} cx={p.x} cy={p.y} r={3} fill="#475569" />
        ))}

        {/* Labels - Counter-rotated */}
        {showLabels && points.map((p, i) => {
            const labelIdx = data.labelIndices[i];
            const labelText = labels[labelIdx];
            const totalRot = data.rotation + rotation;
            const scaleX = (data.isFlipped ? -1 : 1) * (flip ? -1 : 1);
            
            return (
               <g key={`lbl-${i}`} transform={`translate(${p.x}, ${p.y}) scale(${scaleX}, 1) rotate(${-totalRot})`}>
                 <text 
                   y={-22} 
                   textAnchor="middle" 
                   dominantBaseline="middle"
                   className="fill-slate-900 font-bold text-xl drop-shadow-sm select-none"
                   style={{ textShadow: '0px 0px 4px white' }}
                 >
                   {labelText}
                 </text>
               </g>
            );
        })}
      </g>
    </svg>
  );
};

export default TriangleSVG;
