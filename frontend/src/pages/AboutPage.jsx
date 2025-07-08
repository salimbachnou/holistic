import { Users, Heart, Lightbulb, TrendingUp, Award, Shield, Clock, Star } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { getGlobalStats } from '../services/api.service';

const AboutPage = () => {
  const [stats, setStats] = useState({
    professionals: 0,
    clients: 0,
    sessions: 0,
    satisfaction: 0,
  });

  const [animatedStats, setAnimatedStats] = useState({
    professionals: 0,
    clients: 0,
    sessions: 0,
    satisfaction: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getGlobalStats();
        setStats(data);

        // Animate numbers
        const duration = 2000;
        const steps = 60;
        const increment = duration / steps;

        let currentStep = 0;
        const timer = setInterval(() => {
          currentStep++;
          const progress = currentStep / steps;

          setAnimatedStats({
            professionals: Math.floor(data.professionals * progress),
            clients: Math.floor(data.clients * progress),
            sessions: Math.floor(data.sessions * progress),
            satisfaction: Math.floor(data.satisfaction * progress),
          });

          if (currentStep >= steps) {
            clearInterval(timer);
            setAnimatedStats(data);
          }
        }, increment);

        return () => clearInterval(timer);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // En cas d'erreur, on garde les stats à 0
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      icon: <Users className="h-8 w-8 text-secondary-600" />,
      title: 'Communauté Diversifiée',
      description:
        'Une plateforme qui rassemble des professionnels qualifiés et des clients en quête de bien-être.',
      color: 'bg-secondary-50 border-secondary-200',
    },
    {
      icon: <Heart className="h-8 w-8 text-primary-600" />,
      title: 'Accompagnement Personnalisé',
      description:
        'Des services sur mesure pour répondre à vos besoins spécifiques en matière de santé et de bien-être.',
      color: 'bg-primary-50 border-primary-200',
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-accent-600" />,
      title: 'Innovation Continue',
      description:
        'Des solutions technologiques avancées pour faciliter vos rendez-vous et suivis.',
      color: 'bg-accent-50 border-accent-200',
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-warning-600" />,
      title: 'Résultats Prouvés',
      description:
        "Un historique de succès et de satisfaction client démontrant l'efficacité de notre approche.",
      color: 'bg-warning-50 border-warning-200',
    },
  ];

  const values = [
    {
      icon: <Shield className="h-6 w-6 text-secondary-600" />,
      title: 'Sécurité & Confidentialité',
      description: 'Protection maximale de vos données personnelles et professionnelles.',
    },
    {
      icon: <Award className="h-6 w-6 text-primary-600" />,
      title: 'Excellence & Qualité',
      description: 'Standards élevés pour tous nos professionnels et services.',
    },
    {
      icon: <Clock className="h-6 w-6 text-accent-600" />,
      title: 'Disponibilité & Flexibilité',
      description: 'Accès à nos services 24/7 avec une flexibilité totale.',
    },
    {
      icon: <Star className="h-6 w-6 text-warning-600" />,
      title: 'Satisfaction Client',
      description: 'Engagement total envers votre satisfaction et votre bien-être.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-pink-500 via-purple-600 to-violet-700 py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-secondary-500/20 to-accent-500/20"></div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"
          style={{ animationDelay: '1s' }}
        ></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Notre <span className="text-secondary-300">Mission</span>
            </h1>
            <p className="mt-8 max-w-3xl mx-auto text-xl text-white/90 leading-relaxed">
              Connecter les professionnels du bien-être avec ceux qui cherchent à améliorer leur
              qualité de vie à travers une plateforme innovante et sécurisée.
            </p>
            <div className="mt-12">
              <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-white font-medium">
                <Heart className="h-5 w-5 mr-2 text-secondary-300" />
                Plus de 5000 sessions réalisées avec succès
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-20 -mt-12 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 animate-slide-up">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center group">
                <div className="text-5xl font-bold text-secondary-600 mb-2 group-hover:text-secondary-700 transition-colors">
                  {animatedStats.professionals}+
                </div>
                <div className="text-lg font-medium text-gray-600">Professionnels Certifiés</div>
                <div className="mt-2 w-12 h-1 bg-secondary-600 mx-auto rounded-full"></div>
              </div>
              <div className="text-center group">
                <div className="text-5xl font-bold text-primary-600 mb-2 group-hover:text-primary-700 transition-colors">
                  {animatedStats.clients}+
                </div>
                <div className="text-lg font-medium text-gray-600">Clients Satisfaits</div>
                <div className="mt-2 w-12 h-1 bg-primary-600 mx-auto rounded-full"></div>
              </div>
              <div className="text-center group">
                <div className="text-5xl font-bold text-accent-600 mb-2 group-hover:text-accent-700 transition-colors">
                  {animatedStats.sessions}+
                </div>
                <div className="text-lg font-medium text-gray-600">Sessions Réalisées</div>
                <div className="mt-2 w-12 h-1 bg-accent-600 mx-auto rounded-full"></div>
              </div>
              <div className="text-center group">
                <div className="text-5xl font-bold text-warning-600 mb-2 group-hover:text-warning-700 transition-colors">
                  {animatedStats.satisfaction}%
                </div>
                <div className="text-lg font-medium text-gray-600">Taux de Satisfaction</div>
                <div className="mt-2 w-12 h-1 bg-warning-600 mx-auto rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Pourquoi nous <span className="text-secondary-600">choisir</span> ?
            </h2>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
              Des solutions innovantes et personnalisées pour votre bien-être
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`${feature.color} border-2 rounded-2xl p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-scale-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-center mb-6">
                  <div className="p-3 bg-white rounded-xl shadow-lg">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Nos <span className="text-secondary-600">Valeurs</span>
            </h2>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
              Des principes qui guident chacune de nos actions
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-gray-50 rounded-xl">{value.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-secondary-500 to-primary-500 rounded-3xl p-8 lg:p-12 text-white">
              <h3 className="text-2xl font-bold mb-6">Notre Engagement</h3>
              <p className="text-lg leading-relaxed mb-6">
                Notre plateforme s'engage à maintenir les plus hauts standards de qualité et
                d'éthique dans le domaine du bien-être. Nous croyons en la création d'un
                environnement où professionnels et clients peuvent interagir en toute confiance et
                sécurité.
              </p>
              <p className="text-lg leading-relaxed mb-8">
                La transparence, l'intégrité et le professionnalisme sont au cœur de notre approche.
                Nous veillons à ce que chaque interaction sur notre plateforme soit enrichissante et
                contribue au bien-être de tous nos utilisateurs.
              </p>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold">Bien-être avant tout</div>
                  <div className="text-sm text-white/80">Notre priorité absolue</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-secondary-600 to-primary-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Prêt à commencer votre parcours bien-être ?
            </h2>
            <p className="mt-4 text-xl text-white/90 max-w-2xl mx-auto">
              Rejoignez notre communauté et découvrez comment nous pouvons vous accompagner vers une
              meilleure qualité de vie.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-secondary-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors shadow-lg">
                Commencer maintenant
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors">
                En savoir plus
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
