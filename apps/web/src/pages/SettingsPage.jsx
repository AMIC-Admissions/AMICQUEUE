
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Settings, Save, Plus, Trash2, Edit, Image as ImageIcon, Palette, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState([]);
  
  const [settings, setSettings] = useState({
    id: '',
    systemTitle: '',
    colorBackground: 'light',
    notificationSettings: {
      soundEnabled: true,
      autoLogout: 30,
      defaultLanguage: 'en'
    }
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
          systemTitle: s.systemTitle || '',
          colorBackground: s.colorBackground || 'light',
          notificationSettings: s.notificationSettings || { soundEnabled: true, autoLogout: 30, defaultLanguage: 'en' }
        });
      }
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

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      if (settings.id) {
        await pb.collection('settings').update(settings.id, {
          systemTitle: settings.systemTitle,
          colorBackground: settings.colorBackground,
          notificationSettings: settings.notificationSettings
        }, { $autoCancel: false });
      } else {
        const created = await pb.collection('settings').create({
          systemTitle: settings.systemTitle,
          colorBackground: settings.colorBackground,
          notificationSettings: settings.notificationSettings
        }, { $autoCancel: false });
        setSettings(prev => ({ ...prev, id: created.id }));
      }
      
      await pb.collection('activity_logs').create({
        action: 'settings_updated',
        userId: pb.authStore.model?.id,
        timestamp: new Date().toISOString(),
        description: 'Updated system settings'
      }, { $autoCancel: false }).catch(() => {});

      toast.success('Settings saved successfully');
    } catch (error) {
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
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="system" className="rounded-lg data-[state=active]:shadow-sm">System</TabsTrigger>
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
                <div className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-bold mb-1">Upload Logo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                </div>
                
                <div className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-bold mb-1">Upload Background</p>
                  <p className="text-xs text-muted-foreground">1920x1080 recommended</p>
                </div>
              </div>
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
