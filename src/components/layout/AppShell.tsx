import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  Brain,
  LayoutDashboard,
  Map,
  RotateCcw,
  BookTemplate,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Flame,
  Globe,
  LogOut,
  User,
  Plus,
} from 'lucide-react';
import clsx from 'clsx';

export const AppShell: React.FC = () => {
  const { user, profile, logout, updateTheme, updateLanguage } = useAuth();
  const navigate = useNavigate();

  const isDark = document.documentElement.classList.contains('dark');
  const isRtl = document.documentElement.getAttribute('dir') === 'rtl';

  const navLinks = [
    { to: '/dashboard', label: isRtl ? 'لوحة التحكم' : 'Dashboard', icon: LayoutDashboard },
    { to: '/maps', label: isRtl ? 'خرائط المعرفة' : 'Mind Maps', icon: Map },
    { to: '/review', label: isRtl ? 'طابور التكرار' : 'Review Queue', icon: RotateCcw },
    { to: '/templates', label: isRtl ? 'القوالب الدراسية' : 'Templates', icon: BookTemplate },
    { to: '/analytics', label: isRtl ? 'التحليلات' : 'Analytics', icon: BarChart3 },
    { to: '/settings', label: isRtl ? 'الإعدادات' : 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5" />
            </span>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-foreground flex items-center gap-1.5">
                MindForge <span className="text-primary font-mono text-xs uppercase px-1.5 py-0.2 rounded bg-primary/10">AI</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-medium -mt-1">
                Visual Knowledge System
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-3">
          {/* Create New Map Button */}
          <button
            onClick={() => navigate('/maps/new')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'خريطة جديدة' : 'New Map'}</span>
          </button>

          {/* Study Streak Pill */}
          <div
            title="Daily Learning Streak"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold"
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>{profile?.streakDays || 1}d</span>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => updateLanguage(isRtl ? 'en' : 'ar')}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors text-xs font-bold flex items-center gap-1"
            title="Switch Language / RTL"
          >
            <Globe className="w-4 h-4" />
            <span className="uppercase">{isRtl ? 'EN' : 'عربي'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => updateTheme(isDark ? 'light' : 'dark')}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* User Profile / Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
              {profile?.displayName?.[0] || 'U'}
            </div>
            <button
              onClick={() => logout()}
              className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};
