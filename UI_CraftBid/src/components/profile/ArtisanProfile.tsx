import React, { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { InputWithError } from '@/components/ui/InputWithError';
import { TextareaWithError } from '@/components/ui/TextareaWithError';
import { Label } from '@/components/ui/label';
import { UploadCloud, Edit, Check, Store, MapPin } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api, { ApiResponse } from '@/lib/axois';

interface Artisan {
  id: number;
  business_name: string;
  speciality: string;
  location: string;
  bio: string;
  image?: string;
  rating?: number;
  status: string;
  id_verification_status: string;
  id_document_front_path?: string;
  id_document_front_url?: string;
  id_document_back_path?: string;
  id_document_back_url?: string;
  social_media_links?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

interface ArtisanProfileProps {
  user: User;
  onProfileUpdated: () => Promise<ApiResponse<User>>;
}

interface ProfileErrors {
  business_name?: string;
  speciality?: string;
  location?: string;
  bio?: string;
  image?: string;
  general?: string;
}
export const formatImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  return imagePath.startsWith('http') 
    ? imagePath 
    : `http://127.0.0.1:8000/storage/${imagePath}`;
}; 
const ArtisanProfile: React.FC<ArtisanProfileProps> = ({ user, onProfileUpdated }) => {
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileLogo, setProfileLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProfileErrors>({});
  
  const [businessName, setBusinessName] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  
  useEffect(() => {
    const fetchArtisanProfile = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const response = await api.get('/artisan/profile');
        
        if (response.data) {
          const artisanData = response.data as Artisan;
          setArtisan(artisanData);
          setBusinessName(artisanData.business_name || '');
          setSpeciality(artisanData.speciality || '');
          setLocation(artisanData.location || '');
          setBio(artisanData.bio || '');
          setLogoPreview(formatImageUrl(artisanData.image));
        }
      } catch (error) {
        setErrors({ general: "Could not load artisan profile." });
        console.error('Error fetching artisan profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArtisanProfile();
  }, [user]);
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => { setLogoPreview(reader.result as string); };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, image: undefined }));
    }
  };
  
  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    const formData = new FormData();
    formData.append('business_name', businessName);
    formData.append('speciality', speciality);
    formData.append('location', location);
    formData.append('bio', bio);
    
    if (profileLogo) {
      formData.append('image', profileLogo);
    }
    
    try {
      const response = await api.post('/artisan/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data) {
        setArtisan(response.data as Artisan);
        setIsEditing(false);
      }
      
      await onProfileUpdated();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors as ProfileErrors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Failed to update profile." });
      }
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-accent1" />
            </div>
            <p className="text-lg font-montserrat">Loading artisan profile...</p>
            <div className="w-full h-2 bg-gray-100 rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-accent1 rounded-full animate-pulse" style={{ width: "70%" }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!artisan) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="max-w-md mx-auto rounded-xl shadow-lg">
          <AlertTitle className="font-montserrat text-lg">Error</AlertTitle>
          <AlertDescription className="font-montserrat">
            Could not load artisan profile information.
            <Button 
              className="mt-4 w-full bg-accent1 hover:bg-accent1/90 rounded-xl font-montserrat"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="pt-6 pb-12">
      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column - Profile/Business image */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col items-center">
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden bg-gray-100 mb-4 shadow-sm border border-gray-200">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Business" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Store className="h-24 w-24 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="w-full mt-4">
                      <Label htmlFor="logo-upload" className="block mb-2 font-montserrat text-sm font-medium">Business Logo</Label>
                      <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-accent1 transition">
                        <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center">
                          <UploadCloud className="h-8 w-8 text-accent1 mb-2" />
                          <span className="text-accent1 text-sm font-montserrat">Upload Logo</span>
                          <input 
                            id="logo-upload" 
                            type="file" 
                            className="hidden" 
                            onChange={handleLogoChange} 
                            accept="image/jpeg, image/png, image/jpg" 
                          />
                        </label>
                      </div>
                      {errors.image && <p className="text-destructive text-sm mt-1 font-montserrat">{errors.image}</p>}
                    </div>
                  ) : (
                    <div className="text-center mt-2">
                      <h2 className="font-montserrat font-semibold text-xl">{artisan.business_name}</h2>
                      <p className="text-gray-500 font-montserrat text-sm mt-1">{user.name}</p>
                      
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <MapPin className="h-4 w-4 text-accent1" />
                        <span className="font-montserrat text-sm">{artisan.location}</span>
                      </div>
                      
                      <div className="mt-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium 
                          ${artisan.id_verification_status === 'confirmed' ? 
                            'bg-green-100/70 text-green-800 border border-green-200' : 
                            artisan.id_verification_status === 'pending' ? 
                            'bg-yellow-100/70 text-yellow-800 border border-yellow-200' : 
                            'bg-red-100/70 text-red-800 border border-red-200'
                          }`}
                        >
                          {artisan.id_verification_status === 'confirmed' && <Check className="w-3 h-3 mr-1" />}
                          {artisan.id_verification_status.charAt(0).toUpperCase() + artisan.id_verification_status.slice(1)} Verification
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
          
          {/* Right column - Profile details */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-2xl font-montserrat font-bold text-gray-900">
                    <span className="relative">
                      Artisan Profile
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputWithError
                          id="business-name"
                          label="Business Name"
                          placeholder="Your business name"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          error={errors.business_name}
                          required
                          className="w-full font-montserrat"
                        />
                        
                        <InputWithError
                          id="speciality"
                          label="Speciality"
                          placeholder="Your craft speciality"
                          value={speciality}
                          onChange={(e) => setSpeciality(e.target.value)}
                          error={errors.speciality}
                          required
                          className="w-full font-montserrat"
                        />
                      </div>
                      
                      <InputWithError
                        id="location"
                        label="Location"
                        placeholder="City, Region"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        error={errors.location}
                        required
                        className="w-full font-montserrat"
                      />
                      
                      <TextareaWithError
                        id="bio"
                        label="Bio"
                        placeholder="Tell potential buyers about your craft and experience"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        error={errors.bio}
                        required
                        className="w-full font-montserrat"
                        rows={5}
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
                      <h2 className="text-lg font-montserrat font-semibold text-gray-900 mb-2">Business Information</h2>
                      <p className="font-montserrat text-sm text-gray-500">
                        This information is visible to buyers when they browse your products and auctions.
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-montserrat font-medium text-gray-500 mb-1">Business Name</h3>
                        <p className="font-montserrat text-base text-gray-900">{artisan.business_name}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-montserrat font-medium text-gray-500 mb-1">Speciality</h3>
                        <p className="font-montserrat text-base text-gray-900">{artisan.speciality}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-montserrat font-medium text-gray-500 mb-1">Location</h3>
                        <p className="font-montserrat text-base text-gray-900">{artisan.location}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-montserrat font-medium text-gray-500 mb-1">Bio</h3>
                        <p className="font-montserrat text-base text-gray-900 whitespace-pre-line">{artisan.bio}</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4 mt-6">
                      <h2 className="text-lg font-montserrat font-semibold text-gray-900 mb-2">Account Settings</h2>
                      <p className="font-montserrat text-sm text-gray-500 mb-4">
                        Manage your artisan profile and account settings.
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
                        
                        <Button 
                          variant="outline" 
                          className="font-montserrat rounded-xl border border-gray-200"
                          onClick={() => window.location.href = '/dashboard/my-products'}
                        >
                          Manage Products
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

export default ArtisanProfile; 