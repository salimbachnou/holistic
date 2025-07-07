import React, { useState, useEffect } from 'react';
import { FaUsers, FaHandHoldingHeart, FaLightbulb, FaChartLine } from 'react-icons/fa';

import { apiService } from '../services/axiosConfig';

const AboutPage = () => {
  const [stats, setStats] = useState({
    professionals: 0,
    clients: 0,
    sessions: 0,
    satisfaction: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiService.get('/stats/about');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      icon: <FaUsers className="h-6 w-6 text-primary-600" />,
      title: 'Communauté Diversifiée',
      description:
        'Une plateforme qui rassemble des professionnels qualifiés et des clients en quête de bien-être.',
    },
    {
      icon: <FaHandHoldingHeart className="h-6 w-6 text-primary-600" />,
      title: 'Accompagnement Personnalisé',
      description:
        'Des services sur mesure pour répondre à vos besoins spécifiques en matière de santé et de bien-être.',
    },
    {
      icon: <FaLightbulb className="h-6 w-6 text-primary-600" />,
      title: 'Innovation Continue',
      description:
        'Des solutions technologiques avancées pour faciliter vos rendez-vous et suivis.',
    },
    {
      icon: <FaChartLine className="h-6 w-6 text-primary-600" />,
      title: 'Résultats Prouvés',
      description:
        "Un historique de succès et de satisfaction client démontrant l'efficacité de notre approche.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-primary-700 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Notre Mission
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-primary-100">
              Connecter les professionnels du bien-être avec ceux qui cherchent à améliorer leur
              qualité de vie.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">{stats.professionals}+</div>
              <div className="mt-2 text-lg font-medium text-gray-600">Professionnels</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">{stats.clients}+</div>
              <div className="mt-2 text-lg font-medium text-gray-600">Clients Satisfaits</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">{stats.sessions}+</div>
              <div className="mt-2 text-lg font-medium text-gray-600">Sessions Réalisées</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">{stats.satisfaction}%</div>
              <div className="mt-2 text-lg font-medium text-gray-600">Taux de Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Pourquoi nous choisir ?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Des solutions innovantes pour votre bien-être
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg p-6 transform transition-transform hover:scale-105"
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Nos Valeurs
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Des principes qui guident chacune de nos actions
            </p>
          </div>

          <div className="mt-16 prose prose-lg mx-auto text-gray-600">
            <p>
              Notre plateforme s'engage à maintenir les plus hauts standards de qualité et d'éthique
              dans le domaine du bien-être. Nous croyons en la création d'un environnement où
              professionnels et clients peuvent interagir en toute confiance et sécurité.
            </p>
            <p>
              La transparence, l'intégrité et le professionnalisme sont au cœur de notre approche.
              Nous veillons à ce que chaque interaction sur notre plateforme soit enrichissante et
              contribue au bien-être de tous nos utilisateurs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
