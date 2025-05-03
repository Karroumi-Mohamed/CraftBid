import React, { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { InputWithError } from '@/components/ui/InputWithError';
import { Label } from '@/components/ui/label';
import { UploadCloud, Edit, User as UserIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api, { ApiResponse } from '@/lib/axois';

interface BuyerProfileProps {
  user: User;
  onProfileUpdated: () => Promise<ApiResponse<User>>;
}

interface ProfileErrors {
  name?: string;
  email?: string;
  general?: string;
}

const BuyerProfile: React.FC<BuyerProfileProps> = ({ user, onProfileUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProfileErrors>({});
  
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  
  useEffect(() => {
    if (user.avatar) {
      const avatarUrl = user.avatar.startsWith('http') 
        ? user.avatar 
        : `http://127.0.0.1:8000/storage/${user.avatar}`;
      setImagePreview(avatarUrl);
    }
  }, [user]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };
  
  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    
    if (profileImage) {
      formData.append('avatar', profileImage);
    }
    
    try {
      await api.post('/profile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setIsLoading(false);
      setIsEditing(false);
      await onProfileUpdated();
    } catch (error: any) {
      setIsLoading(false);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Failed to update profile." });
      }
    }
  };
  
  return (
    <div className="pt-6 pb-12">
      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col items-center">
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden bg-gray-100 mb-4 shadow-sm border border-gray-200">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <UserIcon className="h-24 w-24 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="w-full mt-4">
                      <Label htmlFor="profile-upload" className="block mb-2 font-montserrat text-sm font-medium">Profile Image</Label>
                      <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-accent1 transition">
                        <label htmlFor="profile-upload" className="cursor-pointer flex flex-col items-center">
                          <UploadCloud className="h-8 w-8 text-accent1 mb-2" />
                          <span className="text-accent1 text-sm font-montserrat">Upload Image</span>
                          <input 
                            id="profile-upload" 
                            type="file" 
                            className="hidden" 
                            onChange={handleImageChange} 
                            accept="image/jpeg, image/png, image/jpg" 
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center mt-2">
                      <h2 className="font-montserrat font-semibold text-xl">{user.name}</h2>
                      <p className="text-gray-500 font-montserrat text-sm mt-1">{user.email}</p>
                      <div className="mt-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent1/10 text-accent1 border border-accent1/20">
                          Buyer
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {!isEditing && (
                    <Button 
                      onClick={() => setIsEditing(true)} 
                      variant="outline" 
                      className="mt-4 w-full flex items-center justify-center bg-accent1/5 hover:bg-accent1/10 border border-accent1/10 rounded-xl font-montserrat"
                    >
                      <Edit className="mr-2 h-4 w-4 text-accent1" /> 
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-2xl font-montserrat font-bold text-gray-900">
                    <span className="relative">
                      User Profile
                      <span className="absolute bottom-0 left-0 w-full h-1 bg-accent1 rounded-full transform translate-y-1"></span>
                    </span>
                  </h1>
                  
                  {isEditing && (
                    <Button 
                      onClick={() => setIsEditing(false)} 
                      variant="outline" 
                      className="flex items-center font-montserrat rounded-xl"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                
                {errors.general && (
                  <Alert variant="destructive" className="mb-6 rounded-xl">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errors.general}</AlertDescription>
                  </Alert>
                )}
                
                {isEditing ? (
                  <form onSubmit={handleUpdateProfile}>
                    <div className="space-y-6">
                      <InputWithError
                        id="name"
                        label="Name"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={errors.name}
                        required
                        className="w-full font-montserrat"
                      />
                      
                      <InputWithError
                        id="email"
                        label="Email"
                        type="email"
                        placeholder="Your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={errors.email}
                        required
                        className="w-full font-montserrat"
                      />
                      
                      <div className="flex justify-end">
                        <Button type="submit" className="bg-accent1 hover:bg-accent1/90 text-white font-montserrat rounded-xl">
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-4">
                      <h2 className="text-lg font-montserrat font-semibold text-gray-900 mb-2">Profile Information</h2>
                      <p className="font-montserrat text-sm text-gray-500">
                        This information is visible to other users on the platform when they view your bids or interactions.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-montserrat font-medium text-gray-500 mb-1">Full Name</h3>
                        <p className="font-montserrat text-base text-gray-900">{user.name}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-montserrat font-medium text-gray-500 mb-1">Email Address</h3>
                        <p className="font-montserrat text-base text-gray-900">{user.email}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-montserrat font-medium text-gray-500 mb-1">Account Type</h3>
                        <p className="font-montserrat text-base text-gray-900">Buyer</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-montserrat font-medium text-gray-500 mb-1">Member Since</h3>
                        <p className="font-montserrat text-base text-gray-900">
                          {user.email_verified_at ? new Date(user.email_verified_at).toLocaleDateString() : 'Not verified'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4 mt-6">
                      <h2 className="text-lg font-montserrat font-semibold text-gray-900 mb-2">Account Settings</h2>
                      <p className="font-montserrat text-sm text-gray-500 mb-4">
                        Manage your account settings and preferences.
                      </p>
                      
                      <div className="flex flex-wrap gap-3">
                        <Button 
                          variant="outline" 
                          className="font-montserrat rounded-xl border border-accent1/20 text-accent1"
                          onClick={() => setIsEditing(true)}
                        >
                          Edit Profile
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="font-montserrat rounded-xl border border-gray-200"
                          onClick={() => window.location.href = '/dashboard/settings'}
                        >
                          Account Settings
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerProfile; 