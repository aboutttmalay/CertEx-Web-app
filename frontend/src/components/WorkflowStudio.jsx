import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Settings,
  RefreshCw,
  Database,
  Terminal,
  CheckCircle2,
  ArrowRight,
  Gauge,
  ShieldCheck,
  Layers,
  AlertTriangle,
  Check,
  Circle,
} from 'lucide-react';
import { API_ROUTES } from '../config';

const WorkflowStudio = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [integrityResult, setIntegrityResult] = useState(null);
  const [kpiValues, setKpiValues] = useState({
    reliability: '--',
    retryBudget: '--',
    executionLayers: '--',
  });

  const stats = [
    { label: 'Pipeline Reliability', value: kpiValues.reliability, icon: ShieldCheck, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    { label: 'SQL Retry Budget', value: kpiValues.retryBudget, icon: Gauge, tone: 'text-cyan-700 bg-cyan-50 border-cyan-100' },
    { label: 'Execution Layers', value: kpiValues.executionLayers, icon: Layers, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
  ];

  const steps = [
    {
      id: 1,
      title: 'Data Ingestion',
      icon: <Database className="w-5 h-5 text-blue-500" />,
      status: 'ready',
      desc: 'Connect enterprise sources and generate a normalized dataframe.',
    },
    {
      id: 2,
      title: 'Auto-Structuring',
      icon: <Settings className="w-5 h-5 text-indigo-500" />,
      status: 'ready',
      desc: 'Detect schema, enrich metadata, and apply deterministic typing rules.',
    },
    {
      id: 3,
      title: 'Reflexion Logic',
      icon: <RefreshCw className="w-5 h-5 text-emerald-500" />,
      status: 'ready',
      desc: 'Generate SQL, validate execution, and self-correct with retry feedback.',
    },
    {
      id: 4,
      title: 'Ghost Factory',
      icon: <Terminal className="w-5 h-5 text-amber-500" />,
      status: 'ready',
      desc: 'Simulate adversarial prompts to evaluate reasoning robustness at scale.',
    },
  ];

  const runIntegrityCheck = async () => {
    setIsChecking(true);
    const toastId = toast.loading('Running integrity check...');

    try {
      const response = await axios.get(API_ROUTES.integrityCheck);
      setIntegrityResult(response.data);
      const checks = response.data?.checks || [];
      const okCount = checks.filter((check) => check.status === 'ok').length;
      const reliabilityPercent = checks.length ? Math.round((okCount / checks.length) * 100) : 0;
      setKpiValues((prev) => ({ ...prev, reliability: `${reliabilityPercent}%` }));

      if (response.data.status === 'healthy') {
        toast.success('Integrity check passed. All systems healthy.', { id: toastId });
      } else if (response.data.status === 'needs_setup') {
        toast.warning('Integrity check completed. Setup still required.', { id: toastId });
      } else {
        toast.error('Integrity check found degraded services.', { id: toastId });
      }
    } catch (error) {
      const message = error?.response?.data?.detail || 'Integrity check failed.';
      toast.error(message, { id: toastId });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const [capabilitiesRes, workflowRes, integrityRes] = await Promise.all([
          axios.get(API_ROUTES.capabilities),
          axios.get(API_ROUTES.workflow),
          axios.get(API_ROUTES.integrityCheck),
        ]);

        const retryBudget = capabilitiesRes.data?.reflexion_max_retries;
        const stageCount = workflowRes.data?.stages?.length;
        const checks = integrityRes.data?.checks || [];
        const okCount = checks.filter((check) => check.status === 'ok').length;
        const reliabilityPercent = checks.length ? Math.round((okCount / checks.length) * 100) : 0;

        setIntegrityResult(integrityRes.data);
        setKpiValues({
          reliability: `${reliabilityPercent}%`,
          retryBudget: `${retryBudget ?? '--'} Steps`,
          executionLayers: `${stageCount ?? '--'} Stages`,
        });
      } catch {
        setKpiValues({
          reliability: 'N/A',
          retryBudget: 'N/A',
          executionLayers: 'N/A',
        });
      }
    };

    loadMetrics();
  }, []);

  const statusUi = {
    healthy: {
      text: 'Healthy',
      tone: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
      icon: Check,
    },
    degraded: {
      text: 'Degraded',
      tone: 'text-red-300 border-red-400/30 bg-red-500/10',
      icon: AlertTriangle,
    },
    needs_setup: {
      text: 'Needs Setup',
      tone: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
      icon: Circle,
    },
  };

  const checkStatusUi = {
    ok: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    warning: 'text-amber-700 bg-amber-50 border-amber-200',
    error: 'text-red-700 bg-red-50 border-red-200',
  };

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-2xl border p-4 ${stat.tone}`}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">{stat.label}</p>
                <Icon size={16} />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">{stat.value}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Execution Pipeline</h2>
        <p className="mt-1 text-sm text-slate-500">Operational view of each CertEx stage with readiness indicators.</p>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.id} className="group rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-cyan-300 hover:bg-cyan-50/50">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white bg-white shadow-sm">
                  {step.icon}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  <CheckCircle2 size={12} />
                  {step.status}
                </span>
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-800">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{step.desc}</p>

              {index < steps.length - 1 && (
                <div className="mt-4 hidden items-center gap-2 text-[11px] font-semibold text-slate-400 lg:flex">
                  Next Stage
                  <ArrowRight size={13} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold">Runtime Verification</h3>
            <p className="mt-1 text-sm text-slate-400">
              Trigger a full readiness check for ingestion, SQL reasoning, and simulation modules.
            </p>
          </div>
          <button
            onClick={runIntegrityCheck}
            disabled={isChecking}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isChecking ? 'Checking...' : 'Run Integrity Check'}
          </button>
        </div>

        {!integrityResult && (
          <div className="mt-6 flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 p-10">
            <div className="text-center">
              <RefreshCw className={`mx-auto mb-3 h-8 w-8 text-cyan-400 ${isChecking ? 'animate-spin' : ''}`} />
              <p className="text-sm font-medium text-slate-300">Press Run Integrity Check to load runtime diagnostics.</p>
            </div>
          </div>
        )}

        {integrityResult && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              {(() => {
                const StatusIcon = statusUi[integrityResult.status]?.icon || Circle;
                return <StatusIcon size={14} />;
              })()}
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusUi[integrityResult.status]?.tone || statusUi.needs_setup.tone}`}>
                {statusUi[integrityResult.status]?.text || 'Unknown'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {integrityResult.checks.map((check) => (
                <div key={check.name} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-200">{check.label}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${checkStatusUi[check.status] || checkStatusUi.warning}`}>
                      {check.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">{check.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default WorkflowStudio;