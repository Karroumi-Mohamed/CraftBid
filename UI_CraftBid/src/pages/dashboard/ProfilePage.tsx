import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import BuyerProfile from '@/components/profile/BuyerProfile';
import ArtisanProfile from '@/components/profile/ArtisanProfile';

const ProfilePage: React.FC = () => {
  const { user, isLoading, refreshUser } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-lg font-montserrat">Loading profile...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="rounded-xl">
          <AlertTitle className="font-montserrat">Error</AlertTitle>
          <AlertDescription className="font-montserrat">You must be logged in to view this page.</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const isArtisan = user.roles?.some(role => role.name === 'artisan');
  
  return isArtisan ? (
    <ArtisanProfile user={user} onProfileUpdated={refreshUser} />
  ) : (
    <BuyerProfile user={user} onProfileUpdated={refreshUser} />
  );
};

export default ProfilePage; 