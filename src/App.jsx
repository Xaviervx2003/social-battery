import React, { useState, useRef } from 'react';
import { 
  Battery, BatteryCharging, Zap, Coffee, Moon, Music, 
  MessageCircle, PhoneOff, Sun, Bell, Heart, User, 
  BarChart2, Clock, Shield, Calendar, Share2, Copy, Plus, Search,
  Settings, Volume2, VolumeX, Globe, Eye, EyeOff, Users
} from 'lucide-react';

export default function SocialBatteryApp() {
  const [batteryLevel, setBatteryLevel] = useState(65);
  const [activeTab, setActiveTab] = useState('home');
  const [rechargeTime, setRechargeTime] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const [inviteCode] = useState("RAFA-8291");
  const [copied, setCopied] = useState(false);

  // Configurações de notificação
  const [notificationSettings, setNotificationSettings] = useState({
    friendUpdates: true,
    ownUpdates: true,
    lowBatteryAlerts: true,
    careReceived: true,
    streakReminders: false,
    soundEnabled: true,
    vibration: true,
    showOnLockScreen: true
  });

  // Configurações de privacidade
  const [privacySettings, setPrivacySettings] = useState({
    showBatteryToAll: true,
    showStatusToAll: true,
    showToCloseFriends: true,
    showLastUpdate: true,
    visibleInSearch: true,
    allowFriendRequests: true
  });

  const [notifications, setNotifications] = useState([
    { id: 1, type: 'charge', from: 'Ana', message: 'Ana te enviou um café virtual ☕', time: '10m atrás', read: false },
    { id: 2, type: 'alert', from: 'System', message: 'Você respeitou o Modo Caverna por 2h! +1 Badge', time: '2h atrás', read: false },
    { id: 3, type: 'update', from: 'Lucas', message: 'Lucas mudou para Modo Caverna', time: '15m atrás', read: true },
    { id: 4, type: 'update', from: 'Júlia', message: 'Júlia agora está no Modo Festa!', time: '30m atrás', read: true },
    { id: 5, type: 'care', from: 'Pedro', message: 'Pedro enviou um carinho para você', time: '1h atrás', read: true }
  ]);
  
  const [friends, setFriends] = useState([
    { id: 1, name: 'Lucas', battery: 15, status: 'cave', lastUpdate: '10 min', notificationsEnabled: true },
    { id: 2, name: 'Júlia', battery: 90, status: 'party', lastUpdate: 'Agora', notificationsEnabled: true },
    { id: 3, name: 'Pedro', battery: 45, status: 'passive', lastUpdate: '1h', notificationsEnabled: false },
    { id: 4, name: 'Mari', battery: 60, status: 'coffee', lastUpdate: '30 min', notificationsEnabled: true },
  ]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateBatteryFromPointer(e);
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      updateBatteryFromPointer(e);
    }
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const updateBatteryFromPointer = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    
    setBatteryLevel(Math.round(percentage));
    setRechargeTime(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`Olá! Acompanha a minha bateria social neste app: socialbattery.app/invite/${inviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    alert(`Link de convite gerado para ${inviteCode}! Compartilhe no WhatsApp.`);
  };

  const getModeInfo = (level) => {
    if (level <= 20) return { 
      mode: 'Modo Caverna', 
      color: 'bg-slate-800', 
      textColor: 'text-slate-200',
      accent: 'from-slate-700 to-slate-900',
      icon: Moon, 
      desc: 'Sem respostas. Apenas existindo.',
      avatarBg: 'bg-slate-700'
    };
    if (level <= 50) return { 
      mode: 'Modo Passivo', 
      color: 'bg-blue-600', 
      textColor: 'text-blue-50',
      accent: 'from-blue-500 to-blue-700',
      icon: MessageCircle, 
      desc: 'Memes e textos. Sem ligações.',
      avatarBg: 'bg-blue-500'
    };
    if (level <= 80) return { 
      mode: 'Modo Café', 
      color: 'bg-orange-500', 
      textColor: 'text-orange-50',
      accent: 'from-orange-400 to-orange-600',
      icon: Coffee, 
      desc: 'Topo sair para algo tranquilo.',
      avatarBg: 'bg-orange-400'
    };
    return { 
      mode: 'Modo Festa', 
      color: 'bg-green-500', 
      textColor: 'text-green-50',
      accent: 'from-green-400 to-green-600',
      icon: Zap, 
      desc: 'Pronto para o agito total!',
      avatarBg: 'bg-green-400'
    };
  };

  const currentMode = getModeInfo(batteryLevel);
  const ModeIcon = currentMode.icon;

  const sendCare = (friendName) => {
    alert(`⚡ Enviou um carregador virtual para ${friendName}! (Sem abrir chat)`);
  };

  // Funções para atualizar configurações
  const toggleNotificationSetting = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const togglePrivacySetting = (setting) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const toggleFriendNotifications = (friendId) => {
    setFriends(prev => prev.map(friend => 
      friend.id === friendId 
        ? { ...friend, notificationsEnabled: !friend.notificationsEnabled }
        : friend
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Conteúdo das abas
  const homeContent = (
    <div className={`space-y-6 pb-24 ${isDragging ? '' : 'animate-in fade-in duration-500'}`}>
      <div className="flex justify-between items-center pt-4 px-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Olá, Rafa</h2>
          <p className="text-sm text-slate-500">Cuide da sua energia hoje.</p>
        </div>
        <button 
          onClick={() => setActiveTab('notifications')}
          className="relative"
        >
          <Bell className="text-slate-600" size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white text-white text-xs flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className={`rounded-3xl p-6 shadow-xl text-white transition-colors duration-500 bg-gradient-to-br ${currentMode.accent}`}>
        <div className="flex justify-between items-start mb-6">
          <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
            <ModeIcon size={24} className="text-white" />
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-bold">{batteryLevel}%</h1>
            <p className="text-white/80 text-sm font-medium">{currentMode.mode}</p>
          </div>
        </div>

        <div className="flex justify-center mb-8">
           <div className={`w-32 h-32 rounded-full ${currentMode.avatarBg} border-4 border-white/30 flex items-center justify-center shadow-lg transition-colors duration-500 relative`}>
              {batteryLevel <= 20 ? <span className="text-5xl">😴</span> : 
               batteryLevel <= 50 ? <span className="text-5xl">😐</span> : 
               batteryLevel <= 80 ? <span className="text-5xl">🙂</span> : 
               <span className="text-5xl">🤩</span>}
              {rechargeTime && (
                <div className="absolute -bottom-2 bg-white text-slate-800 text-xs px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                   <Clock size={10} /> {rechargeTime}
                </div>
              )}
           </div>
        </div>

        <div 
          ref={sliderRef}
          className="relative w-full h-14 bg-black/20 rounded-full p-1 mb-2 cursor-pointer touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div className="w-full h-full rounded-full overflow-hidden relative">
             <div 
                className={`h-full bg-white/90 rounded-full relative shadow-sm ${isDragging ? '' : 'transition-all duration-300 ease-out'}`}
                style={{ width: `${batteryLevel}%` }}
             >
                <div className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center transform active:scale-95 transition-transform">
                    <div className="w-1.5 h-4 bg-slate-300 rounded-full"></div>
                </div>
             </div>
          </div>
        </div>
        <p className="text-center text-white/70 text-sm mt-2">{currentMode.desc}</p>
      </div>

      {batteryLevel < 50 && !rechargeTime && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
            <BatteryCharging size={16} /> Definir tempo de recarga?
          </p>
          <div className="flex gap-2">
            {[1, 2, 4].map(h => (
              <button key={h} onClick={() => setRechargeTime(`${h}h`)} className="flex-1 py-2 text-xs font-semibold bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 border border-slate-200">{h}h</button>
            ))}
            <button onClick={() => setRechargeTime('Amanhã')} className="flex-1 py-2 text-xs font-semibold bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 border border-slate-200">Até Amanhã</button>
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="font-bold text-slate-800">Círculo Íntimo</h3>
          <span className="text-xs text-indigo-600 font-medium">Ver Widget</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {friends.slice(0, 2).map(friend => {
             const fMode = getModeInfo(friend.battery);
             return (
              <div key={friend.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${fMode.color}`}></div>
                <div className="flex justify-between items-start mb-2">
                  <div className={`w-10 h-10 rounded-full ${fMode.avatarBg} flex items-center justify-center text-white text-sm font-bold`}>
                    {friend.name[0]}
                  </div>
                  <span className="text-xs text-slate-400">{friend.lastUpdate}</span>
                </div>
                <h4 className="font-bold text-slate-700">{friend.name}</h4>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${fMode.color}`} style={{ width: `${friend.battery}%` }}></div>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{friend.battery}%</span>
                </div>
              </div>
             );
          })}
        </div>
      </div>
    </div>
  );

  const friendsContent = (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500 pt-6 px-2">
      <div className="flex justify-between items-center mb-2">
         <h2 className="text-2xl font-bold text-slate-800">Amigos</h2>
         <button className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100">
            <Plus size={24} />
         </button>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
         <div className="flex justify-between items-start mb-4">
            <div>
               <h3 className="font-bold text-lg">Conecte-se</h3>
               <p className="text-indigo-100 text-sm opacity-90">Partilhe o seu status com amigos.</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
               <Share2 size={20} className="text-white" />
            </div>
         </div>

         <div className="bg-black/20 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm mb-4 border border-white/10">
            <div>
               <p className="text-xs text-indigo-200 mb-1">SEU CÓDIGO DE AMIGO</p>
               <p className="text-xl font-mono font-bold tracking-wider">{inviteCode}</p>
            </div>
            <button 
               onClick={handleCopyCode}
               className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-95"
            >
               {copied ? <span className="text-xs font-bold text-green-300">Copiado!</span> : <Copy size={20} />}
            </button>
         </div>

         <button 
            onClick={handleShare}
            className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm"
         >
            Convidar Amigos via WhatsApp
         </button>
      </div>

      <div className="relative">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
         <input 
            type="text" 
            placeholder="Adicionar por código (ex: #ANA-123)"
            className="w-full bg-white pl-12 pr-4 py-3 rounded-xl border-none text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-100 outline-none placeholder:text-slate-400"
         />
      </div>

      <div>
         <h3 className="font-bold text-slate-700 mb-3 px-1">Seu Círculo ({friends.length})</h3>
         <div className="space-y-3">
            {friends.map(friend => {
               const fMode = getModeInfo(friend.battery);
               return (
                  <div key={friend.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full ${fMode.avatarBg} flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm relative`}>
                           {friend.name[0]}
                           <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${fMode.color}`}></div>
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-700">{friend.name}</h4>
                           <p className="text-xs text-slate-400 flex items-center gap-1">
                              {fMode.mode} • {friend.lastUpdate}
                           </p>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <div className="text-right">
                           <span className={`text-sm font-bold ${friend.battery < 20 ? 'text-slate-400' : 'text-slate-600'}`}>
                              {friend.battery}%
                           </span>
                        </div>
                        {friend.battery < 30 ? (
                           <button onClick={() => sendCare(friend.name)} className="p-2 bg-pink-50 text-pink-500 rounded-full hover:bg-pink-100">
                              <Heart size={18} fill="currentColor" />
                           </button>
                        ) : (
                           <div className="w-8 h-8 flex items-center justify-center text-slate-300">
                              {friend.battery > 80 ? <Zap size={18} /> : <Coffee size={18} />}
                           </div>
                        )}
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
    </div>
  );

  const insightsContent = (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500 pt-6">
      <h2 className="text-2xl font-bold text-slate-800 px-2">Seus Insights</h2>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <BarChart2 size={20} className="text-indigo-500" />
            Variação de Humor
          </h3>
          <select className="text-xs bg-slate-50 border-none rounded-lg p-1 text-slate-500 outline-none">
            <option>Esta Semana</option>
          </select>
        </div>
        <div className="flex items-end justify-between h-32 gap-2">
          {[60, 40, 20, 10, 50, 80, 70].map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div className={`w-full rounded-t-lg transition-all ${h < 30 ? 'bg-slate-300' : 'bg-indigo-400'}`} style={{ height: `${h}%` }}></div>
              <span className="text-[10px] text-slate-400">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-3xl text-white shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Streak</h3>
          <Shield size={24} className="text-purple-200" />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-5xl font-bold">12</span>
          <div><p className="font-medium text-purple-100">Dias seguidos</p></div>
        </div>
      </div>
    </div>
  );

  const notificationsContent = (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500 pt-6 px-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Notificações</h2>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100"
            >
              Marcar como lidas
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              onClick={clearAllNotifications}
              className="px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-100"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Histórico de Notificações */}
      {notifications.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Bell size={18} /> Histórico ({unreadCount} não lidas)
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-4 ${!notification.read ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      notification.type === 'charge' ? 'bg-green-100 text-green-600' :
                      notification.type === 'alert' ? 'bg-purple-100 text-purple-600' :
                      notification.type === 'care' ? 'bg-pink-100 text-pink-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {notification.type === 'charge' ? <Zap size={14} /> :
                       notification.type === 'alert' ? <Shield size={14} /> :
                       notification.type === 'care' ? <Heart size={14} /> :
                       <Users size={14} />}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-700">{notification.from}</h4>
                      <p className="text-sm text-slate-600">{notification.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{notification.time}</span>
                </div>
                {!notification.read && (
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl text-center border border-slate-100">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-700 mb-2">Nenhuma notificação</h3>
          <p className="text-sm text-slate-500">Suas notificações aparecerão aqui</p>
        </div>
      )}

      {/* Configurações de Notificação */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Settings size={18} /> Configurações de Notificação
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-4">
            <h4 className="font-medium text-slate-700 flex items-center gap-2">
              <Users size={16} /> Notificações de Amigos
            </h4>
            
            {friends.map(friend => (
              <div key={friend.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${
                    getModeInfo(friend.battery).avatarBg
                  } flex items-center justify-center text-white font-bold`}>
                    {friend.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">{friend.name}</p>
                    <p className="text-xs text-slate-500">{friend.battery}% • {friend.lastUpdate}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFriendNotifications(friend.id)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    friend.notificationsEnabled ? 'bg-indigo-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    friend.notificationsEnabled ? 'right-1' : 'left-1'
                  }`}></div>
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="font-medium text-slate-700 flex items-center gap-2">
              <Globe size={16} /> Configurações Gerais
            </h4>
            
            {Object.entries(notificationSettings).map(([key, value]) => {
              const labels = {
                friendUpdates: "Atualizações dos amigos",
                ownUpdates: "Minhas próprias atualizações",
                lowBatteryAlerts: "Alertas de bateria baixa",
                careReceived: "Quando receber cuidados",
                streakReminders: "Lembretes de streak",
                soundEnabled: "Som das notificações",
                vibration: "Vibração",
                showOnLockScreen: "Mostrar na tela bloqueada"
              };
              
              return (
                <div key={key} className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-700">{labels[key]}</span>
                  <button
                    onClick={() => toggleNotificationSetting(key)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${
                      value ? 'bg-indigo-500' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      value ? 'right-1' : 'left-1'
                    }`}></div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Configurações de Privacidade */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Eye size={18} /> Privacidade
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {Object.entries(privacySettings).map(([key, value]) => {
            const labels = {
              showBatteryToAll: "Mostrar bateria para todos",
              showStatusToAll: "Mostrar status para todos",
              showToCloseFriends: "Sempre mostrar para amigos próximos",
              showLastUpdate: "Mostrar última atualização",
              visibleInSearch: "Visível em buscas",
              allowFriendRequests: "Permitir solicitações de amizade"
            };
            
            return (
              <div key={key} className="flex justify-between items-center py-2">
                <div>
                  <span className="text-sm text-slate-700">{labels[key]}</span>
                </div>
                <button
                  onClick={() => togglePrivacySetting(key)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    value ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    value ? 'right-1' : 'left-1'
                  }`}></div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Volume e Som */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-4">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
            {notificationSettings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            Som e Volume
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Volume das notificações</span>
              <div className="flex items-center gap-2">
                <VolumeX size={16} className="text-slate-400" />
                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500" 
                    style={{ width: notificationSettings.soundEnabled ? '75%' : '0%' }}
                  ></div>
                </div>
                <Volume2 size={16} className="text-slate-400" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Tipo de som</span>
              <select className="text-xs bg-slate-50 border-none rounded-lg p-2 text-slate-500 outline-none">
                <option>Notificação padrão</option>
                <option>Som suave</option>
                <option>Sem som</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-200 font-sans p-4">
      <div className="w-full max-w-sm h-[800px] bg-slate-50 rounded-[40px] shadow-2xl overflow-hidden relative border-[8px] border-gray-900 flex flex-col">
        {/* Status Bar */}
        <div className="bg-slate-50 h-8 flex justify-between items-center px-6 text-[10px] font-bold text-slate-800 z-10 select-none">
          <span>9:41</span>
          <div className="flex gap-1.5 items-center">
             <PhoneOff size={10} className={batteryLevel < 20 ? 'text-red-500' : 'text-slate-300'} />
             <div className="w-5 h-2.5 border border-slate-800 rounded-[2px] relative ml-1">
               <div className="absolute inset-0.5 bg-slate-800" style={{ width: `${batteryLevel}%`, maxWidth: '100%' }}></div>
             </div>
          </div>
        </div>

        {/* Conteúdo - Renderizado Condicionalmente */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pt-2 select-none">
          {activeTab === 'home' && homeContent}
          {activeTab === 'friends' && friendsContent}
          {activeTab === 'insights' && insightsContent}
          {activeTab === 'notifications' && notificationsContent}
        </div>

        {/* Navigation Bar */}
        <div className="absolute bottom-6 left-6 right-6 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-around z-20 border border-slate-100">
          <button 
            onClick={() => setActiveTab('home')} 
            className={`transition-all duration-300 ${activeTab === 'home' ? 'text-slate-900 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Battery size={24} fill={activeTab === 'home' ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={() => setActiveTab('friends')} 
            className={`transition-all duration-300 ${activeTab === 'friends' ? 'text-slate-900 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <MessageCircle size={24} fill={activeTab === 'friends' ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={() => setActiveTab('insights')} 
            className={`transition-all duration-300 ${activeTab === 'insights' ? 'text-slate-900 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <BarChart2 size={24} fill={activeTab === 'insights' ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={() => setActiveTab('notifications')} 
            className={`transition-all duration-300 relative ${activeTab === 'notifications' ? 'text-slate-900 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Bell size={24} fill={activeTab === 'notifications' ? "currentColor" : "none"} />
            {unreadCount > 0 && activeTab !== 'notifications' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
        </div>

        {/* Overlay do Modo Caverna */}
        {batteryLevel <= 20 && (
           <div className="absolute inset-0 bg-slate-900/10 pointer-events-none z-0 mix-blend-multiply"></div>
        )}
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}