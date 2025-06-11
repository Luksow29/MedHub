import React from 'react';
import { User } from '@supabase/supabase-js';
import { useAuth } from '../../hooks/useAuth';
import Button from './Button';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="bg-sky-700 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">MedRemind Hub</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm">Welcome, {user.email}</span>
          <Button onClick={handleLogout} variant="secondary" size="sm">
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;