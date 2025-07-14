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
import axios from 'axios';
import { useState, useEffect } from 'react';

import ProfessionalButton from '../../components/professional/ProfessionalButton';
import ProfessionalCard from '../../components/professional/ProfessionalCard';
import ProfessionalDashboardCard from '../../components/professional/ProfessionalDashboardCard';
import apiConfig from '../../config/api.config';
import { useAuth } from '../../contexts/AuthContext';

const ProfessionalAnalyticsPage = () => {
  const { user: _user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('month');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${apiConfig.baseURL}/professionals/analytics`, {
          params: { period },
          withCredentials: true,
        });

        console.log('Analytics response:', response.data); // Debug log

        if (response.data) {
          setAnalytics(response.data);
        } else {
          console.error('No data received from analytics API');
          setAnalytics(null);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        console.error('Error details:', error.response?.data || error.message);
        setAnalytics(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [period]);

  // Fonction pour télécharger le rapport CSV
  const downloadCSVReport = () => {
    if (!analytics) return;

    setIsDownloading(true);

    try {
      // Créer les données CSV avec formatage propre
      const csvRows = [
        // En-tête du rapport
        `RAPPORT D'ANALYTICS PROFESSIONNEL`,
        `Periode: ${period.toUpperCase()}`,
        `Date de generation: ${new Date().toLocaleDateString('fr-FR')}`,
        '',

        // Aperçu général
        'APERCU GENERAL',
        'Metrique,Valeur',
        `Sessions totales,${analytics.overview?.sessions?.total || 0}`,
        `Clients totaux,${analytics.overview?.clients?.total || 0}`,
        `Revenus totaux (MAD),${analytics.overview?.revenue?.total || 0}`,
        `Produits vendus,${analytics.overview?.products?.total || 0}`,
        '',

        // Performance
        'INDICATEURS DE PERFORMANCE',
        'Metrique,Valeur',
        `Note moyenne,${analytics.performance?.avgRating || 0}/5`,
        `Nombre d avis,${analytics.performance?.totalReviews || 0}`,
        `Duree moyenne session (min),${analytics.performance?.avgSessionLength || 0}`,
        `Taux de retour (%),${analytics.performance?.returnRate || 0}`,
        '',

        // Sessions mensuelles
        'SESSIONS MENSUELLES',
        'Mois,Sessions',
        ...analytics.monthlySessions.map(item => `${item.month},${item.sessions}`),
        '',

        // Revenus mensuels
        'REVENUS MENSUELS',
        'Mois,Revenus (MAD)',
        ...analytics.monthlyRevenue.map(item => `${item.month},${item.revenue}`),
        '',

        // Top services
        'TOP SERVICES',
        'Service,Sessions,Revenus (MAD)',
        ...analytics.topServices.map(item => `${item.name},${item.sessions},${item.revenue}`),
        '',

        // Top produits
        'TOP PRODUITS',
        'Produit,Ventes,Revenus (MAD)',
        ...analytics.topProducts.map(item => `${item.name},${item.sales},${item.revenue}`),
      ];

      // Ajouter le BOM UTF-8 pour éviter les problèmes d'encodage
      const csvContent = '\uFEFF' + csvRows.join('\n');

      // Créer le fichier et déclencher le téléchargement
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `Rapport_Analytics_${period}_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors de la génération du CSV:', error);
      alert('Erreur lors de la génération du rapport CSV');
    } finally {
      setIsDownloading(false);
    }
  };

  // Fonction pour télécharger le rapport PDF
  const downloadPDFReport = () => {
    if (!analytics) return;
    setIsDownloading(true);

    // Générer un PDF réel côté client
    generateRealPDF();
  };

  // Fonction pour générer un vrai PDF téléchargeable
  const generateRealPDF = () => {
    try {
      const currentDate = new Date().toLocaleDateString('fr-FR');
      const fileName = `Rapport_Analytics_${period}_${new Date().toISOString().split('T')[0]}.pdf`;

      // Créer le contenu du PDF en HTML optimisé
      const pdfContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${fileName}</title>
            <meta charset="UTF-8">
            <style>
              @page { margin: 20mm; }
              @media print {
                body { margin: 0; }
                .no-print { display: none !important; }
              }
              body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.4; color: #333; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; }
              .header h1 { color: #8b5cf6; margin: 0; font-size: 28px; font-weight: bold; }
              .header p { margin: 10px 0; font-size: 14px; color: #666; }
              .section { margin-bottom: 30px; page-break-inside: avoid; }
              .section h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; font-size: 18px; margin-bottom: 15px; }
              .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
              .metric { padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; background: #f9fafb; }
              .metric-value { font-size: 24px; font-weight: bold; color: #8b5cf6; margin-bottom: 5px; }
              .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
              th { background: #8b5cf6; color: white; font-weight: 600; }
              tr:nth-child(even) { background: #f9fafb; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 20px; }
              .download-btn { background: #8b5cf6; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; margin: 10px; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .download-btn:hover { background: #7c3aed; }
            </style>
          </head>
          <body>
            <div class="no-print" style="text-align: center; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 10px; border: 2px dashed #8b5cf6;">
              <p style="margin: 0 0 15px 0; font-size: 16px; color: #374151; font-weight: 600;">📄 Votre rapport est prêt !</p>
              <button class="download-btn" onclick="window.print()">📥 Télécharger PDF</button>
              <button class="download-btn" onclick="window.close()" style="background: #6b7280;">❌ Fermer</button>
            </div>
            
            <div class="header">
              <h1>📊 RAPPORT D'ANALYTICS PROFESSIONNEL</h1>
              <p><strong>Période:</strong> ${period.toUpperCase()} | <strong>Date:</strong> ${currentDate}</p>
            </div>
            
            <div class="section">
              <h2>📈 Aperçu Général</h2>
              <div class="metrics-grid">
                <div class="metric">
                  <div class="metric-value">${analytics.overview?.sessions?.total || 0}</div>
                  <div class="metric-label">Sessions Totales</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${analytics.overview?.clients?.total || 0}</div>
                  <div class="metric-label">Clients Totaux</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${analytics.overview?.revenue?.total || 0}</div>
                  <div class="metric-label">Revenus (MAD)</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${analytics.overview?.products?.total || 0}</div>
                  <div class="metric-label">Produits Vendus</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>⭐ Indicateurs de Performance</h2>
              <div class="metrics-grid">
                <div class="metric">
                  <div class="metric-value">${analytics.performance?.avgRating || 0}/5</div>
                  <div class="metric-label">Note Moyenne</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${analytics.performance?.totalReviews || 0}</div>
                  <div class="metric-label">Nombre d'Avis</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${analytics.performance?.avgSessionLength || 0} min</div>
                  <div class="metric-label">Durée Moyenne</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${analytics.performance?.returnRate || 0}%</div>
                  <div class="metric-label">Taux de Retour</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>📅 Sessions Mensuelles</h2>
              <table>
                <tr><th>Mois</th><th>Nombre de Sessions</th></tr>
                ${analytics.monthlySessions
                  .map(
                    (item, index) => `
                  <tr><td>${item.month}</td><td>${item.sessions}</td></tr>
                `
                  )
                  .join('')}
              </table>
            </div>
            
            <div class="section">
              <h2>💰 Revenus Mensuels</h2>
              <table>
                <tr><th>Mois</th><th>Revenus (MAD)</th></tr>
                ${analytics.monthlyRevenue
                  .map(
                    (item, index) => `
                  <tr><td>${item.month}</td><td>${item.revenue.toLocaleString()} MAD</td></tr>
                `
                  )
                  .join('')}
              </table>
            </div>

            <div class="section">
              <h2>🏆 Top Services</h2>
              <table>
                <tr><th>Service</th><th>Sessions</th><th>Revenus (MAD)</th></tr>
                ${analytics.topServices
                  .slice(0, 5)
                  .map(
                    (item, index) => `
                  <tr><td>${item.name}</td><td>${item.sessions}</td><td>${item.revenue} MAD</td></tr>
                `
                  )
                  .join('')}
              </table>
            </div>

            <div class="section">
              <h2>🛍️ Top Produits</h2>
              <table>
                <tr><th>Produit</th><th>Ventes</th><th>Revenus (MAD)</th></tr>
                ${analytics.topProducts
                  .slice(0, 5)
                  .map(
                    (item, index) => `
                  <tr><td>${item.name}</td><td>${item.sales}</td><td>${item.revenue} MAD</td></tr>
                `
                  )
                  .join('')}
              </table>
            </div>
            
            <div class="footer">
              <p><strong>Rapport généré automatiquement le ${currentDate}</strong></p>
              <p style="color: #8b5cf6; font-weight: 600;">🌸 Holistic Platform - Votre partenaire bien-être</p>
            </div>
          </body>
        </html>
      `;

      // Ouvrir dans une nouvelle fenêtre optimisée pour l'impression
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        alert('⚠️ Veuillez autoriser les pop-ups pour télécharger le PDF');
        setIsDownloading(false);
        return;
      }

      printWindow.document.write(pdfContent);
      printWindow.document.close();

      // Auto-ouverture de la boîte de dialogue d'impression
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
        }, 200);
      };

      setIsDownloading(false);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('❌ Erreur lors de la génération du PDF');
      setIsDownloading(false);
    }
  };

  // Fonction de fallback pour générer un PDF côté client
  const generateClientSidePDF = () => {
    // Créer un HTML stylé et utiliser window.print
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les pop-ups pour télécharger le PDF');
      return;
    }

    const currentDate = new Date().toLocaleDateString('fr-FR');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rapport Analytics - ${period}</title>
          <meta charset="UTF-8">
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 20px; 
              line-height: 1.4;
              color: #333;
            }
            
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              border-bottom: 3px solid #8b5cf6;
              padding-bottom: 20px;
            }
            
            .header h1 { 
              color: #8b5cf6; 
              margin: 0; 
              font-size: 28px;
              font-weight: bold;
            }
            
            .header p { 
              margin: 10px 0 0 0; 
              font-size: 14px; 
              color: #666;
            }
            
            .section { 
              margin-bottom: 30px; 
              page-break-inside: avoid;
            }
            
            .section h3 { 
              color: #374151; 
              border-bottom: 2px solid #e5e7eb; 
              padding-bottom: 8px; 
              margin-bottom: 15px;
              font-size: 18px;
            }
            
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin: 20px 0;
            }
            
            .metric { 
              padding: 15px; 
              border: 1px solid #e5e7eb; 
              border-radius: 8px; 
              background-color: #f9fafb;
              text-align: center;
            }
            
            .metric-value {
              font-size: 24px;
              font-weight: bold;
              color: #8b5cf6;
              margin-bottom: 5px;
            }
            
            .metric-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 15px 0; 
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            th, td { 
              border: 1px solid #e5e7eb; 
              padding: 12px 8px; 
              text-align: left; 
            }
            
            th { 
              background-color: #8b5cf6; 
              color: white;
              font-weight: 600;
              font-size: 14px;
            }
            
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            
            .download-btn {
              background: #8b5cf6;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              margin: 10px;
              font-size: 14px;
            }
            
            .download-btn:hover {
              background: #7c3aed;
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button class="download-btn" onclick="window.print()">📄 Imprimer / Sauvegarder PDF</button>
            <button class="download-btn" onclick="window.close()">❌ Fermer</button>
          </div>
          
          <div class="header">
            <h1>📊 Rapport d'Analytics Professionnel</h1>
            <p><strong>Période:</strong> ${period.toUpperCase()} | <strong>Date:</strong> ${currentDate}</p>
          </div>
          
          <div class="section">
            <h3>📈 Aperçu Général</h3>
            <div class="metrics-grid">
              <div class="metric">
                <div class="metric-value">${analytics.overview?.sessions?.total || 0}</div>
                <div class="metric-label">Sessions Totales</div>
              </div>
              <div class="metric">
                <div class="metric-value">${analytics.overview?.clients?.total || 0}</div>
                <div class="metric-label">Clients Totaux</div>
              </div>
              <div class="metric">
                <div class="metric-value">${analytics.overview?.revenue?.total || 0} MAD</div>
                <div class="metric-label">Revenus Totaux</div>
              </div>
              <div class="metric">
                <div class="metric-value">${analytics.overview?.products?.total || 0}</div>
                <div class="metric-label">Produits Vendus</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>⭐ Indicateurs de Performance</h3>
            <div class="metrics-grid">
              <div class="metric">
                <div class="metric-value">${analytics.performance?.avgRating || 0}/5</div>
                <div class="metric-label">Note Moyenne</div>
              </div>
              <div class="metric">
                <div class="metric-value">${analytics.performance?.totalReviews || 0}</div>
                <div class="metric-label">Nombre d'Avis</div>
              </div>
              <div class="metric">
                <div class="metric-value">${analytics.performance?.avgSessionLength || 0} min</div>
                <div class="metric-label">Durée Moy. Session</div>
              </div>
              <div class="metric">
                <div class="metric-value">${analytics.performance?.returnRate || 0}%</div>
                <div class="metric-label">Taux de Retour</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>📅 Sessions Mensuelles</h3>
            <table>
              <tr><th>Mois</th><th>Nombre de Sessions</th></tr>
              ${analytics.monthlySessions.map(item => `<tr><td>${item.month}</td><td>${item.sessions}</td></tr>`).join('')}
            </table>
          </div>

          <div class="section">
            <h3>💰 Revenus Mensuels</h3>
            <table>
              <tr><th>Mois</th><th>Revenus (MAD)</th></tr>
              ${analytics.monthlyRevenue.map(item => `<tr><td>${item.month}</td><td>${item.revenue.toLocaleString()} MAD</td></tr>`).join('')}
            </table>
          </div>

          <div class="section">
            <h3>🏆 Top Services</h3>
            <table>
              <tr><th>Service</th><th>Sessions</th><th>Revenus (MAD)</th></tr>
              ${analytics.topServices.map(item => `<tr><td>${item.name}</td><td>${item.sessions}</td><td>${item.revenue} MAD</td></tr>`).join('')}
            </table>
          </div>

          <div class="section">
            <h3>🛍️ Top Produits</h3>
            <table>
              <tr><th>Produit</th><th>Ventes</th><th>Revenus (MAD)</th></tr>
              ${analytics.topProducts.map(item => `<tr><td>${item.name}</td><td>${item.sales}</td><td>${item.revenue} MAD</td></tr>`).join('')}
            </table>
          </div>
          
          <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p>Rapport généré automatiquement le ${currentDate} • Holistic Platform</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Automatiquement ouvrir la boîte de dialogue d'impression
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 shadow-lotus"></div>
      </div>
    );
  }

  // Vérifier si analytics est null ou undefined
  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-900 mb-2">
            Erreur de chargement des données
          </div>
          <p className="text-gray-600">
            Impossible de charger les données d'analytiques. Veuillez réessayer.
          </p>
        </div>
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
          value={analytics.overview?.sessions?.total || 0}
          icon={CalendarDaysIcon}
          color="primary"
          trend={analytics.overview?.sessions?.trend || 'up'}
          trendValue={`${analytics.overview?.sessions?.percentChange || 0}%`}
        />
        <ProfessionalDashboardCard
          title="Clients"
          value={analytics.overview?.clients?.total || 0}
          icon={UsersIcon}
          color="green"
          trend={analytics.overview?.clients?.trend || 'up'}
          trendValue={`${analytics.overview?.clients?.percentChange || 0}%`}
        />
        <ProfessionalDashboardCard
          title="Revenus (MAD)"
          value={
            analytics.overview?.revenue?.total
              ? analytics.overview.revenue.total.toLocaleString()
              : '0'
          }
          icon={CreditCardIcon}
          color="blue"
          trend={analytics.overview?.revenue?.trend || 'up'}
          trendValue={`${analytics.overview?.revenue?.percentChange || 0}%`}
        />
        <ProfessionalDashboardCard
          title="Produits vendus"
          value={analytics.overview?.products?.total || 0}
          icon={ShoppingBagIcon}
          color="orange"
          trend={analytics.overview?.products?.trend || 'up'}
          trendValue={`${analytics.overview?.products?.percentChange || 0}%`}
        />
      </div>

      {/* Performance Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-5">Indicateurs de Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProfessionalCard hover title="Note Moyenne" icon={StarIcon} color="yellow">
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {analytics.performance?.avgRating || 0}
                <span className="text-lg text-gray-500">/5</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Basé sur {analytics.performance?.totalReviews || 0} avis
              </p>
              <div className="flex justify-center mt-3">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(analytics.performance?.avgRating || 0)
                        ? 'text-yellow-500 fill-yellow-500'
                        : i < (analytics.performance?.avgRating || 0)
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
                {analytics.performance?.avgSessionLength || 0}
                <span className="text-lg text-gray-500">min</span>
              </div>
              <p className="text-sm text-gray-600">Durée moyenne des sessions</p>
            </div>
          </ProfessionalCard>

          <ProfessionalCard hover title="Taux de Retour" icon={UserGroupIcon} color="green">
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {analytics.performance?.returnRate || 0}
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
                      {service.revenue ? service.revenue.toLocaleString() : '0'}
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
                      {product.revenue ? product.revenue.toLocaleString() : '0'}
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
              {analytics.clientDemographics?.ageGroups &&
              analytics.clientDemographics.ageGroups.length > 0 ? (
                analytics.clientDemographics.ageGroups.map((ageGroup, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{ageGroup.group}</span>
                      <span className="text-sm font-medium text-gray-700">
                        {ageGroup.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${ageGroup.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Données insuffisantes</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Les données démographiques apparaîtront après quelques réservations
                  </p>
                </div>
              )}
            </div>
          </ProfessionalCard>

          <ProfessionalCard title="Répartition par Genre" icon={UsersIcon} color="primary">
            <div className="p-6">
              {analytics.clientDemographics?.gender &&
              analytics.clientDemographics.gender.length > 0 ? (
                analytics.clientDemographics.gender.map((genderGroup, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{genderGroup.group}</span>
                      <span className="text-sm font-medium text-gray-700">
                        {genderGroup.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
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
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Données insuffisantes</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Les données démographiques apparaîtront après quelques réservations
                  </p>
                </div>
              )}
            </div>
          </ProfessionalCard>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-5">Tendances Mensuelles</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ProfessionalCard title="Sessions par Mois" icon={CalendarDaysIcon} color="primary">
            <div className="p-6 h-80">
              {analytics.monthlySessions && analytics.monthlySessions.length > 0 ? (
                <div className="flex items-end justify-between h-full gap-2">
                  {analytics.monthlySessions.map((data, index) => {
                    const maxSessions = Math.max(
                      ...analytics.monthlySessions.map(d => d.sessions),
                      1
                    );
                    const heightPercentage = (data.sessions / maxSessions) * 100;

                    return (
                      <div key={index} className="flex flex-col items-center flex-1 group">
                        <div className="text-xs font-semibold text-gray-600 mb-2 transition-colors group-hover:text-primary-600">
                          {data.sessions}
                        </div>
                        <div className="relative w-10 flex-1 flex items-end">
                          <div
                            className="w-full rounded-xl shadow-lg transition-all duration-500 ease-out transform group-hover:scale-105 group-hover:shadow-xl"
                            style={{
                              height:
                                data.sessions === 0 ? '6px' : `${Math.max(heightPercentage, 15)}%`,
                              minHeight: data.sessions === 0 ? '6px' : '25px',
                              maxHeight: '240px',
                              background:
                                data.sessions === 0
                                  ? 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)'
                                  : 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%)',
                              boxShadow:
                                data.sessions > 0
                                  ? '0 4px 15px rgba(139, 92, 246, 0.3)'
                                  : '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                          >
                            {data.sessions > 0 && (
                              <div
                                className="absolute inset-0 rounded-xl opacity-30"
                                style={{
                                  background:
                                    'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.2) 100%)',
                                }}
                              />
                            )}
                          </div>
                        </div>
                        <div className="mt-3 text-xs font-medium text-gray-700 transition-colors group-hover:text-primary-600">
                          {data.month}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <CalendarDaysIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Aucune donnée disponible</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Les données apparaîtront après vos premières sessions
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ProfessionalCard>

          <ProfessionalCard title="Revenus par Mois (MAD)" icon={CreditCardIcon} color="blue">
            <div className="p-6 h-80">
              {analytics.monthlyRevenue && analytics.monthlyRevenue.length > 0 ? (
                <div className="flex items-end justify-between h-full gap-2">
                  {analytics.monthlyRevenue.map((data, index) => {
                    const maxRevenue = Math.max(...analytics.monthlyRevenue.map(d => d.revenue), 1);
                    const heightPercentage = (data.revenue / maxRevenue) * 100;

                    return (
                      <div key={index} className="flex flex-col items-center flex-1 group">
                        <div className="text-xs font-semibold text-gray-600 mb-2 transition-colors group-hover:text-blue-600">
                          {data.revenue > 0 ? `${data.revenue.toLocaleString()}` : '0'} MAD
                        </div>
                        <div className="relative w-10 flex-1 flex items-end">
                          <div
                            className="w-full rounded-xl shadow-lg transition-all duration-500 ease-out transform group-hover:scale-105 group-hover:shadow-xl"
                            style={{
                              height:
                                data.revenue === 0 ? '6px' : `${Math.max(heightPercentage, 15)}%`,
                              minHeight: data.revenue === 0 ? '6px' : '25px',
                              maxHeight: '240px',
                              background:
                                data.revenue === 0
                                  ? 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)'
                                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                              boxShadow:
                                data.revenue > 0
                                  ? '0 4px 15px rgba(59, 130, 246, 0.3)'
                                  : '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                          >
                            {data.revenue > 0 && (
                              <div
                                className="absolute inset-0 rounded-xl opacity-30"
                                style={{
                                  background:
                                    'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.2) 100%)',
                                }}
                              />
                            )}
                          </div>
                        </div>
                        <div className="mt-3 text-xs font-medium text-gray-700 transition-colors group-hover:text-blue-600">
                          {data.month}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <CreditCardIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Aucune donnée disponible</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Les données apparaîtront après vos premiers revenus
                    </p>
                  </div>
                </div>
              )}
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
            <button
              onClick={downloadCSVReport}
              disabled={isDownloading || !analytics}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isDownloading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
              ) : (
                <ChartBarIcon className="h-5 w-5 mr-2 text-gray-500" />
              )}
              {isDownloading ? 'Génération...' : 'Rapport CSV'}
            </button>
            <button
              onClick={downloadPDFReport}
              disabled={isDownloading || !analytics}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isDownloading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
              ) : (
                <ChartBarIcon className="h-5 w-5 mr-2 text-gray-500" />
              )}
              {isDownloading ? 'Génération...' : 'Rapport PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAnalyticsPage;
