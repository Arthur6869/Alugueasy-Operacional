import React, { useRef, useState, useEffect } from 'react';
import { TeamAvatar } from './TeamAvatar';
import { Upload, Sun, Moon, Bell, Lock, Globe, Mail, Smartphone, Camera, Eye, EyeOff, Check, X, Download, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTasksContext } from '../../lib/TasksContext';
import { exportToCSV, exportToExcel } from '../../lib/exportData';

interface SettingsScreenProps {
  currentUser: 'Arthur' | 'Yasmim' | 'Alexandre' | 'Nikolas';
  currentTheme: 'light' | 'dark';
}

const teamMembers = ['Arthur', 'Yasmim', 'Alexandre', 'Nikolas'] as const;

function loadProfileData(user: string) {
  try {
    const raw = localStorage.getItem(`profileData_${user}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadNotifPrefs(user: string) {
  try {
    const raw = localStorage.getItem(`notifPrefs_${user}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function SettingsScreen({ currentUser, currentTheme }: SettingsScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tasks } = useTasksContext();
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingXLSX, setExportingXLSX] = useState(false);

  // ── Profile ──
  const saved = loadProfileData(currentUser);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(
    () => localStorage.getItem(`profilePhoto_${currentUser}`)
  );
  const [firstName, setFirstName] = useState(saved?.firstName ?? currentUser);
  const [lastName, setLastName] = useState(saved?.lastName ?? 'Silva');
  const [cargo, setCargo] = useState(saved?.cargo ?? 'Gerente de Projetos');
  const [departamento, setDepartamento] = useState(saved?.departamento ?? 'Operacional');
  const [bio, setBio] = useState(saved?.bio ?? '');
  const [profileSaved, setProfileSaved] = useState(false);

  // ── Appearance ──
  const [theme, setTheme] = useState<'light' | 'dark'>(currentTheme);
  useEffect(() => { setTheme(currentTheme); }, [currentTheme]);

  // ── Language ──
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'pt-BR');
  const [timezone, setTimezone] = useState(localStorage.getItem('timezone') || '(GMT-03:00) Brasília');
  const [dateFormat, setDateFormat] = useState(localStorage.getItem('dateFormat') || 'DD/MM/YYYY');

  // ── Notifications activity ──
  const savedNotif = loadNotifPrefs(currentUser);
  const [notifActivity, setNotifActivity] = useState<Record<string, boolean>>({
    assignment: savedNotif?.assignment ?? true,
    comments: savedNotif?.comments ?? true,
    deadline: savedNotif?.deadline ?? true,
    weeklySummary: savedNotif?.weeklySummary ?? false,
    followedTasks: savedNotif?.followedTasks ?? true,
    mentions: savedNotif?.mentions ?? true,
  });

  // ── Notification channels ──
  const [emailNotifications, setEmailNotifications] = useState(savedNotif?.emailNotifications ?? true);
  const [pushNotifications, setPushNotifications] = useState(savedNotif?.pushNotifications ?? true);

  // ── Password ──
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // ── Helpers ──
  const toast = (type: 'success' | 'error', message: string) => {
    window.dispatchEvent(new CustomEvent('showToast', { detail: { type, message } }));
  };

  // ── Photo upload ──
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast('error', 'A imagem deve ter no máximo 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      localStorage.setItem(`profilePhoto_${currentUser}`, base64);
      setProfilePhoto(base64);
      window.dispatchEvent(new CustomEvent('profilePhotoUpdated', {
        detail: { member: currentUser, photo: base64 },
      }));
      toast('success', 'Foto de perfil atualizada!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Save profile ──
  const handleSaveProfile = () => {
    const data = { firstName, lastName, cargo, departamento, bio };
    localStorage.setItem(`profileData_${currentUser}`, JSON.stringify(data));
    setProfileSaved(true);
    toast('success', 'Alterações salvas com sucesso!');
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleCancelProfile = () => {
    const s = loadProfileData(currentUser);
    setFirstName(s?.firstName ?? currentUser);
    setLastName(s?.lastName ?? 'Silva');
    setCargo(s?.cargo ?? 'Gerente de Projetos');
    setDepartamento(s?.departamento ?? 'Operacional');
    setBio(s?.bio ?? '');
    toast('success', 'Alterações descartadas');
  };

  // ── Theme ──
  const handleThemeChange = (t: 'light' | 'dark') => {
    setTheme(t);
    window.dispatchEvent(new CustomEvent('changeTheme', { detail: t }));
    toast('success', `Tema ${t === 'light' ? 'Claro' : 'Escuro'} ativado!`);
  };

  // ── Language/Timezone/DateFormat ──
  const handleLanguage = (v: string) => {
    setLanguage(v);
    localStorage.setItem('language', v);
    const label = { 'pt-BR': 'Português (Brasil)', 'en-US': 'English (US)', 'es-ES': 'Español', 'fr-FR': 'Français' }[v] || v;
    toast('success', `Idioma alterado para ${label}`);
  };
  const handleTimezone = (v: string) => {
    setTimezone(v);
    localStorage.setItem('timezone', v);
    toast('success', 'Fuso horário atualizado');
  };
  const handleDateFormat = (v: string) => {
    setDateFormat(v);
    localStorage.setItem('dateFormat', v);
    toast('success', `Formato de data alterado para ${v}`);
  };

  // ── Notification prefs ──
  const saveNotifPrefs = (updated: Record<string, boolean>, email?: boolean, push?: boolean) => {
    const prefs = {
      ...updated,
      emailNotifications: email ?? emailNotifications,
      pushNotifications: push ?? pushNotifications,
    };
    localStorage.setItem(`notifPrefs_${currentUser}`, JSON.stringify(prefs));
  };

  const handleNotifActivity = (key: string, checked: boolean) => {
    const updated = { ...notifActivity, [key]: checked };
    setNotifActivity(updated);
    saveNotifPrefs(updated);
  };

  const handleEmailNotif = (checked: boolean) => {
    setEmailNotifications(checked);
    saveNotifPrefs(notifActivity, checked, pushNotifications);
    toast('success', `Notificações por email ${checked ? 'ativadas' : 'desativadas'}`);
  };

  const handlePushNotif = (checked: boolean) => {
    setPushNotifications(checked);
    saveNotifPrefs(notifActivity, emailNotifications, checked);
    toast('success', `Notificações push ${checked ? 'ativadas' : 'desativadas'}`);
  };

  // ── Change password ──
  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast('error', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('error', 'As senhas não coincidem');
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) {
      toast('error', `Erro ao alterar senha: ${error.message}`);
    } else {
      toast('success', 'Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    }
  };

  const notifActivityItems = [
    { key: 'assignment', label: 'Quando forem atribuídas tarefas a mim', description: 'Receba notificação quando alguém atribuir uma tarefa a você' },
    { key: 'comments', label: 'Quando comentarem nas minhas tarefas', description: 'Seja notificado sobre novos comentários' },
    { key: 'deadline', label: 'Prazo vencendo em 24h', description: 'Lembrete de tarefas com prazo próximo' },
    { key: 'weeklySummary', label: 'Resumo semanal por email', description: 'Receba um resumo das suas atividades toda segunda-feira' },
    { key: 'followedTasks', label: 'Mudanças em tarefas que sigo', description: 'Atualizações em tarefas que você marcou como favoritas' },
    { key: 'mentions', label: 'Menções em comentários', description: 'Quando alguém mencionar você com @' },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="p-6 md:p-8 max-w-3xl mx-auto pb-12 min-h-full">

        {/* Page Header */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-1">AlugEasy / Configurações</p>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie sua conta, preferências e configurações do sistema</p>
        </div>

        {/* ── Minha Conta ── */}
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Minha Conta</h2>

          {/* Avatar */}
          <div className="flex items-center gap-5 mb-6 pb-6 border-b border-border">
            <div className="relative group shrink-0">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={currentUser}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: { Arthur: '#4A9EDB', Yasmim: '#F472B6', Alexandre: '#34D399', Nikolas: '#F59E0B' }[currentUser] }}
                >
                  {currentUser.substring(0, 2).toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                title="Trocar foto"
              >
                <Camera size={20} className="text-white" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{firstName} {lastName}</p>
              <p className="text-sm text-muted-foreground">{currentUser.toLowerCase()}@alugueasy.com</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-1.5 text-sm text-[#4A9EDB] hover:underline flex items-center gap-1"
              >
                <Upload size={13} />
                Trocar foto de perfil
              </button>
              {profilePhoto && (
                <button
                  onClick={() => {
                    localStorage.removeItem(`profilePhoto_${currentUser}`);
                    setProfilePhoto(null);
                    window.dispatchEvent(new CustomEvent('profilePhotoUpdated', {
                      detail: { member: currentUser, photo: null },
                    }));
                    toast('success', 'Foto removida');
                  }}
                  className="ml-3 mt-1.5 text-sm text-red-500 hover:underline"
                >
                  Remover foto
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Form */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nome</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Sobrenome</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={`${currentUser.toLowerCase()}@alugueasy.com`}
                disabled
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed text-sm"
              />
              <p className="text-xs text-red-500 mt-1">Email não pode ser alterado</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Cargo</label>
              <input
                type="text"
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Departamento</label>
              <select
                value={departamento}
                onChange={e => setDepartamento(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] text-sm"
              >
                <option>Operacional</option>
                <option>Desenvolvimento</option>
                <option>Financeiro</option>
                <option>Marketing</option>
                <option>Recursos Humanos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Conte um pouco sobre você..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] resize-none text-sm"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
                style={{ backgroundColor: '#1E3A5F' }}
              >
                {profileSaved ? <Check size={15} /> : null}
                Salvar Alterações
              </button>
              <button
                onClick={handleCancelProfile}
                className="px-5 py-2 border border-border rounded-lg text-sm hover:bg-muted font-medium transition-all text-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        </section>

        {/* ── Aparência ── */}
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Aparência</h2>
          <div className="grid grid-cols-2 gap-4">
            {(['light', 'dark'] as const).map(t => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${
                  theme === t ? 'border-[#4A9EDB] bg-[#4A9EDB]/5' : 'border-border hover:border-gray-400 hover:bg-muted/50'
                }`}
              >
                {t === 'light'
                  ? <Sun className={`mb-2 ${theme === t ? 'text-[#4A9EDB]' : 'text-muted-foreground'}`} size={28} strokeWidth={1.5} />
                  : <Moon className={`mb-2 ${theme === t ? 'text-[#4A9EDB]' : 'text-muted-foreground'}`} size={28} strokeWidth={1.5} />
                }
                <span className={`text-sm font-medium ${theme === t ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {t === 'light' ? 'Claro' : 'Escuro'}
                </span>
                {theme === t && <span className="text-xs text-[#4A9EDB] mt-1">Ativo</span>}
              </button>
            ))}
          </div>
        </section>

        {/* ── Idioma e Região ── */}
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Globe size={18} /> Idioma e Região
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Idioma</label>
              <select value={language} onChange={e => handleLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] text-sm">
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
                <option value="fr-FR">Français</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Fuso Horário</label>
              <select value={timezone} onChange={e => handleTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] text-sm">
                <option>(GMT-03:00) Brasília</option>
                <option>(GMT-05:00) Nova York</option>
                <option>(GMT+00:00) Londres</option>
                <option>(GMT+01:00) Paris</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Formato de Data</label>
              <select value={dateFormat} onChange={e => handleDateFormat(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] text-sm">
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </section>

        {/* ── Atividades que geram notificações ── */}
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Atividades que geram notificações</h2>
          <div className="space-y-1">
            {notifActivityItems.map(item => (
              <label key={item.key} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-all">
                <input
                  type="checkbox"
                  checked={notifActivity[item.key]}
                  onChange={e => handleNotifActivity(item.key, e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#4A9EDB] focus:ring-[#4A9EDB]"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* ── Preferências de Notificação ── */}
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell size={18} /> Preferências de Notificação
          </h2>
          <div className="space-y-4">
            {[
              { icon: Mail, label: 'Notificações por Email', desc: 'Receba atualizações por email', value: emailNotifications, onChange: handleEmailNotif },
              { icon: Smartphone, label: 'Notificações Push', desc: 'Receba alertas no navegador', value: pushNotifications, onChange: handlePushNotif },
            ].map(({ icon: Icon, label, desc, value, onChange }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4A9EDB]" />
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* ── Segurança ── */}
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lock size={18} /> Segurança
          </h2>
          <div className="space-y-3">

            {/* Alterar Senha */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setShowPasswordForm(prev => !prev)}
                className="w-full px-4 py-3 hover:bg-muted/50 text-left transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">Alterar Senha</p>
                  <p className="text-xs text-muted-foreground">Defina uma nova senha para sua conta</p>
                </div>
                <span className="text-xs text-[#4A9EDB]">{showPasswordForm ? 'Fechar' : 'Alterar'}</span>
              </button>

              {showPasswordForm && (
                <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/20 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Nova Senha</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-3 py-2 pr-10 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] text-sm"
                      />
                      <button onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Confirmar Nova Senha</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full px-3 py-2 pr-10 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] text-sm"
                      />
                      <button onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 flex items-center gap-1"><X size={12} /> As senhas não coincidem</p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                    <p className="text-xs text-green-600 flex items-center gap-1"><Check size={12} /> Senhas coincidem</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleChangePassword}
                      disabled={pwLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                      className="px-4 py-1.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {pwLoading ? 'Salvando...' : 'Salvar Senha'}
                    </button>
                    <button
                      onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); }}
                      className="px-4 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-all text-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => toast('success', 'Autenticação de dois fatores em desenvolvimento')}
              className="w-full px-4 py-3 border border-border rounded-lg hover:bg-muted/50 text-left transition-all"
            >
              <p className="text-sm font-medium text-foreground">Autenticação de Dois Fatores</p>
              <p className="text-xs text-muted-foreground">Adicione uma camada extra de segurança</p>
            </button>

            <button
              onClick={() => toast('success', 'Histórico de sessões exibido')}
              className="w-full px-4 py-3 border border-border rounded-lg hover:bg-muted/50 text-left transition-all"
            >
              <p className="text-sm font-medium text-foreground">Sessões Ativas</p>
              <p className="text-xs text-muted-foreground">Gerenciar dispositivos conectados</p>
            </button>
          </div>
        </section>

        {/* ── Equipe ── */}
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Equipe</h2>
          <div className="space-y-2">
            {teamMembers.map(member => (
              <div key={member} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all">
                <TeamAvatar member={member} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{member}</p>
                  <p className="text-xs text-muted-foreground">{member.toLowerCase()}@alugueasy.com</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  member === currentUser ? 'bg-blue-100 text-[#4A9EDB]' : 'bg-muted text-muted-foreground'
                }`}>
                  {member === currentUser ? 'Você' : 'Membro'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={() => toast('success', 'Funcionalidade de convite em desenvolvimento')}
              className="w-full px-4 py-2 border-2 border-dashed border-border rounded-lg hover:border-[#4A9EDB] hover:bg-[#4A9EDB]/5 text-[#4A9EDB] text-sm font-medium transition-all"
            >
              + Convidar membro para equipe
            </button>
          </div>
        </section>

        {/* ── Zona de Perigo ── */}
        <section className="bg-card border-2 border-red-200 dark:border-red-900 rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-red-600 mb-1">Zona de Perigo</h2>
          <p className="text-xs text-muted-foreground mb-4">Ações irreversíveis que afetam permanentemente sua conta e dados.</p>
          <div className="space-y-3">
            <div className="border border-border rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-1">Exportar Dados</p>
              <p className="text-xs text-muted-foreground mb-3">Baixe uma cópia de todas as tarefas ({tasks.length} tarefas)</p>
              <div className="flex gap-2">
                <button
                  disabled={exportingCSV}
                  onClick={async () => {
                    setExportingCSV(true);
                    try {
                      exportToCSV(tasks);
                      toast('success', `${tasks.length} tarefas exportadas com sucesso`);
                    } catch {
                      toast('error', 'Erro ao exportar CSV. Tente novamente.');
                    } finally {
                      setExportingCSV(false);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 text-sm font-medium transition-all disabled:opacity-50"
                >
                  {exportingCSV
                    ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <Download size={15} />}
                  Exportar CSV
                </button>
                <button
                  disabled={exportingXLSX}
                  onClick={async () => {
                    setExportingXLSX(true);
                    try {
                      exportToExcel(tasks);
                      toast('success', `${tasks.length} tarefas exportadas com sucesso`);
                    } catch {
                      toast('error', 'Erro ao exportar Excel. Tente novamente.');
                    } finally {
                      setExportingXLSX(false);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-[#10B981] text-[#10B981] rounded-lg hover:bg-[#10B981]/10 text-sm font-medium transition-all disabled:opacity-50"
                >
                  {exportingXLSX
                    ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <FileSpreadsheet size={15} />}
                  Exportar Excel
                </button>
              </div>
            </div>
            <button
              onClick={() => { if (confirm('Deseja desativar sua conta? Pode ser reativada em até 30 dias.')) toast('error', 'Funcionalidade de desativação em desenvolvimento'); }}
              className="w-full px-4 py-3 border border-red-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-left transition-all"
            >
              <p className="text-sm font-medium text-red-600">Desativar Conta</p>
              <p className="text-xs text-muted-foreground">Desative temporariamente sua conta</p>
            </button>
            <button
              onClick={() => { if (confirm('⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nTodos os seus dados serão permanentemente excluídos.\n\nDeseja continuar?')) toast('error', 'Funcionalidade de exclusão em desenvolvimento'); }}
              className="w-full px-4 py-3 border-2 border-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/40 text-left transition-all"
            >
              <p className="text-sm font-medium text-red-600">Excluir Conta Permanentemente</p>
              <p className="text-xs text-red-500">Esta ação não pode ser desfeita</p>
            </button>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>AlugEasy Task Manager v1.0.0</p>
          <p>© 2026 AlugEasy. Todos os direitos reservados.</p>
          <div className="flex items-center justify-center gap-3 mt-3">
            {['Termos de Serviço', 'Política de Privacidade', 'Suporte'].map(label => (
              <button key={label} onClick={() => toast('success', `Abrindo ${label}...`)} className="hover:text-[#4A9EDB] transition-all">{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
