import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Award, Star, Target, Lightbulb, BookOpen, GraduationCap as CapIcon } from 'lucide-react';

// CATEGORY_ICONS is removed as icons are no longer used for labels

export default function SuccessRadarChart({ data, studentName, size = 600 }) {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size / 2) * 0.5; // Reduced from 0.55 to give even more room for 25-char labels
  const numPoints = data.length;

  const points = useMemo(() => {
    return data.map((d, i) => {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      // Score is 0-100, normalize to 0-1
      const normalizedScore = (d.score || 0) / 100;
      
      // We want some minimum distance so it's visible
      const r = Math.max(normalizedScore * radius, 10); 
      
      return {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
        // Increased label radius for better breathing room
        labelX: centerX + (radius + 20) * Math.cos(angle),
        labelY: centerY + (radius + 20) * Math.sin(angle),
        axisX: centerX + radius * Math.cos(angle),
        axisY: centerY + radius * Math.sin(angle),
        angle,
        label: d.competence,
        score: d.score
      };
    });
  }, [data, radius, centerX, centerY, numPoints]);

  const polygonPath = useMemo(() => {
    if (points.length < 3) return "";
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  }, [points]);

  // Guides (concentric circles)
  const guides = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-col items-center justify-center bg-white p-4 md:p-8 rounded-[40px] shadow-2xl border border-indigo-50 min-h-[550px]">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {/* External decorative Rings */}
          <circle cx={centerX} cy={centerY} r={radius + 60} fill="none" stroke="#F8FAFF" strokeWidth="40" />
          {/* Removed: <circle cx={centerX} cy={centerY} r={radius + 40} fill="none" stroke="#EEF2FF" strokeWidth="2" strokeDasharray="8 8" /> */}

          {/* Web Axes Lines */}
          {points.map((p, i) => (
            <line
              key={`axis-${i}`}
              x1={centerX}
              y1={centerY}
              x2={p.axisX}
              y2={p.axisY}
              stroke="#E2E8F0"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          ))}

          {/* Concentric Guide Circles */}
          {guides.map((g, i) => (
            <circle
              key={`guide-${i}`}
              cx={centerX}
              cy={centerY}
              r={radius * g}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="1"
              opacity={0.5}
            />
          ))}

          {/* Value Labels on Axis (25, 50, 75, 100) */}
          {guides.map((g, i) => (
             <text
               key={`label-${i}`}
               x={centerX}
               y={centerY - (radius * g) - 6}
               className="text-[9px] font-black text-indigo-200 pointer-events-none"
               textAnchor="middle"
             >
               {g * 100}%
             </text>
          ))}

          {/* The Spider Web / Data Polygon */}
          <motion.path
            d={polygonPath}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            fill="rgba(79, 70, 229, 0.2)"
            stroke="#4F46E5"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Data Points (Dots) */}
          {points.map((p, i) => (
            <circle
              key={`point-${i}`}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="white"
              stroke="#4F46E5"
              strokeWidth="2"
            />
          ))}

          {/* Labels around the circle */}
          {(() => {
            const wrapText = (text, limit) => {
              if (!text) return [''];
              const words = text.split(' ');
              const lines = [];
              let currentLine = '';

              words.forEach(word => {
                if ((currentLine + word).length <= limit) {
                  currentLine += (currentLine ? ' ' : '') + word;
                } else {
                  if (currentLine) lines.push(currentLine);
                  currentLine = word;
                }
              });
              if (currentLine) lines.push(currentLine);
              return lines;
            };

            return points.map((p, i) => {
              const cos = Math.cos(p.angle);
              const sin = Math.sin(p.angle);
              
              // Smart text anchor based on angle
              let textAnchor = "middle";
              if (cos > 0.2) textAnchor = "start";
              else if (cos < -0.2) textAnchor = "end";

              const wrappedLines = wrapText(p.label, 25);
              const lineHeight = 1.1; // em

              // Vertical adjustment
              let dy = "0.35em";
              if (sin < -0.8) {
                // For top labels, move up based on number of lines to clear the 100% mark
                dy = `-${(wrappedLines.length - 1) * lineHeight + 1.8}em`;
              } else if (sin > 0.8) {
                dy = "2em"; // Increased slightly for bottom labels
              }

              return (
                <g key={`label-group-${i}`}>
                  <text
                    x={p.labelX}
                    y={p.labelY}
                    dy={dy}
                    textAnchor={textAnchor}
                    className="text-[8px] font-black uppercase tracking-tight fill-slate-700 pointer-events-none"
                  >
                    {wrappedLines.map((line, idx) => (
                      <tspan
                        key={idx}
                        x={p.labelX}
                        dy={idx === 0 ? 0 : `${lineHeight}em`}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            });
          })()}

          {/* Central Decoration (Simple Circle) */}
          {/* Removed: <g> ... </g> */}
          <circle cx={centerX} cy={centerY} r="10" fill="white" stroke="#EEF2FF" strokeWidth="2" />
        </svg>
      </div>
      
    </div>
  );
}
