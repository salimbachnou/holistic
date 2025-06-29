import {
  CalendarDaysIcon,
  ChartBarIcon,
  ClockIcon,
  CreditCardIcon,
  EyeIcon,
  ShoppingBagIcon,
  StarIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';

import ProfessionalButton from '../../components/professional/ProfessionalButton';
import ProfessionalCard from '../../components/professional/ProfessionalCard';
import ProfessionalDashboardCard from '../../components/professional/ProfessionalDashboardCard';
import { useAuth } from '../../contexts/AuthContext';

const ProfessionalAnalyticsPage = () => {
  const { user: _user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    // Simulate API call to fetch analytics data
    const fetchAnalyticsData = async () => {
      try {
        // In a real app, this would be an API call to your backend
        // const token = localStorage.getItem('token');
        // const response = await fetch(`${process.env.REACT_APP_API_URL}/api/professional/analytics?period=${period}`, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        // const data = await response.json();

        // Mock data for demonstration
        const mockData = {
          overview: {
            sessions: {
              total: 28,
              previousTotal: 22,
              percentChange: 27.3,
              trend: 'up',
            },
            clients: {
              total: 15,
              previousTotal: 12,
              percentChange: 25,
              trend: 'up',
            },
            revenue: {
              total: 3950,
              previousTotal: 3200,
              percentChange: 23.4,
              trend: 'up',
            },
            products: {
              total: 38,
              previousTotal: 32,
              percentChange: 18.8,
              trend: 'up',
            },
          },
          performance: {
            avgRating: 4.8,
            totalReviews: 24,
            avgSessionLength: 55, // minutes
            returnRate: 73, // percentage
          },
          topServices: [
            { name: 'Yoga Thérapeutique', sessions: 12, revenue: 1440 },
            { name: 'Méditation Guidée', sessions: 8, revenue: 880 },
            { name: 'Massage Ayurvédique', sessions: 5, revenue: 1250 },
            { name: 'Consultation Naturopathie', sessions: 3, revenue: 900 },
          ],
          topProducts: [
            { name: 'Huile Essentielle Bio', sales: 15, revenue: 525 },
            { name: 'Tapis de Yoga Premium', sales: 3, revenue: 750 },
            { name: 'Livre "Bien-être Holistique"', sales: 7, revenue: 420 },
            { name: 'Tisane Détox (pack)', sales: 10, revenue: 350 },
          ],
          clientDemographics: {
            ageGroups: [
              { group: '18-24', percentage: 15 },
              { group: '25-34', percentage: 35 },
              { group: '35-44', percentage: 25 },
              { group: '45-54', percentage: 15 },
              { group: '55+', percentage: 10 },
            ],
            gender: [
              { group: 'Femme', percentage: 68 },
              { group: 'Homme', percentage: 30 },
              { group: 'Non-binaire', percentage: 2 },
            ],
          },
          monthlySessions: [
            { month: 'Jan', sessions: 18 },
            { month: 'Fév', sessions: 22 },
            { month: 'Mar', sessions: 20 },
            { month: 'Avr', sessions: 24 },
            { month: 'Mai', sessions: 26 },
            { month: 'Jun', sessions: 28 },
          ],
          monthlyRevenue: [
            { month: 'Jan', revenue: 2700 },
            { month: 'Fév', revenue: 3100 },
            { month: 'Mar', revenue: 2900 },
            { month: 'Avr', revenue: 3200 },
            { month: 'Mai', revenue: 3600 },
            { month: 'Jun', revenue: 3950 },
          ],
        };

        setAnalytics(mockData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [period]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 shadow-lotus"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiques et Analyses</h1>
          <p className="mt-2 text-lg text-gray-600">
            Suivez vos performances et identifiez les opportunités de croissance
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                period === 'week'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300`}
            >
              Semaine
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 text-sm font-medium ${
                period === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-gray-300`}
            >
              Mois
            </button>
            <button
              onClick={() => setPeriod('quarter')}
              className={`px-4 py-2 text-sm font-medium ${
                period === 'quarter'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-gray-300`}
            >
              Trimestre
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                period === 'year'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300`}
            >
              Année
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ProfessionalDashboardCard
          title="Sessions"
          value={analytics.overview.sessions.total}
          icon={CalendarDaysIcon}
          color="primary"
          trend={analytics.overview.sessions.trend}
          trendValue={`${analytics.overview.sessions.percentChange}%`}
        />
        <ProfessionalDashboardCard
          title="Clients"
          value={analytics.overview.clients.total}
          icon={UsersIcon}
          color="green"
          trend={analytics.overview.clients.trend}
          trendValue={`${analytics.overview.clients.percentChange}%`}
        />
        <ProfessionalDashboardCard
          title="Revenus (MAD)"
          value={analytics.overview.revenue.total.toLocaleString()}
          icon={CreditCardIcon}
          color="blue"
          trend={analytics.overview.revenue.trend}
          trendValue={`${analytics.overview.revenue.percentChange}%`}
        />
        <ProfessionalDashboardCard
          title="Produits vendus"
          value={analytics.overview.products.total}
          icon={ShoppingBagIcon}
          color="orange"
          trend={analytics.overview.products.trend}
          trendValue={`${analytics.overview.products.percentChange}%`}
        />
      </div>

      {/* Performance Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-5">Indicateurs de Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProfessionalCard hover title="Note Moyenne" icon={StarIcon} color="yellow">
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {analytics.performance.avgRating}
                <span className="text-lg text-gray-500">/5</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Basé sur {analytics.performance.totalReviews} avis
              </p>
              <div className="flex justify-center mt-3">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(analytics.performance.avgRating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : i < analytics.performance.avgRating
                          ? 'text-yellow-500 fill-yellow-500 opacity-50'
                          : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </ProfessionalCard>

          <ProfessionalCard hover title="Durée Moyenne" icon={ClockIcon} color="blue">
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {analytics.performance.avgSessionLength}
                <span className="text-lg text-gray-500">min</span>
              </div>
              <p className="text-sm text-gray-600">Durée moyenne des sessions</p>
            </div>
          </ProfessionalCard>

          <ProfessionalCard hover title="Taux de Retour" icon={UserGroupIcon} color="green">
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {analytics.performance.returnRate}
                <span className="text-lg text-gray-500">%</span>
              </div>
              <p className="text-sm text-gray-600">Clients qui reviennent</p>
            </div>
          </ProfessionalCard>

          <ProfessionalCard hover title="Visibilité Profil" icon={EyeIcon} color="purple">
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">128</div>
              <p className="text-sm text-gray-600">Vues du profil ce mois</p>
            </div>
          </ProfessionalCard>
        </div>
      </div>

      {/* Top Services and Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ProfessionalCard
          title="Services les Plus Populaires"
          icon={CalendarDaysIcon}
          color="primary"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Service
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Sessions
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Revenus (MAD)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.topServices.map((service, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.sessions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 px-6 py-3">
            <ProfessionalButton to="/dashboard/professional/sessions" variant="ghost" size="sm">
              Voir tous les services
            </ProfessionalButton>
          </div>
        </ProfessionalCard>

        <ProfessionalCard title="Produits les Plus Vendus" icon={ShoppingBagIcon} color="blue">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Produit
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Ventes
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Revenus (MAD)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.topProducts.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 px-6 py-3">
            <ProfessionalButton to="/dashboard/professional/products" variant="ghost" size="sm">
              Voir tous les produits
            </ProfessionalButton>
          </div>
        </ProfessionalCard>
      </div>

      {/* Client Demographics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-5">Démographie des Clients</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ProfessionalCard title="Répartition par Âge" icon={UsersIcon} color="green">
            <div className="p-6">
              {analytics.clientDemographics.ageGroups.map((ageGroup, index) => (
                <div key={index} className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{ageGroup.group}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {ageGroup.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{ width: `${ageGroup.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </ProfessionalCard>

          <ProfessionalCard title="Répartition par Genre" icon={UsersIcon} color="primary">
            <div className="p-6">
              {analytics.clientDemographics.gender.map((genderGroup, index) => (
                <div key={index} className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{genderGroup.group}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {genderGroup.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        index === 0
                          ? 'bg-primary-600'
                          : index === 1
                            ? 'bg-blue-600'
                            : 'bg-purple-600'
                      }`}
                      style={{ width: `${genderGroup.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </ProfessionalCard>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-5">Tendances Mensuelles</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ProfessionalCard title="Sessions par Mois" icon={CalendarDaysIcon} color="primary">
            <div className="p-6 h-64 flex items-end justify-between">
              {analytics.monthlySessions.map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="text-xs text-gray-500 mb-1">{data.sessions}</div>
                  <div
                    className="w-10 bg-primary-500 rounded-t-md"
                    style={{
                      height: `${(data.sessions / 30) * 100}%`,
                      minHeight: '20px',
                      maxHeight: '180px',
                    }}
                  ></div>
                  <div className="mt-2 text-xs font-medium text-gray-700">{data.month}</div>
                </div>
              ))}
            </div>
          </ProfessionalCard>

          <ProfessionalCard title="Revenus par Mois (MAD)" icon={CreditCardIcon} color="blue">
            <div className="p-6 h-64 flex items-end justify-between">
              {analytics.monthlyRevenue.map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="text-xs text-gray-500 mb-1">{data.revenue}</div>
                  <div
                    className="w-10 bg-blue-500 rounded-t-md"
                    style={{
                      height: `${(data.revenue / 4000) * 100}%`,
                      minHeight: '20px',
                      maxHeight: '180px',
                    }}
                  ></div>
                  <div className="mt-2 text-xs font-medium text-gray-700">{data.month}</div>
                </div>
              ))}
            </div>
          </ProfessionalCard>
        </div>
      </div>

      {/* Download Reports */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Télécharger les rapports</h3>
            <p className="mt-1 text-sm text-gray-600">
              Exportez vos données pour une analyse plus approfondie
            </p>
          </div>
          <div className="mt-4 md:mt-0 space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
              <ChartBarIcon className="h-5 w-5 mr-2 text-gray-500" />
              Rapport CSV
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
              <ChartBarIcon className="h-5 w-5 mr-2 text-gray-500" />
              Rapport PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAnalyticsPage;
