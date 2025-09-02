import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../ContextAPI/AuthContext';

const OAuthCallbackHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/?error=auth_failed');
        return;
      }

      if (token) {
        try {
          // 🔥 WAIT for the login to complete before navigating!
          const result = await loginWithGoogle(token);
          
          if (result.success) {
            // Navigation happens ONLY after successful login
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/?error=login_failed');
          }
        } catch (err) {
          console.error('Login failed:', err);
          navigate('/?error=login_failed');
        }
      } else {
        navigate('/?error=no_token');
      }
    };

    handleCallback();
  }, [searchParams, navigate, loginWithGoogle]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallbackHandler;