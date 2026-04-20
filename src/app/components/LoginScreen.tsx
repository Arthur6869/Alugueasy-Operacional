import { useState } from 'react';
import { AlugEasyLogo } from './AlugEasyLogo';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (member: 'Arthur' | 'Yasmim' | 'Alexandre' | 'Nikolas') => void;
}

const users = {
  'arthur@alugueasy.com': { password: 'arthur123', name: 'Arthur' as const },
  'yasmim@alugueasy.com': { password: 'yasmim123', name: 'Yasmim' as const },
  'alexandre@alugueasy.com': { password: 'alexandre123', name: 'Alexandre' as const },
  'nikolas@alugueasy.com': { password: 'nikolas123', name: 'Nikolas' as const },
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users[email.toLowerCase() as keyof typeof users];

    if (!user) {
      setError('Usuário não encontrado');
      return;
    }

    if (user.password !== password) {
      setError('Senha incorreta');
      return;
    }

    onLogin(user.name);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1E3A5F' }}>
      {/* Subtle texture background */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 20px)'
      }} />

      <div className="relative bg-white rounded-2xl shadow-2xl p-6 md:p-10 w-full max-w-[420px] mx-4">
        <div className="flex flex-col items-center mb-8">
          <AlugEasyLogo variant="dark" />
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
            className="w-full py-3 rounded-lg font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#1E3A5F' }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
