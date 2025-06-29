import {
  StarIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  UsersIcon,
  MapPinIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

const testimonials = [
  {
    id: 1,
    text: "Holistic.ma m'a permis de trouver une coach de yoga exceptionnelle qui m'a aidée à surmonter mon stress. L'accompagnement personnalisé fait toute la différence !",
    author: 'Salma K.',
    location: 'Casablanca',
    rating: 5,
  },
  {
    id: 2,
    text: "J'ai découvert des produits naturels de qualité grâce à la marketplace. La livraison a été rapide et les produits sont conformes à la description.",
    author: 'Ahmed M.',
    location: 'Rabat',
    rating: 4,
  },
  {
    id: 3,
    text: "Les ateliers de méditation auxquels j'ai participé via Holistic.ma ont transformé ma routine quotidienne. Une communauté bienveillante et des professionnels à l'écoute.",
    author: 'Leila B.',
    location: 'Marrakech',
    rating: 5,
  },
];

const professionals = [
  {
    id: 1,
    name: 'Coach Bien-être',
    description: 'Accompagnement pour retrouver équilibre et vitalité',
    image:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 2,
    name: 'Naturopathe',
    description: 'Solutions naturelles pour votre santé',
    image:
      'https://images.unsplash.com/photo-1589456506629-b2ea1a8576fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 3,
    name: 'Thérapeute Holistique',
    description: 'Approche globale pour votre bien-être',
    image:
      'https://images.unsplash.com/photo-1594751684241-7c959e0ad5ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 4,
    name: 'Professeur de Yoga',
    description: 'Harmonisez corps et esprit',
    image:
      'https://images.unsplash.com/photo-1599447292761-50f16ae87093?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
  },
];

const products = [
  {
    id: 1,
    name: 'Huiles essentielles',
    description: '100% naturelles et bio',
    image:
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 2,
    name: 'Thés bio',
    description: 'Saveurs authentiques et bienfaits naturels',
    image:
      'https://images.unsplash.com/photo-1563911892437-1feda0179e1b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 3,
    name: 'Compléments alimentaires',
    description: 'Pour renforcer votre vitalité',
    image:
      'https://images.unsplash.com/photo-1568717099337-c5008c1d8747?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
  },
];

const events = [
  {
    id: 1,
    name: 'Atelier méditation pleine conscience',
    date: '15 juillet 2023',
    location: 'Casablanca',
    image:
      'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 2,
    name: 'Retraite yoga weekend',
    date: '22-23 juillet 2023',
    location: 'Marrakech',
    image:
      'https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 3,
    name: 'Conférence alimentation & santé',
    date: '5 août 2023',
    location: 'Rabat',
    image:
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
  },
];

const advantages = [
  {
    id: 1,
    title: 'Professionnels vérifiés',
    description: 'Tous nos praticiens sont certifiés et évalués',
    icon: ShieldCheckIcon,
  },
  {
    id: 2,
    title: 'Communauté engagée',
    description: 'Rejoignez des personnes partageant vos valeurs',
    icon: UsersIcon,
  },
  {
    id: 3,
    title: 'Proximité',
    description: 'Trouvez des services et produits près de chez vous',
    icon: MapPinIcon,
  },
];

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-white">
      {/* 1. Hero Section - Bienvenue sur Holistic.ma */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 opacity-70"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Bienvenue sur <span className="text-gradient-lotus">Holistic.ma</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-xl text-gray-600">
              La première plateforme marocaine dédiée au bien-être holistique. Connectez-vous avec
              des professionnels, découvrez des produits naturels et participez à des événements
              inspirants.
            </p>

            {/* 2. Votre bien-être, notre priorité */}
            <p className="mx-auto mt-4 max-w-3xl text-2xl font-medium text-primary-700">
              🌿 Votre bien-être, notre priorité
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/professionals"
                className="btn-primary text-lg px-8 py-4 shadow-lotus hover:shadow-lotus-hover"
              >
                Découvrir les professionnels
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link to="/products" className="btn-outline text-lg px-8 py-4 hover:shadow-lg">
                Explorer nos produits
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Trouvez votre professionnel holistique */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Trouvez votre professionnel holistique
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Des experts certifiés dans différentes disciplines pour vous accompagner dans votre
              parcours de bien-être
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {professionals.map(professional => (
              <div key={professional.id} className="lotus-card overflow-hidden">
                <div className="h-48 w-full overflow-hidden">
                  <img
                    src={professional.image}
                    alt={professional.name}
                    className="h-full w-full object-cover transition-all hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{professional.name}</h3>
                  <p className="mt-2 text-gray-600">{professional.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/professionals"
              className="inline-flex items-center text-primary-600 font-medium hover:text-primary-800"
            >
              Voir tous les professionnels
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Découvrez nos produits naturels */}
      <section className="bg-gradient-to-r from-gray-50 to-primary-50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              🛍️ Découvrez nos produits naturels
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Une sélection de produits bio et naturels pour prendre soin de vous au quotidien
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {products.map(product => (
              <div key={product.id} className="lotus-card overflow-hidden">
                <div className="h-48 w-full overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-all hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                  <p className="mt-2 text-gray-600">{product.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/products"
              className="inline-flex items-center text-primary-600 font-medium hover:text-primary-800"
            >
              Explorer notre boutique
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Participez à des événements bien-être */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              📅 Participez à des événements bien-être
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Ateliers, stages, conférences... Des moments de partage et d'apprentissage
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {events.map(event => (
              <div key={event.id} className="lotus-card overflow-hidden">
                <div className="h-48 w-full overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.name}
                    className="h-full w-full object-cover transition-all hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{event.name}</h3>
                  <div className="mt-2 flex items-center text-gray-600">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    {event.date}
                  </div>
                  <div className="mt-1 flex items-center text-gray-600">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    {event.location}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/events"
              className="inline-flex items-center text-primary-600 font-medium hover:text-primary-800"
            >
              Voir tous les événements
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Pourquoi choisir Holistic.ma ? */}
      <section className="bg-gradient-to-r from-gray-50 to-primary-50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              ✅ Pourquoi choisir Holistic.ma ?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Des avantages qui font la différence pour votre bien-être
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {advantages.map(advantage => (
              <div key={advantage.id} className="lotus-card p-8 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-gradient-lotus flex items-center justify-center shadow-lotus mb-6">
                  <advantage.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">{advantage.title}</h3>
                <p className="mt-2 text-gray-600">{advantage.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-white rounded-xl shadow-lotus p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary-600">500+</div>
                <div className="text-gray-600">Professionnels certifiés</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">15+</div>
                <div className="text-gray-600">Villes couvertes au Maroc</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">1000+</div>
                <div className="text-gray-600">Clients satisfaits</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Témoignages de nos utilisateurs */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              💬 Témoignages de nos utilisateurs
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Ce que disent nos clients de leur expérience avec Holistic.ma
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map(testimonial => (
              <div key={testimonial.id} className="lotus-card p-8">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="mt-4 text-gray-600 italic">"{testimonial.text}"</p>
                <div className="mt-6 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gradient-lotus flex items-center justify-center text-white font-bold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">{testimonial.author}</div>
                    <div className="text-gray-500 text-sm">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Rejoignez notre communauté */}
      <section className="bg-gradient-lotus py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              🔒 Rejoignez notre communauté
            </h2>
            <p className="mt-4 text-xl text-white opacity-90">
              Commencez votre parcours bien-être dès aujourd'hui
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    className="btn-white text-primary-600 text-lg px-8 py-4 hover:bg-gray-100"
                  >
                    Se connecter
                  </Link>
                  <Link
                    to="/register"
                    className="btn-white-outline text-white text-lg px-8 py-4 border-2 border-white hover:bg-white hover:bg-opacity-10"
                  >
                    S'inscrire
                  </Link>
                </>
              ) : (
                <Link
                  to="/dashboard"
                  className="btn-white text-primary-600 text-lg px-8 py-4 hover:bg-gray-100"
                >
                  Accéder à mon espace
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured In Section */}
      <section className="py-12 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-medium text-gray-600">Ils parlent de nous</h2>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
            <img
              src="https://via.placeholder.com/150x50?text=Media+1"
              alt="Media Partner"
              className="h-8 grayscale"
            />
            <img
              src="https://via.placeholder.com/150x50?text=Media+2"
              alt="Media Partner"
              className="h-8 grayscale"
            />
            <img
              src="https://via.placeholder.com/150x50?text=Media+3"
              alt="Media Partner"
              className="h-8 grayscale"
            />
            <img
              src="https://via.placeholder.com/150x50?text=Media+4"
              alt="Media Partner"
              className="h-8 grayscale"
            />
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-50 rounded-2xl p-8 md:p-12 shadow-sm">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Restez informé</h2>
              <p className="mt-2 text-gray-600">
                Inscrivez-vous à notre newsletter pour recevoir nos conseils bien-être et actualités
              </p>
            </div>
            <div className="mt-6 max-w-md mx-auto">
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  className="flex-grow px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="btn-primary py-3 px-6 rounded-lg whitespace-nowrap"
                >
                  S'inscrire
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
