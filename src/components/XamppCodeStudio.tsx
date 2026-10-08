import React, { useState } from 'react';
import { XAMPP_BLUEPRINT_FILES, BlueprintFile } from '../data/xamppBlueprints';
import { Copy, Check, Download, FileCode, Database, Terminal, BookOpen } from 'lucide-react';

export const XamppCodeStudio: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>(XAMPP_BLUEPRINT_FILES[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeFile: BlueprintFile =
    XAMPP_BLUEPRINT_FILES.find((f) => f.id === selectedFileId) || XAMPP_BLUEPRINT_FILES[0];

  const handleCopyCode = async (file: BlueprintFile) => {
    try {
      await navigator.clipboard.writeText(file.code);
      setCopiedId(file.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback copy
    }
  };

  const handleDownloadFile = (file: BlueprintFile) => {
    const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Environment Stack Specifications */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              L4 XAMPP / Apache / MySQL (Port 3306) & PHP Source Code Package
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Complete production-ready SQL DDL, Server-Side PHP PDO scripts, Cron Engine, and completed index.html for local XAMPP deployment and assessment defense.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopyCode(activeFile)}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              {copiedId === activeFile.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied {activeFile.filename}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy {activeFile.filename}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleDownloadFile(activeFile)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {activeFile.filename}</span>
            </button>
          </div>
        </div>

        {/* XAMPP Stack Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-slate-500">Web Server (httpd.conf)</div>
            <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
              Apache · Port 80
            </div>
            <div className="text-slate-600 mt-0.5">DocumentRoot: C:\xampp\htdocs\gmms</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-slate-500">Database Engine (my.ini)</div>
            <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
              MySQL / MariaDB · Port 3306
            </div>
            <div className="text-slate-600 mt-0.5">Schema: gmms_db (InnoDB 3NF)</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-slate-500">Graphic Console</div>
            <div className="font-mono font-semibold text-slate-900 mt-0.5">
              http://localhost/phpmyadmin
            </div>
            <div className="text-slate-600 mt-0.5">Import gmms_database.sql</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-slate-500">Cron / Penalty Scheduler</div>
            <div className="font-mono font-semibold text-slate-900 mt-0.5">
              cron_penalties.php
            </div>
            <div className="text-slate-600 mt-0.5">Enforces 5th-of-Month Arrears Rule</div>
          </div>
        </div>
      </div>

      {/* File Selector Tabs + Code Viewer */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex flex-wrap items-center gap-2">
          {XAMPP_BLUEPRINT_FILES.map((file) => {
            const isSelected = file.id === activeFile.id;
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => setSelectedFileId(file.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {file.language === 'sql' ? (
                  <Database className="w-3.5 h-3.5" />
                ) : file.language === 'php' ? (
                  <Terminal className="w-3.5 h-3.5" />
                ) : (
                  <FileCode className="w-3.5 h-3.5" />
                )}
                <span className="font-mono">{file.filename}</span>
              </button>
            );
          })}
        </div>

        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono">{activeFile.pathInXampp}</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-emerald-700">{activeFile.l4RequirementTag}</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mt-1">{activeFile.title}</h3>
            <p className="text-xs text-slate-600 mt-0.5">{activeFile.description}</p>
          </div>
        </div>

        <div className="bg-slate-950 p-5 overflow-x-auto max-h-[600px] overflow-y-auto">
          <pre className="text-xs font-mono text-slate-100 leading-relaxed tabular-nums">
            <code>{activeFile.code}</code>
          </pre>
        </div>
      </div>

      {/* L4 Assessment Viva Defense Talking Points */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <BookOpen className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">
            L4 Technical Presentation Defense Notes (How to Explain to Assessors)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-600 leading-relaxed">
          <div className="space-y-1.5">
            <div className="font-semibold text-slate-900">
              01. Defending Visual Stall Mapping
            </div>
            <p>
              Explain that the `stalls` table stores explicit spatial coordinates (`grid_row`, `grid_col`, `zone_name`) and an `ENUM('AVAILABLE', 'OCCUPIED', 'SUB_LEASED', 'MAINTENANCE')`. The PHP endpoint `api.php?action=stall_map` joins `stalls`, `stall_allocations`, and `sublease_ledger` in a single query to feed the frontend grid array without N+1 queries.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="font-semibold text-slate-900">
              02. Defending Smart Penalty Automation
            </div>
            <p>
              Point to both `sp_compute_monthly_penalties` in MySQL and `SmartPenaltyAutomationEngine` in `cron_penalties.php`. Emphasize that every billing cycle sets `due_date` to the `5th` of the month. Once `DATEDIFF(eval_date, due_date) &gt; 0`, the system applies a 5% statutory trigger fee plus a 1% daily cumulative surcharge on unpaid principal.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="font-semibold text-slate-900">
              03. Defending Sub-Letting Relational Tracking
            </div>
            <p>
              Show the `sublease_ledger` table which holds two distinct Foreign Keys referencing `vendors(vendor_id)`: `primary_vendor_id` (the citizen leased by the District) and `operational_tenant_id` (the merchant operating on-site), enforced by `CHECK (primary_vendor_id &lt;&gt; operational_tenant_id)` and a generated `markup_percentage` column to prevent illegal rent gouging.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
