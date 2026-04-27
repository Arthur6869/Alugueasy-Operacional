import { useState } from 'react';
import { EasyTaskLogo } from './EasyTaskLogo';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type TeamMember = 'Arthur' | 'Yasmim' | 'Alexandre' | 'Nikolas';

interface LoginScreenProps {
  onLogin: (member: TeamMember) => void;
}

const validMembers: TeamMember[] = ['Arthur', 'Yasmim', 'Alexandre', 'Nikolas'];

function nameFromEmail(email: string): TeamMember | null {
  const prefix = email.split('@')[0];
  const capitalized = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
  return validMembers.includes(capitalized as TeamMember) ? (capitalized as TeamMember) : null;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError('Email ou senha incorretos');
      return;
    }

    const member = nameFromEmail(data.user?.email ?? '');
    if (!member) {
      setError('Usuário não autorizado nesta plataforma');
      await supabase.auth.signOut();
      return;
    }

    onLogin(member);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1E3A5F' }}>
      {/* Subtle texture background */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 20px)'
      }} />

      <div className="relative bg-white rounded-2xl shadow-2xl p-6 md:p-10 w-full max-w-[420px] mx-4">
        <div className="flex flex-col items-center mb-8">
          <EasyTaskLogo variant="dark" showTagline />
        </div>

        <h1 className="text-2xl font-bold text-[#1E3A5F] text-center mb-2">
          Acesso da Equipe
        </h1>
        <p className="text-sm text-[#6B7280] text-center mb-8">
          Plataforma interna · Acesso restrito
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#1E3A5F' }}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
