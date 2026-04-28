import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowLeft, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { useSyncContext } from '@/contexts/SyncContext.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import { getAppUrl } from '@/lib/runtimeUrls.js';
import { getCounterOptions } from '@/lib/counterOptions.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { BRANCH_OPTIONS, getBranchLabel, normalizeBranch } from '@/lib/branchOptions.js';

const AddStaffPageContent = () => {
  const navigate = useNavigate();
  const { data: syncData, refetchUsers } = useSyncContext();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const modalT = t.staffModal || {};
  const teamT = t.team || {};
  const commonT = t.common || {};

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff',
    branch: 'AMIS',
    counterNumber: '',
  });
  const counterOptions = useMemo(
    () => getCounterOptions(syncData?.counters, { branch: formData.branch }),
    [syncData?.counters, formData.branch],
  );

  useEffect(() => {
    if (!formData.counterNumber && counterOptions.length > 0) {
      setFormData((prev) => ({ ...prev, counterNumber: String(counterOptions[0]) }));
    }
  }, [counterOptions, formData.counterNumber]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.username?.trim() || !formData.email?.trim() || !formData.password || !formData.role || !formData.counterNumber) {
      toast.error(modalT.requiredFields || 'All fields are required');
      return;
    }

    if (formData.password.length < 8) {
      toast.error(modalT.passwordLength || 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const baseData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        passwordConfirm: formData.password,
        role: formData.role,
        counterNumber: parseInt(formData.counterNumber, 10),
        emailVisibility: true,
        verified: true,
        name: formData.username.trim(),
      };

      let record;
      try {
        record = await pb.collection('users').create({
          ...baseData,
          branch: formData.branch,
        }, { $autoCancel: false });
      } catch (error) {
        record = await pb.collection('users').create(baseData, { $autoCancel: false });
      }
      await refetchUsers();

      setSuccessData({
        email: record.email,
        password: formData.password,
        role: record.role,
        branch: normalizeBranch(record.branch || formData.branch),
        counter: record.counterNumber,
      });

      toast.success(modalT.createdSuccess || 'Staff member created successfully');
    } catch (error) {
      console.error('Staff creation error:', error);
      toast.error(error?.response?.message || error?.message || modalT.createdSuccess || 'Failed to create staff member');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!successData) return;
    const text = `Login URL: ${getAppUrl('/login')}\nEmail: ${successData.email}\nPassword: ${successData.password}\nRole: ${successData.role}\nBranch: ${successData.branch}\nCounter: ${successData.counter}`;
    navigator.clipboard.writeText(text);
    toast.success(modalT.copied || 'Credentials copied to clipboard');
  };

  const handleReset = () => {
    setSuccessData(null);
        setFormData({
          username: '',
          email: '',
          password: '',
          role: 'staff',
          branch: 'AMIS',
          counterNumber: counterOptions.length > 0 ? String(counterOptions[0]) : '',
        });
  };

  return (
    <div className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full z-10 relative">
      <Helmet><title>{`${modalT.addTitle || 'Add New Staff'} - AMIC Queue`}</title></Helmet>

      <div className="mb-8">
        <Link to="/admin/users">
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary interactive-element">
            <ArrowLeft className="w-4 h-4 mr-2" /> {commonT.back || 'Back'}
          </Button>
        </Link>
      </div>

      <div className="card-primary overflow-hidden bg-card/95 backdrop-blur-xl border-border/40 shadow-2xl">
        <div className="bg-primary/5 p-8 sm:p-10 border-b border-border/50 flex items-center gap-5">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <UserPlus className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight">
              {modalT.addTitle || 'Add New Staff'}
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              {teamT.subtitle || 'Add staff accounts, expand counters, and keep assignments under one admin screen.'}
            </p>
          </div>
        </div>

        {successData ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">{modalT.accountReady || 'Staff account is ready!'}</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {modalT.saveCredentialsHint || 'Please save these credentials securely. The password will not be shown again.'}
            </p>

            <div className="bg-muted/50 rounded-2xl p-6 text-left space-y-4 border border-border/50 max-w-md mx-auto mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{modalT.email || commonT.email || 'Email'}</span>
                <p className="font-medium text-lg text-foreground">{successData.email}</p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{modalT.password || commonT.password || 'Password'}</span>
                <p className="font-medium text-lg text-foreground font-mono">{successData.password}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{modalT.role || commonT.role || 'Role'}</span>
                  <p className="font-medium text-foreground capitalize">{modalT[successData.role] || successData.role}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{modalT.counter || commonT.counter || 'Counter'}</span>
                  <p className="font-medium text-foreground">{successData.counter}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Button variant="outline" className="h-14 px-8 text-lg font-bold rounded-xl flex-1" onClick={copyCredentials}>
                <Copy className="w-5 h-5 mr-2" /> {modalT.copy || commonT.copy || 'Copy'}
              </Button>
              <Button className="h-14 px-8 text-lg font-bold rounded-xl flex-1 shadow-lg shadow-primary/20" onClick={handleReset}>
                {commonT.createAnother || 'Create Another'}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="username" className="text-base font-bold">{modalT.username || commonT.username || 'Username'} <span className="text-destructive">*</span></Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(event) => setFormData({ ...formData, username: event.target.value })}
                  className="h-14 bg-background/50 rounded-xl border-border/60 focus-visible:ring-primary/20 text-foreground"
                  placeholder={modalT.usernamePlaceholder || 'e.g. jsmith'}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-base font-bold">{modalT.email || commonT.email || 'Email'} <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  className="h-14 bg-background/50 rounded-xl border-border/60 focus-visible:ring-primary/20 text-foreground"
                  placeholder={modalT.emailPlaceholder || 'staff@example.com'}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-base font-bold">{modalT.password || commonT.password || 'Password'} <span className="text-destructive">*</span></Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                className="h-14 bg-background/50 rounded-xl border-border/60 focus-visible:ring-primary/20 text-foreground"
                placeholder={modalT.passwordPlaceholder || 'Minimum 8 characters'}
                disabled={loading}
                required
                minLength={8}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="branch" className="text-base font-bold">{commonT.branch || 'Branch'} <span className="text-destructive">*</span></Label>
                <Select value={formData.branch} onValueChange={(value) => setFormData({ ...formData, branch: value, counterNumber: '' })} disabled={loading} required>
                  <SelectTrigger className="h-14 text-base bg-background/50 rounded-xl border-border/60 text-foreground">
                    <SelectValue placeholder={commonT.branch || 'Branch'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {BRANCH_OPTIONS.map((branchOption) => (
                      <SelectItem key={branchOption.value} value={branchOption.value} className="py-3">
                        {getBranchLabel(branchOption.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="role" className="text-base font-bold">{modalT.role || commonT.role || 'Role'} <span className="text-destructive">*</span></Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} disabled={loading} required>
                  <SelectTrigger className="h-14 text-base bg-background/50 rounded-xl border-border/60 text-foreground">
                    <SelectValue placeholder={modalT.selectRole || 'Select role'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="admin" className="py-3">{modalT.admin || 'Admin'}</SelectItem>
                    <SelectItem value="staff" className="py-3">{modalT.staff || 'Staff'}</SelectItem>
                    <SelectItem value="operator" className="py-3">{modalT.operator || 'Operator'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="counterNumber" className="text-base font-bold">{teamT.counter || commonT.counter || 'Counter'} <span className="text-destructive">*</span></Label>
                <Select value={formData.counterNumber} onValueChange={(value) => setFormData({ ...formData, counterNumber: value })} disabled={loading} required>
                  <SelectTrigger className="h-14 text-base bg-background/50 rounded-xl border-border/60 text-foreground">
                    <SelectValue placeholder={modalT.selectCounter || 'Select counter'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {counterOptions.map((num) => (
                      <SelectItem key={num} value={num.toString()} className="py-3">
                        {(commonT.counter || 'Counter')} {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-6 border-t border-border/40 flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/users')}
                className="h-14 px-8 text-lg font-bold rounded-xl"
                disabled={loading}
              >
                {commonT.cancel || 'Cancel'}
              </Button>
              <Button type="submit" className="h-14 px-10 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 interactive-element" disabled={loading}>
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (modalT.create || 'Create Staff')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const AddStaffPage = () => (
  <ErrorBoundary>
    <AddStaffPageContent />
  </ErrorBoundary>
);

export default AddStaffPage;
