import React, { useState } from 'react';
import { MindMap } from '@/types/hamomap';
import { useMapStore } from '@/stores/useMapStore';
import {
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  UserPlus,
  Trash2,
  X,
  Shield,
  Layers,
} from 'lucide-react';
import clsx from 'clsx';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const currentMap = useMapStore((s) => s.currentMap);
  const saveCurrentMap = useMapStore((s) => s.saveCurrentMap);

  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer');

  if (!isOpen || !currentMap) return null;

  const shareUrl = `${window.location.origin}${window.location.pathname}#/shared/${currentMap.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePublic = () => {
    const isPublic = !currentMap.isPublic;
    useMapStore.setState((state) => ({
      currentMap: state.currentMap ? { ...state.currentMap, isPublic } : null,
    }));
    saveCurrentMap();
  };

  const handleAddCollaborator = () => {
    if (!inviteEmail.trim()) return;
    const email = inviteEmail.trim().toLowerCase();
    const collaborators = { ...(currentMap.collaborators || {}), [email]: inviteRole };

    useMapStore.setState((state) => ({
      currentMap: state.currentMap ? { ...state.currentMap, collaborators } : null,
    }));
    saveCurrentMap();
    setInviteEmail('');
  };

  const handleRemoveCollaborator = (email: string) => {
    const collaborators = { ...(currentMap.collaborators || {}) };
    delete collaborators[email];

    useMapStore.setState((state) => ({
      currentMap: state.currentMap ? { ...state.currentMap, collaborators } : null,
    }));
    saveCurrentMap();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-primary/10 text-primary rounded-xl">
              <Share2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">Share Knowledge Map</h3>
              <p className="text-xs text-muted-foreground">{currentMap.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted text-muted-foreground rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Public Access Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-2xl">
          <div className="flex items-start gap-3">
            {currentMap.isPublic ? (
              <Globe className="w-5 h-5 text-emerald-500 mt-0.5" />
            ) : (
              <Lock className="w-5 h-5 text-amber-500 mt-0.5" />
            )}
            <div>
              <span className="text-xs font-semibold block text-foreground">
                {currentMap.isPublic ? 'Public Link Access' : 'Restricted (Private)'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {currentMap.isPublic
                  ? 'Anyone with the link can view this knowledge map.'
                  : 'Only invited collaborators and you can access.'}
              </span>
            </div>
          </div>
          <button
            onClick={handleTogglePublic}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
              currentMap.isPublic
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                : 'bg-muted text-foreground border-border'
            )}
          >
            {currentMap.isPublic ? 'Make Private' : 'Make Public'}
          </button>
        </div>

        {/* Share Link Copy */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Shareable Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3.5 py-2 text-xs bg-muted/40 border border-border rounded-xl font-mono text-muted-foreground select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold shadow hover:bg-primary/90 transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Invite Collaborator */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Invite Collaborator
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@domain.com"
              className="flex-1 px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'editor')}
              className="px-2.5 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button
              onClick={handleAddCollaborator}
              className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl text-xs font-semibold"
            >
              Invite
            </button>
          </div>
        </div>

        {/* Collaborators List */}
        {currentMap.collaborators && Object.keys(currentMap.collaborators).length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              People with access
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {Object.entries(currentMap.collaborators).map(([email, role]) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2 rounded-xl bg-muted/20 text-xs border border-border/50"
                >
                  <span className="font-medium text-foreground">{email}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize font-medium">
                      {role}
                    </span>
                    <button
                      onClick={() => handleRemoveCollaborator(email)}
                      className="p-1 hover:text-destructive text-muted-foreground"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
