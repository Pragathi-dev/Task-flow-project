/**
 * CompletionTrendChart.tsx — Pure SVG Area/Line Chart for 7-Day Completion & Creation Trends.
 *
 * Single Responsibility: Render 7-day daily trend curve using pure SVG graphics.
 * Strictly avoids third-party chart libraries (Recharts / Chart.js).
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { RiLineChartLine } from 'react-icons/ri';
import { Card } from '@/components/common/Card';
import type { WeeklyTrendData } from '@/types/analytics.types';

export interface CompletionTrendChartProps {
  trend: WeeklyTrendData[];
}

export function CompletionTrendChart({ trend }: CompletionTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 600;
  const height = 200;
  const paddingX = 40;
  const paddingY = 25;

  const maxVal = Math.max(
    5,
    ...trend.map((d) => Math.max(d.created, d.completed)),
  );

  const stepX = trend.length > 1 ? (width - paddingX * 2) / (trend.length - 1) : 0;

  // Compute point coordinates
  const createdPoints = trend.map((d, i) => {
    const x = paddingX + i * stepX;
    const y = height - paddingY - (d.created / maxVal) * (height - paddingY * 2);
    return { x, y, data: d };
  });

  const completedPoints = trend.map((d, i) => {
    const x = paddingX + i * stepX;
    const y = height - paddingY - (d.completed / maxVal) * (height - paddingY * 2);
    return { x, y, data: d };
  });

  // Generate SVG path string (Line & Area)
  const buildPath = (pts: typeof createdPoints) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const buildAreaPath = (pts: typeof createdPoints) => {
    if (pts.length === 0) return '';
    const linePath = buildPath(pts);
    const lastX = pts[pts.length - 1].x;
    const firstX = pts[0].x;
    const bottomY = height - paddingY;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const createdPathStr = buildPath(createdPoints);
  const createdAreaStr = buildAreaPath(createdPoints);

  const completedPathStr = buildPath(completedPoints);
  const completedAreaStr = buildAreaPath(completedPoints);

  return (
    <Card className="p-5 sm:p-6 flex flex-col justify-between space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <RiLineChartLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Completion & Creation Trend
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              7-day activity velocity trajectory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
            <span className="text-zinc-600 dark:text-zinc-400">Created</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="text-zinc-600 dark:text-zinc-400">Completed</span>
          </div>
        </div>
      </div>

      {/* SVG Line / Area Chart */}
      <div className="w-full relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 sm:h-56 overflow-visible"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {[0, 0.33, 0.66, 1].map((ratio) => {
            const y = paddingY + ratio * (height - paddingY * 2);
            return (
              <line
                key={ratio}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="currentColor"
                strokeDasharray="4 4"
                className="text-zinc-200 dark:text-zinc-800"
              />
            );
          })}

          {/* Area Fills */}
          <motion.path
            d={createdAreaStr}
            fill="url(#createdGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.path
            d={completedAreaStr}
            fill="url(#completedGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Lines */}
          <motion.path
            d={createdPathStr}
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8 }}
          />
          <motion.path
            d={completedPathStr}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8 }}
          />

          {/* Points & Interactive Hover Circles */}
          {trend.map((day, idx) => {
            const cp = createdPoints[idx];
            const dp = completedPoints[idx];
            const isHovered = hoveredIdx === idx;

            return (
              <g key={day.date} className="cursor-pointer">
                {/* Hover trigger zone */}
                <rect
                  x={cp.x - stepX / 2}
                  y={0}
                  width={stepX}
                  height={height}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {/* Vertical hover line */}
                {isHovered && (
                  <line
                    x1={cp.x}
                    y1={paddingY}
                    x2={cp.x}
                    y2={height - paddingY}
                    stroke="#a1a1aa"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Dots */}
                <circle cx={cp.x} cy={cp.y} r={isHovered ? 6 : 4} fill="#6366f1" />
                <circle cx={dp.x} cy={dp.y} r={isHovered ? 6 : 4} fill="#10b981" />

                {/* Day Labels */}
                <text
                  x={cp.x}
                  y={height - 5}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[10px] font-semibold"
                >
                  {day.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIdx !== null && (
          <div
            className="absolute top-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold p-2.5 rounded-lg shadow-lg pointer-events-none transition-all z-20 space-y-1"
            style={{
              left: `${((hoveredIdx * stepX + paddingX) / width) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-bold border-b border-zinc-700 dark:border-zinc-300 pb-1 mb-1">
              {trend[hoveredIdx].label} ({trend[hoveredIdx].date})
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-indigo-400 dark:text-indigo-600">Created:</span>
              <span>{trend[hoveredIdx].created}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-emerald-400 dark:text-emerald-600">Completed:</span>
              <span>{trend[hoveredIdx].completed}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
