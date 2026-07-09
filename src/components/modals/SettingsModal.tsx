import React, { useState, useCallback } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { X, LogOut, Moon, Sun, Save, Check } from 'lucide-react';
import { auth, signOut } from '../../lib/firebase';
import Cropper from 'react-easy-crop';

export function SettingsModal() {
  const { setSettingsModal, theme, setTheme } = useUIStore();
  const { user, updateProfile } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleLogout = async () => {
    await signOut(auth);
    setSettingsModal(false);
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = useCallback(async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      setAvatar(croppedImage);
      setImageSrc(null);
    } catch (e) {
      console.error(e);
    }
  }, [imageSrc, croppedAreaPixels]);

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile({ displayName, avatar });
    setSaving(false);
    setIsEditing(false);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      let imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl as string);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-50 dark:bg-[#313338] w-full max-w-4xl rounded-xl shadow-2xl flex flex-col relative overflow-hidden h-[80vh] min-h-[500px] transition-colors border border-black/10 dark:border-white/10">
        <button 
          onClick={() => setSettingsModal(false)}
          className="absolute top-4 right-4 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white z-10 transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="flex flex-col md:flex-row h-full">
          {/* Sidebar */}
          <div className="md:w-64 w-full bg-zinc-100 dark:bg-[#2b2d31] p-4 flex flex-col border-b md:border-b-0 md:border-r border-black/5 dark:border-white/5 flex-shrink-0 overflow-y-auto">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-2">User Settings</h3>
            <button className="bg-indigo-500/10 dark:bg-[#404249] text-indigo-600 dark:text-white px-3 py-2 rounded text-left font-medium mb-1 transition-colors">My Account</button>
            <button className="hover:bg-zinc-200 dark:hover:bg-[#35373c] text-zinc-700 dark:text-zinc-300 px-3 py-2 rounded text-left font-medium mb-1 transition-colors hidden md:block">Privacy & Safety</button>
            <button className="hover:bg-zinc-200 dark:hover:bg-[#35373c] text-zinc-700 dark:text-zinc-300 px-3 py-2 rounded text-left font-medium mb-1 transition-colors hidden md:block">Notifications</button>
            
            <div className="h-px bg-zinc-300 dark:bg-[#3f4147] my-4" />
            
            <button 
              onClick={handleLogout}
              className="hover:bg-red-500 hover:text-white text-red-500 dark:text-red-400 px-3 py-2 rounded text-left font-medium flex items-center gap-2 transition-colors mt-auto md:mt-0"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
          
          {/* Main */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6">My Account</h2>
            
            {/* Profile Card */}
            <div className="bg-white dark:bg-[#1e1f22] rounded-xl p-4 mb-6 border border-zinc-200 dark:border-white/5 relative shadow-sm">
              <div className="h-24 bg-indigo-500 absolute top-0 left-0 right-0 rounded-t-xl" />
              <div className="w-24 h-24 bg-white dark:bg-[#313338] rounded-full border-4 border-white dark:border-[#1e1f22] relative z-10 mt-10 flex items-center justify-center text-4xl font-bold text-black dark:text-white shadow-md overflow-hidden">
                {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user?.displayName.substring(0, 2).toUpperCase()}
              </div>
              <div className="mt-4 bg-zinc-50 dark:bg-[#2b2d31] rounded-lg p-4 flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between sm:items-center border border-zinc-200 dark:border-transparent">
                <div>
                  <div className="text-black dark:text-white font-bold text-lg">{user?.displayName}</div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-sm">#{user?.username}</div>
                </div>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                  {isEditing ? 'Cancel' : 'Edit User Profile'}
                </button>
              </div>
            </div>
            
            {isEditing && (
              <div className="bg-white dark:bg-[#2b2d31] p-6 rounded-xl mb-6 border border-zinc-200 dark:border-transparent shadow-sm">
                <h3 className="text-black dark:text-white font-bold mb-4 uppercase tracking-wider text-xs">Edit Profile Information</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Display Name</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full bg-zinc-100 dark:bg-[#1e1f22] text-black dark:text-zinc-100 p-3 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Profile Picture</label>
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-[#1e1f22] flex items-center justify-center overflow-hidden border-2 border-dashed border-zinc-300 dark:border-zinc-600 cursor-pointer hover:border-indigo-500 transition-colors flex-shrink-0"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <span className="text-zinc-400 text-xs text-center p-1">Upload</span>}
                      </div>
                      <input 
                        id="avatar-upload"
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={onFileChange}
                      />
                      <div className="text-sm text-zinc-500">
                        Click the circle to upload and crop a new profile picture.
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm w-full sm:w-auto justify-center"
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
            
            <h2 className="text-xl font-bold text-black dark:text-white mb-4 border-t border-zinc-200 dark:border-[#3f4147] pt-6">Appearance</h2>
            <div className="flex items-center justify-between bg-white dark:bg-[#2b2d31] p-5 rounded-xl border border-zinc-200 dark:border-transparent shadow-sm mb-6">
              <div>
                <div className="text-black dark:text-white font-bold">Theme</div>
                <div className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Toggle between Dark and Light mode.</div>
              </div>
              <div className="flex items-center bg-zinc-100 dark:bg-[#1e1f22] rounded-full p-1 border border-zinc-200 dark:border-transparent">
                <button 
                  onClick={() => setTheme('light')}
                  className={`p-2 rounded-full transition-all ${theme === 'light' ? 'bg-white text-black shadow-md' : 'text-zinc-500 hover:text-black'}`}
                >
                  <Sun size={20} />
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`p-2 rounded-full transition-all ${theme === 'dark' ? 'bg-[#35373c] text-white shadow-md' : 'text-zinc-500 hover:text-white'}`}
                >
                  <Moon size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {imageSrc && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#2b2d31] rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-white font-bold">Crop Image</h3>
              <button onClick={() => setImageSrc(null)} className="text-zinc-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="relative h-64 w-full bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-4 space-y-4">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <button 
                onClick={showCroppedImage}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-md flex items-center justify-center gap-2"
              >
                <Check size={18} /> Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function readFile(file: File) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result), false)
    reader.readAsDataURL(file)
  })
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return ''
  }

  // Set the canvas to the desired dimensions (max 256x256 for avatar)
  const MAX_SIZE = 256;
  canvas.width = MAX_SIZE;
  canvas.height = MAX_SIZE;

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    MAX_SIZE,
    MAX_SIZE
  )

  // As a base64 string
  return canvas.toDataURL('image/jpeg', 0.8)
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
