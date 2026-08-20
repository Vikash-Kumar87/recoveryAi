// ============================================================
// RecoverAI — Settings Page (Premium UI Redesign)
// ============================================================
import { useState, useEffect } from 'react';
import {
  Bell,
  Shield,
  Link2,
  Sliders,
  Save,
  CheckCircle,
  Brain,
  Zap,
  RefreshCw,
  AlertTriangle,
  Info,
  Database,
  Mail,
  MessageSquare,
  Globe,
  Lock,
  Activity,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { getSettings, updateSettings } from '../services/api';
import { clsx } from 'clsx';

// ── Toggle Component ─────────────────────────────────────────
interface ToggleProps {
  enabled: boolean;
  onChange: (v: boolean) => void;
  id: string;
  disabled?: boolean;
}

const Toggle = ({ enabled, onChange, id, disabled }: ToggleProps) => (
  <button
    id={id}
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={clsx(
      'relative w-11 h-6 rounded-full transition-all duration-300 flex items-center flex-shrink-0',
      'focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 focus:ring-offset-slate-900',
      enabled
        ? 'bg-gradient-to-r from-brand-600 to-brand-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
        : 'bg-slate-700 hover:bg-slate-600',
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
    )}
    role="switch"
    aria-checked={enabled}
  >
    <span
      className={clsx(
        'absolute w-4.5 h-4.5 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center',
        enabled
          ? 'translate-x-[22px] bg-white'
          : 'translate-x-[3px] bg-slate-300'
      )}
    />
  </button>
);

// ── Section Component ────────────────────────────────────────
const Section = ({
  title,
  icon: Icon,
  badge,
  children,
  status,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  children: React.ReactNode;
  status?: 'active' | 'inactive' | 'warning';
}) => (
  <div className="card overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50">
      <div className="flex items-center gap-3">
        <div className={clsx(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          status === 'active' ? 'bg-brand-600/20' :
          status === 'warning' ? 'bg-warning-500/20' :
          'bg-slate-800'
        )}>
          <Icon size={15} className={clsx(
            status === 'active' ? 'text-brand-400' :
            status === 'warning' ? 'text-warning-400' :
            'text-slate-400'
          )} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          {badge && (
            <span className="text-[10px] text-brand-400 font-mono">{badge}</span>
          )}
        </div>
      </div>
      {status && (
        <div className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium',
          status === 'active' ? 'bg-success-500/10 text-success-400' :
          status === 'warning' ? 'bg-warning-500/10 text-warning-400' :
          'bg-slate-800 text-slate-500'
        )}>
          <div className={clsx(
            'w-1.5 h-1.5 rounded-full',
            status === 'active' ? 'bg-success-500 animate-pulse' :
            status === 'warning' ? 'bg-warning-500' :
            'bg-slate-600'
          )} />
          {status === 'active' ? 'Active' : status === 'warning' ? 'Warning' : 'Inactive'}
        </div>
      )}
    </div>
    <div className="p-5 space-y-5">{children}</div>
  </div>
);

// ── Setting Row Component ────────────────────────────────────
const SettingRow = ({
  label,
  description,
  badge,
  children,
}: {
  label: string;
  description?: string;
  badge?: { text: string; color: 'green' | 'blue' | 'yellow' | 'red' };
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <p className="text-xs font-medium text-slate-200">{label}</p>
        {badge && (
          <span className={clsx(
            'text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide',
            badge.color === 'green' ? 'bg-success-500/15 text-success-400' :
            badge.color === 'blue' ? 'bg-brand-500/15 text-brand-400' :
            badge.color === 'yellow' ? 'bg-warning-500/15 text-warning-400' :
            'bg-error-500/15 text-error-400'
          )}>
            {badge.text}
          </span>
        )}
      </div>
      {description && (
        <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
      )}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

// ── Stat Card ────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, color }: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}) => (
  <div className="flex items-center gap-3 p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
    <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
      <Icon size={16} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-slate-500 truncate">{label}</p>
      <p className="text-sm font-bold text-slate-100">{value}</p>
      {sub && <p className="text-[10px] text-slate-600">{sub}</p>}
    </div>
  </div>
);

// ── Main Settings Page ───────────────────────────────────────
const SettingsPage = () => {
  const { addToast } = useAppStore();

  const [aiEnabled, setAiEnabled] = useState(true);
  const [autoRetry, setAutoRetry] = useState(true);
  const [sendMessages, setSendMessages] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [alertEmail, setAlertEmail] = useState('merchant@recoverai.in');
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [retryThreshold, setRetryThreshold] = useState(70);
  const [maxRetries, setMaxRetries] = useState(3);
  const [apiUrl] = useState(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Track unsaved changes
  const markDirty = () => setIsDirty(true);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const s = await getSettings();
        if (s) {
          setAiEnabled(s.enableAiRecovery ?? true);
          setAutoRetry(s.autoStartRecovery ?? true);
          setSendMessages(s.autoSendMessages ?? false);
          setEmailAlerts(s.emailAlerts ?? true);
          setSmsAlerts(s.smsAlerts ?? false);
          setAlertEmail(s.alertEmail ?? 'merchant@recoverai.in');
          setWebhookEnabled(s.webhookEnabled ?? false);
          setRetryThreshold(s.recoveryThreshold ?? 70);
          setMaxRetries(s.maxRetryAttempts ?? 3);
        }
      } catch {
        addToast({ type: 'error', title: 'Could not load settings from server' });
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        enableAiRecovery: aiEnabled,
        autoStartRecovery: autoRetry,
        autoSendMessages: sendMessages,
        recoveryThreshold: retryThreshold,
        maxRetryAttempts: maxRetries,
        emailAlerts,
        smsAlerts,
        alertEmail,
        webhookEnabled,
      });
      const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      setLastSaved(now);
      setIsDirty(false);
      addToast({
        type: 'success',
        title: 'Settings saved to MongoDB ✓',
        message: 'Your configuration will persist across restarts.',
      });
    } catch {
      addToast({ type: 'error', title: 'Failed to save settings', message: 'Please check your connection' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (setter: (v: boolean) => void) => (v: boolean) => {
    setter(v);
    markDirty();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw size={18} className="animate-spin text-brand-400" />
          <span className="text-sm">Loading settings from MongoDB...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5 animate-fade-in">

      {/* System Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="AI Engine" value="Groq Cloud" sub="openai/gpt-oss-120b" icon={Brain} color="bg-brand-600" />
        <StatCard label="Database" value="MongoDB Atlas" sub="recoveryai cluster" icon={Database} color="bg-success-600" />
        <StatCard label="API Status" value="Healthy" sub="Port 5000" icon={Activity} color="bg-accent-600" />
        <StatCard label="Security" value="Server-Side" sub="Keys never exposed" icon={Lock} color="bg-slate-600" />
      </div>

      {/* Unsaved changes banner */}
      {isDirty && (
        <div className="flex items-center gap-3 px-4 py-3 bg-warning-500/10 border border-warning-500/30 rounded-xl">
          <AlertTriangle size={14} className="text-warning-400 flex-shrink-0" />
          <p className="text-xs text-warning-300 flex-1">You have unsaved changes. Click "Save Settings" to persist to MongoDB.</p>
          <button onClick={handleSave} className="text-xs font-semibold text-warning-400 hover:text-warning-300 transition-colors">
            Save now →
          </button>
        </div>
      )}

      {/* AI Configuration */}
      <Section title="AI Recovery Agent" icon={Brain} badge="Powered by Groq LLM" status={aiEnabled ? 'active' : 'inactive'}>
        <SettingRow
          label="Enable AI Recovery"
          description="Automatically analyze every failed payment using Groq AI and generate a recovery strategy."
          badge={{ text: 'Core', color: 'blue' }}
        >
          <Toggle id="toggle-ai-enabled" enabled={aiEnabled} onChange={handleToggle(setAiEnabled)} />
        </SettingRow>

        <div className="border-t border-slate-800/60" />

        <SettingRow
          label="Auto-Start Recovery Workflow"
          description="Automatically begin the recovery workflow for payments above the recovery threshold."
          badge={{ text: 'Auto', color: 'green' }}
        >
          <Toggle id="toggle-auto-retry" enabled={autoRetry} onChange={handleToggle(setAutoRetry)} disabled={!aiEnabled} />
        </SettingRow>

        <div className="border-t border-slate-800/60" />

        <SettingRow
          label="Auto-Send Recovery Messages"
          description="Automatically dispatch personalized WhatsApp/SMS messages to customers without manual approval."
          badge={{ text: 'Caution', color: 'yellow' }}
        >
          <Toggle id="toggle-send-messages" enabled={sendMessages} onChange={handleToggle(setSendMessages)} disabled={!aiEnabled} />
        </SettingRow>

        <div className="border-t border-slate-800/60" />

        {/* Recovery Threshold Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-200">Recovery Threshold</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Minimum AI-predicted probability to trigger automated recovery
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={clsx(
                'text-lg font-bold tabular-nums',
                retryThreshold >= 80 ? 'text-success-400' :
                retryThreshold >= 60 ? 'text-brand-400' :
                'text-warning-400'
              )}>{retryThreshold}%</span>
            </div>
          </div>
          <div className="relative">
            <input
              id="recovery-threshold-input"
              type="range"
              min={10}
              max={100}
              step={5}
              value={retryThreshold}
              onChange={(e) => { setRetryThreshold(Number(e.target.value)); markDirty(); }}
              className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500
                [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(99,102,241,0.6)] [&::-webkit-slider-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgb(99 102 241) ${retryThreshold}%, rgb(51 65 85) ${retryThreshold}%)`,
              }}
            />
            <div className="flex justify-between mt-1.5 px-0.5">
              <span className="text-[9px] text-slate-600">10% (Aggressive)</span>
              <span className="text-[9px] text-slate-600">100% (Conservative)</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/60" />

        {/* Max Retries */}
        <SettingRow
          label="Max Retry Attempts"
          description="Maximum number of automated retry attempts per failed payment before escalating."
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setMaxRetries(Math.max(1, maxRetries - 1)); markDirty(); }}
              className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-bold flex items-center justify-center"
            >−</button>
            <span className="w-8 text-center text-sm font-bold text-slate-100 tabular-nums">{maxRetries}</span>
            <button
              onClick={() => { setMaxRetries(Math.min(10, maxRetries + 1)); markDirty(); }}
              className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-bold flex items-center justify-center"
            >+</button>
          </div>
        </SettingRow>
      </Section>

      {/* Notifications */}
      <Section title="Notifications & Alerts" icon={Bell} status={emailAlerts || smsAlerts ? 'active' : 'inactive'}>
        <SettingRow
          label="Email Alerts"
          description="Receive email notifications for recovery events, workflow completions, and AI decisions."
        >
          <div className="flex items-center gap-2.5">
            <Mail size={13} className={emailAlerts ? 'text-brand-400' : 'text-slate-600'} />
            <Toggle id="toggle-email" enabled={emailAlerts} onChange={handleToggle(setEmailAlerts)} />
          </div>
        </SettingRow>

        <div className="border-t border-slate-800/60" />

        <SettingRow
          label="SMS / WhatsApp Alerts"
          description="Receive SMS notifications for critical recovery events and payment status changes."
        >
          <div className="flex items-center gap-2.5">
            <MessageSquare size={13} className={smsAlerts ? 'text-brand-400' : 'text-slate-600'} />
            <Toggle id="toggle-sms" enabled={smsAlerts} onChange={handleToggle(setSmsAlerts)} />
          </div>
        </SettingRow>

        <div className="border-t border-slate-800/60" />

        <SettingRow label="Alert Email Address" description="Recovery event notifications will be sent to this address.">
          <div className="relative">
            <Mail size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={alertEmail}
              onChange={(e) => { setAlertEmail(e.target.value); markDirty(); }}
              className="input-base pl-8 w-56 text-xs"
              id="alert-email-input"
              placeholder="admin@company.com"
            />
          </div>
        </SettingRow>
      </Section>



      {/* Save Bar */}
      <div className="sticky bottom-4 z-10">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            {lastSaved ? (
              <>
                <CheckCircle size={14} className="text-success-400" />
                <span className="text-xs text-slate-400">Saved to MongoDB at <span className="text-slate-300 font-medium">{lastSaved}</span></span>
              </>
            ) : isDirty ? (
              <>
                <AlertTriangle size={14} className="text-warning-400" />
                <span className="text-xs text-warning-300">Unsaved changes</span>
              </>
            ) : (
              <>
                <CheckCircle size={14} className="text-slate-600" />
                <span className="text-xs text-slate-600">No changes</span>
              </>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={clsx(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
              isDirty && !saving
                ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-[0_0_16px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            )}
            id="save-settings-btn"
          >
            {saving ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? 'Saving to MongoDB...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
