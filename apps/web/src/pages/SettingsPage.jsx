import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Settings, Save, Plus, Trash2, Edit, Palette, Globe, Lock, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import pb, { isUsingLocalDatabase } from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { resolvePublishedAssetUrl } from '@/lib/brandAssets.js';
import { defaultNotificationSettings, normalizeNotificationSettings } from '@/lib/settingsHelpers.js';

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Could not read file'));
  reader.readAsDataURL(file);
});

const loadImage = (source) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Could not load image'));
  image.src = source;
});

const blobFromCanvas = (canvas, outputType, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) {
      resolve(blob);
      return;
    }
    reject(new Error('Could not export the image'));
  }, outputType, quality);
});

const optimizeImage = async (file, { maxWidth, maxHeight, outputType, quality = 0.92, fill = '#ffffff', output = 'dataUrl', filename = 'asset' }) => {
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);

  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not supported in this browser');
  }

  if (outputType === 'image/jpeg') {
    context.fillStyle = fill;
    context.fillRect(0, 0, width, height);
  } else {
    context.clearRect(0, 0, width, height);
  }

  context.drawImage(image, 0, 0, width, height);

  if (output === 'file') {
    const blob = await blobFromCanvas(canvas, outputType, quality);
    return new File([blob], filename, { type: outputType });
  }

  return canvas.toDataURL(outputType, quality);
};

const getUploadedFileName = (value) => {
  if (Array.isArray(value)) {
    return value.find((item) => typeof item === 'string' && item.trim()) || '';
  }
  return typeof value === 'string' ? value : '';
};

const SettingsPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [services, setServices] = useState([]);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [assetDrafts, setAssetDrafts] = useState({
    logoFile: null,
    backgroundFile: null,
    logoPreviewUrl: '',
    backgroundPreviewUrl: '',
    clearLogo: false,
    clearBackground: false
  });
  
  const [settings, setSettings] = useState({
    id: '',
    collectionId: '',
    collectionName: 'settings',
    systemTitle: '',
    logoImage: '',
    backgroundImage: '',
    logoPath: '',
    backgroundImagePath: '',
    colorBackground: 'light',
    notificationSettings: defaultNotificationSettings
  });

  const fetchData = async () => {
    try {
      const [settingsRes, servicesRes] = await Promise.all([
        pb.collection('settings').getList(1, 1, { $autoCancel: false }),
        pb.collection('services').getFullList({ sort: 'order', $autoCancel: false })
      ]);

      if (settingsRes.items.length > 0) {
        const s = settingsRes.items[0];
        setSettings({
          id: s.id,
          collectionId: s.collectionId || '',
          collectionName: s.collectionName || 'settings',
          systemTitle: s.systemTitle || '',
          logoImage: s.logoImage || '',
          backgroundImage: s.backgroundImage || '',
          logoPath: s.logoPath || '',
          backgroundImagePath: s.backgroundImagePath || '',
          colorBackground: s.colorBackground || 'light',
          notificationSettings: normalizeNotificationSettings(s.notificationSettings)
        });
      }
      setAssetDrafts({
        logoFile: null,
        backgroundFile: null,
        logoPreviewUrl: '',
        backgroundPreviewUrl: '',
        clearLogo: false,
        clearBackground: false
      });
      setServices(servicesRes);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => () => {
    if (assetDrafts.logoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(assetDrafts.logoPreviewUrl);
    }
    if (assetDrafts.backgroundPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(assetDrafts.backgroundPreviewUrl);
    }
  }, [assetDrafts.backgroundPreviewUrl, assetDrafts.logoPreviewUrl]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      let savedRecord;

      if (isUsingLocalDatabase) {
        const payload = {
          systemTitle: settings.systemTitle,
          logoPath: settings.logoPath,
          backgroundImagePath: settings.backgroundImagePath,
          colorBackground: settings.colorBackground,
          notificationSettings: settings.notificationSettings
        };

        savedRecord = settings.id
          ? await pb.collection('settings').update(settings.id, payload, { $autoCancel: false })
          : await pb.collection('settings').create(payload, { $autoCancel: false });
      } else {
        const payload = new FormData();
        payload.append('systemTitle', settings.systemTitle || '');
        payload.append('colorBackground', settings.colorBackground || 'light');
        payload.append('notificationSettings', JSON.stringify(settings.notificationSettings || {}));

        if (assetDrafts.logoFile) {
          payload.append('logoImage', assetDrafts.logoFile);
        } else if (assetDrafts.clearLogo) {
          const existingLogo = getUploadedFileName(settings.logoImage);
          if (existingLogo) {
            payload.append('logoImage-', existingLogo);
          }
        }

        if (assetDrafts.backgroundFile) {
          payload.append('backgroundImage', assetDrafts.backgroundFile);
        } else if (assetDrafts.clearBackground) {
          const existingBackground = getUploadedFileName(settings.backgroundImage);
          if (existingBackground) {
            payload.append('backgroundImage-', existingBackground);
          }
        }

        savedRecord = settings.id
          ? await pb.collection('settings').update(settings.id, payload, { $autoCancel: false })
          : await pb.collection('settings').create(payload, { $autoCancel: false });
      }

      setSettings((prev) => ({
        ...prev,
        id: savedRecord.id,
        collectionId: savedRecord.collectionId || prev.collectionId || '',
        collectionName: savedRecord.collectionName || prev.collectionName || 'settings',
        systemTitle: savedRecord.systemTitle || '',
        logoImage: savedRecord.logoImage || '',
        backgroundImage: savedRecord.backgroundImage || '',
        logoPath: isUsingLocalDatabase ? (savedRecord.logoPath || '') : '',
        backgroundImagePath: isUsingLocalDatabase ? (savedRecord.backgroundImagePath || '') : '',
        colorBackground: savedRecord.colorBackground || 'light',
        notificationSettings: normalizeNotificationSettings(savedRecord.notificationSettings ?? prev.notificationSettings)
      }));

      setAssetDrafts((prev) => {
        if (prev.logoPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(prev.logoPreviewUrl);
        }
        if (prev.backgroundPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(prev.backgroundPreviewUrl);
        }
        return {
          logoFile: null,
          backgroundFile: null,
          logoPreviewUrl: '',
          backgroundPreviewUrl: '',
          clearLogo: false,
          clearBackground: false
        };
      });
      
      await pb.collection('activity_logs').create({
        action: 'settings_updated',
        userId: pb.authStore.model?.id,
        timestamp: new Date().toISOString(),
        description: 'Updated system settings'
      }, { $autoCancel: false }).catch(() => {});

      toast.success(isUsingLocalDatabase ? 'Settings saved on this device' : 'Settings saved for all devices');
    } catch (error) {
      console.error('Settings save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await pb.collection('services').delete(id, { $autoCancel: false });
      toast.success('Service deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!currentUser?.id) {
      toast.error('Please sign in again before changing your password');
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      const identity = currentUser.email || currentUser.username;
      await pb.collection('users').authWithPassword(identity, passwordForm.currentPassword, { $autoCancel: false });
      await pb.collection('users').update(currentUser.id, {
        oldPassword: passwordForm.currentPassword,
        password: passwordForm.newPassword,
        passwordConfirm: passwordForm.confirmPassword
      }, { $autoCancel: false });
      await pb.collection('users').authWithPassword(identity, passwordForm.newPassword, { $autoCancel: false });

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Could not change password. Check the current password and try again.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAssetUpload = async (field, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }

    try {
      if (isUsingLocalDatabase) {
        const processed = await optimizeImage(file, field === 'logoPath'
          ? { maxWidth: 1200, maxHeight: 360, outputType: 'image/png' }
          : { maxWidth: 1920, maxHeight: 1080, outputType: 'image/jpeg', quality: 0.82, fill: '#ffffff' });

        if (processed.length > 3000000) {
          toast.error('Image is too large after processing. Use a smaller file.');
          return;
        }

        setSettings((prev) => ({ ...prev, [field]: processed }));
      } else {
        const isLogo = field === 'logoPath';
        const processedFile = await optimizeImage(file, isLogo
          ? { maxWidth: 1200, maxHeight: 360, outputType: 'image/png', output: 'file', filename: 'logo.png' }
          : { maxWidth: 1920, maxHeight: 1080, outputType: 'image/jpeg', quality: 0.82, fill: '#ffffff', output: 'file', filename: 'background.jpg' });

        if (processedFile.size > 3000000) {
          toast.error('Image is too large after processing. Use a smaller file.');
          return;
        }

        const previewUrl = URL.createObjectURL(processedFile);
        setAssetDrafts((prev) => {
          const previewField = isLogo ? 'logoPreviewUrl' : 'backgroundPreviewUrl';
          const fileField = isLogo ? 'logoFile' : 'backgroundFile';
          const clearField = isLogo ? 'clearLogo' : 'clearBackground';

          if (prev[previewField]?.startsWith?.('blob:')) {
            URL.revokeObjectURL(prev[previewField]);
          }

          return {
            ...prev,
            [fileField]: processedFile,
            [previewField]: previewUrl,
            [clearField]: false
          };
        });
      }

      toast.success(field === 'logoPath' ? 'Logo ready to save' : 'Background ready to save');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Could not process the selected image');
    }
  };

  const clearAsset = (field) => {
    if (isUsingLocalDatabase) {
      setSettings((prev) => ({ ...prev, [field]: '' }));
      return;
    }

    const isLogo = field === 'logoPath';
    setAssetDrafts((prev) => {
      const previewField = isLogo ? 'logoPreviewUrl' : 'backgroundPreviewUrl';
      const fileField = isLogo ? 'logoFile' : 'backgroundFile';
      const clearField = isLogo ? 'clearLogo' : 'clearBackground';

      if (prev[previewField]?.startsWith?.('blob:')) {
        URL.revokeObjectURL(prev[previewField]);
      }

      return {
        ...prev,
        [fileField]: null,
        [previewField]: '',
        [clearField]: true
      };
    });
  };

  const logoPreviewUrl = assetDrafts.clearLogo
    ? resolvePublishedAssetUrl({ record: null, fileField: 'logoImage', pathField: 'logoPath', fallbackPath: '/assets/amic-logo.png' })
    : assetDrafts.logoPreviewUrl || resolvePublishedAssetUrl({
      record: settings,
      fileField: 'logoImage',
      pathField: 'logoPath',
      fallbackPath: '/assets/amic-logo.png'
    });

  const backgroundPreviewUrl = assetDrafts.clearBackground
    ? resolvePublishedAssetUrl({ record: null, fileField: 'backgroundImage', pathField: 'backgroundImagePath', fallbackPath: '/assets/amic-site-background.png' })
    : assetDrafts.backgroundPreviewUrl || resolvePublishedAssetUrl({
      record: settings,
      fileField: 'backgroundImage',
      pathField: 'backgroundImagePath',
      fallbackPath: '/assets/amic-site-background.png'
    });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Helmet><title>{'System Settings - AMIC Queue Management'}</title></Helmet>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Helmet><title>{'System Settings - AMIC Queue Management'}</title></Helmet>
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black">Settings</h1>
            <p className="text-muted-foreground font-medium">Manage system configuration and services.</p>
          </div>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving} className="shadow-lg shadow-primary/20">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 bg-muted/50 p-1 rounded-xl h-auto">
          <TabsTrigger value="system" className="rounded-lg data-[state=active]:shadow-sm">System</TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg data-[state=active]:shadow-sm">Account</TabsTrigger>
          <TabsTrigger value="branding" className="rounded-lg data-[state=active]:shadow-sm">Branding</TabsTrigger>
          <TabsTrigger value="services" className="rounded-lg data-[state=active]:shadow-sm">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-card border border-border/50 rounded-[2rem] shadow-xl p-8">
            <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> General Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Language</Label>
                <Select 
                  value={settings.notificationSettings.defaultLanguage} 
                  onValueChange={(v) => setSettings(s => ({...s, notificationSettings: {...s.notificationSettings, defaultLanguage: v}}))}
                >
                  <SelectTrigger className="h-12 bg-background">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Auto-Logout Timeout (minutes)</Label>
                <Input 
                  type="number" 
                  min="5" 
                  max="120" 
                  value={settings.notificationSettings.autoLogout}
                  onChange={(e) => setSettings(s => ({...s, notificationSettings: {...s.notificationSettings, autoLogout: parseInt(e.target.value, 10)}}))}
                  className="h-12 bg-background"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">System Sounds</Label>
                  <p className="text-xs text-muted-foreground">Enable notification sounds globally</p>
                </div>
                <Switch 
                  checked={settings.notificationSettings.soundEnabled}
                  onCheckedChange={(v) => setSettings(s => ({...s, notificationSettings: {...s.notificationSettings, soundEnabled: v}}))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Dark Theme Default</Label>
                  <p className="text-xs text-muted-foreground">Set default appearance</p>
                </div>
                <Switch 
                  checked={settings.colorBackground === 'dark'}
                  onCheckedChange={(v) => setSettings(s => ({...s, colorBackground: v ? 'dark' : 'light'}))}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="account" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-card border border-border/50 rounded-[2rem] shadow-xl p-8">
            <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" /> Account Security
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8">
              <div className="bg-muted/30 border border-border/50 rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Signed in as</p>
                <p className="text-lg font-black text-foreground">{currentUser?.name || currentUser?.username || 'User'}</p>
                <p className="text-sm text-muted-foreground break-all">{currentUser?.email || '-'}</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm(form => ({ ...form, currentPassword: event.target.value }))}
                    className="h-12 bg-background"
                    dir="ltr"
                    autoComplete="current-password"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) => setPasswordForm(form => ({ ...form, newPassword: event.target.value }))}
                      className="h-12 bg-background"
                      dir="ltr"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) => setPasswordForm(form => ({ ...form, confirmPassword: event.target.value }))}
                      className="h-12 bg-background"
                      dir="ltr"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={passwordSaving} className="h-12 rounded-xl font-bold">
                  {passwordSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                  Change Password
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-card border border-border/50 rounded-[2rem] shadow-xl p-8">
            <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" /> Brand Identity
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Organization Name</Label>
                <Input 
                  value={settings.systemTitle}
                  onChange={(e) => setSettings(s => ({...s, systemTitle: e.target.value}))}
                  placeholder="e.g. AMIC Queue Management"
                  className="h-12 bg-background max-w-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                  <div className="overflow-hidden rounded-2xl border border-border/50 bg-white">
                    <div className="flex min-h-[180px] items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(111,206,181,0.15),transparent_40%),linear-gradient(180deg,#ffffff,#f7f9fc)] p-6">
                      <img src={logoPreviewUrl} alt="Current logo" className="max-h-24 w-auto max-w-full object-contain" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold mb-1">Upload Logo</p>
                      <p className="text-xs text-muted-foreground">
                        {isUsingLocalDatabase
                          ? 'PNG or JPG, optimized for this browser-based site'
                          : 'PNG or JPG, stored in the shared system for every device'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="relative rounded-xl">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="absolute inset-0 cursor-pointer opacity-0"
                          onChange={(event) => handleAssetUpload('logoPath', event.target.files?.[0])}
                        />
                      </Button>
                      <Button type="button" variant="ghost" className="rounded-xl" onClick={() => clearAsset('logoPath')}>
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                  <div className="overflow-hidden rounded-2xl border border-border/50 bg-white">
                    <div className="aspect-[16/9] w-full bg-cover bg-center" style={{ backgroundImage: `url(${backgroundPreviewUrl})` }} />
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold mb-1">Upload Background</p>
                      <p className="text-xs text-muted-foreground">
                        {isUsingLocalDatabase
                          ? 'Automatically resized for GitHub Pages local storage'
                          : 'Automatically resized and uploaded to the shared AMIC server'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="relative rounded-xl">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="absolute inset-0 cursor-pointer opacity-0"
                          onChange={(event) => handleAssetUpload('backgroundImagePath', event.target.files?.[0])}
                        />
                      </Button>
                      <Button type="button" variant="ghost" className="rounded-xl" onClick={() => clearAsset('backgroundImagePath')}>
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                {isUsingLocalDatabase
                  ? 'In the local browser mode, logo and background stay only on this device.'
                  : 'Brand updates are saved to the shared PocketBase server, so the logo and background appear for all users after saving.'}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-card border border-border/50 rounded-[2rem] shadow-xl overflow-hidden">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/10">
              <h3 className="text-xl font-display font-bold">Service Types</h3>
              <Button size="sm" onClick={() => toast.info('Add service modal coming soon')} className="shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Add Service
              </Button>
            </div>
            
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold">Service Name</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${service.isActive !== false ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {service.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => toast.info('Edit coming soon')}>
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {services.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No services configured.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
