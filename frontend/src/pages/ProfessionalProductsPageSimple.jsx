import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const ProfessionalProductsPageSimple = () => {
  const { id } = useParams();
  const [professional, setProfessional] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data for professional ID:', id);
        
        // Test simple fetch
        const professionalResponse = await fetch(`http://localhost:5000/api/professionals/${id}`);
        console.log('Professional response status:', professionalResponse.status);
        
        if (!professionalResponse.ok) {
          throw new Error(`HTTP error! status: ${professionalResponse.status}`);
        }
        
        const professionalData = await professionalResponse.json();
        console.log('Professional data:', professionalData);
        
        if (professionalData.success) {
          setProfessional(professionalData.professional);
        } else {
          setError('Professional not found in response');
        }
        
        // Test products fetch
        const productsResponse = await fetch(`http://localhost:5000/api/professionals/${id}/products`);
        console.log('Products response status:', productsResponse.status);
        
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          console.log('Products data:', productsData);
          
          if (productsData.success) {
            setProducts(productsData.products || []);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Erreur</h1>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Professionnel non trouvé</h1>
            <p>Debug: professional state is null</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          Produits de {professional.businessName || professional.title}
        </h1>
        
        <div className="mb-4">
          <p>Professionnel ID: {id}</p>
          <p>Professionnel: {professional.businessName}</p>
          <p>Nombre de produits: {products.length}</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-600">Ce professionnel n'a pas encore de produits</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product._id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">{product.name || product.title}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <p className="text-xl font-bold text-blue-600">
                  {product.price} {product.currency || 'EUR'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalProductsPageSimple;
