import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const { user, refreshUserData } = useAuth();
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
    profileImage: null,
  });
  const [editMode, setEditMode] = useState(false);
  const [passwordChangeMode, setPasswordChangeMode] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (user) {
      console.log('User data in ProfilePage:', user);
      console.log('User birthDate:', user.birthDate);

      // Formater la date de naissance correctement
      let formattedBirthDate = '';
      if (user.birthDate) {
        try {
          const date = new Date(user.birthDate);
          if (!isNaN(date.getTime())) {
            formattedBirthDate = date.toISOString().split('T')[0];
          }
        } catch (error) {
          console.error('Error formatting birthDate:', error);
        }
      }

      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        birthDate: formattedBirthDate,
        password: '',
        newPassword: '',
        confirmPassword: '',
        profileImage: null,
      });

      // Set preview image if user has profile image
      if (user.profileImage) {
        setPreviewImage(
          user.profileImage.startsWith('http')
            ? user.profileImage
            : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${user.profileImage}`
        );
      }
    }
  }, [user]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      setProfileForm(prev => ({
        ...prev,
        profileImage: file,
      }));

      // Preview image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('=== Frontend Profile Update ===');
      console.log('Profile form data:', profileForm);

      // Create a FormData object to handle file uploads
      const formData = new FormData();
      formData.append('firstName', profileForm.firstName);
      formData.append('lastName', profileForm.lastName);
      formData.append('email', profileForm.email);
      formData.append('phone', profileForm.phone);

      // Explicitly handle address field
      console.log('Address before sending:', profileForm.address);
      formData.append('address', profileForm.address || '');

      formData.append('birthDate', profileForm.birthDate);

      // Log FormData contents
      console.log('FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      // Only append profileImage if it exists
      if (profileForm.profileImage) {
        formData.append('profileImage', profileForm.profileImage);
        console.log('Profile image added to FormData');
      }

      // Get API URL and token
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      console.log('API URL:', API_URL);
      console.log('Token exists:', !!token);

      // Update user profile
      const response = await axios.put(`${API_URL}/api/users/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response:', response.data);

      if (response.data.success) {
        // Refresh user data in context
        await refreshUserData();

        // Log the updated user data
        console.log('User data after update:', user);
        console.log('Updated address:', user?.address);

        toast.success('Profil mis à jour avec succès');
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async e => {
    e.preventDefault();

    // Validate passwords
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (profileForm.newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setSaving(true);

    try {
      // Get API URL and token
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      // Change password
      const response = await axios.put(
        `${API_URL}/api/users/change-password`,
        {
          currentPassword: profileForm.password,
          newPassword: profileForm.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success('Mot de passe mis à jour avec succès');
        setPasswordChangeMode(false);
        setProfileForm(prev => ({
          ...prev,
          password: '',
          newPassword: '',
          confirmPassword: '',
        }));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
              {!editMode && !passwordChangeMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Modifier le profil
                </button>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 py-6">
            {/* Profile Image */}
            <div className="flex flex-col md:flex-row items-center mb-8">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-4 md:mb-0 md:mr-8">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircleIcon className="w-20 h-20 text-gray-400" />
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {user?.fullName || 'Utilisateur'}
                </h2>
                <p className="text-gray-600">{user?.email}</p>

                {editMode && (
                  <div className="mt-4">
                    <label className="bg-primary-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-primary-700 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      Changer la photo
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Password Change Form */}
            {passwordChangeMode && (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Changer le mot de passe
                  </h3>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Mot de passe actuel
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        value={profileForm.password}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        required
                        value={profileForm.newPassword}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Confirmer le nouveau mot de passe
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        required
                        value={profileForm.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setPasswordChangeMode(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Enregistrement...' : 'Changer le mot de passe'}
                  </button>
                </div>
              </form>
            )}

            {/* Profile Form */}
            {!passwordChangeMode && (
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Prénom
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          disabled={!editMode}
                          required
                          value={profileForm.firstName}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg ${
                            editMode
                              ? 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                              : 'bg-gray-50'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Nom
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          disabled={!editMode}
                          required
                          value={profileForm.lastName}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg ${
                            editMode
                              ? 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                              : 'bg-gray-50'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          disabled={true} // Email cannot be changed
                          required
                          value={profileForm.email}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Téléphone
                      </label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          disabled={!editMode}
                          value={profileForm.phone}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg ${
                            editMode
                              ? 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                              : 'bg-gray-50'
                          }`}
                          placeholder="+212 6XX XX XX XX"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Adresse
                      </label>
                      <div className="relative">
                        <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <textarea
                          id="address"
                          name="address"
                          disabled={!editMode}
                          rows={3}
                          value={profileForm.address}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg ${
                            editMode
                              ? 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                              : 'bg-gray-50'
                          }`}
                          placeholder="Votre adresse complète"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="birthDate"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Date de naissance
                      </label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="date"
                          id="birthDate"
                          name="birthDate"
                          disabled={!editMode}
                          value={profileForm.birthDate}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg ${
                            editMode
                              ? 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                              : 'bg-gray-50'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type de compte
                      </label>
                      <div className="relative">
                        <ShieldCheckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          disabled
                          value={
                            user?.role === 'professional'
                              ? 'Professionnel'
                              : user?.role === 'admin'
                                ? 'Administrateur'
                                : 'Client'
                          }
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  {editMode && (
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                      </button>
                    </div>
                  )}
                </form>

                {/* Password Change Button */}
                {!editMode && (
                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Sécurité</h3>
                    <button
                      onClick={() => setPasswordChangeMode(true)}
                      className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                    >
                      <LockClosedIcon className="h-5 w-5" />
                      <span>Changer mon mot de passe</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
