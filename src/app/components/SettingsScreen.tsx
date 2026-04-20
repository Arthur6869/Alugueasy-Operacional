import React from 'react';
import { TeamAvatar } from './TeamAvatar';
import { Upload, Sun, Moon, Bell, Lock, Globe, Mail, Smartphone } from 'lucide-react';

interface SettingsScreenProps {
  currentUser: 'Arthur' | 'Yasmim' | 'Alexandre' | 'Nikolas';
  currentTheme: 'light' | 'dark';
}

const teamMembers = ['Arthur', 'Yasmim', 'Alexandre', 'Nikolas'] as const;

export function SettingsScreen({ currentUser, currentTheme }: SettingsScreenProps) {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(currentTheme);
  const [language, setLanguage] = React.useState('pt-BR');
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [pushNotifications, setPushNotifications] = React.useState(true);

  React.useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    window.dispatchEvent(new CustomEvent('changeTheme', { detail: newTheme }));
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: {
        type: 'success',
        message: `Tema ${newTheme === 'light' ? 'Claro' : 'Escuro'} ativado!`
      }
    }));
  };
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="p-8 max-w-4xl mx-auto pb-12 min-h-full">
        {/* Page Header */}
        <div className="mb-8">
          <p className="text-sm text-[#6B7280] mb-1">AlugEasy / Configurações</p>
          <h1 className="text-3xl font-bold text-[#111827]">Configurações</h1>
          <p className="text-[#6B7280] mt-2">Gerencie sua conta, preferências e configurações do sistema</p>
        </div>

        {/* My Account */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-[#111827] mb-6">Minha Conta</h2>

          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
            <div className="relative group">
              <TeamAvatar member={currentUser} size="lg" />
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Upload size={20} className="text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-[#111827]">{currentUser}</h3>
              <p className="text-sm text-[#6B7280]">{currentUser.toLowerCase()}@alugueasy.com</p>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('showToast', {
                    detail: { type: 'success', message: 'Seletor de foto de perfil em desenvolvimento' }
                  }));
                }}
                className="mt-2 text-sm text-[#4A9EDB] hover:underline"
              >
                Trocar foto de perfil
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Nome</label>
              <input
                type="text"
                defaultValue={currentUser}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Sobrenome</label>
              <input
                type="text"
                defaultValue="Silva"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Email</label>
              <input
                type="email"
                defaultValue={`${currentUser.toLowerCase()}@alugueasy.com`}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-[#6B7280] mt-1">Email não pode ser alterado</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Cargo</label>
              <input
                type="text"
                defaultValue="Gerente de Projetos"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Departamento</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]">
                <option>Operacional</option>
                <option>Desenvolvimento</option>
                <option>Financeiro</option>
                <option>Marketing</option>
                <option>Recursos Humanos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Bio</label>
              <textarea
                rows={3}
                placeholder="Conte um pouco sobre você..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('showToast', {
                    detail: { type: 'success', message: 'Alterações salvas com sucesso!' }
                  }));
                }}
                className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
                style={{ backgroundColor: '#1E3A5F' }}
              >
                Salvar Alterações
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('showToast', {
                    detail: { type: 'success', message: 'Alterações descartadas' }
                  }));
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-[#111827] mb-6">Atividades que geram notificações</h2>

          <div className="space-y-4">
            {[
              {
                label: 'Quando forem atribuídas tarefas a mim',
                description: 'Receba notificação quando alguém atribuir uma tarefa a você',
                checked: true
              },
              {
                label: 'Quando comentarem nas minhas tarefas',
                description: 'Seja notificado sobre novos comentários',
                checked: true
              },
              {
                label: 'Prazo vencendo em 24h',
                description: 'Lembrete de tarefas com prazo próximo',
                checked: true
              },
              {
                label: 'Resumo semanal por email',
                description: 'Receba um resumo das suas atividades toda segunda-feira',
                checked: false
              },
              {
                label: 'Mudanças em tarefas que sigo',
                description: 'Atualizações em tarefas que você marcou como favoritas',
                checked: true
              },
              {
                label: 'Menções em comentários',
                description: 'Quando alguém mencionar você com @',
                checked: true
              },
            ].map((item, idx) => (
              <label
                key={idx}
                className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-all"
              >
                <input
                  type="checkbox"
                  defaultChecked={item.checked}
                  onChange={(e) => {
                    window.dispatchEvent(new CustomEvent('showToast', {
                      detail: {
                        type: 'success',
                        message: `"${item.label}" ${e.target.checked ? 'ativado' : 'desativado'}`
                      }
                    }));
                  }}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#4A9EDB] focus:ring-[#4A9EDB]"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#111827]">{item.label}</p>
                  <p className="text-xs text-[#6B7280] mt-1">{item.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-[#111827] mb-6">Aparência</h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex flex-col items-center justify-center p-8 border-2 rounded-xl transition-all ${
                theme === 'light'
                  ? 'border-[#4A9EDB] bg-blue-50/30'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <Sun
                className={`mb-3 ${theme === 'light' ? 'text-[#4A9EDB]' : 'text-gray-400'}`}
                size={32}
                strokeWidth={1.5}
              />
              <span className={`text-base font-medium ${theme === 'light' ? 'text-[#111827]' : 'text-[#6B7280]'}`}>
                Claro
              </span>
            </button>

            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex flex-col items-center justify-center p-8 border-2 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'border-[#4A9EDB] bg-blue-50/30'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <Moon
                className={`mb-3 ${theme === 'dark' ? 'text-[#4A9EDB]' : 'text-gray-400'}`}
                size={32}
                strokeWidth={1.5}
              />
              <span className={`text-base font-medium ${theme === 'dark' ? 'text-[#111827]' : 'text-[#6B7280]'}`}>
                Escuro
              </span>
            </button>
          </div>
        </div>

        {/* Language & Region */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-[#111827] mb-6 flex items-center gap-2">
            <Globe size={20} />
            Idioma e Região
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Idioma</label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  window.dispatchEvent(new CustomEvent('showToast', {
                    detail: { type: 'success', message: `Idioma alterado para ${e.target.options[e.target.selectedIndex].text}` }
                  }));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
                <option value="fr-FR">Français</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Fuso Horário</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]"
              >
                <option>(GMT-03:00) Brasília</option>
                <option>(GMT-05:00) Nova York</option>
                <option>(GMT+00:00) Londres</option>
                <option>(GMT+01:00) Paris</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Formato de Data</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]"
              >
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-[#111827] mb-6 flex items-center gap-2">
            <Bell size={20} />
            Preferências de Notificação
          </h2>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-500" />
                  <div>
                    <p className="font-medium text-[#111827]">Notificações por Email</p>
                    <p className="text-sm text-[#6B7280]">Receba atualizações por email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => {
                      setEmailNotifications(e.target.checked);
                      window.dispatchEvent(new CustomEvent('showToast', {
                        detail: {
                          type: 'success',
                          message: `Notificações por email ${e.target.checked ? 'ativadas' : 'desativadas'}`
                        }
                      }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4A9EDB]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone size={18} className="text-gray-500" />
                  <div>
                    <p className="font-medium text-[#111827]">Notificações Push</p>
                    <p className="text-sm text-[#6B7280]">Receba alertas no navegador</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={(e) => {
                      setPushNotifications(e.target.checked);
                      window.dispatchEvent(new CustomEvent('showToast', {
                        detail: {
                          type: 'success',
                          message: `Notificações push ${e.target.checked ? 'ativadas' : 'desativadas'}`
                        }
                      }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4A9EDB]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-[#111827] mb-6 flex items-center gap-2">
            <Lock size={20} />
            Segurança
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('showToast', {
                  detail: { type: 'success', message: 'Formulário de alteração de senha em desenvolvimento' }
                }));
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-all"
            >
              <p className="font-medium text-[#111827]">Alterar Senha</p>
              <p className="text-sm text-[#6B7280]">Última alteração: 30 dias atrás</p>
            </button>

            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('showToast', {
                  detail: { type: 'success', message: 'Configuração de autenticação de dois fatores em desenvolvimento' }
                }));
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-all"
            >
              <p className="font-medium text-[#111827]">Autenticação de Dois Fatores</p>
              <p className="text-sm text-[#6B7280]">Adicione uma camada extra de segurança</p>
            </button>

            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('showToast', {
                  detail: { type: 'success', message: 'Histórico de sessões exibido' }
                }));
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-all"
            >
              <p className="font-medium text-[#111827]">Sessões Ativas</p>
              <p className="text-sm text-[#6B7280]">Gerenciar dispositivos conectados</p>
            </button>
          </div>
        </div>

        {/* Team */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-[#111827] mb-6">Equipe</h2>

          <div className="space-y-3">
            {teamMembers.map(member => (
              <div key={member} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all">
                <TeamAvatar member={member} size="md" />
                <div className="flex-1">
                  <p className="font-medium text-[#111827]">{member}</p>
                  <p className="text-sm text-[#6B7280]">{member.toLowerCase()}@alugueasy.com</p>
                </div>
                <span className="text-xs px-2 py-1 bg-blue-100 text-[#4A9EDB] rounded-full font-medium">
                  {member === currentUser ? 'Você' : 'Membro'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('showToast', {
                  detail: { type: 'success', message: 'Funcionalidade de convite em desenvolvimento' }
                }));
              }}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#4A9EDB] hover:bg-blue-50/30 text-[#4A9EDB] font-medium transition-all"
            >
              + Convidar membro para equipe
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6 border-2 border-red-200">
          <h2 className="text-xl font-bold text-red-600 mb-4">Zona de Perigo</h2>
          <p className="text-sm text-[#6B7280] mb-4">
            Ações irreversíveis que afetam permanentemente sua conta e dados.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja exportar todos os seus dados? Isso pode levar alguns minutos.')) {
                  window.dispatchEvent(new CustomEvent('showToast', {
                    detail: { type: 'success', message: 'Exportação de dados iniciada! Você receberá um email quando estiver pronto.' }
                  }));
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-all"
            >
              <p className="font-medium text-[#111827]">Exportar Dados</p>
              <p className="text-sm text-[#6B7280]">Baixe uma cópia de todos os seus dados</p>
            </button>

            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja desativar sua conta? Você pode reativá-la fazendo login novamente dentro de 30 dias.')) {
                  window.dispatchEvent(new CustomEvent('showToast', {
                    detail: { type: 'error', message: 'Funcionalidade de desativação em desenvolvimento' }
                  }));
                }
              }}
              className="w-full px-4 py-2 border border-red-300 rounded-lg hover:bg-red-50 text-left transition-all"
            >
              <p className="font-medium text-red-600">Desativar Conta</p>
              <p className="text-sm text-[#6B7280]">Desative temporariamente sua conta</p>
            </button>

            <button
              onClick={() => {
                if (confirm('⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nTodos os seus dados, tarefas e configurações serão permanentemente excluídos.\n\nDeseja realmente excluir sua conta?')) {
                  window.dispatchEvent(new CustomEvent('showToast', {
                    detail: { type: 'error', message: 'Funcionalidade de exclusão em desenvolvimento' }
                  }));
                }
              }}
              className="w-full px-4 py-2 border-2 border-red-500 bg-red-50 rounded-lg hover:bg-red-100 text-left transition-all"
            >
              <p className="font-medium text-red-600">Excluir Conta Permanentemente</p>
              <p className="text-sm text-red-500">Esta ação não pode ser desfeita</p>
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-[#6B7280] space-y-2">
          <p>AlugEasy Task Manager v2.0.0</p>
          <p>© 2026 AlugEasy. Todos os direitos reservados.</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('showToast', {
                  detail: { type: 'success', message: 'Abrindo termos de serviço...' }
                }));
              }}
              className="hover:text-[#4A9EDB] transition-all"
            >
              Termos de Serviço
            </button>
            <span>•</span>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('showToast', {
                  detail: { type: 'success', message: 'Abrindo política de privacidade...' }
                }));
              }}
              className="hover:text-[#4A9EDB] transition-all"
            >
              Política de Privacidade
            </button>
            <span>•</span>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('showToast', {
                  detail: { type: 'success', message: 'Abrindo suporte...' }
                }));
              }}
              className="hover:text-[#4A9EDB] transition-all"
            >
              Suporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
