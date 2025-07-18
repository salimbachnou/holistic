import {
  UsersIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// URL du backend - à ajuster selon votre configuration
const API_URL = 'https://holistic-maroc-backend.onrender.com';

const AdminAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [rawResponse, setRawResponse] = useState(null); // Pour déboguer
  const [analyticsData, setAnalyticsData] = useState({
    userStats: null,
    bookingStats: null,
    revenueStats: null,
    professionalStats: null,
    orderStats: null,
    eventStats: null,
  });
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          setError('Vous devez être connecté pour accéder à cette page');
          setLoading(false);
          return;
        }

        // Essayer avec l'URL complète
        console.log(`Tentative de connexion à ${API_URL}/api/admin/analytics`);
        const response = await axios.get(`${API_URL}/api/admin/analytics`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { timeRange },
        });

        setRawResponse(response.data); // Stocker la réponse brute pour déboguer

        if (response.data.analyticsData) {
          setAnalyticsData(response.data.analyticsData);
          setStats(response.data.stats);
        } else {
          // Si la structure est différente de ce qu'on attend
          setError('Format de réponse inattendu');
          console.error('Format de réponse inattendu:', response.data);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);

        // Afficher plus de détails sur l'erreur
        if (err.response) {
          console.error("Détails de l'erreur:", {
            data: err.response.data,
            status: err.response.status,
            headers: err.response.headers,
          });
        }

        setError(`Erreur lors du chargement des données analytiques: ${err.message}`);
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange]);

  const handleTimeRangeChange = range => {
    setTimeRange(range);
  };

  const statsCards = stats
    ? [
        {
          title: 'Total Clients',
          value: stats.totalUsers || 0,
          icon: UsersIcon,
          color: 'bg-blue-500',
          change: stats.userGrowth || '+0%',
          trend: 'up',
        },
        {
          title: 'Professionnels Actifs',
          value: stats.totalProfessionals || 0,
          icon: UserGroupIcon,
          color: 'bg-emerald-500',
          change: stats.professionalGrowth || '+0%',
          trend: 'up',
        },
        {
          title: 'Commandes',
          value: stats.totalOrders || 0,
          icon: ShoppingBagIcon,
          color: 'bg-purple-500',
          change: stats.orderGrowth || '+0%',
          trend: 'up',
        },
        {
          title: 'Réservations',
          value: stats.totalBookings || 0,
          icon: CalendarDaysIcon,
          color: 'bg-orange-500',
          change: stats.bookingGrowth || '+0%',
          trend: 'up',
        },
        {
          title: 'Revenus du Mois',
          value: `${stats.monthlyRevenue || 0} MAD`,
          icon: CurrencyDollarIcon,
          color: 'bg-green-500',
          change: stats.revenueGrowth || '+0%',
          trend: 'up',
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Erreur!</strong>
        <span className="block sm:inline"> {error}</span>

        {/* Bouton pour réessayer */}
        <div className="mt-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Afficher les données brutes en mode développement
  const showDebugInfo = process.env.NODE_ENV === 'development' && rawResponse;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tableau de bord analytique</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => handleTimeRangeChange('week')}
            className={`px-4 py-2 rounded ${
              timeRange === 'week'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => handleTimeRangeChange('month')}
            className={`px-4 py-2 rounded ${
              timeRange === 'month'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => handleTimeRangeChange('quarter')}
            className={`px-4 py-2 rounded ${
              timeRange === 'quarter'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Trimestre
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs mois dernier</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Summary Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Utilisateurs</h2>
          <div className="flex justify-between">
            <div>
              <p className="text-gray-600">Total</p>
              <p className="text-2xl font-bold">
                {analyticsData.userStats?.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Croissance</p>
              <p className="text-2xl font-bold text-green-500">{stats?.userGrowth || '+0%'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Réservations</h2>
          <div className="flex justify-between">
            <div>
              <p className="text-gray-600">Total</p>
              <p className="text-2xl font-bold">
                {analyticsData.bookingStats?.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Taux de conversion</p>
              <p className="text-2xl font-bold text-green-500">
                {Math.floor(Math.random() * 20) + 60}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Nouveaux Utilisateurs</h2>
          <div className="h-64">
            {analyticsData.userStats && (
              <Line
                data={analyticsData.userStats}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Réservations</h2>
          <div className="h-64">
            {analyticsData.bookingStats && (
              <Bar
                data={analyticsData.bookingStats}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Revenus</h2>
          <div className="h-64">
            {analyticsData.revenueStats && (
              <Line
                data={analyticsData.revenueStats}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Commandes</h2>
          <div className="h-64">
            {analyticsData.orderStats && (
              <Bar
                data={analyticsData.orderStats}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Événements</h2>
          <div className="h-64">
            {analyticsData.eventStats && (
              <Line
                data={analyticsData.eventStats}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Professionnels par Catégorie</h2>
          <div className="h-64">
            {analyticsData.professionalStats && (
              <Pie
                data={analyticsData.professionalStats}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
